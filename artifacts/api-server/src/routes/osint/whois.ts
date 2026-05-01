import type { WhoisData } from "./types.js";
import { createRequire } from "module";

const require = createRequire(import.meta.url);

function parseWhoisText(raw: string): WhoisData {
  const get = (...keys: string[]): string | undefined => {
    for (const key of keys) {
      const rx = new RegExp(`^${key}[\\s:]+(.+)`, "mi");
      const m = rx.exec(raw);
      if (m) return m[1].trim();
    }
    return undefined;
  };

  const getAll = (...keys: string[]): string[] => {
    const results: string[] = [];
    for (const key of keys) {
      const rx = new RegExp(`^${key}[\\s:]+(.+)`, "gmi");
      let m;
      while ((m = rx.exec(raw)) !== null) {
        const v = m[1].trim();
        if (v && !results.includes(v)) results.push(v);
      }
    }
    return results;
  };

  const emailRx = /[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/g;
  const emails = [...new Set(raw.match(emailRx) || [])];

  return {
    registrar: get("Registrar", "registrar", "Sponsoring Registrar", "Registrar Name"),
    registrantOrg: get("Registrant Organization", "Registrant Org", "org-name", "Organization", "owner"),
    registrantCountry: get("Registrant Country", "Registrant Country/Economy", "country"),
    registrantName: get("Registrant Name", "Registrant", "owner"),
    registrantEmail: get("Registrant Email", "Admin Email"),
    registrantPhone: get("Registrant Phone", "phone"),
    createdDate: get("Creation Date", "Created On", "created", "Domain Registration Date", "Registered Date", "registered"),
    expiresDate: get("Registry Expiry Date", "Registrar Registration Expiration Date", "expires", "Expiry Date", "Expiration Date", "paid-till"),
    updatedDate: get("Updated Date", "Last Modified", "changed", "last-modified"),
    nameServers: getAll("Name Server", "nserver"),
    status: getAll("Domain Status", "status"),
    emails,
    rawText: raw.substring(0, 3000),
  };
}

export async function lookupWhois(target: string): Promise<WhoisData> {
  const cleanTarget = target.replace(/^https?:\/\//, "").split("/")[0].split(":")[0].toLowerCase();

  // Try node-whois package (handles all TLDs via proper WHOIS servers)
  try {
    const whoisLib = require("whois");
    const raw: string = await new Promise((resolve, reject) => {
      whoisLib.lookup(cleanTarget, { timeout: 12000, follow: 3 }, (err: Error | null, data: string) => {
        if (err) reject(err);
        else resolve(data || "");
      });
    });
    if (raw && raw.length > 50) {
      return parseWhoisText(raw);
    }
  } catch {
    // fall through
  }

  // Fallback: RDAP via IANA bootstrap
  try {
    const bootstrapRes = await fetch("https://data.iana.org/rdap/dns.json", {
      signal: AbortSignal.timeout(6000),
    });
    if (bootstrapRes.ok) {
      const bootstrap = await bootstrapRes.json() as { services: [string[], string[]][] };
      const tld = cleanTarget.split(".").slice(-1)[0];

      let rdapBase: string | null = null;
      for (const [tlds, servers] of bootstrap.services) {
        if (tlds.includes(tld) && servers.length > 0) {
          rdapBase = servers[0];
          break;
        }
      }

      if (rdapBase) {
        const rdapUrl = `${rdapBase}domain/${cleanTarget}`;
        const rdapRes = await fetch(rdapUrl, { signal: AbortSignal.timeout(8000) });
        if (rdapRes.ok) {
          const json = await rdapRes.json() as Record<string, unknown>;
          const data: WhoisData = {};

          if (Array.isArray(json.entities)) {
            for (const entity of json.entities as Record<string, unknown>[]) {
              const roles = entity.roles as string[] | undefined;
              const vcardArray = entity.vcardArray as unknown[][] | undefined;
              const vcard = vcardArray?.[1] as unknown[][] | undefined;

              if (vcard) {
                for (const field of vcard) {
                  if (!Array.isArray(field)) continue;
                  if (field[0] === "fn" && roles?.includes("registrar")) data.registrar = String(field[3]);
                  if (field[0] === "fn" && roles?.includes("registrant")) data.registrantName = String(field[3]);
                  if (field[0] === "org") data.registrantOrg = String(field[3]);
                  if (field[0] === "adr") {
                    const adr = field[3] as Record<string, string> | undefined;
                    if (adr?.["country-name"]) data.registrantCountry = adr["country-name"];
                  }
                  if (field[0] === "email") data.registrantEmail = String(field[3]);
                }
              }
            }
          }

          if (Array.isArray(json.events)) {
            for (const ev of json.events as Record<string, string>[]) {
              if (ev.eventAction === "registration") data.createdDate = ev.eventDate;
              if (ev.eventAction === "expiration") data.expiresDate = ev.eventDate;
              if (ev.eventAction === "last changed") data.updatedDate = ev.eventDate;
            }
          }

          if (Array.isArray(json.nameservers)) {
            data.nameServers = (json.nameservers as Record<string, string>[]).map(ns => ns.ldhName || ns.unicodeName || "").filter(Boolean);
          }

          if (Array.isArray(json.status)) data.status = json.status as string[];

          return data;
        }
      }
    }
  } catch {
    // fall through
  }

  // Last resort: ipwhois.io for IP-based info
  try {
    const res = await fetch(`https://ipwho.is/${cleanTarget}`, { signal: AbortSignal.timeout(6000) });
    if (res.ok) {
      const json = await res.json() as Record<string, unknown>;
      if (json.success) {
        return {
          registrantOrg: String(json.org || json.company || ""),
          registrantCountry: String(json.country || ""),
          registrantName: String(json.org || ""),
        };
      }
    }
  } catch {
    // nothing
  }

  return {};
}
