import { NextRequest, NextResponse } from "next/server";
import { getMediaInfo, isSupportedUrl } from "@/lib/media-downloader";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function POST(req: NextRequest) {
    try {
        const body = await req.json().catch(() => ({})) as { url?: string };
        const url = typeof body.url === "string" ? body.url.trim() : "";

        if (!url) {
            return NextResponse.json({ error: "URL is required" }, { status: 400 });
        }
        if (!isSupportedUrl(url)) {
            return NextResponse.json(
                { error: "Unsupported link. Use YouTube or Spotify track URLs." },
                { status: 400 }
            );
        }

        const info = await getMediaInfo(url);
        return NextResponse.json({
            source: info.source,
            id: info.id,
            title: info.title,
            artist: info.artist,
            duration: info.duration,
            thumbnail: info.thumbnail,
            url: info.url,
        });
    } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to fetch media info";
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
