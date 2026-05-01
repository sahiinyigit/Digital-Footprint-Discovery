import type { SecurityHeadersResult, SecurityHeader } from "./types.js";

const SECURITY_HEADERS: Array<{
  name: string;
  required: boolean;
  severity: SecurityHeader["severity"];
  description: string;
}> = [
  {
    name: "Strict-Transport-Security",
    required: true,
    severity: "critical",
    description: "Forces HTTPS connections, preventing man-in-the-middle attacks",
  },
  {
    name: "Content-Security-Policy",
    required: true,
    severity: "critical",
    description: "Prevents XSS attacks by whitelisting content sources",
  },
  {
    name: "X-Frame-Options",
    required: true,
    severity: "warning",
    description: "Prevents clickjacking attacks by restricting iframe embedding",
  },
  {
    name: "X-Content-Type-Options",
    required: true,
    severity: "warning",
    description: "Prevents MIME-type sniffing attacks",
  },
  {
    name: "Referrer-Policy",
    required: false,
    severity: "info",
    description: "Controls how much referrer info is sent with requests",
  },
  {
    name: "Permissions-Policy",
    required: false,
    severity: "info",
    description: "Controls access to browser features like camera and geolocation",
  },
  {
    name: "X-XSS-Protection",
    required: false,
    severity: "warning",
    description: "Legacy XSS filter for older browsers (deprecated in modern browsers)",
  },
  {
    name: "Cross-Origin-Opener-Policy",
    required: false,
    severity: "info",
    description: "Isolates browsing context to prevent cross-origin attacks",
  },
  {
    name: "Cross-Origin-Embedder-Policy",
    required: false,
    severity: "info",
    description: "Prevents cross-origin resources from being embedded without permission",
  },
  {
    name: "Cross-Origin-Resource-Policy",
    required: false,
    severity: "info",
    description: "Prevents other origins from reading responses",
  },
];

function calculateGrade(score: number): string {
  if (score >= 90) return "A+";
  if (score >= 80) return "A";
  if (score >= 70) return "B";
  if (score >= 60) return "C";
  if (score >= 50) return "D";
  return "F";
}

export async function analyzeSecurityHeaders(domain: string): Promise<SecurityHeadersResult> {
  const cleanDomain = domain.replace(/^https?:\/\//, "").split("/")[0].split(":")[0];

  let finalUrl = `https://${cleanDomain}`;
  let redirectsToHttps = false;

  // First try HTTPS
  let res: Response | null = null;
  try {
    res = await fetch(finalUrl, {
      method: "HEAD",
      redirect: "follow",
      signal: AbortSignal.timeout(12000),
      headers: { "User-Agent": "Mozilla/5.0 (compatible; SecurityScanner/1.0)" },
    });
    finalUrl = res.url;
    redirectsToHttps = res.url.startsWith("https://");
  } catch {
    // Try HTTP
    try {
      res = await fetch(`http://${cleanDomain}`, {
        method: "HEAD",
        redirect: "follow",
        signal: AbortSignal.timeout(10000),
        headers: { "User-Agent": "Mozilla/5.0 (compatible; SecurityScanner/1.0)" },
      });
      finalUrl = res.url;
      redirectsToHttps = res.url.startsWith("https://");
    } catch {
      return { headers: [], grade: "N/A", score: 0, redirectsToHttps: false };
    }
  }

  const headers: SecurityHeader[] = [];
  let totalScore = 0;
  const maxScore = 100;

  const criticalHeaders = SECURITY_HEADERS.filter(h => h.severity === "critical");
  const warningHeaders = SECURITY_HEADERS.filter(h => h.severity === "warning");
  const infoHeaders = SECURITY_HEADERS.filter(h => h.severity === "info");

  const pointsPerCritical = 25;
  const pointsPerWarning = 10;

  for (const headerDef of SECURITY_HEADERS) {
    const value = res.headers.get(headerDef.name);
    const present = value !== null;

    headers.push({
      name: headerDef.name,
      present,
      value: value || undefined,
      severity: present ? "ok" : headerDef.severity,
      description: headerDef.description,
    });

    if (present) {
      if (headerDef.severity === "critical") totalScore += pointsPerCritical;
      else if (headerDef.severity === "warning") totalScore += pointsPerWarning;
    }
  }

  // Bonus for HTTPS redirect
  if (redirectsToHttps) totalScore = Math.min(totalScore, maxScore);

  const serverInfo = res.headers.get("server") || res.headers.get("x-powered-by") || undefined;

  return {
    grade: calculateGrade(totalScore),
    score: Math.min(totalScore, 100),
    headers,
    serverInfo,
    redirectsToHttps,
    finalUrl,
  };
}
