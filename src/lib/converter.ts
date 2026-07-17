import { convertMedia, compressMedia, isFFmpegFormat, type ProgressCallback } from "./ffmpeg-helper";

export type ConversionCategory = "image" | "document" | "data" | "audio" | "video" | "subtitle" | "font" | "code" | "archive" | "ebook";

export interface FormatInfo {
    ext: string;
    label: string;
    mime: string;
    category: ConversionCategory;
}

// ─────────────────────────────────────────────────────────────────────────────
// 100+ FORMAT DEFINITIONS
// ─────────────────────────────────────────────────────────────────────────────
export const FORMATS: Record<string, FormatInfo> = {
    // ── Images (18) ──────────────────────────────────────────────────────────
    png: { ext: "png", label: "PNG", mime: "image/png", category: "image" },
    jpg: { ext: "jpg", label: "JPG", mime: "image/jpeg", category: "image" },
    jpeg: { ext: "jpeg", label: "JPEG", mime: "image/jpeg", category: "image" },
    jfif: { ext: "jfif", label: "JFIF", mime: "image/jpeg", category: "image" },
    webp: { ext: "webp", label: "WebP", mime: "image/webp", category: "image" },
    gif: { ext: "gif", label: "GIF", mime: "image/gif", category: "image" },
    bmp: { ext: "bmp", label: "BMP", mime: "image/bmp", category: "image" },
    ico: { ext: "ico", label: "ICO", mime: "image/x-icon", category: "image" },
    svg: { ext: "svg", label: "SVG", mime: "image/svg+xml", category: "image" },
    tiff: { ext: "tiff", label: "TIFF", mime: "image/tiff", category: "image" },
    tif: { ext: "tif", label: "TIF", mime: "image/tiff", category: "image" },
    avif: { ext: "avif", label: "AVIF", mime: "image/avif", category: "image" },
    heic: { ext: "heic", label: "HEIC", mime: "image/heic", category: "image" },
    heif: { ext: "heif", label: "HEIF", mime: "image/heif", category: "image" },
    psd: { ext: "psd", label: "PSD", mime: "image/vnd.adobe.photoshop", category: "image" },
    tga: { ext: "tga", label: "TGA", mime: "image/x-tga", category: "image" },
    ppm: { ext: "ppm", label: "PPM", mime: "image/x-portable-pixmap", category: "image" },
    raw: { ext: "raw", label: "RAW", mime: "image/x-raw", category: "image" },

    // ── Audio (12) ───────────────────────────────────────────────────────────
    mp3: { ext: "mp3", label: "MP3", mime: "audio/mpeg", category: "audio" },
    wav: { ext: "wav", label: "WAV", mime: "audio/wav", category: "audio" },
    ogg: { ext: "ogg", label: "OGG", mime: "audio/ogg", category: "audio" },
    flac: { ext: "flac", label: "FLAC", mime: "audio/flac", category: "audio" },
    aac: { ext: "aac", label: "AAC", mime: "audio/aac", category: "audio" },
    wma: { ext: "wma", label: "WMA", mime: "audio/x-ms-wma", category: "audio" },
    m4a: { ext: "m4a", label: "M4A", mime: "audio/mp4", category: "audio" },
    opus: { ext: "opus", label: "Opus", mime: "audio/opus", category: "audio" },
    aiff: { ext: "aiff", label: "AIFF", mime: "audio/aiff", category: "audio" },
    ac3: { ext: "ac3", label: "AC3", mime: "audio/ac3", category: "audio" },
    amr: { ext: "amr", label: "AMR", mime: "audio/amr", category: "audio" },
    pcm: { ext: "pcm", label: "PCM", mime: "audio/L16", category: "audio" },

    // ── Video (14) ───────────────────────────────────────────────────────────
    mp4: { ext: "mp4", label: "MP4", mime: "video/mp4", category: "video" },
    webm: { ext: "webm", label: "WebM", mime: "video/webm", category: "video" },
    avi: { ext: "avi", label: "AVI", mime: "video/x-msvideo", category: "video" },
    mkv: { ext: "mkv", label: "MKV", mime: "video/x-matroska", category: "video" },
    mov: { ext: "mov", label: "MOV", mime: "video/quicktime", category: "video" },
    flv: { ext: "flv", label: "FLV", mime: "video/x-flv", category: "video" },
    wmv: { ext: "wmv", label: "WMV", mime: "video/x-ms-wmv", category: "video" },
    "3gp": { ext: "3gp", label: "3GP", mime: "video/3gpp", category: "video" },
    ogv: { ext: "ogv", label: "OGV", mime: "video/ogg", category: "video" },
    m4v: { ext: "m4v", label: "M4V", mime: "video/mp4", category: "video" },
    mpeg: { ext: "mpeg", label: "MPEG", mime: "video/mpeg", category: "video" },
    mpg: { ext: "mpg", label: "MPG", mime: "video/mpeg", category: "video" },
    vob: { ext: "vob", label: "VOB", mime: "video/dvd", category: "video" },
    "3g2": { ext: "3g2", label: "3G2", mime: "video/3gpp2", category: "video" },

    // ── Documents (7) ────────────────────────────────────────────────────────
    txt: { ext: "txt", label: "TXT", mime: "text/plain", category: "document" },
    html: { ext: "html", label: "HTML", mime: "text/html", category: "document" },
    htm: { ext: "htm", label: "HTM", mime: "text/html", category: "document" },
    md: { ext: "md", label: "Markdown", mime: "text/markdown", category: "document" },
    rtf: { ext: "rtf", label: "RTF", mime: "application/rtf", category: "document" },
    csv: { ext: "csv", label: "CSV", mime: "text/csv", category: "document" },
    log: { ext: "log", label: "LOG", mime: "text/plain", category: "document" },

    // ── Data (9) ─────────────────────────────────────────────────────────────
    json: { ext: "json", label: "JSON", mime: "application/json", category: "data" },
    xml: { ext: "xml", label: "XML", mime: "application/xml", category: "data" },
    yaml: { ext: "yaml", label: "YAML", mime: "text/yaml", category: "data" },
    yml: { ext: "yml", label: "YAML", mime: "text/yaml", category: "data" },
    tsv: { ext: "tsv", label: "TSV", mime: "text/tab-separated-values", category: "data" },
    toml: { ext: "toml", label: "TOML", mime: "text/toml", category: "data" },
    ini: { ext: "ini", label: "INI", mime: "text/plain", category: "data" },
    ndjson: { ext: "ndjson", label: "NDJSON", mime: "application/x-ndjson", category: "data" },
    jsonl: { ext: "jsonl", label: "JSONL", mime: "application/x-ndjson", category: "data" },

    // ── Subtitles (5) ────────────────────────────────────────────────────────
    srt: { ext: "srt", label: "SRT", mime: "application/x-subrip", category: "subtitle" },
    vtt: { ext: "vtt", label: "VTT", mime: "text/vtt", category: "subtitle" },
    ass: { ext: "ass", label: "ASS", mime: "text/x-ass", category: "subtitle" },
    ssa: { ext: "ssa", label: "SSA", mime: "text/x-ssa", category: "subtitle" },
    sub: { ext: "sub", label: "SUB", mime: "text/plain", category: "subtitle" },

    // ── Code (24) ────────────────────────────────────────────────────────────
    js: { ext: "js", label: "JavaScript", mime: "text/javascript", category: "code" },
    ts: { ext: "ts", label: "TypeScript", mime: "text/typescript", category: "code" },
    jsx: { ext: "jsx", label: "JSX", mime: "text/jsx", category: "code" },
    tsx: { ext: "tsx", label: "TSX", mime: "text/tsx", category: "code" },
    css: { ext: "css", label: "CSS", mime: "text/css", category: "code" },
    scss: { ext: "scss", label: "SCSS", mime: "text/x-scss", category: "code" },
    less: { ext: "less", label: "LESS", mime: "text/x-less", category: "code" },
    py: { ext: "py", label: "Python", mime: "text/x-python", category: "code" },
    java: { ext: "java", label: "Java", mime: "text/x-java", category: "code" },
    cpp: { ext: "cpp", label: "C++", mime: "text/x-c++", category: "code" },
    c: { ext: "c", label: "C", mime: "text/x-c", category: "code" },
    h: { ext: "h", label: "C Header", mime: "text/x-c", category: "code" },
    hpp: { ext: "hpp", label: "C++ Header", mime: "text/x-c++", category: "code" },
    go: { ext: "go", label: "Go", mime: "text/x-go", category: "code" },
    rs: { ext: "rs", label: "Rust", mime: "text/x-rust", category: "code" },
    rb: { ext: "rb", label: "Ruby", mime: "text/x-ruby", category: "code" },
    php: { ext: "php", label: "PHP", mime: "text/x-php", category: "code" },
    swift: { ext: "swift", label: "Swift", mime: "text/x-swift", category: "code" },
    kt: { ext: "kt", label: "Kotlin", mime: "text/x-kotlin", category: "code" },
    lua: { ext: "lua", label: "Lua", mime: "text/x-lua", category: "code" },
    r: { ext: "r", label: "R", mime: "text/x-r", category: "code" },
    sh: { ext: "sh", label: "Shell", mime: "text/x-shellscript", category: "code" },
    bat: { ext: "bat", label: "Batch", mime: "text/x-bat", category: "code" },
    sql: { ext: "sql", label: "SQL", mime: "text/x-sql", category: "code" },

    // ── Fonts (4) ────────────────────────────────────────────────────────────
    ttf: { ext: "ttf", label: "TTF", mime: "font/ttf", category: "font" },
    otf: { ext: "otf", label: "OTF", mime: "font/otf", category: "font" },
    woff: { ext: "woff", label: "WOFF", mime: "font/woff", category: "font" },
    woff2: { ext: "woff2", label: "WOFF2", mime: "font/woff2", category: "font" },

    // ── Archives (5) ─────────────────────────────────────────────────────────
    zip: { ext: "zip", label: "ZIP", mime: "application/zip", category: "archive" },
    tar: { ext: "tar", label: "TAR", mime: "application/x-tar", category: "archive" },
    gz: { ext: "gz", label: "GZ", mime: "application/gzip", category: "archive" },
    "7z": { ext: "7z", label: "7Z", mime: "application/x-7z-compressed", category: "archive" },
    rar: { ext: "rar", label: "RAR", mime: "application/x-rar-compressed", category: "archive" },

    // ── Ebooks (2) ───────────────────────────────────────────────────────────
    epub: { ext: "epub", label: "EPUB", mime: "application/epub+zip", category: "ebook" },
    mobi: { ext: "mobi", label: "MOBI", mime: "application/x-mobipocket-ebook", category: "ebook" },
};

