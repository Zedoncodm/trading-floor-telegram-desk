import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import type { IncomingMessage, ServerResponse } from "node:http";

/**
 * Authentification par PIN (DESK_ACCESS_PIN) pour l'accès distant (Cloudflare Tunnel / LAN).
 * - Requêtes locales directes (127.0.0.1 sans en-têtes Cloudflare) : autorisées (PC + EA MT5).
 * - Toute autre requête : cookie de session signé HMAC requis, sinon écran de login.
 * - Anti brute-force : 5 essais ratés / 15 min par IP.
 */
const COOKIE = "tfdesk_session";
const SESSION_DAYS = 30;
const secret = (process.env.DESK_SESSION_SECRET || "").trim() || randomBytes(32).toString("hex");
const failures = new Map<string, { count: number; until: number }>();

export function authEnabled(): boolean {
  return Boolean((process.env.DESK_ACCESS_PIN ?? "").trim());
}

function clientIp(req: IncomingMessage): string {
  return String(req.headers["cf-connecting-ip"] ?? req.headers["x-forwarded-for"] ?? req.socket.remoteAddress ?? "?").split(",")[0]!.trim();
}

export function isDirectLocal(req: IncomingMessage): boolean {
  const ra = req.socket.remoteAddress ?? "";
  const loopback = ra === "127.0.0.1" || ra === "::1" || ra === "::ffff:127.0.0.1";
  const proxied = Boolean(req.headers["cf-connecting-ip"] || req.headers["cf-ray"] || req.headers["x-forwarded-for"]);
  return loopback && !proxied;
}

function sign(exp: number): string {
  const mac = createHmac("sha256", secret).update(`desk:${exp}`).digest("hex");
  return `${exp}.${mac}`;
}

function validToken(tok: string | undefined): boolean {
  if (!tok) return false;
  const [expRaw, mac] = tok.split(".");
  const exp = Number(expRaw);
  if (!Number.isFinite(exp) || exp < Date.now() || !mac) return false;
  const expected = sign(exp).split(".")[1]!;
  const a = Buffer.from(mac);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

function readCookie(req: IncomingMessage, name: string): string | undefined {
  const raw = req.headers.cookie ?? "";
  for (const part of raw.split(";")) {
    const [k, ...v] = part.trim().split("=");
    if (k === name) return decodeURIComponent(v.join("="));
  }
  return undefined;
}

function pinMatches(pin: string): boolean {
  const expected = Buffer.from((process.env.DESK_ACCESS_PIN ?? "").trim());
  const got = Buffer.from(pin.trim());
  if (got.length !== expected.length) {
    timingSafeEqual(expected, expected);
    return false;
  }
  return timingSafeEqual(got, expected);
}

const LOGIN_HTML = (msg = "") => `<!doctype html><html lang="fr"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1"><title>Trading Floor · Accès</title>
<style>body{margin:0;min-height:100vh;display:grid;place-items:center;background:#0b0f17;color:#e2e8f0;font-family:system-ui,sans-serif}
form{background:#111827;border:1px solid #1f2937;border-radius:14px;padding:28px;width:min(320px,88vw)}
h1{font-size:16px;margin:0 0 16px;letter-spacing:.08em;text-transform:uppercase;color:#94a3b8}
input{width:100%;box-sizing:border-box;padding:14px;font-size:22px;letter-spacing:.3em;text-align:center;background:#0b0f17;color:#fff;border:1px solid #334155;border-radius:10px}
button{margin-top:14px;width:100%;padding:13px;border:0;border-radius:10px;background:#38bdf8;color:#04121c;font-weight:700;font-size:15px}
p{color:#f87171;font-size:13px;min-height:18px;margin:10px 0 0}</style></head>
<body><form method="post" action="/login"><h1>Trading Floor Desk</h1>
<input name="pin" type="password" inputmode="numeric" autocomplete="current-password" placeholder="PIN" autofocus required>
<button type="submit">Entrer</button><p>${msg}</p></form></body></html>`;

/** Retourne true si la requête a été traitée (login / refus), false si elle peut continuer. */
export async function handleAuth(req: IncomingMessage, res: ServerResponse, url: URL): Promise<boolean> {
  if (!authEnabled() || isDirectLocal(req)) return false;
  const ip = clientIp(req);

  if (url.pathname === "/login" && req.method === "GET") {
    res.writeHead(200, { "content-type": "text/html; charset=utf-8", "cache-control": "no-store" });
    res.end(LOGIN_HTML());
    return true;
  }
  if (url.pathname === "/login" && req.method === "POST") {
    const f = failures.get(ip);
    if (f && f.until > Date.now() && f.count >= 5) {
      res.writeHead(429, { "content-type": "text/html; charset=utf-8" });
      res.end(LOGIN_HTML("Trop d'essais. Réessayez dans 15 minutes."));
      return true;
    }
    let body = "";
    for await (const chunk of req) {
      body += chunk;
      if (body.length > 2048) break;
    }
    const pin = new URLSearchParams(body).get("pin") ?? "";
    if (!pinMatches(pin)) {
      const cur = f && f.until > Date.now() ? f : { count: 0, until: Date.now() + 15 * 60_000 };
      cur.count += 1;
      failures.set(ip, cur);
      res.writeHead(401, { "content-type": "text/html; charset=utf-8" });
      res.end(LOGIN_HTML("PIN incorrect."));
      return true;
    }
    failures.delete(ip);
    const exp = Date.now() + SESSION_DAYS * 86_400_000;
    const secure = req.headers["x-forwarded-proto"] === "https" || Boolean(req.headers["cf-ray"]);
    res.writeHead(303, {
      location: "/",
      "set-cookie": `${COOKIE}=${encodeURIComponent(sign(exp))}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${SESSION_DAYS * 86400}${secure ? "; Secure" : ""}`,
    });
    res.end();
    return true;
  }
  if (url.pathname === "/logout") {
    res.writeHead(303, { location: "/login", "set-cookie": `${COOKIE}=; Path=/; Max-Age=0` });
    res.end();
    return true;
  }
  if (validToken(readCookie(req, COOKIE))) return false;

  if (url.pathname.startsWith("/api/") || url.pathname.startsWith("/webhook/")) {
    res.writeHead(401, { "content-type": "application/json" });
    res.end(JSON.stringify({ ok: false, error: "auth required" }));
  } else {
    res.writeHead(303, { location: "/login" });
    res.end();
  }
  return true;
}
