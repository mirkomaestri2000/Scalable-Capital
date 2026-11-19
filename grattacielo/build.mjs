// Bundles src/ into a single self-contained dist/index.html (JS + CSS inline).
import { build } from "esbuild";
import { execFileSync } from "node:child_process";
import { copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";

mkdirSync("dist", { recursive: true });
if (!existsSync("src/data/portfolio.js")) {
  console.warn("src/data/portfolio.js non trovato: uso i dati di esempio.");
  copyFileSync("src/data/portfolio.example.js", "src/data/portfolio.js");
}
execFileSync("npx", ["tailwindcss", "-c", "tailwind.config.cjs", "-i", "src/styles.css", "-o", "dist/app.css", "--minify"], { stdio: "inherit" });
const res = await build({
  entryPoints: ["src/main.jsx"],
  bundle: true,
  minify: true,
  format: "iife",
  write: false,
  jsx: "automatic",
  loader: { ".css": "empty" },
  define: { "process.env.NODE_ENV": '"production"' },
});
const js = res.outputFiles[0].text.replace(/<\/script/gi, "<\\/script");
const css = readFileSync("dist/app.css", "utf8");
const html = `<!DOCTYPE html>
<html lang="it">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Grattacielo del portafoglio</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500;600&display=swap">
<style>${css}
.font-mono{font-family:"IBM Plex Mono",ui-monospace,SFMono-Regular,Menlo,monospace}
body{background:#05070d;color-scheme:dark}</style>
</head>
<body>
<div id="root"></div>
<script>${js}</script>
</body>
</html>
`;
writeFileSync("dist/index.html", html);
console.log("dist/index.html", (html.length / 1024).toFixed(0) + " KB");
