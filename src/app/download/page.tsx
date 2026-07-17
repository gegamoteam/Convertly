"use client";

import { useState, useCallback, useRef } from "react";
import {
    Link2, Download, Music, Video, Loader2, CheckCircle,
    AlertTriangle, Youtube, Headphones, ExternalLink, Clock, User,
} from "lucide-react";
import { useToast } from "@/components/Toast";
import styles from "./download.module.css";

type Format = "mp3" | "mp4" | "m4a" | "webm" | "wav";
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

const FORMAT_OPTIONS: { value: Format; label: string; kind: "audio" | "video"; desc: string }[] = [
    { value: "mp3", label: "MP3", kind: "audio", desc: "Best for music" },
    { value: "m4a", label: "M4A", kind: "audio", desc: "High quality audio" },
    { value: "wav", label: "WAV", kind: "audio", desc: "Lossless audio" },
    { value: "mp4", label: "MP4", kind: "video", desc: "Video + audio" },
    { value: "webm", label: "WebM", kind: "video", desc: "Web video" },
];

function formatDuration(sec?: number): string {
    if (!sec || !Number.isFinite(sec)) return "";
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${s.toString().padStart(2, "0")}`;
}

function sourceLabel(source: string): string {
    if (source === "youtube") return "YouTube";
    if (source === "spotify") return "Spotify";
    if (source === "soundcloud") return "SoundCloud";
    return source;
}

function SourceIcon({ source }: { source: string }) {
    if (source === "spotify") return <Headphones size={18} />;
    if (source === "soundcloud") return <Music size={18} />;
    return <Youtube size={18} />;
}

export default function DownloadPage() {
    const [url, setUrl] = useState("");
    const [format, setFormat] = useState<Format>("mp3");
    const [status, setStatus] = useState<JobStatus>("idle");
    const [progress, setProgress] = useState(0);
    const [stage, setStage] = useState("");
    const [preview, setPreview] = useState<MediaPreview | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [downloadedName, setDownloadedName] = useState<string | null>(null);
    const abortRef = useRef<AbortController | null>(null);
    const { addToast } = useToast();

    const isSpotify = /spotify\.com/i.test(url);
    const availableFormats = isSpotify
        ? FORMAT_OPTIONS.filter(f => f.kind === "audio")
        : FORMAT_OPTIONS;

    const fetchInfo = useCallback(async () => {
        const trimmed = url.trim();
        if (!trimmed) {
            setError("Paste a YouTube, Spotify, or SoundCloud link");
            return;
        }

        abortRef.current?.abort();
        const ac = new AbortController();
        abortRef.current = ac;

        setStatus("fetching");
        setError(null);
        setPreview(null);
        setDownloadedName(null);
        setProgress(0);
        setStage("Fetching info…");

        try {
            const res = await fetch("/api/download/info", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ url: trimmed }),
                signal: ac.signal,
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Failed to fetch info");

            setPreview(data as MediaPreview);
            setStatus("ready");
            setStage("");
            // Spotify is audio-only — coerce format
            if (data.source === "spotify" && (format === "mp4" || format === "webm")) {
                setFormat("mp3");
            }
            addToast("Media found", "success");
        } catch (err) {
            if ((err as Error).name === "AbortError") return;
            const msg = err instanceof Error ? err.message : "Failed to fetch info";
            setError(msg);
            setStatus("error");
            setStage("");
            addToast(msg, "error");
        }
    }, [url, format, addToast]);

    const startDownload = useCallback(async () => {
        const trimmed = url.trim();
        if (!trimmed) return;

        abortRef.current?.abort();
        const ac = new AbortController();
        abortRef.current = ac;

        setStatus("downloading");
        setError(null);
        setDownloadedName(null);
        setProgress(8);
        setStage("Starting download…");

        // Simulated progress while server works (real % only available server-side)
        let fake = 8;
        const tick = setInterval(() => {
            fake = Math.min(88, fake + Math.max(0.4, (90 - fake) * 0.04));
            setProgress(Math.round(fake));
            if (fake < 30) setStage("Connecting…");
            else if (fake < 60) setStage("Downloading media…");
            else if (fake < 85) setStage("Encoding…");
            else setStage("Almost done…");
        }, 400);

        try {
            const res = await fetch("/api/download", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ url: trimmed, format }),
                signal: ac.signal,
            });

            clearInterval(tick);

            if (!res.ok) {
                const data = await res.json().catch(() => ({}));
                throw new Error((data as { error?: string }).error || `Download failed (${res.status})`);
            }

            setProgress(95);
            setStage("Saving file…");

            const blob = await res.blob();
            const disposition = res.headers.get("Content-Disposition") || "";
            const utfMatch = disposition.match(/filename\*=UTF-8''([^;]+)/i);
            const plainMatch = disposition.match(/filename="?([^";]+)"?/i);
            let fileName = utfMatch
                ? decodeURIComponent(utfMatch[1])
                : plainMatch
                    ? plainMatch[1]
                    : `convertly.${format}`;

            const titleHeader = res.headers.get("X-Convertly-Title");
            if (titleHeader && !utfMatch) {
                try {
                    fileName = `${decodeURIComponent(titleHeader)}.${format}`;
                } catch { /* keep */ }
            }

            const objectUrl = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = objectUrl;
            a.download = fileName;
            document.body.appendChild(a);
            a.click();
            a.remove();
            URL.revokeObjectURL(objectUrl);

            setProgress(100);
            setStage("Done");
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
    }, [url, format, addToast]);

    const busy = status === "fetching" || status === "downloading";

    return (
        <div className={`${styles.page} section`}>
            <div className="container">
                <div className="section-header">
                    <p className="section-label">Media Downloader</p>
                    <h1 className="section-title">
                        YouTube, Spotify &amp; more{" "}
                        <span className="gradient-text">to MP3 / MP4</span>
                    </h1>
                    <p className="section-desc">
                        Paste a link, pick a format, download. YouTube → MP3/MP4, Spotify tracks → audio. Pure Next.js — no extra installs.
                    </p>
                </div>

                <div className={styles.layout}>
                    <div className={styles.card}>
                        <label className={styles.label}>
                            <Link2 size={16} /> Media URL
                        </label>
                        <div className={styles.inputRow}>
                            <input
                                className={styles.input}
                                type="url"
                                placeholder="https://youtube.com/watch?v=…  or  open.spotify.com/track/…"
                                value={url}
                                onChange={e => {
                                    setUrl(e.target.value);
                                    if (status === "done" || status === "error" || status === "ready") {
                                        setStatus("idle");
                                        setPreview(null);
                                        setError(null);
                                        setProgress(0);
                                    }
                                }}
                                onKeyDown={e => {
                                    if (e.key === "Enter" && !busy) void fetchInfo();
                                }}
                                disabled={busy}
                            />
                            <button
                                className="btn btn-secondary"
                                onClick={() => void fetchInfo()}
                                disabled={busy || !url.trim()}
                            >
                                {status === "fetching" ? (
                                    <><Loader2 size={16} className="spinning" /> Fetching</>
                                ) : (
                                    "Fetch"
                                )}
                            </button>
                        </div>

                        <div className={styles.platforms}>
                            <span><Youtube size={14} /> YouTube → MP3 / MP4</span>
                            <span><Headphones size={14} /> Spotify → MP3</span>
                        </div>

                        <label className={styles.label} style={{ marginTop: 20 }}>
                            {format === "mp4" || format === "webm" ? <Video size={16} /> : <Music size={16} />}
                            Output format
                        </label>
                        <div className={styles.formatGrid}>
                            {availableFormats.map(f => (
                                <button
                                    key={f.value}
                                    type="button"
                                    className={`${styles.formatBtn} ${format === f.value ? styles.formatBtnActive : ""}`}
                                    onClick={() => setFormat(f.value)}
                                    disabled={busy}
                                >
                                    <strong>{f.label}</strong>
                                    <small>{f.desc}</small>
                                </button>
                            ))}
                        </div>

                        {isSpotify && (
                            <p className={styles.hint}>
                                Spotify tracks are matched on YouTube and saved as audio (MP3/M4A/WAV).
                            </p>
                        )}

                        <button
                            className={`btn btn-primary ${styles.downloadBtn}`}
                            onClick={() => void startDownload()}
                            disabled={busy || !url.trim()}
                        >
                            {status === "downloading" ? (
                                <><Loader2 size={18} className="spinning" /> Downloading…</>
                            ) : status === "done" ? (
                                <><CheckCircle size={18} /> Download again</>
                            ) : (
                                <><Download size={18} /> Download {format.toUpperCase()}</>
                            )}
                        </button>

                        {(status === "downloading" || status === "done") && (
                            <div className={styles.progressWrap}>
                                <div className={styles.progressMeta}>
                                    <span>{stage || (status === "done" ? "Complete" : "Working…")}</span>
                                    <span>{progress}%</span>
                                </div>
                                <div className={styles.progressBar}>
                                    <div
                                        className={`${styles.progressFill} ${status === "done" ? styles.progressDone : ""}`}
                                        style={{ width: `${progress}%` }}
                                    />
                                </div>
                            </div>
                        )}

                        {error && (
                            <div className={styles.errorBox}>
                                <AlertTriangle size={16} />
                                <span>{error}</span>
                            </div>
                        )}

                        {downloadedName && status === "done" && (
                            <div className={styles.successBox}>
                                <CheckCircle size={16} />
                                <span>Saved as <strong>{downloadedName}</strong></span>
                            </div>
                        )}
                    </div>

                    <div className={styles.side}>
                        {preview ? (
                            <div className={styles.previewCard}>
                                {preview.thumbnail ? (
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img src={preview.thumbnail} alt="" className={styles.thumb} />
                                ) : (
                                    <div className={styles.thumbPlaceholder}>
                                        <SourceIcon source={preview.source} />
                                    </div>
                                )}
                                <div className={styles.previewBody}>
                                    <span className={styles.sourceBadge}>
                                        <SourceIcon source={preview.source} />
                                        {sourceLabel(preview.source)}
                                    </span>
                                    <h3 className={styles.previewTitle}>{preview.title}</h3>
                                    {preview.artist && (
                                        <p className={styles.previewMeta}>
                                            <User size={14} /> {preview.artist}
                                        </p>
                                    )}
                                    {preview.duration != null && (
                                        <p className={styles.previewMeta}>
                                            <Clock size={14} /> {formatDuration(preview.duration)}
                                        </p>
                                    )}
                                    <a
                                        href={preview.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className={styles.previewLink}
                                    >
                                        Open original <ExternalLink size={12} />
                                    </a>
                                </div>
                            </div>
                        ) : (
                            <div className={styles.emptyPreview}>
                                <Download size={32} strokeWidth={1.5} />
                                <h3>How it works</h3>
                                <ol>
                                    <li>Paste a YouTube or Spotify track URL</li>
                                    <li>Optionally hit Fetch to preview</li>
                                    <li>Choose MP3 / MP4 / etc. and download</li>
                                </ol>
                                <p className={styles.reqNote}>
                                    Runs fully on Convertly (Next.js). Spotify tracks are matched to YouTube audio.
                                    Audio is the best stream YouTube provides (often M4A/WebM) — no system tools required.
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