// ─────────────────────────────────────────────────────────────────────────────
// CONVERSION MAP — built programmatically
// ─────────────────────────────────────────────────────────────────────────────

const CANVAS_INPUTS = ["png", "jpg", "jpeg", "jfif", "webp", "gif", "bmp", "svg", "ico", "avif", "tiff", "tif"];
const CANVAS_OUTPUTS = ["png", "jpg", "webp", "bmp", "ico", "avif"];

const FFMPEG_AUDIO = ["mp3", "wav", "ogg", "flac", "aac", "wma", "m4a", "opus", "aiff", "ac3", "amr"];
const FFMPEG_VIDEO = ["mp4", "webm", "avi", "mkv", "mov", "flv", "wmv", "3gp", "ogv", "m4v", "mpeg", "mpg"];

const SUBTITLE_FORMATS = ["srt", "vtt", "ass", "ssa"];

const DATA_TEXT: Record<string, string[]> = {
    csv: ["json", "tsv", "xml", "yaml"],
    json: ["csv", "xml", "yaml", "tsv", "ndjson"],
    xml: ["json", "csv", "yaml"],
    yaml: ["json", "xml", "csv"],
    yml: ["json", "xml", "csv"],
    tsv: ["csv", "json", "xml"],
    toml: ["json", "yaml"],
    ini: ["json", "yaml"],
    ndjson: ["json", "csv"],
    jsonl: ["json", "csv"],
    txt: ["html", "md"],
    html: ["txt", "md"],
    htm: ["txt", "md"],
    md: ["html", "txt"],
    log: ["txt"],
    rtf: ["txt"],
};

