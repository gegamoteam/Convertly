export type MediaSource = "youtube" | "spotify" | "unknown";
export type DownloadFormat = "mp3" | "mp4" | "m4a" | "webm" | "wav";
export type VideoQuality = "best" | "720" | "480" | "360";

export interface MediaInfo {
    source: MediaSource;
    id: string;
    title: string;
    artist?: string;
    duration?: number;
    thumbnail?: string;
    url: string;
}

export interface DownloadPlan {
    url: string;
    fileName: string;
    inputExt: string;
    outputExt: DownloadFormat;
    mime: string;
    needsConversion: boolean;
    title: string;
}

interface PipedMediaStream {
    bitrate?: number;
    format?: string;
    height?: number;
    mimeType?: string;
    quality?: string;
    url?: string;
    videoOnly?: boolean;
}

interface PipedStreamsResponse {
    audioStreams?: PipedMediaStream[];
    duration?: number;
    livestream?: boolean;
    thumbnailUrl?: string;
    title?: string;
    uploader?: string;
    videoStreams?: PipedMediaStream[];
}

interface PipedSearchItem {
    duration?: number;
    thumbnail?: string;
    title?: string;
    type?: string;
    uploaderName?: string;
    url?: string;
}

interface PipedSearchResponse {
    items?: PipedSearchItem[];
}

interface ResolvedMedia {
    info: MediaInfo;
    streams: PipedStreamsResponse;
}

const YOUTUBE_HOSTS = new Set([
    "youtube.com",
    "www.youtube.com",
    "m.youtube.com",
    "music.youtube.com",
    "youtu.be",
    "www.youtu.be",
]);

const SPOTIFY_HOSTS = new Set(["open.spotify.com", "spotify.com", "www.spotify.com"]);

// Piped's public API is federated. Using several instances prevents one unhealthy
// host from taking down downloads and keeps YouTube extraction away from Vercel IPs.
const DEFAULT_PIPED_INSTANCES = [
    "https://pipedapi.kavin.rocks",
    "https://pipedapi.tokhmi.xyz",
    "https://pipedapi.moomoo.me",
    "https://pipedapi.syncpundit.io",
    "https://api-piped.mha.fi",
    "https://piped-api.garudalinux.org",
];

const MIME: Record<DownloadFormat, string> = {
    mp3: "audio/mpeg",
    mp4: "video/mp4",
    m4a: "audio/mp4",
    webm: "video/webm",
    wav: "audio/wav",
};

