import { NextRequest, NextResponse } from "next/server";
import {
    createDownloadPlan,
    isSupportedUrl,
    type DownloadFormat,
    type VideoQuality,
} from "@/lib/media-downloader";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const FORMATS = new Set<DownloadFormat>(["mp3", "mp4", "m4a", "webm", "wav"]);
const QUALITIES = new Set<VideoQuality>(["best", "720", "480", "360"]);

async function handleDownload(url: string, formatRaw: string, qualityRaw: string) {
    const format = formatRaw.toLowerCase() as DownloadFormat;
    const quality = (qualityRaw.toLowerCase() || "best") as VideoQuality;

    try {
        if (!url) {
            return NextResponse.json({ error: "URL is required" }, { status: 400 });
        }
        if (!isSupportedUrl(url)) {
            return NextResponse.json(
                { error: "Unsupported link. Use a YouTube video or Spotify track URL." },
                { status: 400 }
            );
        }
        if (!FORMATS.has(format)) {
            return NextResponse.json(
                { error: "Invalid format. Use MP3, MP4, M4A, WebM, or WAV." },
                { status: 400 }
            );
        }
        if (!QUALITIES.has(quality)) {
            return NextResponse.json(
                { error: "Invalid quality. Use best, 720, 480, or 360." },
                { status: 400 }
            );
        }

        const plan = await createDownloadPlan(url, { format, quality });
        return NextResponse.json(plan, {
            headers: { "Cache-Control": "no-store" },
        });
    } catch (error) {
        const message = error instanceof Error ? error.message : "Download could not be prepared";
        console.error("[api/download] failed", { message, format, quality });
        return NextResponse.json({ error: message }, { status: 502 });
    }
}

export async function POST(request: NextRequest) {
    const body = await request.json().catch(() => ({})) as {
        url?: string;
        format?: string;
        quality?: string;
    };
    const url = typeof body.url === "string" ? body.url.trim() : "";
    const format = typeof body.format === "string" ? body.format : "mp3";
    const quality = typeof body.quality === "string" ? body.quality : "best";
    return handleDownload(url, format, quality);
}

export async function GET(request: NextRequest) {
    const url = (request.nextUrl.searchParams.get("url") || "").trim();
    const format = request.nextUrl.searchParams.get("format") || "mp3";
    const quality = request.nextUrl.searchParams.get("quality") || "best";
    return handleDownload(url, format, quality);
}
