"use strict";

const { onRequest } = require("firebase-functions/v2/https");
const fs = require("fs");
const path = require("path");

// ── Supabase config (anon key — same as what the browser bundle uses) ──
const SUPABASE_URL = process.env.SUPABASE_URL || "https://dvvecaqvdyjeoiloqlua.supabase.co";
const SUPABASE_KEY = process.env.SUPABASE_KEY || "";

// ── Known social/link-preview crawlers ──────────────────────────────────
const CRAWLER_PATTERNS = [
  "whatsapp",
  "facebookexternalhit",
  "facebookcatalog",
  "twitterbot",
  "linkedinbot",
  "telegrambot",
  "slackbot",
  "discordbot",
  "googlebot",
  "bingbot",
  "applebot",
  "imessagebot",
  "yandexbot",
  "ia_archiver",
  "embedly",
  "outbrain",
  "pinterest",
  "vkshare",
];

function isCrawler(userAgent = "") {
  const ua = userAgent.toLowerCase();
  return CRAWLER_PATTERNS.some((p) => ua.includes(p));
}

// ── Fetch campaign OG metadata from Supabase REST API ───────────────────
async function fetchOgMeta(slug) {
  const headers = {
    apikey: SUPABASE_KEY,
    Authorization: `Bearer ${SUPABASE_KEY}`,
    "Content-Type": "application/json",
  };

  try {
    // 1. Resolve campaign id + basic fields by slug
    const campRes = await fetch(
      `${SUPABASE_URL}/rest/v1/campaigns?slug=eq.${encodeURIComponent(slug)}&select=id,name,logo_url&limit=1`,
      { headers }
    );
    const camps = await campRes.json();
    if (!Array.isArray(camps) || !camps.length) return null;

    const { id: campaignId, name: campaignName, logo_url: campaignLogo } = camps[0];

    // 2. Resolve richer display fields from app_settings
    const settRes = await fetch(
      `${SUPABASE_URL}/rest/v1/app_settings?campaign_id=eq.${campaignId}&select=competition_name,school_name,logo_url&limit=1`,
      { headers }
    );
    const settings = await settRes.json();
    const s = Array.isArray(settings) ? settings[0] : null;

    return {
      title: s?.competition_name || campaignName || "תחרות מצמיחה",
      school: s?.school_name || "",
      logo: s?.logo_url || campaignLogo || "",
    };
  } catch {
    return null;
  }
}

// ── Build the OG-tags HTML shell ─────────────────────────────────────────
function buildOgHtml({ title, school, logo, pageUrl }) {
  const fullTitle = `${title} - תחרות מצמיחה 🌱`;
  const description = school
    ? `${school} — הצטרף לתחרות!`
    : "הצטרף לתחרות!";
  const imageTag = logo
    ? `\n  <meta property="og:image" content="${logo}" />\n  <meta name="twitter:image" content="${logo}" />`
    : "";

  // The page redirects regular browsers instantly; crawlers read the OG tags.
  return `<!DOCTYPE html>
<html lang="he" dir="rtl">
<head>
  <meta charset="UTF-8" />
  <title>${fullTitle}</title>

  <!-- Open Graph -->
  <meta property="og:type"        content="website" />
  <meta property="og:url"         content="${pageUrl}" />
  <meta property="og:title"       content="${fullTitle}" />
  <meta property="og:description" content="${description}" />
  <meta property="og:locale"      content="he_IL" />${imageTag}

  <!-- Twitter / X -->
  <meta name="twitter:card"        content="summary_large_image" />
  <meta name="twitter:title"       content="${fullTitle}" />
  <meta name="twitter:description" content="${description}" />

  <!-- Instant redirect for real browsers -->
  <meta http-equiv="refresh" content="0; url=${pageUrl}" />
</head>
<body>
  <script>window.location.replace("${pageUrl}");</script>
</body>
</html>`;
}

// ── Serve the SPA shell (dist/index.html copied here during build) ───────
function serveSpa(res) {
  try {
    const html = fs.readFileSync(
      path.join(__dirname, "public", "index.html"),
      "utf-8"
    );
    res.set("Content-Type", "text/html; charset=utf-8");
    res.set("Cache-Control", "no-cache, no-store, must-revalidate");
    res.send(html);
  } catch {
    // Fallback: redirect to root (hosting will serve index.html)
    res.redirect(302, "/");
  }
}

// ── Cloud Function ────────────────────────────────────────────────────────
exports.ogMeta = onRequest(
  { region: "us-central1", timeoutSeconds: 10, memory: "128MiB" },
  async (req, res) => {
    // Extract slug from path: /comp/:slug  /admin/:slug  /vote/:slug  /login/:slug
    const match = req.path.match(/^\/(?:comp|admin|vote|login)\/([^/?#]+)/);
    const slug = match?.[1];

    // Not a slug route — serve SPA normally
    if (!slug) {
      serveSpa(res);
      return;
    }

    const userAgent = req.headers["user-agent"] || "";

    // Regular browser — serve the SPA
    if (!isCrawler(userAgent)) {
      serveSpa(res);
      return;
    }

    // Social crawler — build and return OG HTML
    const protocol = req.headers["x-forwarded-proto"] || "https";
    const host = req.headers.host || req.hostname;
    const pageUrl = `${protocol}://${host}${req.path}`;

    const meta = await fetchOgMeta(slug);
    const html = buildOgHtml({
      title: meta?.title ?? "תחרות מצמיחה",
      school: meta?.school ?? "",
      logo: meta?.logo ?? "",
      pageUrl,
    });

    res.set("Content-Type", "text/html; charset=utf-8");
    // Short cache — competition data can change
    res.set("Cache-Control", "public, max-age=300, s-maxage=300");
    res.send(html);
  }
);
