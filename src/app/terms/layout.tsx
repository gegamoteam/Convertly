import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Terms of Service",
    description:
        "Convertly Terms of Service — Read the terms and conditions for using Convertly, the free, private, browser-based file converter.",
};

export default function TermsLayout({ children }: { children: React.ReactNode }) {
    return children;
}
