import ytdl from "@distube/ytdl-core";
import { createWriteStream, createReadStream, promises as fs } from "fs";
import path from "path";
import os from "os";
import { randomBytes } from "crypto";
import { pipeline } from "stream/promises";
import type { Readable } from "stream";

// Vercel/serverless FS is read-only except /tmp.
// @distube/ytdl-core writes "*-watch.html" debug dumps to CWD by default → EROFS.
process.env.YTDL_NO_DEBUG_FILE = "1";
process.env.YTDL_DEBUG_PATH = os.tmpdir();

export type MediaSource = "youtube" | "spotify" | "unknown";
export type DownloadFormat = "mp3" | "mp4" | "m4a" | "webm" | "wav";
export type VideoQuality = "best" | "1080" | "720" | "480" | "360";

export interface MediaInfo {
    source: MediaSource;
    id: string;
    title: string;
    artist?: string;
    duration?: number;
    thumbnail?: string;
    url: string;
    downloadUrl: string;
}

export interface DownloadResult {
    filePath: string;
    fileName: string;
    mime: string;
    size: number;
    title: string;
}

export interface DownloadOptions {
    format: DownloadFormat;
    quality?: VideoQuality;
    onProgress?: (pct: number, stage: string) => void;
}

const YT_HOSTS = [
    "youtube.com", "www.youtube.com", "m.youtube.com", "music.youtube.com",
    "youtu.be", "www.youtu.be",
];
const SPOTIFY_HOSTS = ["open.spotify.com", "spotify.com", "www.spotify.com"];

const MIME: Record<string, string> = {
    mp3: "audio/mpeg",
    m4a: "audio/mp4",
    wav: "audio/wav",
    webm: "video/webm",
    mp4: "video/mp4",
};

const UA =
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36";

const QUALITY_HEIGHT: Record<Exclude<VideoQuality, "best">, number> = {
    "1080": 1080,
    "720": 720,
    "480": 480,
    "360": 360,
};

// Avoid WEB client — YouTube bot-checks datacenter IPs (Vercel) hard on WEB.
const YT_OPTS: ytdl.getInfoOptions = {
    playerClients: ["ANDROID", "IOS", "TV", "WEB_EMBEDDED"],
    requestOptions: {
        headers: {
            "User-Agent":
                "com.google.android.youtube/19.29.37 (Linux; U; Android 14) gzip",
            "Accept-Language": "en-US,en;q=0.9",
        },
    },
};

let agent: ReturnType<typeof ytdl.createAgent> | ReturnType<typeof ytdl.createProxyAgent> | null = null;

function parseCookies(): Parameters<typeof ytdl.createAgent>[0] | undefined {
    const raw = process.env.YOUTUBE_COOKIES?.trim();
    if (!raw) return undefined;
    try {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) return parsed as Parameters<typeof ytdl.createAgent>[0];
    } catch {
        // Netscape-style "name=value; name2=value2" cookie header string
        if (raw.includes("=")) {
            return raw.split(";").map(part => {
                const [name, ...rest] = part.trim().split("=");
                return { name: name.trim(), value: rest.join("=").trim() };
            }) as Parameters<typeof ytdl.createAgent>[0];
        }
    }
    return undefined;
}

function getProxyList(): string[] {
    const multi = process.env.YOUTUBE_PROXIES?.trim();
    if (multi) {
        return multi.split(/[\n,]+/).map(s => s.trim()).filter(Boolean);
    }
    const single = process.env.YOUTUBE_PROXY?.trim() || process.env.HTTPS_PROXY?.trim() || process.env.HTTP_PROXY?.trim();
    return single ? [single] : [];
}

function pickProxy(): string | undefined {
    const list = getProxyList();
    if (!list.length) return undefined;
    return list[Math.floor(Math.random() * list.length)];
}

function getAgent() {
    if (agent) return agent;

    const cookies = parseCookies();
    const proxy = pickProxy();

    try {
        if (proxy) {
            // Residential/mobile proxies work best vs YouTube bot checks
            agent = ytdl.createProxyAgent({ uri: proxy }, cookies || []);
        } else if (cookies) {
            agent = ytdl.createAgent(cookies);
        } else {
            agent = ytdl.createAgent();
        }
    } catch {
        agent = ytdl.createAgent();
    }
    return agent;
}

/** Force rebuild agent (e.g. after rotating proxy) */
function rotateAgent() {
    agent = null;
    return getAgent();
}

