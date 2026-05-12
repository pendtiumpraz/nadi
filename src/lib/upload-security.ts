// ════════════════════════════════════════════════════════════════════
// Upload security
// ────────────────────────────────────────────────────────────────────
// Centralised validation for every file-upload endpoint. Defaults block:
//   - Executable / script extensions (.php, .phtml, .js, .exe, .sh, .py, etc.)
//   - SVG (can carry inline <script> tags)
//   - HTML / HTM (XSS via download)
//   - Path traversal in filename
//   - Files whose declared MIME doesn't match the extension
// Each route passes its allowlist of MIMEs + extensions and a size cap.
// ════════════════════════════════════════════════════════════════════

// Extensions that must NEVER pass validation, regardless of caller config.
// These are well-known script/exploit vectors.
const HARD_BLOCK_EXTENSIONS = [
    "php", "phtml", "phar", "pl", "py", "rb", "sh", "bash", "zsh",
    "exe", "com", "bat", "cmd", "msi", "scr", "dll",
    "jsp", "asp", "aspx", "cfm",
    "htaccess", "htpasswd",
    "svg", // can embed <script> tags
    "html", "htm", "xhtml", // XSS via blob download
    "js", "mjs", "cjs", "ts", "tsx",
    "xml", // XXE if parsed
];

// Crude MIME→extension consistency: catches obvious mismatches like a
// file with .pdf extension but image/jpeg mime (or vice versa).
const MIME_EXTENSION_HINTS: Record<string, string[]> = {
    "application/pdf": ["pdf"],
    "image/jpeg": ["jpg", "jpeg"],
    "image/png": ["png"],
    "image/webp": ["webp"],
    "image/gif": ["gif"],
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document": ["docx"],
    "application/msword": ["doc"],
};

export interface UploadValidationOptions {
    /** Allowed MIME types. Use exact strings — wildcards not supported. */
    allowedMimes: string[];
    /** Allowed file extensions WITHOUT the leading dot (e.g. ["pdf", "jpg"]). */
    allowedExtensions: string[];
    /** Maximum size in bytes. */
    maxBytes: number;
}

export interface UploadValidationResult {
    ok: boolean;
    error?: string;
    /** Safe filename to write to disk / blob. Stripped of traversal characters. */
    safeName?: string;
    /** The detected extension (lowercase, no dot). */
    extension?: string;
}

function getExtension(filename: string): string {
    const dotIndex = filename.lastIndexOf(".");
    if (dotIndex === -1 || dotIndex === filename.length - 1) return "";
    return filename.slice(dotIndex + 1).toLowerCase();
}

function sanitiseBase(filename: string): string {
    // Strip path components and any character that isn't alnum/dash/underscore.
    const base = filename.replace(/^.*[\\/]/, "");
    const noExt = base.replace(/\.[^.]*$/, "");
    const cleaned = noExt.replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 80);
    return cleaned || "upload";
}

/**
 * Validate a File against the supplied policy. Returns ok:true with a safe
 * filename + extension on success, or ok:false with a human-readable error.
 */
export function validateUpload(file: File | null, opts: UploadValidationOptions): UploadValidationResult {
    if (!file || file.size === 0) {
        return { ok: false, error: "No file provided." };
    }
    if (file.size > opts.maxBytes) {
        const mb = (opts.maxBytes / (1024 * 1024)).toFixed(0);
        return { ok: false, error: `File too large (max ${mb}MB).` };
    }
    const ext = getExtension(file.name);
    if (HARD_BLOCK_EXTENSIONS.includes(ext)) {
        return { ok: false, error: `File extension .${ext} is not allowed for security reasons.` };
    }
    if (!opts.allowedExtensions.includes(ext)) {
        return { ok: false, error: `Only ${opts.allowedExtensions.map((e) => "." + e).join(", ")} files are allowed.` };
    }
    if (!opts.allowedMimes.includes(file.type)) {
        return { ok: false, error: `Unsupported file type (got ${file.type || "unknown"}).` };
    }
    // Cross-check: MIME should be consistent with extension when we have a hint.
    const expectedExts = MIME_EXTENSION_HINTS[file.type];
    if (expectedExts && !expectedExts.includes(ext)) {
        return { ok: false, error: "File extension does not match its content type." };
    }
    const base = sanitiseBase(file.name);
    const safeName = `${base}-${Date.now()}.${ext}`;
    return { ok: true, safeName, extension: ext };
}

// Convenience presets ----------------------------------------------------

export const PRESET_IMAGE_5MB: UploadValidationOptions = {
    allowedMimes: ["image/jpeg", "image/png", "image/webp"],
    allowedExtensions: ["jpg", "jpeg", "png", "webp"],
    maxBytes: 5 * 1024 * 1024,
};

export const PRESET_SIGNATURE_2MB: UploadValidationOptions = {
    allowedMimes: ["image/jpeg", "image/png"],
    allowedExtensions: ["jpg", "jpeg", "png"],
    maxBytes: 2 * 1024 * 1024,
};

export const PRESET_PDF_20MB: UploadValidationOptions = {
    allowedMimes: ["application/pdf"],
    allowedExtensions: ["pdf"],
    maxBytes: 20 * 1024 * 1024,
};

export const PRESET_GUIDELINE_25MB: UploadValidationOptions = {
    allowedMimes: [
        "application/pdf",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "application/msword",
    ],
    allowedExtensions: ["pdf", "docx", "doc"],
    maxBytes: 25 * 1024 * 1024,
};
