/* eslint-disable @typescript-eslint/no-explicit-any */

export type ProgressCallback = (progress: number, stage?: string) => void;

let ffmpegInstance: any = null;
let ffmpegLoaded = false;
let ffmpegLoading: Promise<any> | null = null;
let chain: Promise<unknown> = Promise.resolve();

const AUDIO_EXTS = new Set([
    "mp3", "wav", "ogg", "flac", "aac", "wma", "m4a", "opus", "aiff", "ac3", "amr", "pcm",
]);
const VIDEO_EXTS = new Set([
    "mp4", "webm", "avi", "mkv", "mov", "flv", "wmv", "3gp", "ogv", "m4v", "mpeg", "mpg", "vob", "3g2",
]);

const MIME_MAP: Record<string, string> = {
    mp3: "audio/mpeg", wav: "audio/wav", ogg: "audio/ogg", flac: "audio/flac",
    aac: "audio/aac", m4a: "audio/mp4", opus: "audio/opus", aiff: "audio/aiff",
    wma: "audio/x-ms-wma", ac3: "audio/ac3", amr: "audio/amr",
    mp4: "video/mp4", webm: "video/webm", avi: "video/x-msvideo",
    mkv: "video/x-matroska", mov: "video/quicktime", flv: "video/x-flv",
    wmv: "video/x-ms-wmv", "3gp": "video/3gpp", ogv: "video/ogg",
    mpeg: "video/mpeg", mpg: "video/mpeg", m4v: "video/mp4",
    png: "image/png", jpg: "image/jpeg", jpeg: "image/jpeg", webp: "image/webp",
    bmp: "image/bmp", gif: "image/gif",
};

function runExclusive<T>(fn: () => Promise<T>): Promise<T> {
    const next = chain.then(fn, fn);
    chain = next.then(() => undefined, () => undefined);
    return next;
}

async function getFFmpeg(onProgress?: ProgressCallback) {
    if (ffmpegLoaded && ffmpegInstance) {
        if (onProgress) attachProgress(ffmpegInstance, onProgress);
        return ffmpegInstance;
    }

    if (ffmpegLoading) {
        await ffmpegLoading;
        if (onProgress && ffmpegInstance) attachProgress(ffmpegInstance, onProgress);
        return ffmpegInstance;
    }

    ffmpegLoading = (async () => {
        onProgress?.(2, "Loading FFmpeg…");
        const { FFmpeg } = await import("@ffmpeg/ffmpeg");
        const { toBlobURL } = await import("@ffmpeg/util");

        const ff = new FFmpeg();
        const baseURL = "https://cdn.jsdelivr.net/npm/@ffmpeg/core@0.12.6/dist/umd";

        onProgress?.(5, "Downloading FFmpeg core…");
        await ff.load({
            coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, "text/javascript"),
            wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, "application/wasm"),
        });

        ffmpegInstance = ff;
        ffmpegLoaded = true;
        onProgress?.(12, "FFmpeg ready");
        return ff;
    })().catch((err) => {
        ffmpegInstance = null;
        ffmpegLoaded = false;
        ffmpegLoading = null;
        throw new Error(
            err instanceof Error
                ? `FFmpeg failed to load: ${err.message}`
                : "FFmpeg failed to load. Check your network connection."
        );
    });

    const ff = await ffmpegLoading;
    ffmpegLoading = null;
    if (onProgress) attachProgress(ff, onProgress);
    return ff;
}

function attachProgress(ffmpeg: any, onProgress: ProgressCallback) {
    ffmpeg.on("progress", ({ progress }: { progress: number }) => {
        // FFmpeg reports 0–1; map into 15–95 so load/write stages stay visible
        const pct = Math.min(95, Math.max(15, Math.round(progress * 80) + 15));
        onProgress(pct, "Encoding…");
    });
}

async function safeDelete(ffmpeg: any, name: string) {
    try {
        await ffmpeg.deleteFile(name);
    } catch {
        /* file may not exist */
    }
}