function buildConversionMap(): Record<string, string[]> {
    const map: Record<string, string[]> = {};

    // Image → Image (Canvas)
    for (const input of CANVAS_INPUTS) {
        map[input] = CANVAS_OUTPUTS.filter(o => {
            if (o === input) return false;
            if ((input === "jpeg" || input === "jfif") && o === "jpg") return false;
            if (input === "tif" && o === "tiff") return false;
            return true;
        });
    }
    // HEIC/HEIF → Image (via ffmpeg)
    map["heic"] = ["png", "jpg", "webp", "bmp"];
    map["heif"] = ["png", "jpg", "webp", "bmp"];

    // Audio → Audio (FFmpeg)
    for (const input of FFMPEG_AUDIO) {
        map[input] = FFMPEG_AUDIO.filter(o => o !== input);
    }

    // Video → Video (FFmpeg) + extract audio
    for (const input of FFMPEG_VIDEO) {
        map[input] = [
            ...FFMPEG_VIDEO.filter(o => o !== input),
            "mp3", "wav", "ogg", "flac", "aac", // extract audio
        ];
    }

    // Subtitle → Subtitle
    for (const input of SUBTITLE_FORMATS) {
        map[input] = SUBTITLE_FORMATS.filter(o => o !== input);
    }

    // Data & Documents
    for (const [input, outputs] of Object.entries(DATA_TEXT)) {
        map[input] = [...(map[input] || []), ...outputs];
    }

    return map;
}

