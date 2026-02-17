/* eslint-disable @typescript-eslint/no-explicit-any */

let ffmpegInstance: any = null;
let ffmpegLoaded = false;
let ffmpegLoading: Promise<void> | null = null;

async function getFFmpeg() {
    if (ffmpegLoaded && ffmpegInstance) return ffmpegInstance;

    if (ffmpegLoading) {
        await ffmpegLoading;
        return ffmpegInstance;
    }

    ffmpegLoading = (async () => {
        try {
            const { FFmpeg } = await import("@ffmpeg/ffmpeg");
            const { toBlobURL } = await import("@ffmpeg/util");

            ffmpegInstance = new FFmpeg();

            const baseURL = "https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd";
            await ffmpegInstance.load({
                coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, "text/javascript"),
                wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, "application/wasm"),
            });

            ffmpegLoaded = true;
        } catch {
            ffmpegInstance = null;
            ffmpegLoaded = false;
            throw new Error(
                "FFmpeg failed to load. Install it with: npm install @ffmpeg/ffmpeg @ffmpeg/util"
            );
        }
    })();

    await ffmpegLoading;
    ffmpegLoading = null;
    return ffmpegInstance;
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
    }
): Promise<Blob> {
    const ffmpeg = await getFFmpeg();
    const { fetchFile } = await import("@ffmpeg/util");

    const inputName = `input.${inputExt}`;
    const outputName = `output.${outputExt}`;

    await ffmpeg.writeFile(inputName, await fetchFile(file));

    const args: string[] = ["-i", inputName];

    if (options?.compress) {
        if (options.audioBitrate) args.push("-b:a", options.audioBitrate);
        if (options.videoBitrate) args.push("-b:v", options.videoBitrate);
        if (options.resolution) args.push("-vf", `scale=${options.resolution}`);
    }

    // Codec hints for common targets
    if (outputExt === "mp3") args.push("-codec:a", "libmp3lame");
    if (outputExt === "ogg") args.push("-codec:a", "libvorbis");
    if (outputExt === "opus") args.push("-codec:a", "libopus");
    if (outputExt === "flac") args.push("-codec:a", "flac");
    if (outputExt === "wav") args.push("-codec:a", "pcm_s16le");
    if (outputExt === "mp4") args.push("-codec:v", "libx264", "-codec:a", "aac");
    if (outputExt === "webm") args.push("-codec:v", "libvpx", "-codec:a", "libvorbis");

    args.push("-y", outputName);

    await ffmpeg.exec(args);

    const data = await ffmpeg.readFile(outputName);
    const mimeMap: Record<string, string> = {
        mp3: "audio/mpeg", wav: "audio/wav", ogg: "audio/ogg", flac: "audio/flac",
        aac: "audio/aac", m4a: "audio/mp4", opus: "audio/opus", aiff: "audio/aiff",
        wma: "audio/x-ms-wma", ac3: "audio/ac3", amr: "audio/amr",
        mp4: "video/mp4", webm: "video/webm", avi: "video/x-msvideo",
        mkv: "video/x-matroska", mov: "video/quicktime", flv: "video/x-flv",
        wmv: "video/x-ms-wmv", "3gp": "video/3gpp", ogv: "video/ogg",
        mpeg: "video/mpeg", mpg: "video/mpeg", m4v: "video/mp4",
    };

    return new Blob([data], { type: mimeMap[outputExt] || "application/octet-stream" });
}

export async function compressMedia(
    file: File,
    ext: string,
    level: "light" | "medium" | "heavy"
): Promise<Blob> {
    const audioBitrates = { light: "192k", medium: "128k", heavy: "64k" };
    const videoBitrates = { light: "2000k", medium: "1000k", heavy: "500k" };
    const resolutions = { light: "-1:720", medium: "-1:480", heavy: "-1:360" };

    const isAudio = ["mp3", "wav", "ogg", "flac", "aac", "m4a", "opus", "aiff", "wma"].includes(ext);

    return convertMedia(file, ext, ext, {
        compress: true,
        audioBitrate: audioBitrates[level],
        videoBitrate: isAudio ? undefined : videoBitrates[level],
        resolution: isAudio ? undefined : resolutions[level],
    });
}

export function isFFmpegFormat(ext: string): boolean {
    const ffmpegFormats = [
        "mp3", "wav", "ogg", "flac", "aac", "wma", "m4a", "opus", "aiff", "ac3", "amr", "pcm",
        "mp4", "webm", "avi", "mkv", "mov", "flv", "wmv", "3gp", "ogv", "m4v", "mpeg", "mpg", "vob", "3g2",
    ];
    return ffmpegFormats.includes(ext);
}