function buildArgs(
    inputName: string,
    outputName: string,
    outputExt: string,
    inputExt: string,
    options?: {
        compress?: boolean;
        audioBitrate?: string;
        videoBitrate?: string;
        resolution?: string;
    }
): string[] {
    const isAudioOut = AUDIO_EXTS.has(outputExt);
    const isVideoOut = VIDEO_EXTS.has(outputExt);
    const isVideoIn = VIDEO_EXTS.has(inputExt);
    const extractAudio = isVideoIn && isAudioOut;

    const args: string[] = ["-i", inputName];

    if (extractAudio) {
        args.push("-vn");
    }

    // Audio codecs (ffmpeg.wasm-friendly)
    if (outputExt === "mp3") {
        args.push("-c:a", "libmp3lame", "-q:a", options?.compress ? "5" : "2");
        if (options?.audioBitrate) args.push("-b:a", options.audioBitrate);
    } else if (outputExt === "ogg") {
        args.push("-c:a", "libvorbis", "-q:a", "4");
    } else if (outputExt === "opus") {
        args.push("-c:a", "libopus", "-b:a", options?.audioBitrate || "128k");
    } else if (outputExt === "flac") {
        args.push("-c:a", "flac");
    } else if (outputExt === "wav") {
        args.push("-c:a", "pcm_s16le");
    } else if (outputExt === "aac" || outputExt === "m4a") {
        args.push("-c:a", "aac", "-b:a", options?.audioBitrate || "192k");
    } else if (outputExt === "aiff") {
        args.push("-c:a", "pcm_s16be");
    } else if (outputExt === "ac3") {
        args.push("-c:a", "ac3", "-b:a", options?.audioBitrate || "192k");
    } else if (outputExt === "amr") {
        args.push("-c:a", "libopencore_amrnb", "-ar", "8000", "-ac", "1");
    } else if (isAudioOut) {
        args.push("-b:a", options?.audioBitrate || "192k");
    }

    // Video codecs — prefer reliable wasm-friendly settings
    if (isVideoOut && !extractAudio) {
        if (outputExt === "webm") {
            args.push(
                "-c:v", "libvpx",
                "-b:v", options?.videoBitrate || "1M",
                "-c:a", "libvorbis",
                "-deadline", "realtime",
                "-cpu-used", "8"
            );
        } else if (outputExt === "mp4" || outputExt === "m4v" || outputExt === "mov") {
            // libx264 with ultrafast avoids multi-minute hangs in wasm
            args.push(
                "-c:v", "libx264",
                "-preset", "ultrafast",
                "-crf", options?.compress ? "28" : "23",
                "-pix_fmt", "yuv420p",
                "-c:a", "aac",
                "-b:a", options?.audioBitrate || "128k",
                "-movflags", "+faststart"
            );
            if (options?.videoBitrate) {
                args.push("-b:v", options.videoBitrate);
            }
        } else if (outputExt === "avi") {
            args.push("-c:v", "mpeg4", "-q:v", "5", "-c:a", "mp3");
        } else if (outputExt === "mkv") {
            args.push(
                "-c:v", "libx264",
                "-preset", "ultrafast",
                "-crf", "23",
                "-pix_fmt", "yuv420p",
                "-c:a", "aac"
            );
        } else if (outputExt === "ogv") {
            args.push("-c:v", "libtheora", "-c:a", "libvorbis");
        } else {
            // Generic: re-encode to widely supported pair
            args.push(
                "-c:v", "libx264",
                "-preset", "ultrafast",
                "-crf", "23",
                "-pix_fmt", "yuv420p",
                "-c:a", "aac"
            );
        }

        if (options?.resolution) {
            args.push("-vf", `scale=${options.resolution}`);
        } else if (options?.compress && options.videoBitrate) {
            // already set bitrates above
        }
    }

    // Image outputs via ffmpeg (HEIC etc.)
    if (["png", "jpg", "jpeg", "webp", "bmp"].includes(outputExt)) {
        if (outputExt === "jpg" || outputExt === "jpeg") {
            args.push("-q:v", "2");
        }
    }

    args.push("-y", outputName);
    return args;
}

/** Fallback args when primary codec set fails (e.g. missing libx264) */
function buildFallbackArgs(inputName: string, outputName: string, outputExt: string): string[] {
    const args = ["-i", inputName];

    if (AUDIO_EXTS.has(outputExt)) {
        args.push("-vn");
        if (outputExt === "mp3") args.push("-c:a", "mp3");
        else if (outputExt === "wav") args.push("-c:a", "pcm_s16le");
        else args.push("-c:a", "aac");
    } else if (outputExt === "webm") {
        args.push("-c:v", "libvpx", "-c:a", "libvorbis", "-b:v", "1M");
    } else if (VIDEO_EXTS.has(outputExt)) {
        // mpeg4 is almost always available in wasm builds
        args.push("-c:v", "mpeg4", "-q:v", "5", "-c:a", "aac", "-b:a", "128k");
        if (outputExt === "mp4" || outputExt === "m4v" || outputExt === "mov") {
            args.push("-movflags", "+faststart");
        }
    }

    args.push("-y", outputName);
    return args;
}

