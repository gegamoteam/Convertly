"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import {
    Link2, Download, Music, Video, Loader2, CheckCircle,
    AlertTriangle, Youtube, Headphones, ExternalLink, Clock, User,
    MonitorPlay,
} from "lucide-react";
import { useToast } from "@/components/Toast";
import styles from "./download.module.css";

type Format = "mp3" | "mp4" | "m4a" | "webm";
type Quality = "best" | "1080" | "720" | "480" | "360";
type JobStatus = "idle" | "fetching" | "ready" | "downloading" | "done" | "error";

interface MediaPreview {
    source: string;
    id: string;
    title: string;
    artist?: string;
    duration?: number;
    thumbnail?: string;
    url: string;
}

const FORMAT_OPTIONS: { value: Format; label: string; kind: "audio" | "video" }[] = [
    { value: "mp3", label: "MP3", kind: "audio" },
    { value: "m4a", label: "M4A", kind: "audio" },
    { value: "mp4", label: "MP4", kind: "video" },
    { value: "webm", label: "WebM", kind: "video" },
];

const QUALITY_OPTIONS: { value: Quality; label: string }[] = [
    { value: "best", label: "Best" },
    { value: "1080", label: "1080p" },
    { value: "720", label: "720p" },
    { value: "480", label: "480p" },
    { value: "360", label: "360p" },
];

