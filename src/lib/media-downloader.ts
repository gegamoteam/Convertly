import ytdl from "@distube/ytdl-core";
import yts from "yt-search";
import { createWriteStream, createReadStream, promises as fs } from "fs";
import path from "path";
import os from "os";
import { randomBytes } from "crypto";
import { pipeline } from "stream/promises";
import { Readable } from "stream";

export type MediaSource = "youtube" | "spotify" | "soundcloud" | "unknown";
export type DownloadFormat = "mp3" | "mp4" | "m4a" | "webm" | "wav";

export interface MediaInfo {
    source: MediaSource;
    id: string;
    title: string;
    artist?: string;
    duration?: number;
    thumbnail?: string;
    url: string;
    /** YouTube watch URL used for the actual download */
    downloadUrl: string;
}

export interface DownloadResult {
    filePath: string;
    fileName: string;
    mime: string;
    size: number;
    title: string;
}

const YT_HOSTS = [
    "youtube.com", "www.youtube.com", "m.youtube.com", "music.youtube.com",
    "youtu.be", "www.youtu.be",
];
const SPOTIFY_HOSTS = ["open.spotify.com", "spotify.com", "www.spotify.com"];
const SOUNDCLOUD_HOSTS = ["soundcloud.com", "www.soundcloud.com", "m.soundcloud.com"];

const MIME: Record<string, string> = {
    mp3: "audio/mpeg",
    m4a: "audio/mp4",
    wav: "audio/wav",
    webm: "video/webm",
    mp4: "video/mp4",
};

export function detectSource(rawUrl: string): MediaSource {
    try {
        const u = new URL(rawUrl.trim());
        const host = u.hostname.toLowerCase();
        if (YT_HOSTS.some(h => host === h || host.endsWith(`.${h}`))) return "youtube";
        if (SPOTIFY_HOSTS.some(h => host === h || host.endsWith(`.${h}`))) return "spotify";
        if (SOUNDCLOUD_HOSTS.some(h => host === h || host.endsWith(`.${h}`))) return "soundcloud";
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
        // youtu.be/ID
        if (u.hostname.replace(/^www\./, "") === "youtu.be") {
            const id = u.pathname.slice(1).split("/")[0];
            if (id && ytdl.validateID(id)) return `https://www.youtube.com/watch?v=${id}`;
        }
        // /shorts/ID, /embed/ID, /live/ID
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
        headers: { "User-Agent": "Convertly/1.0" },
        signal: AbortSignal.timeout(15000),
    });
    if (!res.ok) throw new Error("Could not fetch Spotify track info. Check the link.");
    const data = await res.json() as { title?: string; thumbnail_url?: string };
    const raw = (data.title || "Unknown Track").trim();
    // Spotify oEmbed is often "Song Name" or "Song · Artist"
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
    const result = await yts(query);
    const video = result.videos?.[0];
    if (!video?.videoId) {
        throw new Error(`No YouTube match found for "${query}"`);
    }
    return {
        videoId: video.videoId,
        title: video.title,
        author: video.author?.name || "",
        duration: video.seconds || 0,
        thumbnail: video.thumbnail || video.image || "",
        url: video.url,
    };
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
    if (!ytdl.validateURL(ytUrl)) {
        throw new Error("Invalid YouTube URL");
    }

    const info = await ytdl.getBasicInfo(ytUrl);
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
}

async function getTempDir(): Promise<string> {
    const dir = path.join(os.tmpdir(), "convertly-dl", randomBytes(8).toString("hex"));
    await fs.mkdir(dir, { recursive: true });
    return dir;
}