export const CONVERSION_MAP = buildConversionMap();

// ─────────────────────────────────────────────────────────────────────────────
// PUBLIC API
// ─────────────────────────────────────────────────────────────────────────────

function getExt(filename: string): string {
    return filename.split(".").pop()?.toLowerCase() || "";
}

export function getAvailableConversions(filename: string): string[] {
    return CONVERSION_MAP[getExt(filename)] || [];
}

export function getFormatInfo(ext: string): FormatInfo | undefined {
    return FORMATS[ext.toLowerCase()];
}

export function getAllTargetFormats(): string[] {
    const targets = new Set<string>();
    Object.values(CONVERSION_MAP).forEach(arr => arr.forEach(f => targets.add(f)));
    return Array.from(targets).sort();
}

export function getFormatsForCategory(cat: ConversionCategory): FormatInfo[] {
    return Object.values(FORMATS).filter(f => f.category === cat);
}

// ─────────────────────────────────────────────────────────────────────────────
// IMAGE CONVERSION (Canvas API)
// ─────────────────────────────────────────────────────────────────────────────

async function convertImageCanvas(file: File, target: string, quality: number, maxDim?: number): Promise<Blob> {
    const ext = getExt(file.name);
    if (ext === "svg") return convertSvg(file, target, quality, maxDim);

    return new Promise((resolve, reject) => {
        const img = new window.Image();
        const url = URL.createObjectURL(file);
        img.onload = () => {
            let w = img.naturalWidth, h = img.naturalHeight;
            if (maxDim && (w > maxDim || h > maxDim)) {
                const ratio = Math.min(maxDim / w, maxDim / h);
                w = Math.round(w * ratio);
                h = Math.round(h * ratio);
            }
            const canvas = document.createElement("canvas");
            canvas.width = w; canvas.height = h;
            const ctx = canvas.getContext("2d");
            if (!ctx) { reject(new Error("Canvas not supported")); return; }
            if (["jpg", "jpeg", "bmp", "ico"].includes(target)) {
                ctx.fillStyle = "#FFFFFF";
                ctx.fillRect(0, 0, w, h);
            }
            ctx.drawImage(img, 0, 0, w, h);
            URL.revokeObjectURL(url);
            const mime = FORMATS[target]?.mime || `image/${target}`;
            canvas.toBlob(
                b => b ? resolve(b) : reject(new Error("Conversion failed")),
                mime, quality / 100
            );
        };
        img.onerror = () => { URL.revokeObjectURL(url); reject(new Error("Failed to load image")); };
        img.src = url;
    });
}

async function convertSvg(file: File, target: string, quality: number, maxDim?: number): Promise<Blob> {
    const svgText = await file.text();
    const blob = new Blob([svgText], { type: "image/svg+xml" });
    const url = URL.createObjectURL(blob);
    return new Promise((resolve, reject) => {
        const img = new window.Image();
        img.onload = () => {
            let w = img.naturalWidth || 512, h = img.naturalHeight || 512;
            if (maxDim && (w > maxDim || h > maxDim)) {
                const ratio = Math.min(maxDim / w, maxDim / h);
                w = Math.round(w * ratio); h = Math.round(h * ratio);
            }
            const canvas = document.createElement("canvas");
            canvas.width = w; canvas.height = h;
            const ctx = canvas.getContext("2d");
            if (!ctx) { reject(new Error("Canvas not supported")); return; }
            if (["jpg", "jpeg", "bmp"].includes(target)) {
                ctx.fillStyle = "#FFFFFF"; ctx.fillRect(0, 0, w, h);
            }
            ctx.drawImage(img, 0, 0, w, h);
            URL.revokeObjectURL(url);
            canvas.toBlob(
                b => b ? resolve(b) : reject(new Error("Conversion failed")),
                FORMATS[target]?.mime || `image/${target}`, quality / 100
            );
        };
        img.onerror = () => { URL.revokeObjectURL(url); reject(new Error("SVG load failed")); };
        img.src = url;
    });
}