function ytOptions(extra?: ytdl.getInfoOptions): ytdl.getInfoOptions {
    return {
        ...YT_OPTS,
        ...extra,
        agent: getAgent(),
        playerClients: extra?.playerClients || YT_OPTS.playerClients,
        requestOptions: {
            ...YT_OPTS.requestOptions,
            ...extra?.requestOptions,
            headers: {
                ...(YT_OPTS.requestOptions as { headers?: Record<string, string> })?.headers,
                ...(extra?.requestOptions as { headers?: Record<string, string> })?.headers,
            },
        },
    };
}

function humanizeYtError(err: unknown): Error {
    const msg = err instanceof Error ? err.message : String(err);
    if (/sign in to confirm|not a bot|bot/i.test(msg)) {
        const hasProxy = getProxyList().length > 0;
        const hasCookies = !!process.env.YOUTUBE_COOKIES?.trim();
        if (!hasProxy && !hasCookies) {
            return new Error(
                "YouTube is blocking this server IP. On Vercel, set YOUTUBE_PROXY (residential) or YOUTUBE_COOKIES. See /download for setup tips."
            );
        }
        if (hasCookies && !hasProxy) {
            return new Error(
                "YouTube still bot-checked this IP even with cookies. Add a residential proxy via YOUTUBE_PROXY."
            );
        }
        return new Error(
            "YouTube bot check failed. Try another proxy (YOUTUBE_PROXIES) or refresh cookies."
        );
    }
    if (/status code 4\d\d|status: 4\d\d|HTTP Error 4/i.test(msg)) {
        return new Error("YouTube refused the request. The video may be private, age-restricted, or region-locked.");
    }
    if (/unavailable|private|removed/i.test(msg)) {
        return new Error("This video is unavailable (private, removed, or region-locked).");
    }
    return err instanceof Error ? err : new Error(msg);
}

export function detectSource(rawUrl: string): MediaSource {
    try {
        const u = new URL(rawUrl.trim());
        const host = u.hostname.toLowerCase();
        if (YT_HOSTS.some(h => host === h || host.endsWith(`.${h}`))) return "youtube";
        if (SPOTIFY_HOSTS.some(h => host === h || host.endsWith(`.${h}`))) return "spotify";
        return "unknown";
    } catch {
        return "unknown";
    }
}

export function isSupportedUrl(rawUrl: string): boolean {
    const src = detectSource(rawUrl);
    return src === "youtube" || src === "spotify";
}

function sanitizeFileName(name: string): string {
    return name
        .replace(/[<>:"/\\|?*\x00-\x1f]/g, "")
        .replace(/\s+/g, " ")
        .trim()
        .slice(0, 120) || "download";
}

function normalizeYoutubeUrl(raw: string): string {
    const url = raw.trim();
    if (ytdl.validateURL(url)) return url;

    try {
        const u = new URL(url);
        if (u.hostname.replace(/^www\./, "") === "youtu.be") {
            const id = u.pathname.slice(1).split("/")[0];
            if (id && ytdl.validateID(id)) return `https://www.youtube.com/watch?v=${id}`;
        }
        const m = u.pathname.match(/\/(shorts|embed|live|v)\/([a-zA-Z0-9_-]{6,})/);
        if (m?.[2] && ytdl.validateID(m[2])) {
            return `https://www.youtube.com/watch?v=${m[2]}`;
        }
        const v = u.searchParams.get("v");
        if (v && ytdl.validateID(v)) return `https://www.youtube.com/watch?v=${v}`;
    } catch {
        /* fall through */
    }
    return url;
}

async function fetchSpotifyMeta(url: string): Promise<{ title: string; artist?: string; thumbnail?: string }> {
    const oembed = `https://open.spotify.com/oembed?url=${encodeURIComponent(url)}`;
    const res = await fetch(oembed, {
        headers: { "User-Agent": UA },
        signal: AbortSignal.timeout(15000),
    });
    if (!res.ok) throw new Error("Could not fetch Spotify track info. Check the link.");
    const data = await res.json() as { title?: string; thumbnail_url?: string };
    const raw = (data.title || "Unknown Track").trim();
    const parts = raw.split(/\s*[·•]\s*/);
    if (parts.length >= 2) {
        return {
            title: parts[0].trim(),
            artist: parts.slice(1).join(" - ").trim(),
            thumbnail: data.thumbnail_url,
        };
    }
    return { title: raw, thumbnail: data.thumbnail_url };
}

async function searchYoutube(query: string): Promise<{
    videoId: string;
    title: string;
    author: string;
    duration: number;
    thumbnail: string;
    url: string;
}> {
    const q = query.trim();
    if (!q) throw new Error("Empty search query");

    try {
        const res = await fetch("https://www.youtube.com/youtubei/v1/search?prettyPrint=false", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "User-Agent": UA,
                "X-YouTube-Client-Name": "1",
                "X-YouTube-Client-Version": "2.20240401.00.00",
            },
            body: JSON.stringify({
                context: {
                    client: {
                        clientName: "WEB",
                        clientVersion: "2.20240401.00.00",
                        hl: "en",
                        gl: "US",
                    },
                },
                query: q,
            }),
            signal: AbortSignal.timeout(20000),
        });

        if (res.ok) {
            const data = await res.json() as Record<string, unknown>;
            const hit = findFirstVideo(data);
            if (hit) return hit;
        }
    } catch {
        /* fallback */
    }

    const page = await fetch(
        `https://www.youtube.com/results?search_query=${encodeURIComponent(q)}`,
        {
            headers: { "User-Agent": UA, "Accept-Language": "en-US,en;q=0.9" },
            signal: AbortSignal.timeout(20000),
        }
    );
    if (!page.ok) throw new Error(`YouTube search failed (${page.status})`);
    const html = await page.text();
    const idMatch = html.match(/"videoId":"([a-zA-Z0-9_-]{11})"/);
    if (!idMatch?.[1]) throw new Error(`No YouTube match found for "${q}"`);
    const videoId = idMatch[1];
    return {
        videoId,
        title: q,
        author: "",
        duration: 0,
        thumbnail: `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
        url: `https://www.youtube.com/watch?v=${videoId}`,
    };
}

