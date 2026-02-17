"use client";

import { useState, useRef, useCallback, useMemo } from "react";
import {
    Upload, FileText, Image as ImageIcon, Music, Video, Database, X,
    ArrowRight, CheckCircle, Download, RefreshCw, AlertTriangle,
    Trash2, Settings2, Archive, Copy, Eye, Subtitles, Code2,
    Disc3, Package, BookOpen, Shrink,
} from "lucide-react";
import { convertFile, getAvailableConversions, getFormatInfo, FORMATS, CONVERSION_MAP, type ConversionCategory } from "@/lib/converter";
import { useToast } from "@/components/Toast";
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

const CATEGORY_ORDER: { key: string; label: string }[] = [
    { key: "all", label: "All" },
    { key: "image", label: "Images" },
    { key: "audio", label: "Audio" },
    { key: "video", label: "Video" },
    { key: "document", label: "Docs" },
    { key: "data", label: "Data" },
    { key: "subtitle", label: "Subtitles" },
];

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
    compress: boolean;
    compressionLevel: "light" | "medium" | "heavy";
    previewUrl: string | null;
    resultPreviewUrl: string | null;
}

export default function ConvertPage() {
    const [files, setFiles] = useState<FileItem[]>([]);
    const [dragging, setDragging] = useState(false);
    const [showSettings, setShowSettings] = useState<string | null>(null);
    const [previewFile, setPreviewFile] = useState<string | null>(null);
    const [preSelectedFormat, setPreSelectedFormat] = useState<string | null>(null);
    const [formatCategory, setFormatCategory] = useState("all");
    const fileInputRef = useRef<HTMLInputElement>(null);
    const { addToast } = useToast();

    // Get all unique target formats organized by category
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
            // Use pre-selected format if it's a valid conversion
            let target = conversions[0] || "";
            if (preSelectedFormat && conversions.includes(preSelectedFormat)) {
                target = preSelectedFormat;
            }
            return {
                id: Math.random().toString(36).slice(2, 10),
                file: f,
                targetFormat: target,
                status: "pending" as const,
                progress: 0,
                result: null,
                error: conversions.length === 0 ? `No conversions available for .${ext}` : null,
                quality: 92,
                compress: false,
                compressionLevel: "medium" as const,
                previewUrl: isImage ? URL.createObjectURL(f) : null,
                resultPreviewUrl: null,
            };
        });
        setFiles(prev => [...prev, ...items]);
    }, [preSelectedFormat]);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault(); setDragging(false);
        if (e.dataTransfer.files.length > 0) addFiles(e.dataTransfer.files);
    }, [addFiles]);

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
        updateFile(item.id, { status: "converting", progress: 10, error: null });
        try {
            const interval = setInterval(() => {
                setFiles(prev => prev.map(f =>
                    f.id === item.id && f.status === "converting"
                        ? { ...f, progress: Math.min(f.progress + 8, 85) } : f
                ));
            }, 300);
            const blob = await convertFile(item.file, item.targetFormat, item.quality, {
                compress: item.compress,
                compressionLevel: item.compressionLevel,
            });
            clearInterval(interval);
            const isImgResult = FORMATS[item.targetFormat]?.category === "image";
            updateFile(item.id, {
                status: "done", progress: 100, result: blob,
                resultPreviewUrl: isImgResult ? URL.createObjectURL(blob) : null,
            });
            addToast(`Converted ${item.file.name} → .${item.targetFormat.toUpperCase()}`, "success");
        } catch (err) {
            updateFile(item.id, { status: "error", error: err instanceof Error ? err.message : "Conversion failed", progress: 0 });
            addToast(`Failed: ${item.file.name}`, "error");
        }
    }, [updateFile, addToast]);

    const convertAll = useCallback(async () => {
        const pending = files.filter(f => f.status === "pending" && f.targetFormat);
        if (!pending.length) return;
        addToast(`Converting ${pending.length} file${pending.length > 1 ? "s" : ""}...`, "info");
        for (const item of pending) await convertSingleFile(item);
    }, [files, convertSingleFile, addToast]);

    const downloadFile = useCallback((item: FileItem) => {
        if (!item.result) return;
        const name = item.file.name.replace(/\.[^/.]+$/, "") + "." + item.targetFormat;
        const url = URL.createObjectURL(item.result);
        const a = document.createElement("a"); a.href = url; a.download = name; a.click();
        URL.revokeObjectURL(url);
    }, []);

    const downloadAll = useCallback(async () => {
        const done = files.filter(f => f.status === "done" && f.result);
        for (const item of done) { downloadFile(item); await new Promise(r => setTimeout(r, 200)); }
        addToast(`Downloaded ${done.length} files`, "success");
    }, [files, downloadFile, addToast]);

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
            error: f.targetFormat ? null : "Unsupported format", resultPreviewUrl: null,
        })));
    }, []);

    const pendingCount = files.filter(f => f.status === "pending" && f.targetFormat).length;
    const doneCount = files.filter(f => f.status === "done").length;
    const convertingCount = files.filter(f => f.status === "converting").length;

    return (
        <div className={`${styles.converterPage} section`}>
            <div className="container">
                <div className="section-header">
                    <p className="section-label">File Converter</p>
                    <h1 className="section-title">
                        Convert your files{" "}
                        <span className="gradient-text">instantly.</span>
                    </h1>
                    <p className="section-desc">
                        100+ formats supported. Everything happens locally — nothing is uploaded.
                    </p>
                </div>

                <div className={styles.converterLayout}>
                    {/* ── Format Picker (choose before upload) ── */}
                    <div className={styles.formatPicker}>
                        <div className={styles.formatPickerHeader}>
                            <h3>Convert to:</h3>
                            {preSelectedFormat && (
                                <button className={styles.formatPickerClear} onClick={() => setPreSelectedFormat(null)}>
                                    <X size={14} /> Clear
                                </button>
                            )}
                        </div>
                        <div className={styles.categoryTabs}>
                            {CATEGORY_ORDER.map(cat => (
                                <button
                                    key={cat.key}
                                    className={`${styles.categoryTab} ${formatCategory === cat.key ? styles.categoryTabActive : ""}`}
                                    onClick={() => setFormatCategory(cat.key)}
                                >
                                    {cat.label}
                                </button>
                            ))}
                        </div>
                        <div className={styles.formatChips}>
                            {targetFormats.map(fmt => {
                                const info = getFormatInfo(fmt);
                                return (
                                    <button
                                        key={fmt}
                                        className={`${styles.formatChip} ${preSelectedFormat === fmt ? styles.formatChipActive : ""}`}
                                        onClick={() => setPreSelectedFormat(preSelectedFormat === fmt ? null : fmt)}
                                    >
                                        {info?.label || fmt.toUpperCase()}
                                    </button>
                                );
                            })}
                        </div>
                        {preSelectedFormat && (
                            <p className={styles.formatPickerHint}>
                                Drop files below — they&apos;ll automatically target <strong>.{preSelectedFormat.toUpperCase()}</strong>
                            </p>
                        )}
                    </div>

                    {/* ── Dropzone ── */}
                    <div
                        className={`${styles.dropzone} ${dragging ? styles.dragging : ""} ${files.length > 0 ? styles.dropzoneCompact : ""}`}
                        onDragOver={e => { e.preventDefault(); setDragging(true); }}
                        onDragLeave={() => setDragging(false)}
                        onDrop={handleDrop}
                        onClick={() => fileInputRef.current?.click()}
                    >
                        <div className={styles.dropzoneIcon}>
                            <Upload size={files.length > 0 ? 20 : 28} strokeWidth={1.8} />
                        </div>
                        <div>
                            <h3>{files.length > 0 ? "Add more files" : "Drop your files here"}</h3>
                            <p>or <span className={styles.dropzoneBrowse}>browse files</span>{files.length === 0 && " to get started"}</p>
                        </div>
                        <input ref={fileInputRef} type="file" multiple onChange={e => { if (e.target.files) addFiles(e.target.files); e.target.value = ""; }} />
                    </div>

                    {/* ── Toolbar ── */}
                    {files.length > 0 && (
                        <div className={styles.toolbar}>
                            <div className={styles.toolbarInfo}>
                                <span className={styles.toolbarCount}>{files.length} file{files.length !== 1 ? "s" : ""}</span>
                                {doneCount > 0 && <span className={`badge badge-success ${styles.toolbarBadge}`}><CheckCircle size={12} /> {doneCount} done</span>}
                                {convertingCount > 0 && <span className={`badge ${styles.toolbarBadge}`}><RefreshCw size={12} className="spinning" /> {convertingCount}</span>}
                            </div>
                            <div className={styles.toolbarActions}>
                                {pendingCount > 0 && <button className="btn btn-primary btn-sm" onClick={convertAll}><ArrowRight size={14} /> Convert All ({pendingCount})</button>}
                                {doneCount > 1 && <button className="btn btn-success btn-sm" onClick={downloadAll}><Archive size={14} /> Download All</button>}
                                {doneCount > 0 && <button className="btn btn-secondary btn-sm" onClick={resetAll}><RefreshCw size={14} /> Reset</button>}
                                <button className="btn btn-danger btn-sm" onClick={clearAll}><Trash2 size={14} /> Clear</button>
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
                                                    {item.status === "done" && item.result && <> → <strong>{item.targetFormat.toUpperCase()}</strong> ({formatBytes(item.result.size)})</>}
                                                </div>
                                            </div>

                                            {item.status === "pending" && avail.length > 0 && (
                                                <select className={styles.fileCardSelect} value={item.targetFormat} onChange={e => updateFile(item.id, { targetFormat: e.target.value })}>
                                                    {avail.map(fmt => <option key={fmt} value={fmt}>{getFormatInfo(fmt)?.label || fmt.toUpperCase()}</option>)}
                                                </select>
                                            )}

                                            {item.status === "converting" && <span className={`badge ${styles.statusBadge}`}><RefreshCw size={12} className="spinning" /> {item.progress}%</span>}
                                            {item.status === "done" && <span className={`badge badge-success ${styles.statusBadge}`}><CheckCircle size={12} /> Done</span>}
                                            {item.status === "error" && <span className={`badge badge-error ${styles.statusBadge}`}><AlertTriangle size={12} /> Error</span>}

                                            <div className={styles.fileCardActions}>
                                                {item.status === "pending" && avail.length > 0 && (
                                                    <>
                                                        <button className={styles.iconBtn} onClick={() => setShowSettings(isSettings ? null : item.id)} title="Settings"><Settings2 size={16} /></button>
                                                        <button className={`${styles.iconBtn} ${styles.iconBtnConvert}`} onClick={() => convertSingleFile(item)} title="Convert"><ArrowRight size={16} /></button>
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

                                        {/* Error */}
                                        {item.error && <div className={styles.fileCardErrorMsg}><AlertTriangle size={14} /> {item.error}</div>}

                                        {/* Settings */}
                                        {isSettings && (
                                            <div className={styles.settingsPanel}>
                                                <div className={styles.settingsRow}>
                                                    <div className={styles.settingsGroup}>
                                                        <label>Quality: <strong>{item.quality}%</strong></label>
                                                        <input type="range" min="10" max="100" value={item.quality} onChange={e => updateFile(item.id, { quality: parseInt(e.target.value) })} className={styles.qualitySlider} />
                                                        <div className={styles.qualityHints}><span>Smaller</span><span>Better</span></div>
                                                    </div>
                                                    <div className={styles.settingsGroup}>
                                                        <label className={styles.compressToggle}>
                                                            <input type="checkbox" checked={item.compress} onChange={e => updateFile(item.id, { compress: e.target.checked })} />
                                                            <Shrink size={14} />
                                                            <span>Compress</span>
                                                        </label>
                                                        {item.compress && (
                                                            <div className={styles.compressionOptions}>
                                                                {(["light", "medium", "heavy"] as const).map(lvl => (
                                                                    <button key={lvl} className={`${styles.compressionBtn} ${item.compressionLevel === lvl ? styles.compressionBtnActive : ""}`} onClick={() => updateFile(item.id, { compressionLevel: lvl })}>
                                                                        {lvl.charAt(0).toUpperCase() + lvl.slice(1)}
                                                                    </button>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {/* Preview */}
                                        {isPreview && (item.previewUrl || item.resultPreviewUrl) && (
                                            <div className={styles.previewPanel}>
                                                {item.previewUrl && <div className={styles.previewItem}><span className={styles.previewLabel}>Original</span>{/* eslint-disable-next-line @next/next/no-img-element */}<img src={item.previewUrl} alt="Original" /></div>}
                                                {item.resultPreviewUrl && <div className={styles.previewItem}><span className={styles.previewLabel}>Converted</span>{/* eslint-disable-next-line @next/next/no-img-element */}<img src={item.resultPreviewUrl} alt="Converted" /></div>}
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
