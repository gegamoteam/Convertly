// Simple global store to pass files from the Hero dropzone to the /convert page.
// This avoids complex state management — files are stored temporarily in memory.

let _pendingFiles: File[] = [];
let _pendingMode: "convert" | "compress" = "convert";

export function setPendingFiles(files: File[], mode: "convert" | "compress" = "convert") {
    _pendingFiles = [...files];
    _pendingMode = mode;
}

export function consumePendingFiles(): { files: File[]; mode: "convert" | "compress" } {
    const files = _pendingFiles;
    const mode = _pendingMode;
    _pendingFiles = [];
    _pendingMode = "convert";
    return { files, mode };
}

export function hasPendingFiles(): boolean {
    return _pendingFiles.length > 0;
}