// ─────────────────────────────────────────────────────────────────────────────
// TEXT / DOCUMENT CONVERSION
// ─────────────────────────────────────────────────────────────────────────────

function convertText(content: string, from: string, to: string): string {
    if ((from === "md") && to === "html") {
        const html = content
            .replace(/^### (.*$)/gim, "<h3>$1</h3>")
            .replace(/^## (.*$)/gim, "<h2>$1</h2>")
            .replace(/^# (.*$)/gim, "<h1>$1</h1>")
            .replace(/\*\*(.*?)\*\*/gim, "<strong>$1</strong>")
            .replace(/\*(.*?)\*/gim, "<em>$1</em>")
            .replace(/`(.*?)`/gim, "<code>$1</code>")
            .replace(/\[([^\]]+)\]\(([^)]+)\)/gim, '<a href="$2">$1</a>')
            .replace(/^- (.*$)/gim, "<li>$1</li>")
            .replace(/\n/gim, "<br>");
        return `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Converted</title></head><body>${html}</body></html>`;
    }
    if ((from === "html" || from === "htm") && to === "txt") {
        return content.replace(/<[^>]*>/g, "").trim();
    }
    if ((from === "html" || from === "htm") && to === "md") {
        return content
            .replace(/<h1>(.*?)<\/h1>/gi, "# $1\n")
            .replace(/<h2>(.*?)<\/h2>/gi, "## $1\n")
            .replace(/<h3>(.*?)<\/h3>/gi, "### $1\n")
            .replace(/<strong>(.*?)<\/strong>/gi, "**$1**")
            .replace(/<em>(.*?)<\/em>/gi, "*$1*")
            .replace(/<code>(.*?)<\/code>/gi, "`$1`")
            .replace(/<a href="([^"]*)">(.*?)<\/a>/gi, "[$2]($1)")
            .replace(/<br\s*\/?>/gi, "\n")
            .replace(/<[^>]*>/g, "").trim();
    }
    if ((from === "txt" || from === "log" || from === "rtf") && to === "html") {
        const esc = content.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
        return `<!DOCTYPE html><html><head><meta charset="utf-8"></head><body><pre>${esc}</pre></body></html>`;
    }
    if (from === "txt" && to === "md") return content;
    if (from === "rtf" && to === "txt") return content.replace(/\{\\[^}]*\}/g, "").replace(/\\/g, "").trim();
    if (from === "log" && to === "txt") return content;
    return content;
}

// ─────────────────────────────────────────────────────────────────────────────
// DATA CONVERSION
// ─────────────────────────────────────────────────────────────────────────────

function parseCsvLine(line: string): string[] {
    const result: string[] = [];
    let cur = "", inQ = false;
    for (let i = 0; i < line.length; i++) {
        const ch = line[i];
        if (ch === '"') {
            if (inQ && line[i + 1] === '"') { cur += '"'; i++; }
            else inQ = !inQ;
        } else if (ch === ',' && !inQ) {
            result.push(cur.trim()); cur = "";
        } else cur += ch;
    }
    result.push(cur.trim());
    return result;
}

function csvToJson(csv: string): string {
    const lines = csv.trim().split("\n");
    if (lines.length < 2) return "[]";
    const headers = parseCsvLine(lines[0]);
    const rows = lines.slice(1).map(l => {
        const vals = parseCsvLine(l);
        const obj: Record<string, string> = {};
        headers.forEach((h, i) => { obj[h] = vals[i] || ""; });
        return obj;
    });
    return JSON.stringify(rows, null, 2);
}

function jsonToCsv(json: string): string {
    const arr = JSON.parse(json);
    if (!Array.isArray(arr) || !arr.length) return "";
    const headers = Object.keys(arr[0]);
    return [headers.join(","), ...arr.map((r: Record<string, unknown>) =>
        headers.map(h => `"${String(r[h] ?? "").replace(/"/g, '""')}"`).join(",")
    )].join("\n");
}

