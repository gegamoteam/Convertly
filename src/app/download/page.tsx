"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
    AlertTriangle,
    Check,
    CheckCircle,
    ClipboardPaste,
    Download,
    ExternalLink,
    FileAudio,
    FileVideo,
    Headphones,
    Link2,
    Loader2,
    MonitorPlay,
    Music,
    ShieldCheck,
    Sparkles,
    Video,
    Youtube,
    Zap,
} from "lucide-react";
import { useToast } from "@/components/Toast";
import styles from "./download.module.css";

type Format = "mp3" | "mp4" | "m4a" | "webm" | "wav";
type Quality = "best" | "720" | "480" | "360";
type JobStatus = "idle" | "fetching" | "ready" | "downloading" | "done" | "error";

interface MediaPreview {
    source: "youtube" | "spotify";
    id: string;
    title: string;
    artist?: string;
    duration?: number;
    thumbnail?: string;
    url: string;
}

interface DownloadPlan {
    url: string;
    fileName: string;
    inputExt: string;
    outputExt: Format;
    mime: string;
    needsConversion: boolean;
}

const FORMAT_OPTIONS: {
    value: Format;
    label: string;
    description: string;
    kind: "audio" | "video";
}[] = [
    { value: "mp3", label: "MP3", description: "Universal audio", kind: "audio" },
    { value: "m4a", label: "M4A", description: "High-quality audio", kind: "audio" },
    { value: "wav", label: "WAV", description: "Lossless audio", kind: "audio" },
    { value: "mp4", label: "MP4", description: "Best compatibility", kind: "video" },
    { value: "webm", label: "WebM", description: "Web optimized", kind: "video" },
];

const QUALITY_OPTIONS: { value: Quality; label: string; detail: string }[] = [
    { value: "best", label: "Best", detail: "Auto" },
    { value: "720", label: "720p", detail: "HD" },
    { value: "480", label: "480p", detail: "SD" },
    { value: "360", label: "360p", detail: "Small" },
];

