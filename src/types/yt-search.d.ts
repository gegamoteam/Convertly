declare module "yt-search" {
    interface VideoResult {
        videoId: string;
        title: string;
        url: string;
        seconds?: number;
        timestamp?: string;
        thumbnail?: string;
        image?: string;
        author?: { name?: string; url?: string };
    }

    interface SearchResult {
        videos: VideoResult[];
    }

    function yts(query: string): Promise<SearchResult>;
    export default yts;
}
