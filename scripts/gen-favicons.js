// Regenerate favicons from /public/logo-nadi-color.png.
// Source is wide (2363x709); we letterbox it inside a square canvas with
// transparent padding so the full word-mark stays readable instead of
// being squashed by the browser. Sizes match what /src/app/layout.tsx
// references: 32 (favicon), 180 (apple-touch), 192 + 512 (PWA).
const sharp = require("sharp");
const path = require("path");

const SRC = path.join(__dirname, "..", "public", "logo-nadi-color.png");
const TARGETS = [
    { size: 32, out: "favicon-32.png" },
    { size: 180, out: "apple-touch-icon.png" },
    { size: 192, out: "icon-192.png" },
    { size: 512, out: "icon-512.png" },
];

(async () => {
    for (const { size, out } of TARGETS) {
        await sharp(SRC)
            .resize(size, size, {
                fit: "contain",
                background: { r: 0, g: 0, b: 0, alpha: 0 },
            })
            .png()
            .toFile(path.join(__dirname, "..", "public", out));
        console.log(`wrote public/${out} (${size}x${size})`);
    }
})();
