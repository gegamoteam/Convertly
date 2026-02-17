"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import styles from "./FAQ.module.css";

const faqs = [
    {
        q: "Is Convertly really free?",
        a: "Yes, completely free with no hidden fees, subscriptions, or premium tiers. All features are available to everyone. Convertly is open-source and maintained by the Gegamo Team.",
    },
    {
        q: "How does local processing work?",
        a: "When you drop a file into Convertly, your browser handles the entire conversion using JavaScript and the Canvas API. The file never leaves your device. No data is sent to any server at any point during the process.",
    },
    {
        q: "What file formats are supported?",
        a: "We support 50+ formats across images (PNG, JPG, WEBP, GIF, BMP, SVG, TIFF, ICO), documents (TXT, HTML, Markdown), and data files (JSON, CSV, XML, YAML, TSV). We're constantly adding more.",
    },
    {
        q: "Is there a file size limit?",
        a: "There's no hard limit imposed by Convertly. Since processing happens in your browser, the practical limit depends on your device's available memory. Most files up to several hundred MB work fine.",
    },
    {
        q: "Can I convert multiple files at once?",
        a: "Yes! Our batch conversion feature lets you drag and drop multiple files at once. Each file is processed independently and you can download them individually or all at once as a ZIP file.",
    },
    {
        q: "Do you collect any data or analytics?",
        a: "No. Zero data collection, zero tracking, zero cookies, zero analytics. We don't even have a backend server. Your privacy is absolute and non-negotiable.",
    },
    {
        q: "Can I adjust conversion quality?",
        a: "Yes, for image conversions you can adjust the output quality using a slider. This is especially useful for lossy formats like JPG and WEBP where you want to balance quality vs file size.",
    },
    {
        q: "Is Convertly open source?",
        a: "Yes! Convertly is fully open-source under the MIT license. You can view, fork, and contribute to the codebase on GitHub. We welcome contributions from the community.",
    },
];

export function FAQ() {
    const [openIndex, setOpenIndex] = useState<number | null>(null);

    return (
        <section className={`section ${styles.faq}`} id="faq">
            <div className="container">
                <div className="section-header">
                    <p className="section-label">FAQ</p>
                    <h2 className="section-title">
                        Got questions?{" "}
                        <span className="gradient-text">We&apos;ve got answers.</span>
                    </h2>
                    <p className="section-desc">
                        Everything you need to know about Convertly and how it works.
                    </p>
                </div>

                <div className={styles.faqList}>
                    {faqs.map((faq, i) => (
                        <div
                            key={i}
                            className={`${styles.faqItem} ${openIndex === i ? styles.faqOpen : ""}`}
                        >
                            <button
                                className={styles.faqQuestion}
                                onClick={() => setOpenIndex(openIndex === i ? null : i)}
                                aria-expanded={openIndex === i}
                            >
                                <span>{faq.q}</span>
                                <ChevronDown size={20} className={styles.faqChevron} />
                            </button>
                            <div className={styles.faqAnswer}>
                                <p>{faq.a}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