function pickFormatFilter(format: DownloadFormat): {
    filter: ytdl.downloadOptions["filter"];
    quality: ytdl.downloadOptions["quality"];
    ext: string;
    /** Container we actually get from YouTube (no server-side re-encode) */
    actualExt: string;
    note?: string;
} {
    // Pure Node — no system ffmpeg. We download the closest stream YouTube offers.
    // "mp3" requests audio-only (usually webm/opus or m4a) and we label honestly via actualExt.
    switch (format) {
        case "mp4":
            return {
                filter: (f) =>
                    f.container === "mp4" &&
                    !!f.hasVideo &&
                    !!f.hasAudio,
                quality: "highest",
                ext: "mp4",
                actualExt: "mp4",
            };
        case "webm":
            return {
                filter: (f) =>
                    (f.container === "webm" || f.container === "mp4") &&
                    !!f.hasVideo &&
                    !!f.hasAudio,
                quality: "highest",
                ext: "webm",
                actualExt: "webm",
            };
        case "m4a":
            return {
                filter: "audioonly",
                quality: "highestaudio",
                ext: "m4a",
                actualExt: "m4a",
            };
        case "wav":
        case "mp3":
        default:
            return {
                filter: "audioonly",
                quality: "highestaudio",
                ext: format === "wav" ? "wav" : "mp3",
                // YouTube audio is typically webm/opus or m4a — not true mp3 without ffmpeg
                actualExt: "audio",
                note: "Audio stream (YouTube does not serve MP3 directly; file is best available audio)",
            };
    }
}

function resolveOutputExt(
    format: DownloadFormat,
    chosen?: { container?: string; codecs?: string; mimeType?: string }
): string {
    if (format === "mp4") return "mp4";
    if (format === "webm") return chosen?.container === "mp4" ? "mp4" : "webm";
    if (format === "m4a") {
        if (chosen?.container === "mp4" || chosen?.container === "m4a") return "m4a";
        if (chosen?.container === "webm") return "webm";
        return "m4a";
    }
    // mp3 / wav request → best audio; pick real container
    if (chosen?.container === "mp4" || chosen?.container === "m4a") return "m4a";
    if (chosen?.container === "webm") return "webm";
    if (chosen?.mimeType?.includes("mp4")) return "m4a";
    if (chosen?.mimeType?.includes("webm")) return "webm";
    return "m4a";
}

export async function downloadMedia(
    rawUrl: string,
    format: DownloadFormat,
    onProgress?: (pct: number, stage: string) => void
): Promise<DownloadResult> {
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

    const fullInfo = await ytdl.getInfo(ytUrl);
    const pick = pickFormatFilter(format);

    const tryChoose = (opts: ytdl.downloadOptions) => {
        try {
            return ytdl.chooseFormat(fullInfo.formats, opts);
        } catch {
            return null;
        }
    };

    let chosen =
        tryChoose({ filter: pick.filter, quality: pick.quality }) ||
        // Fallback: progressive video if combined mp4 not found
        ((format === "mp4" || format === "webm")
            ? tryChoose({
                filter: (f) => !!(f as { hasVideo?: boolean }).hasVideo && !!(f as { hasAudio?: boolean }).hasAudio,
                quality: "highest",
            })
            : null) ||
        // Fallback: any audio
        tryChoose({ filter: "audioonly", quality: "highestaudio" });

    if (!chosen?.url) {
        throw new Error("No suitable stream found for this video.");
    }

    const outExt = resolveOutputExt(format, chosen);
    const dir = await getTempDir();
    const baseName = sanitizeFileName(
        info.artist ? `${info.artist} - ${info.title}` : info.title
    );
    const fileName = `${baseName}.${outExt}`;
    const filePath = path.join(dir, `media.${outExt}`);

    onProgress?.(15, "Downloading…");

    const total = Number(chosen.contentLength) || 0;
    let received = 0;

    const stream = ytdl.downloadFromInfo(fullInfo, {
        format: chosen,
        highWaterMark: 1 << 25,
    });

    stream.on("progress", (_chunkLen: number, downloaded: number, totalBytes: number) => {
        received = downloaded;
        const t = totalBytes || total;
        if (t > 0) {
            const pct = Math.min(92, 15 + Math.round((downloaded / t) * 77));
            onProgress?.(pct, "Downloading…");
        } else {
            // unknown size — slow climb
            const pct = Math.min(88, 15 + Math.floor(downloaded / (256 * 1024)));
            onProgress?.(pct, "Downloading…");
        }
    });

    await pipeline(stream as Readable, createWriteStream(filePath));

    onProgress?.(96, "Finalizing…");
    const stat = await fs.stat(filePath);
    if (stat.size < 1024) {
        await cleanupDownload(filePath);
        throw new Error("Download produced an empty or invalid file. The video may be restricted.");
    }

    onProgress?.(100, "Done");
    void received;

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
        const dir = path.dirname(filePath);
        await fs.rm(dir, { recursive: true, force: true });
    } catch {
        /* ignore */
    }
}

export { createReadStream };