function jsonToTsv(json: string): string {
    const arr = JSON.parse(json);
    if (!Array.isArray(arr) || !arr.length) return "";
    const headers = Object.keys(arr[0]);
    return [headers.join("\t"), ...arr.map((r: Record<string, unknown>) =>
        headers.map(h => String(r[h] ?? "").replace(/\t/g, " ")).join("\t")
    )].join("\n");
}

function jsonToXml(json: string): string {
    const data = JSON.parse(json);
    const toXml = (obj: unknown, tag: string): string => {
        if (Array.isArray(obj)) return obj.map(item => toXml(item, "item")).join("\n");
        if (typeof obj === "object" && obj !== null) {
            const inner = Object.entries(obj as Record<string, unknown>).map(([k, v]) => toXml(v, k)).join("\n");
            return `<${tag}>\n${inner}\n</${tag}>`;
        }
        return `<${tag}>${String(obj)}</${tag}>`;
    };
    return `<?xml version="1.0" encoding="UTF-8"?>\n<root>\n${toXml(data, "data")}\n</root>`;
}

function xmlToJson(xml: string): string {
    const doc = new DOMParser().parseFromString(xml, "text/xml");
    const nodeToObj = (node: Element): unknown => {
        if (node.children.length === 0) return node.textContent;
        const obj: Record<string, unknown> = {};
        const cm: Record<string, unknown[]> = {};
        Array.from(node.children).forEach(ch => {
            if (!cm[ch.tagName]) cm[ch.tagName] = [];
            cm[ch.tagName].push(nodeToObj(ch));
        });
        Object.entries(cm).forEach(([k, v]) => { obj[k] = v.length === 1 ? v[0] : v; });
        return obj;
    };
    return JSON.stringify(nodeToObj(doc.documentElement), null, 2);
}

function jsonToYaml(json: string): string {
    const data = JSON.parse(json);
    const toY = (obj: unknown, indent: number): string => {
        const pad = " ".repeat(indent);
        if (Array.isArray(obj)) {
            return obj.map(item => typeof item === "object" && item !== null
                ? `${pad}-\n${toY(item, indent + 2)}` : `${pad}- ${item}`
            ).join("\n");
        }
        if (typeof obj === "object" && obj !== null) {
            return Object.entries(obj as Record<string, unknown>).map(([k, v]) =>
                typeof v === "object" && v !== null ? `${pad}${k}:\n${toY(v, indent + 2)}` : `${pad}${k}: ${v}`
            ).join("\n");
        }
        return `${pad}${obj}`;
    };
    return toY(data, 0);
}

function yamlToJson(yaml: string): string {
    const result: Record<string, string> = {};
    yaml.split("\n").forEach(line => {
        const m = line.match(/^(\w+):\s*(.+)$/);
        if (m) result[m[1]] = m[2];
    });
    return JSON.stringify(result, null, 2);
}

function tomlToJson(toml: string): string {
    const result: Record<string, string> = {};
    toml.split("\n").forEach(line => {
        const m = line.match(/^(\w+)\s*=\s*"?([^"]*)"?$/);
        if (m) result[m[1]] = m[2];
    });
    return JSON.stringify(result, null, 2);
}

function iniToJson(ini: string): string {
    const result: Record<string, Record<string, string>> = {};
    let section = "default";
    ini.split("\n").forEach(line => {
        const sec = line.match(/^\[(.+)\]$/);
        if (sec) { section = sec[1]; result[section] = result[section] || {}; return; }
        const kv = line.match(/^([^=]+)=(.*)$/);
        if (kv) {
            if (!result[section]) result[section] = {};
            result[section][kv[1].trim()] = kv[2].trim();
        }
    });
    return JSON.stringify(result, null, 2);
}

function ndjsonToJson(ndjson: string): string {
    const lines = ndjson.trim().split("\n").filter(l => l.trim());
    const arr = lines.map(l => JSON.parse(l));
    return JSON.stringify(arr, null, 2);
}

function jsonToNdjson(json: string): string {
    const arr = JSON.parse(json);
    if (!Array.isArray(arr)) return JSON.stringify(arr);
    return arr.map(item => JSON.stringify(item)).join("\n");
}

// ─────────────────────────────────────────────────────────────────────────────
// SUBTITLE CONVERSION
// ─────────────────────────────────────────────────────────────────────────────

interface SubCue { start: string; end: string; text: string; }