async function execWithTimeout(ffmpeg: any, args: string[], ms = 10 * 60 * 1000) {
    let timer: ReturnType<typeof setTimeout> | undefined;
    try {
        await Promise.race([
            ffmpeg.exec(args),
            new Promise((_, reject) => {
                timer = setTimeout(
                    () => reject(new Error("Conversion timed out. Try a smaller file or different format.")),
                    ms
                );
            }),
        ]);
    } finally {
        if (timer) clearTimeout(timer);
    }
}

export async function convertMedia(
    file: File,
    inputExt: string,
    outputExt: string,
    options?: {
        compress?: boolean;
        audioBitrate?: string;
        videoBitrate?: string;
        resolution?: string;
        onProgress?: ProgressCallback;
    }
): Promise<Blob> {
    return runExclusive(async () => {
        const onProgress = options?.onProgress;
        const ffmpeg = await getFFmpeg(onProgress);
        const { fetchFile } = await import("@ffmpeg/util");

        const id = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
        const inputName = `in_${id}.${inputExt}`;
        const outputName = `out_${id}.${outputExt}`;

        try {
            onProgress?.(14, "Reading file…");
            await ffmpeg.writeFile(inputName, await fetchFile(file));

            onProgress?.(16, "Starting encode…");
            const primary = buildArgs(inputName, outputName, outputExt, inputExt, options);

            try {
                await execWithTimeout(ffmpeg, primary);
            } catch (primaryErr) {
                // Retry with simpler codecs if primary failed
                onProgress?.(20, "Retrying with fallback codecs…");
                await safeDelete(ffmpeg, outputName);
                const fallback = buildFallbackArgs(inputName, outputName, outputExt);
                try {
                    await execWithTimeout(ffmpeg, fallback);
                } catch {
                    const msg = primaryErr instanceof Error ? primaryErr.message : "Encoding failed";
                    throw new Error(
                        `Video/audio encoding failed (${msg}). Try MP4/WebM/MP3 or a smaller file.`
                    );
                }
            }

            onProgress?.(96, "Reading output…");
            const data = await ffmpeg.readFile(outputName);

            if (!data || (data as Uint8Array).length === 0) {
                throw new Error("Encoding produced an empty file. The format may not be supported.");
            }

            onProgress?.(100, "Done");
            const bytes = data instanceof Uint8Array ? data : new TextEncoder().encode(String(data));
            // Copy into a plain ArrayBuffer-backed Uint8Array for Blob compatibility
            const copy = new Uint8Array(bytes.byteLength);
            copy.set(bytes);
            return new Blob([copy], { type: MIME_MAP[outputExt] || "application/octet-stream" });
        } finally {
            await safeDelete(ffmpeg, inputName);
            await safeDelete(ffmpeg, outputName);
        }
    });
}

export async function compressMedia(
    file: File,
    ext: string,
    level: "light" | "medium" | "heavy",
    onProgress?: ProgressCallback
): Promise<Blob> {
    const audioBitrates = { light: "192k", medium: "128k", heavy: "64k" };
    const videoBitrates = { light: "2000k", medium: "1000k", heavy: "500k" };
    const resolutions = { light: "-2:720", medium: "-2:480", heavy: "-2:360" };
    const isAudio = AUDIO_EXTS.has(ext);

    return convertMedia(file, ext, ext, {
        compress: true,
        audioBitrate: audioBitrates[level],
        videoBitrate: isAudio ? undefined : videoBitrates[level],
        resolution: isAudio ? undefined : resolutions[level],
        onProgress,
    });
}

export function isFFmpegFormat(ext: string): boolean {
    return AUDIO_EXTS.has(ext) || VIDEO_EXTS.has(ext) || ["heic", "heif"].includes(ext);
}

export function isFFmpegReady(): boolean {
    return ffmpegLoaded && !!ffmpegInstance;
}
