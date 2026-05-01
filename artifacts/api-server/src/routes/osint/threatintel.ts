import dns from "dns/promises";
import type { ThreatIntelResult, PassiveDnsEntry } from "./types.js";

interface OtxIndicator {
  pulse_info?: {
    count: number;
    pulses: Array<{
      name: string;
      tags: string[];
      malware_families: Array<{ display_name: string }>;
    }>;
  };
  sections?: string[];
}

interface OtxPassiveDnsEntry {
  hostname: string;
  address: string;
  first: string;
  last: string;
}

export async function getThreatIntel(target: string): Promise<ThreatIntelResult> {
  const cleanTarget = target.replace(/^https?:\/\//, "").split("/")[0].split(":")[0];
  const isIp = /^(\d{1,3}\.){3}\d{1,3}$/.test(cleanTarget);
  const indicatorType = isIp ? "IPv4" : "domain";

  const result: ThreatIntelResult = {};

  // AlienVault OTX — free, no key needed for public data
  try {
    const [generalRes, passiveDnsRes] = await Promise.allSettled([
      fetch(
        `https://otx.alienvault.com/api/v1/indicators/${indicatorType}/${encodeURIComponent(cleanTarget)}/general`,
        {
          headers: { "User-Agent": "OSINTPlatform/1.0" },
          signal: AbortSignal.timeout(10000),
        }
      ),
      fetch(
        `https://otx.alienvault.com/api/v1/indicators/${indicatorType}/${encodeURIComponent(cleanTarget)}/passive_dns`,
        {
          headers: { "User-Agent": "OSINTPlatform/1.0" },
          signal: AbortSignal.timeout(10000),
        }
      ),
    ]);

    if (generalRes.status === "fulfilled" && generalRes.value.ok) {
      const general = await generalRes.value.json() as OtxIndicator;
      const pulseInfo = general.pulse_info;

      if (pulseInfo) {
        result.pulseCount = pulseInfo.count;

        const tags = new Set<string>();
        const malwareFamilies = new Set<string>();

        for (const pulse of pulseInfo.pulses.slice(0, 10)) {
          for (const tag of pulse.tags || []) tags.add(tag);
          for (const mf of pulse.malware_families || []) {
            malwareFamilies.add(mf.display_name);
          }
        }

        result.tags = [...tags].slice(0, 20);
        result.malwareFamilies = [...malwareFamilies];
        result.maliciousCount = pulseInfo.count > 0 ? pulseInfo.count : 0;
        result.riskScore = Math.min(100, pulseInfo.count * 10);
      }
    }

    if (passiveDnsRes.status === "fulfilled" && passiveDnsRes.value.ok) {
      const pdns = await passiveDnsRes.value.json() as { passive_dns?: OtxPassiveDnsEntry[] };
      if (pdns.passive_dns) {
        result.passiveDns = pdns.passive_dns.slice(0, 20).map(entry => ({
          hostname: entry.hostname,
          ip: entry.address,
          first: entry.first,
          last: entry.last,
        }));
      }
    }
  } catch {
    // OTX unavailable
  }

  // Get IP geolocation reputation via ip-api
  if (isIp) {
    try {
      const res = await fetch(
        `http://ip-api.com/json/${cleanTarget}?fields=status,country,regionName,city,isp,org,as,mobile,proxy,hosting`,
        { signal: AbortSignal.timeout(6000) }
      );
      if (res.ok) {
        const data = await res.json() as Record<string, unknown>;
        if (data.status === "success") {
          const flags: string[] = [];
          if (data.proxy) flags.push("proxy");
          if (data.hosting) flags.push("datacenter/hosting");
          if (data.mobile) flags.push("mobile-network");

          if (!result.tags) result.tags = [];
          result.tags.push(...flags);
          if (!result.riskScore && (data.proxy || data.hosting)) {
            result.riskScore = data.proxy ? 60 : 30;
          }
        }
      }
    } catch {
      // ip-api unavailable
    }
  }

  return result;
}