function findFirstVideo(node: unknown, depth = 0): {
    videoId: string;
    title: string;
    author: string;
    duration: number;
    thumbnail: string;
    url: string;
} | null {
    if (!node || depth > 25) return null;
    if (Array.isArray(node)) {
        for (const item of node) {
            const found = findFirstVideo(item, depth + 1);
            if (found) return found;
        }
        return null;
    }
    if (typeof node !== "object") return null;
    const obj = node as Record<string, unknown>;
    const vr = obj.videoRenderer as Record<string, unknown> | undefined;
    if (vr && typeof vr.videoId === "string" && ytdl.validateID(vr.videoId)) {
        const videoId = vr.videoId;
        const title =
            (vr.title as { runs?: { text?: string }[] })?.runs?.[0]?.text ||
            (vr.title as { simpleText?: string })?.simpleText ||
            "Unknown";
        const author =
            (vr.ownerText as { runs?: { text?: string }[] })?.runs?.[0]?.text ||
            (vr.shortBylineText as { runs?: { text?: string }[] })?.runs?.[0]?.text ||
            "";
        const lengthText =
            (vr.lengthText as { simpleText?: string })?.simpleText || "";
        const thumbs = (vr.thumbnail as { thumbnails?: { url?: string }[] })?.thumbnails;
        return {
            videoId,
            title,
            author,
            duration: parseDuration(lengthText),
            thumbnail: thumbs?.at(-1)?.url || `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
            url: `https://www.youtube.com/watch?v=${videoId}`,
        };
    }
    for (const key of Object.keys(obj)) {
        const found = findFirstVideo(obj[key], depth + 1);
        if (found) return found;
    }
    return null;
}

function parseDuration(text: string): number {
    if (!text) return 0;
    const parts = text.trim().split(":").map(Number);
    if (parts.some(n => Number.isNaN(n))) return 0;
    if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
    if (parts.length === 2) return parts[0] * 60 + parts[1];
    return parts[0] || 0;
}

