"use client";

import { Image, FileText, Music, Video, Database, Subtitles } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import styles from "./SupportedFormats.module.css";

export function SupportedFormats() {
    const { t } = useI18n();

    const categories = [
        { icon: Image, name: t("formats.images"), formats: ["PNG", "JPG", "WEBP", "GIF", "BMP", "ICO", "SVG", "TIFF", "AVIF", "HEIC"] },
        { icon: Music, name: t("formats.audio"), formats: ["MP3", "WAV", "OGG", "FLAC", "AAC", "WMA", "M4A", "OPUS", "AIFF"] },
        { icon: Video, name: t("formats.video"), formats: ["MP4", "WEBM", "AVI", "MOV", "MKV", "FLV", "WMV", "3GP", "MPEG"] },
        { icon: FileText, name: t("formats.documents"), formats: ["TXT", "HTML", "MD", "RTF", "CSV", "LOG", "SRT", "VTT"] },
        { icon: Database, name: t("formats.data"), formats: ["JSON", "CSV", "XML", "YAML", "TSV", "TOML", "INI", "NDJSON"] },
        { icon: Subtitles, name: t("formats.subtitles"), formats: ["SRT", "VTT", "ASS", "SSA", "SUB"] },
    ];

    return (
        <section className={`section ${styles.formats}`} id="formats">
            <div className="container">
                <div className="section-header">
                    <p className="section-label">{t("formats.label")}</p>
                    <h2 className="section-title">
                        {t("formats.title")}
                        <span className="gradient-text">{t("formats.titleGradient")}</span>
                    </h2>
                    <p className="section-desc">
                        {t("formats.desc")}
                    </p>
                </div>

                <div className={styles.formatsCategories}>
                    {categories.map((cat, i) => (
                        <div key={i} className={`glass-card ${styles.formatCategory} animate-in`}>
                            <div className={styles.formatCategoryHeader}>
                                <div className={styles.formatCategoryIcon}>
                                    <cat.icon size={20} strokeWidth={1.8} />
                                </div>
                                <h3>{cat.name}</h3>
                            </div>
                            <div className={styles.formatTags}>
                                {cat.formats.map((f) => (
                                    <span key={f} className={styles.formatTag}>{f}</span>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
