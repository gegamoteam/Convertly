import { NextRequest, NextResponse } from "next/server";
import { createReadStream } from "fs";
import { Readable } from "stream";
import os from "os";
import {
    downloadMedia,
    cleanupDownload,
    isSupportedUrl,
    type DownloadFormat,
    type VideoQuality,
} from "@/lib/media-downloader";

process.env.YTDL_NO_DEBUG_FILE = "1";
process.env.YTDL_DEBUG_PATH = os.tmpdir();

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

const FORMATS = new Set<DownloadFormat>(["mp3", "mp4", "m4a", "webm", "wav"]);
const QUALITIES = new Set<VideoQuality>(["best", "1080", "720", "480", "360"]);

async function handleDownload(url: string, formatRaw: string, qualityRaw: string) {
    let filePath: string | null = null;
    const format = formatRaw.toLowerCase() as DownloadFormat;
    const quality = (qualityRaw.toLowerCase() || "best") as VideoQuality;

    try {
        if (!url) {
            return NextResponse.json({ error: "URL is required" }, { status: 400 });
        }
        if (!isSupportedUrl(url)) {
            return NextResponse.json(
                { error: "Unsupported link. Use YouTube or Spotify track URLs." },
                { status: 400 }
            );
        }
        if (!FORMATS.has(format)) {
            return NextResponse.json(
                { error: "Invalid format. Use mp3, mp4, m4a, webm, or wav." },
                { status: 400 }
            );
        }
        if (!QUALITIES.has(quality)) {
            return NextResponse.json(
                { error: "Invalid quality. Use best, 1080, 720, 480, or 360." },
                { status: 400 }
            );
        }

        const result = await downloadMedia(url, { format, quality });
        filePath = result.filePath;

        const nodeStream = createReadStream(result.filePath);
        const webStream = Readable.toWeb(nodeStream) as ReadableStream;

        const cleanup = () => {
            if (filePath) void cleanupDownload(filePath);
            filePath = null;
        };
        nodeStream.on("close", cleanup);
        nodeStream.on("error", cleanup);

        const headers = new Headers();
        headers.set("Content-Type", result.mime);
        headers.set("Content-Length", String(result.size));
        headers.set(
            "Content-Disposition",
            `attachment; filename*=UTF-8''${encodeURIComponent(result.fileName)}`
        );
        headers.set("X-Convertly-Title", encodeURIComponent(result.title));
        headers.set("Cache-Control", "no-store");

        return new NextResponse(webStream, { status: 200, headers });
    } catch (err) {
        if (filePath) await cleanupDownload(filePath);
        const message = err instanceof Error ? err.message : "Download failed";
        return NextResponse.json({ error: message }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    const body = await req.json().catch(() => ({})) as {
        url?: string;
        format?: string;
        quality?: string;
    };
    const url = typeof body.url === "string" ? body.url.trim() : "";
    const format = typeof body.format === "string" ? body.format : "mp3";
    const quality = typeof body.quality === "string" ? body.quality : "best";
    return handleDownload(url, format, quality);
}

export async function GET(req: NextRequest) {
    const url = (req.nextUrl.searchParams.get("url") || "").trim();
    const format = req.nextUrl.searchParams.get("format") || "mp3";
    const quality = req.nextUrl.searchParams.get("quality") || "best";
    return handleDownload(url, format, quality);
}
