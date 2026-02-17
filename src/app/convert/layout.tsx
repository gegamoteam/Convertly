import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Convert Files",
    description:
        "Convert images, documents, audio, video, and data files instantly in your browser. 100% private — no uploads, no servers. Supports PNG, JPG, WEBP, PDF, MP3, MP4, JSON, CSV, and 50+ more formats.",
};

export default function ConvertLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <>{children}</>;
}
