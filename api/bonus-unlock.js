const crypto = require("crypto");

const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000;
const RATE_LIMIT_MAX_REQUESTS = 8;
const signedUrlTtlSeconds = 5 * 60;

const requestLog = new Map();

function json(res, statusCode, body) {
  res.status(statusCode).setHeader("Content-Type", "application/json");
  res.send(JSON.stringify(body));
}

function getClientIp(req) {
  const fwd = req.headers["x-forwarded-for"];
  if (typeof fwd === "string" && fwd.length > 0) {
    return fwd.split(",")[0].trim();
  }
  return req.socket?.remoteAddress || "unknown";
}

function isValidEmail(email) {
  if (typeof email !== "string") return false;
  const trimmed = email.trim();
  if (trimmed.length < 5 || trimmed.length > 160) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed);
}

function isRateLimited(ip) {
  const now = Date.now();

  for (const [key, info] of requestLog.entries()) {
    if (now - info.windowStart > RATE_LIMIT_WINDOW_MS) {
      requestLog.delete(key);
    }
  }

  const current = requestLog.get(ip);
  if (!current) {
    requestLog.set(ip, { windowStart: now, count: 1 });
    return false;
  }

  if (now - current.windowStart > RATE_LIMIT_WINDOW_MS) {
    requestLog.set(ip, { windowStart: now, count: 1 });
    return false;
  }

  current.count += 1;
  requestLog.set(ip, current);

  return current.count > RATE_LIMIT_MAX_REQUESTS;
}

async function sendLeadWebhook(email, ip) {
  const webhookUrl = process.env.BONUS_LEAD_WEBHOOK_URL;
  if (!webhookUrl) return;

  try {
    await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email,
        ip,
        source: "landing-bonus",
        ts: new Date().toISOString()
      })
    });
  } catch (error) {
    // Falha no webhook nao deve bloquear a entrega do bonus.
  }
}

function getSecret() {
  return process.env.BONUS_TOKEN_SECRET || "change-me-in-vercel-env";
}

function signPayload(payload) {
  return crypto
    .createHmac("sha256", getSecret())
    .update(payload)
    .digest("hex");
}

function createDownloadToken(email, ip) {
  const exp = Math.floor(Date.now() / 1000) + signedUrlTtlSeconds;
  const body = JSON.stringify({ email, exp, ip });
  const payload = Buffer.from(body, "utf8").toString("base64url");
  const signature = signPayload(payload);
  return payload + "." + signature;
}

module.exports = async (req, res) => {
  if (req.method !== "POST") {
    return json(res, 405, { error: "Method not allowed" });
  }

  const ip = getClientIp(req);
  if (isRateLimited(ip)) {
    return json(res, 429, { error: "Too many requests. Try again in a few minutes." });
  }

  let body = req.body || {};
  if (typeof body === "string") {
    try {
      body = JSON.parse(body);
    } catch (error) {
      return json(res, 400, { error: "Invalid request body" });
    }
  }

  const email = String(body.email || "").trim().toLowerCase();
  const company = String(body.company || "").trim();

  if (company) {
    return json(res, 200, { ok: true });
  }

  if (!isValidEmail(email)) {
    return json(res, 400, { error: "Enter a valid email address" });
  }

  try {
    const token = createDownloadToken(email, ip);
    const downloadUrl = "/api/bonus-file?token=" + encodeURIComponent(token);

    await sendLeadWebhook(email, ip);

    return json(res, 200, {
      ok: true,
      downloadUrl,
      expiresIn: signedUrlTtlSeconds
    });
  } catch (error) {
    return json(res, 500, { error: "Could not generate secure download link" });
  }
};
