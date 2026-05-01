import dns from "dns/promises";
import type { SubdomainResult } from "./types.js";

const COMMON_PREFIXES = [
  "www", "mail", "ftp", "smtp", "pop", "imap", "webmail", "vpn", "remote",
  "api", "app", "admin", "portal", "secure", "login", "auth", "sso",
  "intranet", "extranet", "dev", "staging", "test", "beta", "demo", "uat",
  "cdn", "static", "assets", "media", "images", "video", "files",
  "shop", "store", "ecommerce", "payment", "checkout",
  "mobile", "m", "wap", "app2",
  "docs", "wiki", "help", "support", "kb", "faq",
  "blog", "news", "forum", "community", "social",
  "mx", "mx1", "mx2", "smtp1", "smtp2", "mail2",
  "ns", "ns1", "ns2", "dns", "dns1", "dns2",
  "git", "gitlab", "github", "jira", "confluence", "jenkins",
  "monitor", "status", "health", "ping", "uptime",
  "vpn1", "vpn2", "proxy", "gateway", "firewall",
  "crm", "erp", "hr", "finance", "accounting", "intra",
  "webmail2", "owa", "exchange", "autodiscover",
  "cloud", "aws", "azure", "gcp", "k8s", "docker",
  "db", "mysql", "postgres", "redis", "mongo",
  "download", "update", "backup", "archive",
  "old", "new", "v1", "v2", "legacy",
  "internal", "private", "corp", "office",
  "cpanel", "plesk", "whm", "direct",
];

async function resolveSubdomain(sub: string): Promise<{ ip: string | undefined }> {
  try {
    const ips = await dns.resolve4(sub);
    return { ip: ips[0] };
  } catch {
    try {
      const ips = await dns.resolve6(sub);
      return { ip: ips[0] };
    } catch {
      return { ip: undefined };
    }
  }
}

export async function findSubdomains(domain: string): Promise<SubdomainResult[]> {
  const cleanDomain = domain.replace(/^https?:\/\//, "").split("/")[0].split(":")[0].toLowerCase();
  const results: SubdomainResult[] = [];
  const seen = new Set<string>();

  const addResult = (subdomain: string, ip: string | undefined, source: string) => {
    if (!seen.has(subdomain)) {
      seen.add(subdomain);
      results.push({ subdomain, ip, source });
    }
  };

  // 1. crt.sh — certificate transparency
  try {
    const res = await fetch(
      `https://crt.sh/?q=%25.${encodeURIComponent(cleanDomain)}&output=json`,
      { signal: AbortSignal.timeout(12000) }
    );
    if (res.ok) {
      const certs = await res.json() as Array<{ name_value: string }>;
      const fromCrt = new Set<string>();
      for (const cert of certs) {
        for (const name of cert.name_value.split("\n")) {
          const clean = name.trim().toLowerCase().replace(/^\*\./, "");
          if (clean.endsWith(`.${cleanDomain}`) && clean !== cleanDomain) {
            fromCrt.add(clean);
          }
        }
      }
      // Resolve first 30 from crt.sh
      await Promise.allSettled(
        [...fromCrt].slice(0, 30).map(async (sub) => {
          const { ip } = await resolveSubdomain(sub);
          addResult(sub, ip, "crt.sh");
        })
      );
    }
  } catch {
    // crt.sh unavailable
  }

  // 2. AlienVault OTX — passive DNS
  try {
    const res = await fetch(
      `https://otx.alienvault.com/api/v1/indicators/domain/${encodeURIComponent(cleanDomain)}/passive_dns`,
      {
        headers: { "User-Agent": "OSINTPlatform/1.0" },
        signal: AbortSignal.timeout(10000),
      }
    );
    if (res.ok) {
      const data = await res.json() as { passive_dns?: Array<{ hostname: string; address?: string }> };
      for (const entry of data.passive_dns?.slice(0, 30) || []) {
        const sub = entry.hostname.toLowerCase();
        if (sub.endsWith(`.${cleanDomain}`) && !seen.has(sub)) {
          addResult(sub, entry.address, "AlienVault OTX");
        }
      }
    }
  } catch {
    // OTX unavailable
  }

  // 3. HackerTarget subdomain finder (free)
  try {
    const res = await fetch(
      `https://api.hackertarget.com/hostsearch/?q=${encodeURIComponent(cleanDomain)}`,
      { signal: AbortSignal.timeout(10000) }
    );
    if (res.ok) {
      const text = await res.text();
      for (const line of text.split("\n")) {
        const parts = line.split(",");
        if (parts.length >= 2) {
          const sub = parts[0].trim().toLowerCase();
          const ip = parts[1].trim();
          if (sub.endsWith(`.${cleanDomain}`) || sub === cleanDomain) {
            addResult(sub, ip || undefined, "HackerTarget");
          }
        }
      }
    }
  } catch {
    // HackerTarget unavailable
  }

  // 4. Brute-force common prefixes (parallel)
  await Promise.allSettled(
    COMMON_PREFIXES.filter(p => !seen.has(`${p}.${cleanDomain}`)).map(async (prefix) => {
      const sub = `${prefix}.${cleanDomain}`;
      if (seen.has(sub)) return;
      const { ip } = await resolveSubdomain(sub);
      if (ip) addResult(sub, ip, "brute-force");
    })
  );

  return results.sort((a, b) => a.subdomain.localeCompare(b.subdomain));
}
