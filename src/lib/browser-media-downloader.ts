"use client";

import type { Innertube as InnertubeClient, Types } from "youtubei.js/web";

export type BrowserDownloadFormat = "mp3" | "mp4" | "m4a" | "webm" | "wav";
export type BrowserVideoQuality = "best" | "720" | "480" | "360";

export interface BrowserMediaPreview {
    source: "youtube" | "spotify";
    id: string;
    title: string;
    artist?: string;
}

export interface BrowserDownloadResult {
    blob: Blob;
    fileName: string;
    inputExt: string;
    outputExt: BrowserDownloadFormat;
    needsConversion: boolean;
}

interface BrowserDownloadOptions {
    url: string;
    preview: BrowserMediaPreview | null;
    format: BrowserDownloadFormat;
    quality: BrowserVideoQuality;
    signal?: AbortSignal;
    onProgress?: (progress: number, stage: string) => void;
}

let youtubeClient: Promise<InnertubeClient> | null = null;

async function getYoutubeClient(): Promise<InnertubeClient> {
    if (youtubeClient) return youtubeClient;

    youtubeClient = (async () => {
        const { Innertube, Platform, UniversalCache } = await import("youtubei.js/web");

        // YouTube.js transforms the current player code into a small decipher function.
        // The browser build deliberately leaves evaluation to the host application.
        Platform.shim.eval = async (data: Types.BuildScriptResult) => {
            return new Function(data.output)();
        };

        return Innertube.create({
            cache: new UniversalCache(true),
            enable_session_cache: true,
            generate_session_locally: true,
        });
    })().catch(error => {
        youtubeClient = null;
        throw error;
    });

    return youtubeClient;
}

