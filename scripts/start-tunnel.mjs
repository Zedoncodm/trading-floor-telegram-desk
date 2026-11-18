import { spawn } from "node:child_process";
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = dirname(__dirname);
const tunnelInfoPath = join(rootDir, "data", "tunnel_url.json");

function saveTunnelUrl(url) {
  try {
    mkdirSync(dirname(tunnelInfoPath), { recursive: true });
    writeFileSync(tunnelInfoPath, JSON.stringify({ url, updatedAt: Date.now() }, null, 2), "utf8");
  } catch (err) {
    console.error("[Tunnel] Impossible d'enregistrer tunnel_url.json:", err);
  }
}

const port = process.env.UI_PORT || process.env.PORT || "4080";
const token = (process.env.CF_TUNNEL_TOKEN || "").trim();
const publicUrl = (process.env.CF_PUBLIC_URL || "").trim();
if (publicUrl) saveTunnelUrl(publicUrl);

const candidates = [
  process.env.CLOUDFLARED_PATH,
  "C:\\Program Files (x86)\\cloudflared\\cloudflared.exe",
  "C:\\Program Files\\cloudflared\\cloudflared.exe",
  "cloudflared",
].filter(Boolean);

const bin = candidates.find((p) => p === "cloudflared" || existsSync(p));
if (!bin) {
  console.error("[Tunnel] cloudflared introuvable. Installez Cloudflare Tunnel ou définissez CLOUDFLARED_PATH.");
  process.exit(1);
}

// Si CF_TUNNEL_TOKEN est défini -> tunnel nommé stable ; sinon -> Quick Tunnel (*.trycloudflare.com).
const args = token
  ? ["tunnel", "--no-autoupdate", "run", "--token", token]
  : ["tunnel", "--no-autoupdate", "--url", `http://127.0.0.1:${port}`];

console.log(`[Tunnel] Démarrage Cloudflare Tunnel -> http://127.0.0.1:${port} (${token ? "named token" : "quick URL"})`);

const child = spawn(bin, args, { stdio: ["ignore", "pipe", "pipe"] });

function forward(stream, out) {
  stream.on("data", (buf) => {
    const text = buf.toString("utf8");
    out.write(text);
    const m = text.match(/https:\/\/[a-z0-9-]+\.trycloudflare\.com/i);
    if (m) {
      saveTunnelUrl(m[0]);
      console.log(`\n==========================================================`);
      console.log(`[Tunnel] URL HTTPS MOBILE : ${m[0]}`);
      console.log(`==========================================================\n`);
    }
  });
}

forward(child.stdout, process.stdout);
forward(child.stderr, process.stderr);

child.on("exit", (code) => {
  console.error(`[Tunnel] cloudflared arrêté (code ${code ?? 0}).`);
  process.exit(code ?? 1);
});
