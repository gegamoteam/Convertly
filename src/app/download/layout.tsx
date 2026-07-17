import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Media Downloader — YouTube MP3/MP4, Spotify to MP3",
    description:
        "Download YouTube videos as MP3 or MP4, convert Spotify tracks to MP3, and grab SoundCloud audio with Convertly.",
};

export default function DownloadLayout({ children }: { children: React.ReactNode }) {
    return children;
}