function youtubeId(rawUrl: string): string | null {
    try {
        const url = new URL(rawUrl.trim());
        const candidate = url.hostname.toLowerCase().endsWith("youtu.be")
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

function extensionFromMime(mime: string, hasVideo: boolean): string {
    const normalized = mime.toLowerCase();
    if (normalized.includes("audio/mp4")) return "m4a";
    if (normalized.includes("video/mp4")) return "mp4";
    if (normalized.includes("webm")) return "webm";
    if (normalized.includes("audio/mpeg")) return "mp3";
    return hasVideo ? "mp4" : "m4a";
}

function qualityFallbacks(quality: BrowserVideoQuality): string[] {
    if (quality === "best") return ["best"];
    if (quality === "720") return ["720p", "480p", "360p", "best"];
    if (quality === "480") return ["480p", "360p", "best"];
    return ["360p", "best"];
}

function chooseFormat(
    info: Awaited<ReturnType<InnertubeClient["getBasicInfo"]>>,
    output: BrowserDownloadFormat,
    quality: BrowserVideoQuality
) {
    const isAudio = output === "mp3" || output === "m4a" || output === "wav";

    if (isAudio) {
        try {
            return info.chooseFormat({ type: "audio", quality: "best", format: "mp4" });
        } catch {
            return info.chooseFormat({ type: "audio", quality: "best", format: "any" });
        }
    }

    let lastError: unknown;
    for (const candidate of qualityFallbacks(quality)) {
        try {
            return info.chooseFormat({
                type: "video+audio",
                quality: candidate,
                format: output === "mp4" ? "mp4" : "any",
            });
        } catch (error) {
            lastError = error;
        }
    }
    throw lastError instanceof Error ? lastError : new Error("No combined video format is available.");
}

async function resolveVideoId(
    client: InnertubeClient,
    url: string,
    preview: BrowserMediaPreview | null
): Promise<string> {
    if (preview?.source !== "spotify") {
        const id = youtubeId(url) || preview?.id;
        if (id && /^[a-zA-Z0-9_-]{11}$/.test(id)) return id;
        throw new Error("That YouTube link does not contain a valid video ID.");
    }

    const query = [preview.artist, preview.title].filter(Boolean).join(" ").trim();
    if (!query) throw new Error("Could not read the Spotify track title.");

    const { YTNodes } = await import("youtubei.js/web");
    const search = await client.search(query, { type: "video" });
    const match = search.results.firstOfType(YTNodes.Video);
    if (!match?.video_id) throw new Error(`No public media match was found for "${query}".`);
    return match.video_id;
}

async function streamToBlob(
    stream: ReadableStream<Uint8Array>,
    mime: string,
    expectedBytes: number | undefined,
    signal: AbortSignal | undefined,
    onProgress: BrowserDownloadOptions["onProgress"]
): Promise<Blob> {
    const reader = stream.getReader();
    const chunks: Uint8Array[] = [];
    let received = 0;

    const abort = () => void reader.cancel(signal?.reason);
    signal?.addEventListener("abort", abort, { once: true });

    try {
        while (true) {
            if (signal?.aborted) throw new DOMException("Download cancelled", "AbortError");
            const { done, value } = await reader.read();
            if (done) break;
            chunks.push(value);
            received += value.byteLength;

            const percent = expectedBytes
                ? Math.min(86, 18 + Math.round((received / expectedBytes) * 68))
                : Math.min(82, 18 + Math.round(Math.log2(Math.max(1, received / 262_144)) * 7));
            onProgress?.(percent, "Downloading from YouTube");
        }
    } finally {
        signal?.removeEventListener("abort", abort);
        reader.releaseLock();
    }

    const bytes = new Uint8Array(received);
    let offset = 0;
    for (const chunk of chunks) {
        bytes.set(chunk, offset);
        offset += chunk.byteLength;
    }
    return new Blob([bytes], { type: mime.split(";")[0] || "application/octet-stream" });
}

function humanizeError(error: unknown): Error {
    const message = error instanceof Error ? error.message : String(error);
    if (/LOGIN_REQUIRED|sign in|not a bot|verification/i.test(message)) {
        return new Error("YouTube requested verification for this connection. Open the video on YouTube once, then retry here.");
    }
    if (/Failed to fetch|NetworkError|Load failed|CORS/i.test(message)) {
        return new Error("The browser blocked YouTube's media request. Disable strict tracking protection for this page and retry.");
    }
    if (/No matching formats/i.test(message)) {
        return new Error("That quality or format is not available for this video. Try MP3 or a lower video quality.");
    }
    if (/unplayable|private|unavailable/i.test(message)) {
        return new Error("This video is private, unavailable, age-restricted, or region-locked.");
    }
    return error instanceof Error ? error : new Error(message);
}

export async function downloadMediaInBrowser(options: BrowserDownloadOptions): Promise<BrowserDownloadResult> {
    const { url, preview, format, quality, signal, onProgress } = options;
    try {
        onProgress?.(5, "Starting local media engine");
        const client = await getYoutubeClient();
        if (signal?.aborted) throw new DOMException("Download cancelled", "AbortError");

        onProgress?.(10, preview?.source === "spotify" ? "Matching Spotify track" : "Reading YouTube media");
        const videoId = await resolveVideoId(client, url, preview);
        const info = await client.getBasicInfo(videoId, { client: "WEB" });
        if (info.basic_info.is_live) throw new Error("Live streams cannot be downloaded until the broadcast ends.");

        const selected = chooseFormat(info, format, quality);
        const inputExt = extensionFromMime(selected.mime_type, selected.has_video);
        const title = preview?.title && preview.title !== "YouTube video"
            ? preview.title
            : info.basic_info.title || "download";
        const artist = preview?.artist || info.basic_info.author;
        const baseName = sanitizeFileName(artist ? `${artist} - ${title}` : title);
        const qualityTag = selected.has_video && quality !== "best" ? `_${quality}p` : "";

        onProgress?.(16, "Opening direct media stream");
        const stream = await info.download({ itag: selected.itag });
        const blob = await streamToBlob(
            stream,
            selected.mime_type,
            selected.content_length,
            signal,
            onProgress
        );
        if (blob.size < 1024) throw new Error("YouTube returned an empty media stream.");

        return {
            blob,
            fileName: `${baseName}${qualityTag}.${format}`,
            inputExt,
            outputExt: format,
            needsConversion: inputExt !== format,
        };
    } catch (error) {
        throw humanizeError(error);
    }
}
