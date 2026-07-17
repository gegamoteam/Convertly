"use client";

import { useState, useCallback, useRef } from "react";
import {
    Link2, Download, Music, Video, Loader2, CheckCircle,
    AlertTriangle, Youtube, Headphones, ExternalLink, Clock, User,
    Sparkles, ArrowRight,
} from "lucide-react";
import { useToast } from "@/components/Toast";
import styles from "./download.module.css";

type Format = "mp3" | "mp4" | "m4a" | "webm";
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
    { value: "mp3", label: "MP3", kind: "audio", desc: "Music / podcasts" },
    { value: "m4a", label: "M4A", kind: "audio", desc: "High quality audio" },
    { value: "mp4", label: "MP4", kind: "video", desc: "Video + sound" },
    { value: "webm", label: "WebM", kind: "video", desc: "Web video" },
];

async function readApiJson(res: Response): Promise<Record<string, unknown>> {
    const text = await res.text();
    if (!text) return {};
    try {
        return JSON.parse(text) as Record<string, unknown>;
    } catch {
        // Server returned HTML / plain error (e.g. Vercel 500 page)
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

function sourceLabel(source: string): string {
    if (source === "youtube") return "YouTube";
    if (source === "spotify") return "Spotify";
    return source;
}

function SourceIcon({ source, size = 18 }: { source: string; size?: number }) {
    if (source === "spotify") return <Headphones size={size} />;
    return <Youtube size={size} />;
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

    const resetSoft = () => {
        setStatus("idle");
        setPreview(null);
        setError(null);
        setProgress(0);
        setStage("");
        setDownloadedName(null);
    };

    const fetchInfo = useCallback(async () => {
        const trimmed = url.trim();
        if (!trimmed) {
            setError("Paste a YouTube or Spotify track link");
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
        setStage("Looking up media…");

        try {
            const res = await fetch("/api/download/info", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ url: trimmed }),
                signal: ac.signal,
            });
            const data = await readApiJson(res);
            if (!res.ok) throw new Error(String(data.error || "Failed to fetch info"));

            setPreview(data as unknown as MediaPreview);
            setStatus("ready");
            setStage("");
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
        setProgress(6);
        setStage("Starting…");

        let fake = 6;
        const tick = setInterval(() => {
            fake = Math.min(86, fake + Math.max(0.35, (88 - fake) * 0.035));
            setProgress(Math.round(fake));
            if (fake < 25) setStage("Connecting…");
            else if (fake < 55) setStage("Downloading stream…");
            else if (fake < 80) setStage("Packaging file…");
            else setStage("Almost done…");
        }, 350);

        try {
            const res = await fetch("/api/download", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ url: trimmed, format }),
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
            let fileName = utfMatch
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
    }, [url, format, addToast]);

    const busy = status === "fetching" || status === "downloading";

    return (
        <div className={styles.page}>
            <div className={styles.bg}>
                <div className={styles.glow1} />
                <div className={styles.glow2} />
            </div>

            <div className={`container ${styles.inner}`}>
                <header className={styles.header}>
                    <div className={styles.badge}>
                        <Sparkles size={14} />
                        Media Downloader
                    </div>
                    <h1 className={styles.title}>
                        YouTube &amp; Spotify
                        <span className="gradient-text"> to MP3 / MP4</span>
                    </h1>
                    <p className={styles.subtitle}>
                        Paste a link. Pick a format. Download. No installs, no accounts.
                    </p>
                    <div className={styles.platformPills}>
                        <span className={styles.pill}><Youtube size={15} /> YouTube</span>
                        <span className={styles.pill}><Headphones size={15} /> Spotify</span>
                        <span className={styles.pillMuted}>MP3 · M4A · MP4 · WebM</span>
                    </div>
                </header>

                <div className={styles.shell}>
                    <div className={styles.mainCard}>
                        <div className={styles.field}>
                            <label className={styles.label}>
                                <Link2 size={15} /> Paste link
                            </label>
                            <div className={styles.urlBar}>
                                <input
                                    className={styles.input}
                                    type="url"
                                    placeholder="youtube.com/watch?v=…  or  open.spotify.com/track/…"
                                    value={url}
                                    onChange={e => {
                                        setUrl(e.target.value);
                                        if (status !== "idle" && status !== "fetching" && status !== "downloading") {
                                            resetSoft();
                                        }
                                    }}
                                    onKeyDown={e => {
                                        if (e.key === "Enter" && !busy) void fetchInfo();
                                    }}
                                    disabled={busy}
                                    spellCheck={false}
                                />
                                <button
                                    type="button"
                                    className={styles.fetchBtn}
                                    onClick={() => void fetchInfo()}
                                    disabled={busy || !url.trim()}
                                >
                                    {status === "fetching" ? (
                                        <><Loader2 size={16} className="spinning" /> Fetch</>
                                    ) : (
                                        <><ArrowRight size={16} /> Fetch</>
                                    )}
                                </button>
                            </div>
                        </div>

                        <div className={styles.field}>
                            <label className={styles.label}>
                                {format === "mp4" || format === "webm" ? <Video size={15} /> : <Music size={15} />}
                                Format
                            </label>
                            <div className={styles.formatRow}>
                                {availableFormats.map(f => (
                                    <button
                                        key={f.value}
                                        type="button"
                                        className={`${styles.formatChip} ${format === f.value ? styles.formatChipOn : ""}`}
                                        onClick={() => setFormat(f.value)}
                                        disabled={busy}
                                    >
                                        <strong>{f.label}</strong>
                                        <span>{f.desc}</span>
                                    </button>
                                ))}
                            </div>
                            {isSpotify && (
                                <p className={styles.hint}>
                                    Spotify tracks are matched on YouTube and saved as audio.
                                </p>
                            )}
                        </div>

                        <button
                            type="button"
                            className={styles.primaryBtn}
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
                            <div className={styles.progressBlock}>
                                <div className={styles.progressMeta}>
                                    <span>{stage || (status === "done" ? "Complete" : "Working…")}</span>
                                    <span className={styles.progressPct}>{progress}%</span>
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

                    <aside className={styles.aside}>
                        {preview ? (
                            <div className={styles.preview}>
                                <div className={styles.previewMedia}>
                                    {preview.thumbnail ? (
                                        // eslint-disable-next-line @next/next/no-img-element
                                        <img src={preview.thumbnail} alt="" />
                                    ) : (
                                        <div className={styles.previewFallback}>
                                            <SourceIcon source={preview.source} size={28} />
                                        </div>
                                    )}
                                    <span className={styles.sourceTag}>
                                        <SourceIcon source={preview.source} size={13} />
                                        {sourceLabel(preview.source)}
                                    </span>
                                </div>
                                <div className={styles.previewInfo}>
                                    <h3>{preview.title}</h3>
                                    {preview.artist && (
                                        <p><User size={14} /> {preview.artist}</p>
                                    )}
                                    {preview.duration != null && preview.duration > 0 && (
                                        <p><Clock size={14} /> {formatDuration(preview.duration)}</p>
                                    )}
                                    <a href={preview.url} target="_blank" rel="noopener noreferrer">
                                        Open original <ExternalLink size={12} />
                                    </a>
                                </div>
                            </div>
                        ) : (
                            <div className={styles.guide}>
                                <div className={styles.guideIcon}><Download size={22} /></div>
                                <h3>Quick start</h3>
                                <ol>
                                    <li>Paste a YouTube or Spotify track URL</li>
                                    <li>Hit Fetch to preview (optional)</li>
                                    <li>Pick MP3 / MP4 and download</li>
                                </ol>
                                <div className={styles.guideTips}>
                                    <div>
                                        <Youtube size={14} />
                                        <span>YouTube → audio or video</span>
                                    </div>
                                    <div>
                                        <Headphones size={14} />
                                        <span>Spotify → audio only</span>
                                    </div>
                                </div>
                            </div>
                        )}
                    </aside>
                </div>
            </div>
        </div>
    );
}
