"use client";

import { useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
    ArrowRight, Upload, Github, Shrink, FileText,
    Image as ImageIcon, Music, Video, Database,
} from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { setPendingFiles } from "@/lib/fileStore";
import { FORMATS } from "@/lib/converter";
import styles from "./Hero.module.css";

const GITHUB_URL = "https://github.com/gegamoteam/Convertly";

const CATEGORY_ICONS: Record<string, typeof FileText> = {
    image: ImageIcon, audio: Music, video: Video, data: Database, document: FileText,
};

function getCategoryIcon(ext: string) {
    const info = FORMATS[ext];
    return CATEGORY_ICONS[info?.category || "document"] || FileText;
}

function formatBytes(bytes: number): string {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
}

export function Hero() {
    const { t } = useI18n();
    const router = useRouter();
    const [dragging, setDragging] = useState(false);
    const [widgetMode, setWidgetMode] = useState<"convert" | "compress">("convert");
    const [droppedFiles, setDroppedFiles] = useState<File[]>([]);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFiles = useCallback((files: FileList | File[]) => {
        const arr = Array.from(files);
        if (arr.length === 0) return;
        setDroppedFiles(arr);
        // Brief delay so the user sees the files listed, then navigate
        setTimeout(() => {
            setPendingFiles(arr, widgetMode);
            router.push("/convert");
        }, 600);
    }, [widgetMode, router]);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setDragging(false);
        if (e.dataTransfer.files.length > 0) handleFiles(e.dataTransfer.files);
    }, [handleFiles]);

    return (
        <section className={styles.hero}>
            <div className={styles.heroBg}>
                <div className={`${styles.heroGlow} ${styles.heroGlow1}`} />
                <div className={`${styles.heroGlow} ${styles.heroGlow2}`} />
                <div className={styles.heroGridLines} />
            </div>

            <div className={`container ${styles.heroSplit}`}>
                {/* ── Left: Text ── */}
                <div className={styles.heroText}>
                    <h1 className={styles.heroTitle}>
                        {t("hero.title1")}<br />
                        <span className="gradient-text">{t("hero.titleGradient")}</span>
                    </h1>

                    <div className={styles.heroActions}>
                        <a href="/convert" className="btn btn-primary">
                            {t("hero.cta")} <ArrowRight size={16} />
                        </a>
                        <a href="/download" className="btn btn-secondary">
                            Media Download
                        </a>
                        <a href={GITHUB_URL} target="_blank" rel="noopener noreferrer" className={styles.githubBtn}>
                            <Github size={18} />
                            {t("hero.github")}
                        </a>
                    </div>
                </div>

                {/* ── Right: Upload Widget ── */}
                <div className={styles.heroWidget}>
                    <div className={styles.widgetTabs}>
                        <button
                            className={`${styles.widgetTab} ${widgetMode === "convert" ? styles.widgetTabActive : ""}`}
                            onClick={() => setWidgetMode("convert")}
                        >
                            <ArrowRight size={15} />
                            {t("convert.modeConvert")}
                        </button>
                        <button
                            className={`${styles.widgetTab} ${styles.widgetTabCompress} ${widgetMode === "compress" ? styles.widgetTabActive : ""}`}
                            onClick={() => setWidgetMode("compress")}
                        >
                            <Shrink size={15} />
                            {t("convert.modeCompress")}
                        </button>
                    </div>

                    <div
                        className={`${styles.widgetDropzone} ${dragging ? styles.widgetDragging : ""}`}
                        onDragOver={e => { e.preventDefault(); setDragging(true); }}
                        onDragLeave={() => setDragging(false)}
                        onDrop={handleDrop}
                        onClick={() => fileInputRef.current?.click()}
                    >
                        {droppedFiles.length > 0 ? (
                            <div className={styles.widgetFileList}>
                                {droppedFiles.slice(0, 4).map((f, i) => {
                                    const ext = f.name.split(".").pop()?.toLowerCase() || "";
                                    const Icon = getCategoryIcon(ext);
                                    return (
                                        <div key={i} className={styles.widgetFileItem}>
                                            <Icon size={16} />
                                            <span className={styles.widgetFileName}>{f.name}</span>
                                            <span className={styles.widgetFileSize}>{formatBytes(f.size)}</span>
                                        </div>
                                    );
                                })}
                                {droppedFiles.length > 4 && (
                                    <div className={styles.widgetFileMore}>+{droppedFiles.length - 4} more</div>
                                )}
                                <div className={styles.widgetRedirecting}>
                                    <div className={styles.widgetSpinner} />
                                    {widgetMode === "convert" ? t("convert.converting") : t("convert.compressing")}...
                                </div>
                            </div>
                        ) : (
                            <>
                                <div className={styles.widgetUploadIcon}>
                                    <Upload size={28} strokeWidth={1.8} />
                                </div>
                                <p className={styles.widgetMainText}>
                                    {t("convert.dropFiles")} {widgetMode === "convert" ? t("convert.modeConvert").toLowerCase() : t("convert.modeCompress").toLowerCase()}
                                </p>
                                <p className={styles.widgetSubText}>
                                    {t("convert.browse")} {t("convert.toGetStarted")}
                                </p>
                            </>
                        )}
                        <input
                            ref={fileInputRef}
                            type="file"
                            multiple
                            style={{ display: "none" }}
                            onChange={e => {
                                if (e.target.files) handleFiles(e.target.files);
                                e.target.value = "";
                            }}
                        />
                    </div>

                    <div className={styles.widgetFormats}>
                        PNG · JPG · WEBP · MP3 · MP4 · PDF · CSV · 100+
                    </div>
                </div>
            </div>
        </section>
    );
}