function looksLikeMediaUrl(value: string): boolean {
    const v = value.trim();
    if (!/^https?:\/\//i.test(v)) return false;
    return /youtube\.com|youtu\.be|spotify\.com/i.test(v);
}

async function readApiJson(res: Response): Promise<Record<string, unknown>> {
    const text = await res.text();
    if (!text) return {};
    try {
        return JSON.parse(text) as Record<string, unknown>;
    } catch {
        const snippet = text.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim().slice(0, 160);
        throw new Error(
            snippet
                ? `Server error (${res.status}): ${snippet}`
                : `Server error (${res.status}). Try again in a moment.`
        );
    }
}

function formatDuration(sec?: number): string {
    if (!sec || !Number.isFinite(sec)) return "";
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${s.toString().padStart(2, "0")}`;
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
    const lastFetchedUrl = useRef("");
    const { addToast } = useToast();

    const isSpotify = /spotify\.com/i.test(url);
    const isVideo = format === "mp4" || format === "webm";
    const availableFormats = isSpotify
        ? FORMAT_OPTIONS.filter(f => f.kind === "audio")
        : FORMAT_OPTIONS;

    const fetchInfo = useCallback(async (rawUrl: string) => {
        const trimmed = rawUrl.trim();
        if (!trimmed || !looksLikeMediaUrl(trimmed)) return;
        if (lastFetchedUrl.current === trimmed && status === "ready") return;

        abortRef.current?.abort();
        const ac = new AbortController();
        abortRef.current = ac;

        setStatus("fetching");
        setError(null);
        setPreview(null);
        setDownloadedName(null);
        setProgress(0);

        try {
            const res = await fetch("/api/download/info", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ url: trimmed }),
                signal: ac.signal,
            });
            const data = await readApiJson(res);
            if (!res.ok) throw new Error(String(data.error || "Failed to fetch info"));

            lastFetchedUrl.current = trimmed;
            setPreview(data as unknown as MediaPreview);
            setStatus("ready");
            if (data.source === "spotify" && (format === "mp4" || format === "webm")) {
                setFormat("mp3");
            }
        } catch (err) {
            if ((err as Error).name === "AbortError") return;
            const msg = err instanceof Error ? err.message : "Failed to fetch info";
            setError(msg);
            setStatus("error");
        }
    }, [format, status]);

    useEffect(() => {
        const trimmed = url.trim();
        if (!looksLikeMediaUrl(trimmed)) return;
        if (status === "downloading") return;
        if (lastFetchedUrl.current === trimmed && (status === "ready" || status === "done")) return;

        const t = setTimeout(() => {
            void fetchInfo(trimmed);
        }, 450);
        return () => clearTimeout(t);
    }, [url, fetchInfo, status]);

    const startDownload = useCallback(async () => {
        const trimmed = url.trim();
        if (!trimmed) return;

        abortRef.current?.abort();
        const ac = new AbortController();
        abortRef.current = ac;

        setStatus("downloading");
        setError(null);
        setDownloadedName(null);
        setProgress(6);
        setStage("Starting…");

        let fake = 6;
        const tick = setInterval(() => {
            fake = Math.min(86, fake + Math.max(0.35, (88 - fake) * 0.035));
            setProgress(Math.round(fake));
            if (fake < 25) setStage("Connecting…");
            else if (fake < 55) setStage("Downloading…");
            else if (fake < 80) setStage("Packaging…");
            else setStage("Almost done…");
        }, 350);

        try {
            const res = await fetch("/api/download", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    url: trimmed,
                    format,
                    quality: isVideo ? quality : "best",
                }),
                signal: ac.signal,
            });

            clearInterval(tick);

            const ctype = res.headers.get("Content-Type") || "";
            if (!res.ok || ctype.includes("application/json")) {
                const data = await readApiJson(res);
                throw new Error(String(data.error || `Download failed (${res.status})`));
            }

            setProgress(94);
            setStage("Saving…");

            const blob = await res.blob();
            if (blob.size < 500) {
                throw new Error("Download returned an empty file. Try another link or format.");
            }

            const disposition = res.headers.get("Content-Disposition") || "";
            const utfMatch = disposition.match(/filename\*=UTF-8''([^;]+)/i);
            const plainMatch = disposition.match(/filename="?([^";]+)"?/i);
            const fileName = utfMatch
                ? decodeURIComponent(utfMatch[1])
                : plainMatch
                    ? plainMatch[1]
                    : `convertly.${format}`;

            const objectUrl = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = objectUrl;
            a.download = fileName;
            document.body.appendChild(a);
            a.click();
            a.remove();
            URL.revokeObjectURL(objectUrl);

            setProgress(100);
            setStage("Complete");
            setStatus("done");
            setDownloadedName(fileName);
            addToast(`Downloaded ${fileName}`, "success");
        } catch (err) {
            clearInterval(tick);
            if ((err as Error).name === "AbortError") return;
            const msg = err instanceof Error ? err.message : "Download failed";
            setError(msg);
            setStatus("error");
            setProgress(0);
            setStage("");
            addToast(msg, "error");
        }
    }, [url, format, quality, isVideo, addToast]);

    const busy = status === "fetching" || status === "downloading";

    return (
        <div className={`${styles.page} section`}>
            <div className="container">
                <div className="section-header">
                    <p className="section-label">Media Downloader</p>
                    <h1 className="section-title">
                        YouTube &amp; Spotify{" "}
                        <span className="gradient-text">to MP3 / MP4</span>
                    </h1>
                    <p className="section-desc">
                        Paste a link — preview loads automatically. Pick format &amp; quality, then download.
                    </p>
                </div>

                <div className={styles.layout}>
                    {preview && (
                        <div className={styles.previewBar}>
                            {preview.thumbnail ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src={preview.thumbnail} alt="" className={styles.previewThumb} />
                            ) : (
                                <div className={styles.previewThumbFallback}>
                                    {preview.source === "spotify" ? <Headphones size={20} /> : <Youtube size={20} />}
                                </div>
                            )}
                            <div className={styles.previewMeta}>
                                <div className={styles.previewTitle}>{preview.title}</div>
                                <div className={styles.previewSub}>
                                    {preview.source === "spotify" ? "Spotify" : "YouTube"}
                                    {preview.artist ? ` · ${preview.artist}` : ""}
                                    {preview.duration ? ` · ${formatDuration(preview.duration)}` : ""}
                                </div>
                            </div>
                            <a
                                href={preview.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className={styles.previewLink}
                                title="Open original"
                            >
                                <ExternalLink size={16} />
                            </a>
                        </div>
                    )}

                    <div className={styles.card}>
                        <label className={styles.label}>
                            <Link2 size={15} />
                            Link
                            {status === "fetching" && (
                                <span className={styles.statusFetching}>
                                    <Loader2 size={12} className="spinning" /> Fetching
                                </span>
                            )}
                            {status === "ready" && preview && (
                                <span className={styles.statusReady}>
                                    <CheckCircle size={12} /> Ready
                                </span>
                            )}
                        </label>
                        <input
                            className={styles.input}
                            type="url"
                            placeholder="https://youtube.com/watch?v=… or open.spotify.com/track/…"
                            value={url}
                            onChange={e => {
                                const next = e.target.value;
                                setUrl(next);
                                if (lastFetchedUrl.current && lastFetchedUrl.current !== next.trim()) {
                                    lastFetchedUrl.current = "";
                                    setPreview(null);
                                    setError(null);
                                    setDownloadedName(null);
                                    setStatus("idle");
                                    setProgress(0);
                                }
                            }}
                            disabled={status === "downloading"}
                            spellCheck={false}
                            autoFocus
                        />

                        <label className={styles.label}>
                            {isVideo ? <Video size={15} /> : <Music size={15} />}
                            Format
                        </label>
                        <div className={styles.chipRow}>
                            {availableFormats.map(f => (
                                <button
                                    key={f.value}
                                    type="button"
                                    className={`${styles.chip} ${format === f.value ? styles.chipOn : ""}`}
                                    onClick={() => setFormat(f.value)}
                                    disabled={busy}
                                >
                                    {f.label}
                                </button>
                            ))}
                        </div>

                        {isVideo && !isSpotify && (
                            <>
                                <label className={styles.label}>
                                    <MonitorPlay size={15} />
                                    Quality
                                </label>
                                <div className={styles.chipRow}>
                                    {QUALITY_OPTIONS.map(q => (
                                        <button
                                            key={q.value}
                                            type="button"
                                            className={`${styles.chip} ${quality === q.value ? styles.chipOn : ""}`}
                                            onClick={() => setQuality(q.value)}
                                            disabled={busy}
                                        >
                                            {q.label}
                                        </button>
                                    ))}
                                </div>
                            </>
                        )}

                        <button
                            type="button"
                            className={`btn btn-primary ${styles.downloadBtn}`}
                            onClick={() => void startDownload()}
                            disabled={busy || !url.trim()}
                        >
                            {status === "downloading" ? (
                                <><Loader2 size={18} className="spinning" /> Downloading…</>
                            ) : status === "done" ? (
                                <><CheckCircle size={18} /> Download again</>
                            ) : (
                                <>
                                    <Download size={18} />
                                    Download {format.toUpperCase()}
                                    {isVideo ? (quality === "best" ? " · Best" : ` · ${quality}p`) : ""}
                                </>
                            )}
                        </button>

                        {(status === "downloading" || status === "done") && (
                            <div className={styles.progressBlock}>
                                <div className={styles.progressMeta}>
                                    <span>{stage || (status === "done" ? "Complete" : "Working…")}</span>
                                    <span>{progress}%</span>
                                </div>
                                <div className={styles.progressTrack}>
                                    <div
                                        className={`${styles.progressFill} ${status === "done" ? styles.progressDone : ""}`}
                                        style={{ width: `${progress}%` }}
                                    />
                                </div>
                            </div>
                        )}

                        {error && (
                            <div className={styles.alertError}>
                                <AlertTriangle size={16} />
                                <span>{error}</span>
                            </div>
                        )}

                        {downloadedName && status === "done" && (
                            <div className={styles.alertOk}>
                                <CheckCircle size={16} />
                                <span>Saved <strong>{downloadedName}</strong></span>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
