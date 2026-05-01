import dns from "dns/promises";
import type { SubdomainResult } from "./types.js";

const COMMON_PREFIXES = [
  "www", "mail", "ftp", "smtp", "pop", "imap", "webmail", "vpn", "remote",
  "api", "app", "admin", "portal", "secure", "login", "auth", "sso",
  "intranet", "extranet", "dev", "staging", "test", "beta", "demo",
  "cdn", "static", "assets", "media", "images", "video",
  "shop", "store", "ecommerce", "payment",
  "mobile", "m", "wap",
  "docs", "wiki", "help", "support", "kb",
  "blog", "news", "forum", "community",
  "mx", "mx1", "mx2", "smtp1", "smtp2",
  "ns", "ns1", "ns2", "dns", "dns1", "dns2",
  "git", "gitlab", "github", "jira", "confluence",
  "monitor", "status", "health", "ping",
  "vpn1", "vpn2", "proxy", "gateway",
  "crm", "erp", "hr", "finance", "accounting",
  "mail2", "webmail2", "owa", "exchange",
];

export async function findSubdomains(domain: string): Promise<SubdomainResult[]> {
  const cleanDomain = domain.replace(/^https?:\/\//, "").split("/")[0].split(":")[0];
  const results: SubdomainResult[] = [];
  const seen = new Set<string>();

  // Try crt.sh for certificate transparency
  try {
    const res = await fetch(
      `https://crt.sh/?q=%25.${encodeURIComponent(cleanDomain)}&output=json`,
      { signal: AbortSignal.timeout(10000) }
    );

    if (res.ok) {
      const certs = await res.json() as Array<{ name_value: string }>;
      const domains = new Set<string>();

      for (const cert of certs) {
        const names = cert.name_value.split("\n");
        for (const name of names) {
          const clean = name.trim().toLowerCase().replace(/^\*\./, "");
          if (clean.endsWith(`.${cleanDomain}`) && !domains.has(clean)) {
            domains.add(clean);
          }
        }
      }

      // Resolve first 20 from crt.sh
      const toResolve = [...domains].slice(0, 20);
      await Promise.allSettled(
        toResolve.map(async (sub) => {
          if (seen.has(sub)) return;
          seen.add(sub);
          try {
            const ips = await dns.resolve4(sub);
            results.push({ subdomain: sub, ip: ips[0] });
          } catch {
            // Not resolvable
          }
        })
      );
    }
  } catch {
    // crt.sh unavailable
  }

  // Brute-force common prefixes
  const prefixesToTry = COMMON_PREFIXES.filter(
    p => !seen.has(`${p}.${cleanDomain}`)
  );

  await Promise.allSettled(
    prefixesToTry.map(async (prefix) => {
      const sub = `${prefix}.${cleanDomain}`;
      if (seen.has(sub)) return;
      seen.add(sub);
      try {
        const ips = await dns.resolve4(sub);
        results.push({ subdomain: sub, ip: ips[0] });
      } catch {
        // Not resolvable
      }
    })
  );

  return results.sort((a, b) => a.subdomain.localeCompare(b.subdomain));
}