export async function getMediaInfo(rawUrl: string): Promise<MediaInfo> {
    const url = rawUrl.trim();
    if (!url) throw new Error("URL is required");

    const source = detectSource(url);
    if (source !== "youtube" && source !== "spotify") {
        throw new Error("Unsupported link. Use YouTube or Spotify track URLs.");
    }

    if (source === "spotify") {
        if (!/\/(track|episode)\//i.test(url)) {
            throw new Error("Only Spotify tracks are supported (not playlists or albums).");
        }
        const meta = await fetchSpotifyMeta(url);
        const query = [meta.artist, meta.title].filter(Boolean).join(" ");
        const yt = await searchYoutube(query || meta.title);
        return {
            source: "spotify",
            id: url.match(/track\/([a-zA-Z0-9]+)/)?.[1] || yt.videoId,
            title: meta.title,
            artist: meta.artist || yt.author,
            duration: yt.duration || undefined,
            thumbnail: meta.thumbnail || yt.thumbnail,
            url,
            downloadUrl: yt.url,
        };
    }

    const ytUrl = normalizeYoutubeUrl(url);
    if (!ytdl.validateURL(ytUrl)) throw new Error("Invalid YouTube URL");

    try {
        const info = await ytdl.getBasicInfo(ytUrl, ytOptions());
        const d = info.videoDetails;
        return {
            source: "youtube",
            id: d.videoId,
            title: d.title,
            artist: d.author?.name,
            duration: Number(d.lengthSeconds) || undefined,
            thumbnail: d.thumbnails?.at(-1)?.url || d.thumbnails?.[0]?.url,
            url: ytUrl,
            downloadUrl: ytUrl,
        };
    } catch (err) {
        try {
            const o = await fetch(
                `https://www.youtube.com/oembed?url=${encodeURIComponent(ytUrl)}&format=json`,
                { headers: { "User-Agent": UA }, signal: AbortSignal.timeout(10000) }
            );
            if (o.ok) {
                const data = await o.json() as { title?: string; author_name?: string; thumbnail_url?: string };
                const id = ytdl.getURLVideoID(ytUrl);
                return {
                    source: "youtube",
                    id,
                    title: data.title || "YouTube video",
                    artist: data.author_name,
                    thumbnail: data.thumbnail_url || `https://i.ytimg.com/vi/${id}/hqdefault.jpg`,
                    url: ytUrl,
                    downloadUrl: ytUrl,
                };
            }
        } catch {
            /* rethrow */
        }
        throw humanizeYtError(err);
    }
}

async function getTempDir(): Promise<string> {
    const dir = path.join(os.tmpdir(), "convertly-dl", randomBytes(8).toString("hex"));
    await fs.mkdir(dir, { recursive: true });
    return dir;
}

function formatHeight(f: ytdl.videoFormat): number {
    if (typeof f.height === "number" && f.height > 0) return f.height;
    const q = String(f.qualityLabel || f.quality || "");
    const m = q.match(/(\d{3,4})p/i);
    return m ? parseInt(m[1], 10) : 0;
}

function chooseFormat(
    formats: ytdl.videoFormat[],
    format: DownloadFormat,
    quality: VideoQuality = "best"
): ytdl.videoFormat | null {
    const tryChoose = (opts: ytdl.downloadOptions) => {
        try {
            return ytdl.chooseFormat(formats, opts);
        } catch {
            return null;
        }
    };

    const isAudio = format === "mp3" || format === "m4a" || format === "wav";
    if (isAudio) {
        return (
            tryChoose({ filter: "audioonly", quality: "highestaudio" }) ||
            tryChoose({ quality: "highestaudio" })
        );
    }

    const wantH = quality === "best" ? 9999 : QUALITY_HEIGHT[quality];
    const preferMp4 = format === "mp4";

    // Prefer progressive (video+audio) at or below target height
    const progressive = formats
        .filter(f => f.hasVideo && f.hasAudio)
        .filter(f => !preferMp4 || f.container === "mp4" || f.container === "m4a")
        .map(f => ({ f, h: formatHeight(f) }))
        .filter(x => x.h > 0)
        .sort((a, b) => {
            // Closest without going over target, then prefer higher
            const aOver = a.h > wantH ? 1 : 0;
            const bOver = b.h > wantH ? 1 : 0;
            if (aOver !== bOver) return aOver - bOver;
            if (aOver === 0) return b.h - a.h; // under target: higher is better
            return a.h - b.h; // over target: lower is better
        });

    if (progressive.length) {
        // For exact-ish match: take best under/at target
        const under = progressive.filter(x => x.h <= wantH);
        if (under.length) return under[0].f;
        return progressive[0].f;
    }

    // Fallback: any progressive, then any with video
    return (
        tryChoose({
            filter: (f) => !!f.hasVideo && !!f.hasAudio && (!preferMp4 || f.container === "mp4"),
            quality: quality === "best" ? "highest" : `${quality}p` as ytdl.downloadOptions["quality"],
        }) ||
        tryChoose({
            filter: (f) => !!f.hasVideo && !!f.hasAudio,
            quality: "highest",
        }) ||
        tryChoose({ quality: "highest" })
    );
}

