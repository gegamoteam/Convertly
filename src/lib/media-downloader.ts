export type MediaSource = "youtube" | "spotify" | "unknown";

export interface MediaInfo {
    source: MediaSource;
    id: string;
    title: string;
    artist?: string;
    duration?: number;
    thumbnail?: string;
    url: string;
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

async function fetchOEmbed(url: string, source: "youtube" | "spotify") {
    const endpoint = source === "youtube"
        ? `https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`
        : `https://open.spotify.com/oembed?url=${encodeURIComponent(url)}`;
    const response = await fetch(endpoint, {
        headers: { Accept: "application/json" },
        cache: "no-store",
        signal: AbortSignal.timeout(8000),
    });
    if (!response.ok) throw new Error(`Could not read that ${source === "youtube" ? "YouTube video" : "Spotify track"}.`);
    return response.json() as Promise<{
        author_name?: string;
        thumbnail_url?: string;
        title?: string;
    }>;
}

export async function getMediaInfo(rawUrl: string): Promise<MediaInfo> {
    const url = rawUrl.trim();
    const source = detectSource(url);

    if (source === "youtube") {
        const id = youtubeId(url);
        if (!id) throw new Error("That does not look like a valid YouTube video link.");

        try {
            const data = await fetchOEmbed(`https://www.youtube.com/watch?v=${id}`, "youtube");
            return {
                source,
                id,
                title: data.title || "YouTube video",
                artist: data.author_name,
                thumbnail: data.thumbnail_url || `https://i.ytimg.com/vi/${id}/hqdefault.jpg`,
                url: `https://www.youtube.com/watch?v=${id}`,
            };
        } catch {
            // Preview metadata is optional. The browser performs the real media lookup.
            return {
                source,
                id,
                title: "YouTube video",
                thumbnail: `https://i.ytimg.com/vi/${id}/hqdefault.jpg`,
                url: `https://www.youtube.com/watch?v=${id}`,
            };
        }
    }

    if (source === "spotify") {
        if (!/\/(track|episode)\//i.test(url)) {
            throw new Error("Paste a Spotify track or episode link, not an album or playlist.");
        }
        const data = await fetchOEmbed(url, "spotify");
        const id = url.match(/\/(?:track|episode)\/([a-zA-Z0-9]+)/)?.[1] || "spotify";
        return {
            source,
            id,
            title: data.title || "Spotify track",
            artist: data.author_name && data.author_name !== "Spotify" ? data.author_name : undefined,
            thumbnail: data.thumbnail_url,
            url,
        };
    }

    throw new Error("Unsupported link. Use a YouTube video or Spotify track URL.");
}
