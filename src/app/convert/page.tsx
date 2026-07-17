"use client";

import { useState, useRef, useCallback, useMemo, useEffect } from "react";
import {
    Upload, FileText, Image as ImageIcon, Music, Video, Database, X,
    ArrowRight, CheckCircle, Download, RefreshCw, AlertTriangle,
    Trash2, Settings2, Archive, Copy, Eye, Subtitles, Code2,
    Disc3, Package, BookOpen, Shrink, ArrowDownCircle,
} from "lucide-react";
import { convertFile, getAvailableConversions, getFormatInfo, FORMATS, CONVERSION_MAP } from "@/lib/converter";
import { useToast } from "@/components/Toast";
import { useI18n } from "@/lib/i18n";
import { consumePendingFiles } from "@/lib/fileStore";
import styles from "./convert.module.css";

function formatBytes(bytes: number): string {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

const CATEGORY_ICONS: Record<string, typeof FileText> = {
    image: ImageIcon, audio: Music, video: Video, data: Database,
    document: FileText, subtitle: Subtitles, code: Code2,
    font: Disc3, archive: Package, ebook: BookOpen,
};

function getCategoryIcon(ext: string) {
    const info = FORMATS[ext];
    return CATEGORY_ICONS[info?.category || "document"] || FileText;
}

interface FileItem {
    id: string;
    file: File;
    targetFormat: string;
    status: "pending" | "converting" | "done" | "error";
    progress: number;
    result: Blob | null;
    error: string | null;
    quality: number;
    previewUrl: string | null;
    resultPreviewUrl: string | null;
}

type PageMode = "convert" | "compress";
type CompressionLevel = "light" | "medium" | "heavy";

export default function ConvertPage() {
    const [mode, setMode] = useState<PageMode>("convert");
    const [files, setFiles] = useState<FileItem[]>([]);
    const [dragging, setDragging] = useState(false);
    const [showSettings, setShowSettings] = useState<string | null>(null);
    const [previewFile, setPreviewFile] = useState<string | null>(null);
    const [preSelectedFormat, setPreSelectedFormat] = useState<string | null>(null);
    const [formatCategory, setFormatCategory] = useState("all");
    const [compressionLevel, setCompressionLevel] = useState<CompressionLevel>("medium");
    const fileInputRef = useRef<HTMLInputElement>(null);
    const { addToast } = useToast();
    const { t } = useI18n();

    const CATEGORY_ORDER = useMemo(() => [
        { key: "all", label: t("convert.all") },
        { key: "image", label: t("convert.images") },
        { key: "audio", label: t("convert.audio") },
        { key: "video", label: t("convert.video") },
        { key: "document", label: t("convert.docs") },
        { key: "data", label: t("convert.data") },
        { key: "subtitle", label: t("convert.subtitles") },
    ], [t]);

    const targetFormats = useMemo(() => {
        const targets = new Set<string>();
        Object.values(CONVERSION_MAP).forEach(arr => arr.forEach(f => targets.add(f)));
        const all = Array.from(targets).sort();
        if (formatCategory === "all") return all;
        return all.filter(f => FORMATS[f]?.category === formatCategory);
    }, [formatCategory]);

    const addFiles = useCallback((newFiles: FileList | File[]) => {
        const items: FileItem[] = Array.from(newFiles).map(f => {
            const ext = f.name.split(".").pop()?.toLowerCase() || "";
            const conversions = getAvailableConversions(f.name);
            const isImage = FORMATS[ext]?.category === "image";
            let target = conversions[0] || "";
            if (mode === "compress") {
                target = ext;
            } else if (preSelectedFormat && conversions.includes(preSelectedFormat)) {
                target = preSelectedFormat;
            }
            return {
                id: Math.random().toString(36).slice(2, 10),
                file: f,
                targetFormat: target,
                status: "pending" as const,
                progress: 0,
                result: null,
                error: mode === "convert" && conversions.length === 0 ? `${t("convert.noConversions")} .${ext}` : null,
                quality: 92,
                previewUrl: isImage ? URL.createObjectURL(f) : null,
                resultPreviewUrl: null,
            };
        });
        setFiles(prev => [...prev, ...items]);
    }, [preSelectedFormat, mode, t]);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault(); setDragging(false);
        if (e.dataTransfer.files.length > 0) addFiles(e.dataTransfer.files);
    }, [addFiles]);

    // Pick up files from Hero dropzone
    useEffect(() => {
        const { files: pending, mode: pendingMode } = consumePendingFiles();
        if (pending.length > 0) {
            setMode(pendingMode);
            addFiles(pending);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const updateFile = useCallback((id: string, update: Partial<FileItem>) => {
        setFiles(prev => prev.map(f => f.id === id ? { ...f, ...update } : f));
    }, []);

    const removeFile = useCallback((id: string) => {
        setFiles(prev => {
            const item = prev.find(f => f.id === id);
            if (item?.previewUrl) URL.revokeObjectURL(item.previewUrl);
            if (item?.resultPreviewUrl) URL.revokeObjectURL(item.resultPreviewUrl);
            return prev.filter(f => f.id !== id);
        });
    }, []);

    const convertSingleFile = useCallback(async (item: FileItem) => {
        if (!item.targetFormat || item.status === "converting" || item.status === "done") return;
        updateFile(item.id, { status: "converting", progress: 1, error: null });
        try {
            const blob = await convertFile(item.file, item.targetFormat, item.quality, {
                compress: mode === "compress",
                compressionLevel: compressionLevel,
                onProgress: (pct) => {
                    updateFile(item.id, { progress: Math.min(99, Math.max(1, Math.round(pct))) });
                },
            });
            const isImgResult = FORMATS[item.targetFormat]?.category === "image";
            updateFile(item.id, {
                status: "done", progress: 100, result: blob,
                resultPreviewUrl: isImgResult ? URL.createObjectURL(blob) : null,
            });
            const action = mode === "compress" ? t("convert.compressed") : t("convert.converted");
            addToast(`${action} ${item.file.name}`, "success");
        } catch (err) {
            updateFile(item.id, { status: "error", error: err instanceof Error ? err.message : "Failed", progress: 0 });
            addToast(`${t("convert.failedPrefix")} ${item.file.name}`, "error");
        }
    }, [updateFile, addToast, mode, compressionLevel, t]);

    const processAll = useCallback(async () => {
        const pending = files.filter(f => f.status === "pending" && f.targetFormat);
        if (!pending.length) return;
        const action = mode === "compress" ? t("convert.compressing") : t("convert.converting");
        addToast(`${action} ${pending.length} ${pending.length > 1 ? t("convert.files") : t("convert.file")}...`, "info");
        for (const item of pending) await convertSingleFile(item);
    }, [files, convertSingleFile, addToast, mode, t]);

    const downloadFile = useCallback((item: FileItem) => {
        if (!item.result) return;
        const ext = item.file.name.split(".").pop() || "";
        const baseName = item.file.name.replace(/\.[^/.]+$/, "");
        const suffix = mode === "compress" ? "_compressed" : "";
        const name = `${baseName}${suffix}.${item.targetFormat || ext}`;
        const url = URL.createObjectURL(item.result);
        const a = document.createElement("a"); a.href = url; a.download = name; a.click();
        URL.revokeObjectURL(url);
    }, [mode]);

    const downloadAll = useCallback(async () => {
        const done = files.filter(f => f.status === "done" && f.result);
        for (const item of done) { downloadFile(item); await new Promise(r => setTimeout(r, 200)); }
        addToast(`Downloaded ${done.length} ${t("convert.files")}`, "success");
    }, [files, downloadFile, addToast, t]);

    const clearAll = useCallback(() => {
        files.forEach(f => {
            if (f.previewUrl) URL.revokeObjectURL(f.previewUrl);
            if (f.resultPreviewUrl) URL.revokeObjectURL(f.resultPreviewUrl);
        });
        setFiles([]); setShowSettings(null); setPreviewFile(null);
    }, [files]);

    const resetAll = useCallback(() => {
        setFiles(prev => prev.map(f => ({
            ...f, status: "pending" as const, progress: 0, result: null,
            error: null, resultPreviewUrl: null,
        })));
    }, []);

    const switchMode = useCallback((newMode: PageMode) => {
        if (newMode === mode) return;
        setMode(newMode);
        setFiles(prev => prev.map(f => {
            if (f.status !== "pending") return f;
            const ext = f.file.name.split(".").pop()?.toLowerCase() || "";
            if (newMode === "compress") {
                return { ...f, targetFormat: ext, error: null };
            } else {
                const conversions = getAvailableConversions(f.file.name);
                return { ...f, targetFormat: conversions[0] || "", error: conversions.length === 0 ? `${t("convert.noConversions")} .${ext}` : null };
            }
        }));
    }, [mode, t]);

    const pendingCount = files.filter(f => f.status === "pending" && f.targetFormat).length;
    const doneCount = files.filter(f => f.status === "done").length;
    const convertingCount = files.filter(f => f.status === "converting").length;

    const totalOriginalSize = files.filter(f => f.status === "done").reduce((s, f) => s + f.file.size, 0);
    const totalCompressedSize = files.filter(f => f.status === "done" && f.result).reduce((s, f) => s + (f.result?.size || 0), 0);
    const savingsPercent = totalOriginalSize > 0 ? Math.round((1 - totalCompressedSize / totalOriginalSize) * 100) : 0;

    return (
        <div className={`${styles.converterPage} section`}>
            <div className="container">
                <div className="section-header">
                    <p className="section-label">{t("convert.label")}</p>
                    <h1 className="section-title">
                        {mode === "convert" ? (
                            <>{t("convert.titleConvert")}<span className="gradient-text">{t("convert.titleConvertGradient")}</span></>
                        ) : (
                            <>{t("convert.titleCompress")}<span className="gradient-text">{t("convert.titleCompressGradient")}</span></>
                        )}
                    </h1>
                    <p className="section-desc">
                        {mode === "convert" ? t("convert.descConvert") : t("convert.descCompress")}
                    </p>
                </div>

                <div className={styles.converterLayout}>
                    {/* ── Mode Switch ── */}
                    <div className={styles.modeSwitch}>
                        <button className={`${styles.modeSwitchBtn} ${mode === "convert" ? styles.modeSwitchBtnActive : ""}`} onClick={() => switchMode("convert")}>
                            <ArrowRight size={18} />
                            <span>{t("convert.modeConvert")}</span>
                            <small>{t("convert.modeConvertSub")}</small>
                        </button>
                        <button className={`${styles.modeSwitchBtn} ${styles.modeSwitchBtnCompress} ${mode === "compress" ? styles.modeSwitchBtnActive : ""}`} onClick={() => switchMode("compress")}>
                            <Shrink size={18} />
                            <span>{t("convert.modeCompress")}</span>
                            <small className={styles.newBadge}>{t("convert.new")}</small>
                        </button>
                    </div>

                    {/* ── Compress Hero ── */}
                    {mode === "compress" && (
                        <div className={styles.compressHero}>
                            <div className={styles.compressHeroInner}>
                                <div className={styles.compressHeroIcon}><ArrowDownCircle size={32} strokeWidth={1.5} /></div>
                                <div className={styles.compressHeroText}>
                                    <h3>{t("convert.compressTitle")}</h3>
                                    <p>{t("convert.compressDesc")}</p>
                                </div>
                            </div>
                            <div className={styles.compressLevels}>
                                <button className={`${styles.compressLevel} ${compressionLevel === "light" ? styles.compressLevelActive : ""}`} onClick={() => setCompressionLevel("light")}>
                                    <span className={styles.compressLevelTitle}>{t("convert.light")}</span>
                                    <span className={styles.compressLevelDesc}>{t("convert.lightDesc")}</span>
                                    <span className={styles.compressLevelPercent}>{t("convert.lightPercent")}</span>
                                </button>
                                <button className={`${styles.compressLevel} ${compressionLevel === "medium" ? styles.compressLevelActive : ""}`} onClick={() => setCompressionLevel("medium")}>
                                    <span className={styles.compressLevelTitle}>{t("convert.balanced")}</span>
                                    <span className={styles.compressLevelDesc}>{t("convert.balancedDesc")}</span>
                                    <span className={styles.compressLevelPercent}>{t("convert.balancedPercent")}</span>
                                </button>
                                <button className={`${styles.compressLevel} ${compressionLevel === "heavy" ? styles.compressLevelActive : ""}`} onClick={() => setCompressionLevel("heavy")}>
                                    <span className={styles.compressLevelTitle}>{t("convert.maximum")}</span>
                                    <span className={styles.compressLevelDesc}>{t("convert.maximumDesc")}</span>
                                    <span className={styles.compressLevelPercent}>{t("convert.maximumPercent")}</span>
                                </button>
                            </div>
                            {doneCount > 0 && savingsPercent > 0 && (
                                <div className={styles.compressSavings}>
                                    <CheckCircle size={16} />
                                    {t("convert.saved")} {savingsPercent}% — {formatBytes(totalOriginalSize)} → {formatBytes(totalCompressedSize)}
                                </div>
                            )}
                        </div>
                    )}

                    {/* ── Dropzone ── */}
                    <div
                        className={`${styles.dropzone} ${dragging ? styles.dragging : ""} ${files.length > 0 ? styles.dropzoneCompact : ""}`}
                        onDragOver={e => { e.preventDefault(); setDragging(true); }}
                        onDragLeave={() => setDragging(false)}
                        onDrop={handleDrop}
                        onClick={() => fileInputRef.current?.click()}
                    >
                        <div className={styles.dropzoneIcon}><Upload size={files.length > 0 ? 20 : 28} strokeWidth={1.8} /></div>
                        <div>
                            <h3>{files.length > 0 ? t("convert.addMore") : `${t("convert.dropFiles")} ${mode === "convert" ? t("convert.modeConvert").toLowerCase() : t("convert.modeCompress").toLowerCase()}`}</h3>
                            <p>{t("convert.browse")}{files.length === 0 && t("convert.toGetStarted")}</p>
                        </div>
                        <input ref={fileInputRef} type="file" multiple onChange={e => { if (e.target.files) addFiles(e.target.files); e.target.value = ""; }} />
                    </div>

                    {/* ── Format Picker ── */}
                    {mode === "convert" && (
                        <div className={styles.formatPicker}>
                            <div className={styles.formatPickerHeader}>
                                <h3>{t("convert.convertTo")}</h3>
                                {preSelectedFormat && (
                                    <button className={styles.formatPickerClear} onClick={() => setPreSelectedFormat(null)}>
                                        <X size={14} /> {t("convert.clearSelection")}
                                    </button>
                                )}
                            </div>
                            <div className={styles.categoryTabs}>
                                {CATEGORY_ORDER.map(cat => (
                                    <button key={cat.key} className={`${styles.categoryTab} ${formatCategory === cat.key ? styles.categoryTabActive : ""}`} onClick={() => setFormatCategory(cat.key)}>
                                        {cat.label}
                                    </button>
                                ))}
                            </div>
                            <div className={styles.formatChips}>
                                {targetFormats.map(fmt => {
                                    const info = getFormatInfo(fmt);
                                    return (
                                        <button key={fmt} className={`${styles.formatChip} ${preSelectedFormat === fmt ? styles.formatChipActive : ""}`} onClick={() => setPreSelectedFormat(preSelectedFormat === fmt ? null : fmt)}>
                                            {info?.label || fmt.toUpperCase()}
                                        </button>
                                    );
                                })}
                            </div>
                            {preSelectedFormat && <p className={styles.formatPickerHint}>{t("convert.filesWillTarget")} <strong>.{preSelectedFormat.toUpperCase()}</strong></p>}
                        </div>
                    )}

                    {/* ── Toolbar ── */}
                    {files.length > 0 && (
                        <div className={styles.toolbar}>
                            <div className={styles.toolbarInfo}>
                                <span className={styles.toolbarCount}>{files.length} {files.length !== 1 ? t("convert.files") : t("convert.file")}</span>
                                {doneCount > 0 && <span className={`badge badge-success ${styles.toolbarBadge}`}><CheckCircle size={12} /> {doneCount} {t("convert.done")}</span>}
                                {convertingCount > 0 && <span className={`badge ${styles.toolbarBadge}`}><RefreshCw size={12} className="spinning" /> {convertingCount}</span>}
                            </div>
                            <div className={styles.toolbarActions}>
                                {pendingCount > 0 && (
                                    <button className="btn btn-primary btn-sm" onClick={processAll}>
                                        {mode === "compress" ? <Shrink size={14} /> : <ArrowRight size={14} />}
                                        {mode === "compress" ? `${t("convert.compressAll")} (${pendingCount})` : `${t("convert.convertAll")} (${pendingCount})`}
                                    </button>
                                )}
                                {doneCount > 1 && <button className="btn btn-success btn-sm" onClick={downloadAll}><Archive size={14} /> {t("convert.downloadAll")}</button>}
                                {doneCount > 0 && <button className="btn btn-secondary btn-sm" onClick={resetAll}><RefreshCw size={14} /> {t("convert.reset")}</button>}
                                <button className="btn btn-danger btn-sm" onClick={clearAll}><Trash2 size={14} /> {t("convert.clear")}</button>
                            </div>
                        </div>
                    )}

                    {/* ── File List ── */}
                    {files.length > 0 && (
                        <div className={styles.fileList}>
                            {files.map(item => {
                                const ext = item.file.name.split(".").pop()?.toLowerCase() || "";
                                const IconComp = getCategoryIcon(ext);
                                const avail = getAvailableConversions(item.file.name);
                                const isSettings = showSettings === item.id;
                                const isPreview = previewFile === item.id;

                                return (
                                    <div key={item.id} className={`${styles.fileCard} ${item.status === "done" ? styles.fileCardDone : ""} ${item.status === "error" ? styles.fileCardErrorState : ""} ${item.status === "converting" ? styles.fileCardConverting : ""}`}>
                                        {item.status === "converting" && <div className={styles.fileCardProgress} style={{ width: `${item.progress}%` }} />}
                                        <div className={styles.fileCardMain}>
                                            <div className={styles.fileCardIcon} onClick={() => item.previewUrl && setPreviewFile(isPreview ? null : item.id)} style={{ cursor: item.previewUrl ? "pointer" : "default" }}>
                                                {item.previewUrl ? (
                                                    // eslint-disable-next-line @next/next/no-img-element
                                                    <img src={item.previewUrl} alt="" className={styles.fileCardThumb} />
                                                ) : <IconComp size={22} strokeWidth={1.8} />}
                                            </div>
                                            <div className={styles.fileCardDetails}>
                                                <div className={styles.fileCardName}>{item.file.name}</div>
                                                <div className={styles.fileCardMeta}>
                                                    {formatBytes(item.file.size)} · {ext.toUpperCase()}
                                                    {item.status === "done" && item.result && (
                                                        mode === "compress"
                                                            ? <> → <strong>{formatBytes(item.result.size)}</strong> ({Math.round((1 - item.result.size / item.file.size) * 100)}% {t("convert.percentSaved")})</>
                                                            : <> → <strong>{item.targetFormat.toUpperCase()}</strong> ({formatBytes(item.result.size)})</>
                                                    )}
                                                </div>
                                            </div>
                                            {mode === "convert" && item.status === "pending" && avail.length > 0 && (
                                                <select className={styles.fileCardSelect} value={item.targetFormat} onChange={e => updateFile(item.id, { targetFormat: e.target.value })}>
                                                    {avail.map(fmt => <option key={fmt} value={fmt}>{getFormatInfo(fmt)?.label || fmt.toUpperCase()}</option>)}
                                                </select>
                                            )}
                                            {item.status === "converting" && <span className={`badge ${styles.statusBadge}`}><RefreshCw size={12} className="spinning" /> {Math.round(item.progress)}%</span>}
                                            {item.status === "done" && <span className={`badge badge-success ${styles.statusBadge}`}><CheckCircle size={12} /> {t("convert.done")}</span>}
                                            {item.status === "error" && <span className={`badge badge-error ${styles.statusBadge}`}><AlertTriangle size={12} /> Error</span>}
                                            <div className={styles.fileCardActions}>
                                                {item.status === "pending" && (mode === "convert" ? avail.length > 0 : true) && (
                                                    <>
                                                        {mode === "convert" && <button className={styles.iconBtn} onClick={() => setShowSettings(isSettings ? null : item.id)} title="Settings"><Settings2 size={16} /></button>}
                                                        <button className={`${styles.iconBtn} ${styles.iconBtnConvert}`} onClick={() => convertSingleFile(item)} title={mode === "compress" ? t("convert.modeCompress") : t("convert.modeConvert")}>
                                                            {mode === "compress" ? <Shrink size={16} /> : <ArrowRight size={16} />}
                                                        </button>
                                                    </>
                                                )}
                                                {item.status === "done" && (
                                                    <>
                                                        {item.resultPreviewUrl && <button className={styles.iconBtn} onClick={() => setPreviewFile(isPreview ? null : item.id)} title="Preview"><Eye size={16} /></button>}
                                                        <button className={styles.iconBtn} onClick={() => {
                                                            if (item.result) navigator.clipboard.write?.([new ClipboardItem({ [item.result.type]: item.result })]).then(() => addToast("Copied!", "success")).catch(() => addToast("Copy not supported", "error"));
                                                        }} title="Copy"><Copy size={16} /></button>
                                                        <button className={`${styles.iconBtn} ${styles.iconBtnDownload}`} onClick={() => downloadFile(item)} title="Download"><Download size={16} /></button>
                                                    </>
                                                )}
                                                {item.status === "error" && <button className={styles.iconBtn} onClick={() => updateFile(item.id, { status: "pending", error: null, progress: 0 })} title="Retry"><RefreshCw size={16} /></button>}
                                                <button className={`${styles.iconBtn} ${styles.iconBtnRemove}`} onClick={() => removeFile(item.id)} title="Remove"><X size={16} /></button>
                                            </div>
                                        </div>
                                        {item.error && <div className={styles.fileCardErrorMsg}><AlertTriangle size={14} /> {item.error}</div>}
                                        {isSettings && mode === "convert" && (
                                            <div className={styles.settingsPanel}>
                                                <label>{t("convert.quality")}: <strong>{item.quality}%</strong></label>
                                                <input type="range" min="10" max="100" value={item.quality} onChange={e => updateFile(item.id, { quality: parseInt(e.target.value) })} className={styles.qualitySlider} />
                                                <div className={styles.qualityHints}><span>{t("convert.smaller")}</span><span>{t("convert.better")}</span></div>
                                            </div>
                                        )}
                                        {isPreview && (item.previewUrl || item.resultPreviewUrl) && (
                                            <div className={styles.previewPanel}>
                                                {item.previewUrl && <div className={styles.previewItem}><span className={styles.previewLabel}>{t("convert.original")}</span>{/* eslint-disable-next-line @next/next/no-img-element */}<img src={item.previewUrl} alt="Original" /></div>}
                                                {item.resultPreviewUrl && <div className={styles.previewItem}><span className={styles.previewLabel}>{mode === "compress" ? t("convert.compressed") : t("convert.converted")}</span>{/* eslint-disable-next-line @next/next/no-img-element */}<img src={item.resultPreviewUrl} alt="Result" /></div>}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