function resolveOutputExt(
    format: DownloadFormat,
    chosen?: { container?: string; mimeType?: string }
): string {
    if (format === "mp4") return "mp4";
    if (format === "webm") return chosen?.container === "mp4" ? "mp4" : "webm";
    if (chosen?.container === "mp4" || chosen?.container === "m4a") return "m4a";
    if (chosen?.container === "webm") return "webm";
    if (chosen?.mimeType?.includes("mp4")) return "m4a";
    if (chosen?.mimeType?.includes("webm")) return "webm";
    return "m4a";
}

async function getYtInfo(ytUrl: string): Promise<ytdl.videoInfo> {
    const attempts: ytdl.getInfoOptions[] = [
        ytOptions(),
        ytOptions({ playerClients: ["TV", "IOS", "ANDROID"] }),
        ytOptions({ playerClients: ["ANDROID", "IOS"] }),
    ];

    let lastErr: unknown;
    for (let i = 0; i < attempts.length; i++) {
        try {
            if (i > 0 && getProxyList().length > 1) rotateAgent();
            return await ytdl.getInfo(ytUrl, attempts[i]);
        } catch (err) {
            lastErr = err;
        }
    }
    throw humanizeYtError(lastErr);
}

export async function downloadMedia(
    rawUrl: string,
    formatOrOpts: DownloadFormat | DownloadOptions,
    onProgressLegacy?: (pct: number, stage: string) => void
): Promise<DownloadResult> {
    const opts: DownloadOptions =
        typeof formatOrOpts === "string"
            ? { format: formatOrOpts, onProgress: onProgressLegacy }
            : formatOrOpts;

    const { format, quality = "best", onProgress } = opts;

    onProgress?.(3, "Resolving media…");
    const info = await getMediaInfo(rawUrl);

    if (info.source === "spotify" && (format === "mp4" || format === "webm")) {
        throw new Error("Spotify downloads are audio-only. Choose MP3 or M4A.");
    }

    onProgress?.(8, "Fetching stream info…");
    const ytUrl = info.downloadUrl;
    if (!ytdl.validateURL(ytUrl)) {
        throw new Error("Could not resolve a downloadable YouTube URL");
    }

    const fullInfo = await getYtInfo(ytUrl);

    if (!fullInfo.formats?.length) {
        throw new Error(
            "YouTube returned no playable formats (bot check or restricted video). Try another link."
        );
    }

    const chosen = chooseFormat(fullInfo.formats, format, quality);
    if (!chosen?.url) {
        throw new Error("No suitable stream found for this video. It may be region-locked or age-restricted.");
    }

    const outExt = resolveOutputExt(format, chosen);
    const dir = await getTempDir();
    const qTag = format === "mp4" || format === "webm"
        ? (quality === "best" ? "" : `_${quality}p`)
        : "";
    const baseName = sanitizeFileName(
        info.artist ? `${info.artist} - ${info.title}` : info.title
    );
    const fileName = `${baseName}${qTag}.${outExt}`;
    const filePath = path.join(dir, `media.${outExt}`);

    onProgress?.(15, "Downloading…");

    const stream = ytdl.downloadFromInfo(fullInfo, {
        format: chosen,
        highWaterMark: 1 << 25,
        agent: getAgent(),
        requestOptions: YT_OPTS.requestOptions,
    });

    stream.on("progress", (_chunkLen: number, downloaded: number, totalBytes: number) => {
        if (totalBytes > 0) {
            const pct = Math.min(92, 15 + Math.round((downloaded / totalBytes) * 77));
            onProgress?.(pct, "Downloading…");
        } else {
            onProgress?.(Math.min(88, 15 + Math.floor(downloaded / (256 * 1024))), "Downloading…");
        }
    });

    await pipeline(stream as Readable, createWriteStream(filePath));

    onProgress?.(96, "Finalizing…");
    const stat = await fs.stat(filePath);
    if (stat.size < 1024) {
        await cleanupDownload(filePath);
        throw new Error("Download produced an empty file. The video may be restricted.");
    }

    onProgress?.(100, "Done");

    return {
        filePath,
        fileName,
        mime: MIME[outExt] || chosen.mimeType?.split(";")[0] || "application/octet-stream",
        size: stat.size,
        title: info.title,
    };
}

export async function cleanupDownload(filePath: string) {
    try {
        await fs.rm(path.dirname(filePath), { recursive: true, force: true });
    } catch {
        /* ignore */
    }
}

export { createReadStream };