function parseSrt(srt: string): SubCue[] {
    const cues: SubCue[] = [];
    const blocks = srt.trim().split(/\n\n+/);
    for (const block of blocks) {
        const lines = block.split("\n");
        if (lines.length < 3) continue;
        const time = lines[1].match(/(\d{2}:\d{2}:\d{2}[,.]?\d{3})\s*-->\s*(\d{2}:\d{2}:\d{2}[,.]?\d{3})/);
        if (time) cues.push({ start: time[1].replace(",", "."), end: time[2].replace(",", "."), text: lines.slice(2).join("\n") });
    }
    return cues;
}

function parseVtt(vtt: string): SubCue[] {
    const body = vtt.replace(/^WEBVTT.*\n\n?/, "");
    return parseSrt(body);
}

function parseAss(ass: string): SubCue[] {
    const cues: SubCue[] = [];
    const lines = ass.split("\n");
    for (const line of lines) {
        const m = line.match(/^Dialogue:\s*\d+,(\d+:\d{2}:\d{2}\.\d{2}),(\d+:\d{2}:\d{2}\.\d{2}),([^,]*),([^,]*),\d+,\d+,\d+,,(.*)$/);
        if (m) cues.push({ start: m[1] + "0", end: m[2] + "0", text: m[5].replace(/\\N/g, "\n").replace(/\{[^}]*\}/g, "") });
    }
    return cues;
}

function cuesToSrt(cues: SubCue[]): string {
    return cues.map((c, i) =>
        `${i + 1}\n${c.start.replace(".", ",")} --> ${c.end.replace(".", ",")}\n${c.text}`
    ).join("\n\n");
}

function cuesToVtt(cues: SubCue[]): string {
    return "WEBVTT\n\n" + cues.map(c =>
        `${c.start} --> ${c.end}\n${c.text}`
    ).join("\n\n");
}