function looksLikeMediaUrl(value: string): boolean {
    const normalized = value.trim();
    if (!/^https?:\/\//i.test(normalized)) return false;
    return /(?:youtube\.com|youtu\.be|spotify\.com)/i.test(normalized);
}

async function readApiJson<T>(response: Response): Promise<T> {
    const text = await response.text();
    if (!text) return {} as T;
    try {
        return JSON.parse(text) as T;
    } catch {
        throw new Error(`The server returned an invalid response (${response.status}).`);
    }
}

function formatDuration(seconds?: number): string {
    if (!seconds || !Number.isFinite(seconds)) return "";
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    return hours
        ? `${hours}:${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
        : `${minutes}:${secs.toString().padStart(2, "0")}`;
}

function saveBlob(blob: Blob, fileName: string) {
    const objectUrl = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = objectUrl;
    anchor.download = fileName;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    window.setTimeout(() => URL.revokeObjectURL(objectUrl), 30_000);
}

export default function DownloadPage() {
    const [url, setUrl] = useState("");
    const [format, setFormat] = useState<Format>("mp3");
    const [quality, setQuality] = useState<Quality>("720");
    const [status, setStatus] = useState<JobStatus>("idle");
    const [progress, setProgress] = useState(0);
    const [stage, setStage] = useState("");
    const [preview, setPreview] = useState<MediaPreview | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [downloadedName, setDownloadedName] = useState<string | null>(null);
    const abortRef = useRef<AbortController | null>(null);
    const lastRequestedUrl = useRef("");
    const { addToast } = useToast();

    const isSpotify = preview?.source === "spotify" || /spotify\.com/i.test(url);
    const isVideo = format === "mp4" || format === "webm";
    const availableFormats = isSpotify
        ? FORMAT_OPTIONS.filter(option => option.kind === "audio")
        : FORMAT_OPTIONS;
    const busy = status === "fetching" || status === "downloading";

    const resetForUrl = useCallback((nextUrl: string) => {
        setUrl(nextUrl);
        lastRequestedUrl.current = "";
        setPreview(null);
        setError(null);
        setDownloadedName(null);
        setStatus("idle");
        setProgress(0);
        setStage("");
    }, []);

    const fetchInfo = useCallback(async (rawUrl: string, force = false) => {
        const trimmed = rawUrl.trim();
        if (!looksLikeMediaUrl(trimmed)) return;
        if (!force && lastRequestedUrl.current === trimmed) return;

        abortRef.current?.abort();
        const controller = new AbortController();
        abortRef.current = controller;
        lastRequestedUrl.current = trimmed;

        setStatus("fetching");
        setError(null);
        setPreview(null);
        setDownloadedName(null);

        try {
            const response = await fetch("/api/download/info", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ url: trimmed }),
                signal: controller.signal,
            });
            const data = await readApiJson<MediaPreview & { error?: string }>(response);
            if (!response.ok) throw new Error(data.error || "Could not read that link.");

            setPreview(data);
            setStatus("ready");
            if (data.source === "spotify") {
                setFormat(current => current === "mp4" || current === "webm" ? "mp3" : current);
            }
        } catch (caught) {
            if ((caught as Error).name === "AbortError") return;
            const message = caught instanceof Error ? caught.message : "Could not read that link.";
            setError(message);
            setStatus("error");
        }
    }, []);

    useEffect(() => {
        const trimmed = url.trim();
        if (!looksLikeMediaUrl(trimmed) || lastRequestedUrl.current === trimmed) return;
        const timer = window.setTimeout(() => void fetchInfo(trimmed), 500);
        return () => window.clearTimeout(timer);
    }, [url, fetchInfo]);

    useEffect(() => () => abortRef.current?.abort(), []);

    const pasteLink = useCallback(async () => {
        try {
            const text = await navigator.clipboard.readText();
            resetForUrl(text.trim());
        } catch {
            addToast("Clipboard access was blocked. Paste the link into the field instead.", "error");
        }
    }, [addToast, resetForUrl]);

    const startDownload = useCallback(async () => {
        const trimmed = url.trim();
        if (!looksLikeMediaUrl(trimmed)) {
            setError("Paste a valid YouTube or Spotify link first.");
            return;
        }

        abortRef.current?.abort();
        const controller = new AbortController();
        abortRef.current = controller;
        setStatus("downloading");
        setError(null);
        setDownloadedName(null);
        setProgress(5);
        setStage("Finding the best stream");

        let downloadTicker: ReturnType<typeof setInterval> | undefined;

        try {
            const response = await fetch("/api/download", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ url: trimmed, format, quality: isVideo ? quality : "best" }),
                signal: controller.signal,
            });
            const plan = await readApiJson<DownloadPlan & { error?: string }>(response);
            if (!response.ok) throw new Error(plan.error || "The download could not be prepared.");

            setProgress(14);
            setStage("Downloading securely");
            let simulated = 14;
            downloadTicker = window.setInterval(() => {
                simulated = Math.min(62, simulated + Math.max(0.4, (64 - simulated) * 0.045));
                setProgress(Math.round(simulated));
            }, 350);

            const sourceResponse = await fetch(plan.url, { signal: controller.signal });
            if (!sourceResponse.ok) {
                throw new Error(`The media host refused the download (${sourceResponse.status}). Try again.`);
            }
            const sourceBlob = await sourceResponse.blob();
            if (sourceBlob.size < 1024) throw new Error("The media host returned an empty file. Try again.");

            window.clearInterval(downloadTicker);
            downloadTicker = undefined;
            let resultBlob = sourceBlob;

            if (plan.needsConversion) {
                setProgress(64);
                setStage(`Converting to ${plan.outputExt.toUpperCase()} on your device`);
                const { convertMedia } = await import("@/lib/ffmpeg-helper");
                const sourceFile = new File([sourceBlob], `source.${plan.inputExt}`, {
                    type: sourceBlob.type || "application/octet-stream",
                });
                resultBlob = await convertMedia(sourceFile, plan.inputExt, plan.outputExt, {
                    audioBitrate: plan.outputExt === "mp3" ? "192k" : undefined,
                    onProgress: (value, nextStage) => {
                        setProgress(Math.min(97, 64 + Math.round(value * 0.33)));
                        setStage(nextStage ? `${nextStage.replace(/…/g, "")} on your device` : "Converting on your device");
                    },
                });
            }

            setProgress(98);
            setStage("Saving file");
            saveBlob(resultBlob, plan.fileName);
            setProgress(100);
            setStage("Download complete");
            setStatus("done");
            setDownloadedName(plan.fileName);
            addToast(`Downloaded ${plan.fileName}`, "success");
        } catch (caught) {
            if (downloadTicker) window.clearInterval(downloadTicker);
            if ((caught as Error).name === "AbortError") return;
            const message = caught instanceof Error ? caught.message : "Download failed.";
            setError(message);
            setStatus("error");
            setProgress(0);
            setStage("");
            addToast(message, "error");
        }
    }, [url, format, quality, isVideo, addToast]);

    return (
        <main className={`${styles.page} section`}>
            <div className="container">
                <header className={styles.hero}>
                    <div className={styles.eyebrow}><Sparkles size={14} /> Media downloader</div>
                    <h1>Save media. <span className="gradient-text">Skip the friction.</span></h1>
                    <p>Paste a YouTube video or Spotify track. Convertly finds the media, prepares your format, and saves it straight to your device.</p>
                    <div className={styles.platforms}>
                        <span><Youtube size={16} /> YouTube</span>
                        <span><Headphones size={16} /> Spotify tracks</span>
                        <span><ShieldCheck size={16} /> No account</span>
                    </div>
                </header>

                <div className={styles.workspace}>
                    <section className={styles.card}>
                        <div className={styles.stepHeader}>
                            <span className={styles.stepNumber}>1</span>
                            <div><h2>Paste your link</h2><p>Preview loads automatically</p></div>
                            {status === "fetching" && <span className={styles.statusBusy}><Loader2 size={13} className="spinning" /> Checking</span>}
                            {status === "ready" && preview && <span className={styles.statusReady}><Check size={13} /> Ready</span>}
                        </div>

                        <div className={styles.urlField}>
                            <Link2 size={19} />
                            <input
                                type="url"
                                placeholder="Paste a YouTube or Spotify link"
                                value={url}
                                onChange={event => resetForUrl(event.target.value)}
                                onKeyDown={event => {
                                    if (event.key === "Enter") void fetchInfo(url, true);
                                }}
                                disabled={status === "downloading"}
                                spellCheck={false}
                                aria-label="YouTube or Spotify link"
                                autoFocus
                            />
                            <button type="button" onClick={() => void pasteLink()} disabled={status === "downloading"}>
                                <ClipboardPaste size={16} /> <span>Paste</span>
                            </button>
                        </div>

                        {preview && (
                            <div className={styles.preview}>
                                <div className={styles.previewImageWrap}>
                                    {preview.thumbnail ? (
                                        // eslint-disable-next-line @next/next/no-img-element
                                        <img src={preview.thumbnail} alt="" className={styles.previewImage} />
                                    ) : (
                                        <div className={styles.previewFallback}>{preview.source === "spotify" ? <Headphones /> : <Youtube />}</div>
                                    )}
                                    <span className={styles.sourceBadge}>{preview.source === "spotify" ? "Spotify" : "YouTube"}</span>
                                </div>
                                <div className={styles.previewCopy}>
                                    <h3>{preview.title}</h3>
                                    <p>
                                        {preview.artist || "Unknown creator"}
                                        {preview.duration ? <><span>•</span>{formatDuration(preview.duration)}</> : null}
                                    </p>
                                </div>
                                <a href={preview.url} target="_blank" rel="noopener noreferrer" title="Open original">
                                    <ExternalLink size={17} />
                                </a>
                            </div>
                        )}

                        <div className={styles.divider} />

                        <div className={styles.stepHeader}>
                            <span className={styles.stepNumber}>2</span>
                            <div><h2>Choose a format</h2><p>Pick what works for you</p></div>
                        </div>

                        <div className={styles.formatGrid}>
                            {availableFormats.map(option => {
                                const Icon = option.kind === "audio" ? FileAudio : FileVideo;
                                return (
                                    <button
                                        key={option.value}
                                        type="button"
                                        className={format === option.value ? styles.formatActive : ""}
                                        onClick={() => setFormat(option.value)}
                                        disabled={busy}
                                    >
                                        <Icon size={20} />
                                        <span><strong>{option.label}</strong><small>{option.description}</small></span>
                                        <i>{format === option.value && <Check size={13} />}</i>
                                    </button>
                                );
                            })}
                        </div>

                        {isVideo && !isSpotify && (
                            <div className={styles.qualityBlock}>
                                <div className={styles.qualityLabel}><MonitorPlay size={16} /><span>Video quality</span></div>
                                <div className={styles.qualityRow}>
                                    {QUALITY_OPTIONS.map(option => (
                                        <button
                                            key={option.value}
                                            type="button"
                                            className={quality === option.value ? styles.qualityActive : ""}
                                            onClick={() => setQuality(option.value)}
                                            disabled={busy}
                                        >
                                            <strong>{option.label}</strong><small>{option.detail}</small>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {error && (
                            <div className={styles.alertError} role="alert">
                                <AlertTriangle size={18} />
                                <div><strong>Couldn&apos;t prepare that media</strong><span>{error}</span></div>
                                {looksLikeMediaUrl(url) && status !== "downloading" && (
                                    <button type="button" onClick={() => void fetchInfo(url, true)}>Retry</button>
                                )}
                            </div>
                        )}

                        <button
                            type="button"
                            className={`btn btn-primary ${styles.downloadButton}`}
                            onClick={() => void startDownload()}
                            disabled={busy || !looksLikeMediaUrl(url)}
                        >
                            {status === "downloading" ? <Loader2 size={19} className="spinning" /> : status === "done" ? <CheckCircle size={19} /> : <Download size={19} />}
                            {status === "downloading" ? stage || "Preparing download" : status === "done" ? "Download again" : `Download ${format.toUpperCase()}`}
                            {!busy && isVideo && <span>{quality === "best" ? "Best" : `${quality}p`}</span>}
                        </button>

                        {(status === "downloading" || status === "done") && (
                            <div className={styles.progressBlock} aria-live="polite">
                                <div><span>{stage}</span><strong>{progress}%</strong></div>
                                <div className={styles.progressTrack}><i style={{ width: `${progress}%` }} /></div>
                            </div>
                        )}

                        {downloadedName && status === "done" && (
                            <div className={styles.alertSuccess}><CheckCircle size={17} /><span>Saved <strong>{downloadedName}</strong></span></div>
                        )}
                    </section>

                    <aside className={styles.sidePanel}>
                        <div className={styles.sideGlow} />
                        <div className={styles.sideIcon}><Zap size={24} /></div>
                        <h2>Built for Vercel.<br />Processed on your device.</h2>
                        <p>Downloads no longer rely on YouTube cookies or a blocked Vercel server IP. Media is resolved through a federated network, then any conversion happens privately in your browser.</p>
                        <ul>
                            <li><CheckCircle size={15} /><span><strong>No cookie maintenance</strong><small>Nothing to refresh or rotate</small></span></li>
                            <li><CheckCircle size={15} /><span><strong>Real format conversion</strong><small>MP3 and WAV are actually encoded</small></span></li>
                            <li><CheckCircle size={15} /><span><strong>Automatic failover</strong><small>Unhealthy media hosts are skipped</small></span></li>
                        </ul>
                        <div className={styles.localNote}><ShieldCheck size={16} /> Use public media you have permission to save.</div>
                    </aside>
                </div>

                <div className={styles.footnotes}>
                    <span><Zap size={15} /> Direct media transfer</span>
                    <span><ShieldCheck size={15} /> Local conversion</span>
                    <span><Music size={15} /> Spotify metadata matching</span>
                    <span><Video size={15} /> Up to 720p combined video</span>
                </div>
            </div>
        </main>
    );
}
