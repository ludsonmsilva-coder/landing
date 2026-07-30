const crypto = require("crypto");
const fs = require("fs");
const path = require("path");

function json(res, statusCode, body) {
  res.status(statusCode).setHeader("Content-Type", "application/json");
  res.send(JSON.stringify(body));
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

function safeCompare(a, b) {
  const aBuf = Buffer.from(a, "utf8");
  const bBuf = Buffer.from(b, "utf8");
  if (aBuf.length !== bBuf.length) return false;
  return crypto.timingSafeEqual(aBuf, bBuf);
}

module.exports = async (req, res) => {
  if (req.method !== "GET") {
    return json(res, 405, { error: "Method not allowed" });
  }

  const token = String(req.query.token || "");
  if (!token || token.indexOf(".") === -1) {
    return json(res, 401, { error: "Invalid token" });
  }

  const parts = token.split(".");
  if (parts.length !== 2) {
    return json(res, 401, { error: "Invalid token" });
  }

  const payload = parts[0];
  const signature = parts[1];
  const expectedSignature = signPayload(payload);

  if (!safeCompare(signature, expectedSignature)) {
    return json(res, 401, { error: "Invalid signature" });
  }

  let parsed;
  try {
    const raw = Buffer.from(payload, "base64url").toString("utf8");
    parsed = JSON.parse(raw);
  } catch (error) {
    return json(res, 401, { error: "Invalid payload" });
  }

  const now = Math.floor(Date.now() / 1000);
  if (!parsed.exp || now > Number(parsed.exp)) {
    return json(res, 401, { error: "Token expired" });
  }

  const filePath = path.join(process.cwd(), "secure", "Arte_de_Hablar_con_IA.zip");

  if (!fs.existsSync(filePath)) {
    return json(res, 500, { error: "Bonus file not available" });
  }

  res.setHeader("Content-Type", "application/zip");
  res.setHeader("Content-Disposition", 'attachment; filename="Arte_de_Hablar_con_IA.zip"');
  res.setHeader("Cache-Control", "private, no-store, max-age=0");

  const fileStream = fs.createReadStream(filePath);
  fileStream.on("error", () => {
    if (!res.headersSent) {
      json(res, 500, { error: "Could not read bonus file" });
    } else {
      res.end();
    }
  });

  fileStream.pipe(res);
};