function configuredInstances(): string[] {
    const configured = [process.env.PIPED_API_URL, process.env.PIPED_API_URLS]
        .filter(Boolean)
        .join(",")
        .split(/[\n,]+/)
        .map(value => value.trim().replace(/\/+$/, ""))
        .filter(value => /^https:\/\//i.test(value));

    const offset = Math.floor(Math.random() * DEFAULT_PIPED_INSTANCES.length);
    const rotatedDefaults = [
        ...DEFAULT_PIPED_INSTANCES.slice(offset),
        ...DEFAULT_PIPED_INSTANCES.slice(0, offset),
    ];
    return [...new Set([...configured, ...rotatedDefaults])];
}

async function pipedRequest<T>(path: string, isValid: (value: T) => boolean): Promise<T> {
    const errors: string[] = [];

    for (const instance of configuredInstances()) {
        try {
            const response = await fetch(`${instance}${path}`, {
                headers: { Accept: "application/json" },
                cache: "no-store",
                signal: AbortSignal.timeout(9000),
            });

            if (!response.ok) {
                errors.push(`${new URL(instance).hostname}: ${response.status}`);
                continue;
            }

            const data = await response.json() as T;
            if (isValid(data)) return data;
            errors.push(`${new URL(instance).hostname}: incomplete response`);
        } catch (error) {
            const message = error instanceof Error ? error.message : "request failed";
            errors.push(`${new URL(instance).hostname}: ${message}`);
        }
    }

    console.error("[media-provider] all Piped instances failed", { path, errors });
    throw new Error("The media network is temporarily unavailable. Please try again in a minute.");
}

function isPipedStreams(value: PipedStreamsResponse): boolean {
    return !!value?.title && (
        (Array.isArray(value.audioStreams) && value.audioStreams.length > 0) ||
        (Array.isArray(value.videoStreams) && value.videoStreams.length > 0)
    );
}

function isPipedSearch(value: PipedSearchResponse): boolean {
    return Array.isArray(value?.items);
}

export function detectSource(rawUrl: string): MediaSource {
    try {
        const host = new URL(rawUrl.trim()).hostname.toLowerCase();
        if (YOUTUBE_HOSTS.has(host)) return "youtube";
        if (SPOTIFY_HOSTS.has(host)) return "spotify";
        return "unknown";
    } catch {
        return "unknown";
    }
}

export function isSupportedUrl(rawUrl: string): boolean {
    return detectSource(rawUrl) !== "unknown";
}

function youtubeId(rawUrl: string): string | null {
    try {
        const url = new URL(rawUrl.trim());
        const host = url.hostname.toLowerCase();
        const candidate = host.endsWith("youtu.be")
            ? url.pathname.split("/").filter(Boolean)[0]
            : url.searchParams.get("v") || url.pathname.match(/\/(?:shorts|embed|live|v)\/([^/?]+)/i)?.[1];

        return candidate && /^[a-zA-Z0-9_-]{11}$/.test(candidate) ? candidate : null;
    } catch {
        return null;
    }
}

function sanitizeFileName(name: string): string {
    return name
        .replace(/[<>:"/\\|?*\x00-\x1f]/g, "")
        .replace(/\s+/g, " ")
        .trim()
        .slice(0, 120) || "download";
}

function streamExtension(stream: PipedMediaStream): string {
    const format = String(stream.format || "").toLowerCase();
    const mime = String(stream.mimeType || "").toLowerCase();
    if (format.includes("m4a") || mime.includes("audio/mp4")) return "m4a";
    if (format.includes("mpeg_4") || mime.includes("video/mp4")) return "mp4";
    if (format.includes("webm") || mime.includes("webm")) return "webm";
    if (mime.includes("mpeg")) return "mp3";
    return "bin";
}

function safeStreamUrl(rawUrl?: string): string | null {
    if (!rawUrl) return null;
    try {
        const url = new URL(rawUrl);
        if (url.protocol !== "https:") return null;
        if (url.hostname === "localhost" || url.hostname.endsWith(".local")) return null;
        return url.toString();
    } catch {
        return null;
    }
}

async function fetchSpotifyMeta(url: string): Promise<{
    title: string;
    artist?: string;
    thumbnail?: string;
}> {
    const response = await fetch(`https://open.spotify.com/oembed?url=${encodeURIComponent(url)}`, {
        headers: { Accept: "application/json" },
        cache: "no-store",
        signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) throw new Error("Could not read that Spotify track. Check the link and try again.");

    const data = await response.json() as {
        author_name?: string;
        thumbnail_url?: string;
        title?: string;
    };
    const rawTitle = (data.title || "Unknown track").trim();
    const parts = rawTitle.split(/\s*[·•]\s*/).filter(Boolean);

    return {
        title: parts[0] || rawTitle,
        artist: parts.length > 1 ? parts.slice(1).join(" - ") : data.author_name,
        thumbnail: data.thumbnail_url,
    };
}

async function fetchYoutubeStreams(videoId: string): Promise<PipedStreamsResponse> {
    return pipedRequest<PipedStreamsResponse>(
        `/streams/${encodeURIComponent(videoId)}`,
        isPipedStreams
    );
}

async function searchYoutube(query: string): Promise<{ id: string; item: PipedSearchItem }> {
    const data = await pipedRequest<PipedSearchResponse>(
        `/search?q=${encodeURIComponent(query)}&filter=videos`,
        isPipedSearch
    );
    const item = data.items?.find(result => result.type === "stream" || /watch\?v=/i.test(result.url || ""));
    const id = item?.url?.match(/[?&]v=([a-zA-Z0-9_-]{11})/)?.[1];
    if (!item || !id) throw new Error(`No public audio match was found for "${query}".`);
    return { id, item };
}

async function resolveMedia(rawUrl: string): Promise<ResolvedMedia> {
    const url = rawUrl.trim();
    const source = detectSource(url);

    if (source === "youtube") {
        const id = youtubeId(url);
        if (!id) throw new Error("That does not look like a valid YouTube video link.");
        const streams = await fetchYoutubeStreams(id);
        if (streams.livestream) throw new Error("Live streams cannot be downloaded until the broadcast ends.");

        return {
            streams,
            info: {
                source,
                id,
                title: streams.title || "YouTube video",
                artist: streams.uploader,
                duration: streams.duration,
                thumbnail: streams.thumbnailUrl,
                url: `https://www.youtube.com/watch?v=${id}`,
            },
        };
    }

    if (source === "spotify") {
        if (!/\/(track|episode)\//i.test(url)) {
            throw new Error("Paste a Spotify track or episode link, not an album or playlist.");
        }

        const spotify = await fetchSpotifyMeta(url);
        const query = [spotify.artist, spotify.title].filter(Boolean).join(" ");
        const match = await searchYoutube(query || spotify.title);
        const streams = await fetchYoutubeStreams(match.id);

        return {
            streams,
            info: {
                source,
                id: url.match(/\/(?:track|episode)\/([a-zA-Z0-9]+)/)?.[1] || match.id,
                title: spotify.title || match.item.title || streams.title || "Spotify track",
                artist: spotify.artist || match.item.uploaderName || streams.uploader,
                duration: match.item.duration || streams.duration,
                thumbnail: spotify.thumbnail || match.item.thumbnail || streams.thumbnailUrl,
                url,
            },
        };
    }

    throw new Error("Unsupported link. Use a YouTube video or Spotify track URL.");
}

export async function getMediaInfo(rawUrl: string): Promise<MediaInfo> {
    return (await resolveMedia(rawUrl)).info;
}

function chooseAudio(streams: PipedMediaStream[], requested: DownloadFormat): PipedMediaStream | null {
    const candidates = streams
        .filter(stream => !!safeStreamUrl(stream.url))
        .sort((a, b) => (b.bitrate || 0) - (a.bitrate || 0));

    if (requested === "m4a") {
        return candidates.find(stream => streamExtension(stream) === "m4a") || candidates[0] || null;
    }

    // MP4 audio converts more quickly and reliably in ffmpeg.wasm than Opus/WebM.
    return candidates.find(stream => streamExtension(stream) === "m4a") || candidates[0] || null;
}

function chooseVideo(streams: PipedMediaStream[], quality: VideoQuality): PipedMediaStream | null {
    const maxHeight = quality === "best" ? 720 : Number(quality);
    const progressive = streams
        .filter(stream => !stream.videoOnly && !!safeStreamUrl(stream.url))
        .filter(stream => (stream.height || 0) <= maxHeight)
        .sort((a, b) => {
            const heightDiff = (b.height || 0) - (a.height || 0);
            if (heightDiff) return heightDiff;
            const aMp4 = streamExtension(a) === "mp4" ? 1 : 0;
            const bMp4 = streamExtension(b) === "mp4" ? 1 : 0;
            return bMp4 - aMp4;
        });

    return progressive[0] || null;
}

export async function createDownloadPlan(
    rawUrl: string,
    options: { format: DownloadFormat; quality?: VideoQuality }
): Promise<DownloadPlan> {
    const { info, streams } = await resolveMedia(rawUrl);
    const { format, quality = "best" } = options;
    const isAudio = format === "mp3" || format === "m4a" || format === "wav";

    if (info.source === "spotify" && !isAudio) {
        throw new Error("Spotify links are audio-only. Choose MP3, M4A, or WAV.");
    }

    const selected = isAudio
        ? chooseAudio(streams.audioStreams || [], format)
        : chooseVideo(streams.videoStreams || [], quality);
    const streamUrl = safeStreamUrl(selected?.url);

    if (!selected || !streamUrl) {
        throw new Error(
            isAudio
                ? "No downloadable audio stream is available for this link."
                : `No combined video stream is available at ${quality === "best" ? "720p or below" : `${quality}p`}.`
        );
    }

    const inputExt = streamExtension(selected);
    if (inputExt === "bin") throw new Error("The provider returned an unsupported media format.");

    const baseName = sanitizeFileName(info.artist ? `${info.artist} - ${info.title}` : info.title);
    const qualityTag = isAudio || quality === "best" ? "" : `_${quality}p`;

    return {
        url: streamUrl,
        fileName: `${baseName}${qualityTag}.${format}`,
        inputExt,
        outputExt: format,
        mime: MIME[format],
        needsConversion: inputExt !== format,
        title: info.title,
    };
}