function cuesToAss(cues: SubCue[]): string {
    const header = `[Script Info]\nTitle: Converted\nScriptType: v4.00+\n\n[V4+ Styles]\nFormat: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding\nStyle: Default,Arial,20,&H00FFFFFF,&H000000FF,&H00000000,&H00000000,0,0,0,0,100,100,0,0,1,2,2,2,10,10,10,1\n\n[Events]\nFormat: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text\n`;
    const lines = cues.map(c => {
        const s = c.start.substring(0, 10); const e = c.end.substring(0, 10);
        return `Dialogue: 0,${s},${e},Default,,0,0,0,,${c.text.replace(/\n/g, "\\N")}`;
    });
    return header + lines.join("\n");
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN CONVERT FUNCTION
// ─────────────────────────────────────────────────────────────────────────────

export async function convertFile(
    file: File,
    targetFormat: string,
    quality: number = 92,
    options?: {
        compress?: boolean;
        compressionLevel?: "light" | "medium" | "heavy";
        maxDim?: number;
        onProgress?: ProgressCallback;
    }
): Promise<Blob> {
    const ext = getExt(file.name);
    const srcInfo = FORMATS[ext];
    if (!srcInfo) throw new Error(`Unsupported format: .${ext}`);

    const onProgress = options?.onProgress;

    // ── Compression (same format) ────────────────────────────────────────
    if (options?.compress && targetFormat === ext) {
        if (srcInfo.category === "image" && CANVAS_INPUTS.includes(ext)) {
            onProgress?.(30, "Compressing image…");
            const compressQ = { light: 75, medium: 50, heavy: 25 }[options.compressionLevel || "medium"];
            const maxDim = { light: undefined, medium: 1920, heavy: 1280 }[options.compressionLevel || "medium"];
            const result = await convertImageCanvas(file, ext === "svg" ? "png" : ext, compressQ, maxDim);
            onProgress?.(100, "Done");
            return result;
        }
        if (isFFmpegFormat(ext)) {
            return compressMedia(file, ext, options.compressionLevel || "medium", onProgress);
        }
    }

    // ── Image conversion (Canvas) ────────────────────────────────────────
    if (srcInfo.category === "image" && CANVAS_INPUTS.includes(ext) && CANVAS_OUTPUTS.includes(targetFormat)) {
        onProgress?.(40, "Converting image…");
        const result = await convertImageCanvas(file, targetFormat, quality, options?.maxDim);
        onProgress?.(100, "Done");
        return result;
    }

    // ── HEIC/HEIF → Image (via FFmpeg) ───────────────────────────────────
    if ((ext === "heic" || ext === "heif") && CANVAS_OUTPUTS.includes(targetFormat)) {
        return convertMedia(file, ext, targetFormat, { onProgress });
    }

    // ── Audio / Video (FFmpeg) ───────────────────────────────────────────
    if (isFFmpegFormat(ext) && (FFMPEG_AUDIO.includes(targetFormat) || FFMPEG_VIDEO.includes(targetFormat))) {
        return convertMedia(file, ext, targetFormat, {
            ...(options?.compress ? {
                compress: true as const,
                audioBitrate: { light: "192k", medium: "128k", heavy: "64k" }[options.compressionLevel || "medium"],
                videoBitrate: { light: "2000k", medium: "1000k", heavy: "500k" }[options.compressionLevel || "medium"],
            } : {}),
            onProgress,
        });
    }

    // ── Subtitle conversion ──────────────────────────────────────────────
    if (srcInfo.category === "subtitle" && SUBTITLE_FORMATS.includes(targetFormat)) {
        const text = await file.text();
        let cues: SubCue[];
        if (ext === "srt") cues = parseSrt(text);
        else if (ext === "vtt") cues = parseVtt(text);
        else if (ext === "ass" || ext === "ssa") cues = parseAss(text);
        else throw new Error(`Cannot parse ${ext} subtitles`);

        let output: string;
        if (targetFormat === "srt") output = cuesToSrt(cues);
        else if (targetFormat === "vtt") output = cuesToVtt(cues);
        else if (targetFormat === "ass" || targetFormat === "ssa") output = cuesToAss(cues);
        else throw new Error(`Cannot write ${targetFormat} subtitles`);

        return new Blob([output], { type: FORMATS[targetFormat]?.mime || "text/plain" });
    }

    // ── Text / Document conversion ───────────────────────────────────────
    if (srcInfo.category === "document") {
        const text = await file.text();
        if (ext === "csv") {
            if (targetFormat === "json") return blob(csvToJson(text), "application/json");
            if (targetFormat === "tsv") return blob(csvToTsv(text), "text/tab-separated-values");
            if (targetFormat === "xml") return blob(jsonToXml(csvToJson(text)), "application/xml");
            if (targetFormat === "yaml") return blob(jsonToYaml(csvToJson(text)), "text/yaml");
        }
        return blob(convertText(text, ext, targetFormat), FORMATS[targetFormat]?.mime || "text/plain");
    }

    // ── Data conversion ──────────────────────────────────────────────────
    if (srcInfo.category === "data") {
        const text = await file.text();
        let result = "";

        // Normalize to JSON first, then convert to target
        let jsonStr = "";
        if (ext === "json") jsonStr = text;
        else if (ext === "xml") jsonStr = xmlToJson(text);
        else if (ext === "yaml" || ext === "yml") jsonStr = yamlToJson(text);
        else if (ext === "toml") jsonStr = tomlToJson(text);
        else if (ext === "ini") jsonStr = iniToJson(text);
        else if (ext === "tsv") jsonStr = csvToJson(tsvToCsv(text));
        else if (ext === "ndjson" || ext === "jsonl") jsonStr = ndjsonToJson(text);

        if (targetFormat === "json") result = jsonStr;
        else if (targetFormat === "csv") result = jsonToCsv(jsonStr);
        else if (targetFormat === "tsv") result = jsonToTsv(jsonStr);
        else if (targetFormat === "xml") result = jsonToXml(jsonStr);
        else if (targetFormat === "yaml") result = jsonToYaml(jsonStr);
        else if (targetFormat === "ndjson" || targetFormat === "jsonl") result = jsonToNdjson(jsonStr);

        return blob(result, FORMATS[targetFormat]?.mime || "text/plain");
    }

    throw new Error(`Conversion from .${ext} to .${targetFormat} is not supported`);
}

// Helpers
function blob(content: string, mime: string): Blob {
    return new Blob([content], { type: mime });
}

function csvToTsv(csv: string): string {
    return csv.trim().split("\n").map(l => parseCsvLine(l).join("\t")).join("\n");
}

function tsvToCsv(tsv: string): string {
    return tsv.trim().split("\n").map(l =>
        l.split("\t").map(v => `"${v.replace(/"/g, '""')}"`).join(",")
    ).join("\n");
}
