import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Privacy Policy",
    description:
        "Convertly Privacy Policy — We process nothing on our servers. All file conversions happen locally in your browser. No data is collected, stored, or transmitted.",
};

export default function PrivacyLayout({ children }: { children: React.ReactNode }) {
    return children;
}
