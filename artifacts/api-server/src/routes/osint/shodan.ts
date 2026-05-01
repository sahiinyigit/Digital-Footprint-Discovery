import dns from "dns/promises";
import type { ShodanHost, ShodanService } from "./types.js";

const SHODAN_API_KEY = process.env.SHODAN_API_KEY;

interface ShodanApiService {
  port: number;
  transport?: string;
  product?: string;
  version?: string;
  banner?: string;
  cpe?: string[];
  data?: string;
}

interface ShodanApiResponse {
  ip_str?: string;
  org?: string;
  isp?: string;
  country_name?: string;
  city?: string;
  os?: string;
  ports?: number[];
  vulns?: string[];
  tags?: string[];
  hostnames?: string[];
  data?: ShodanApiService[];
  asn?: string;
  last_update?: string;
  error?: string;
}

async function shodanLookupIp(ip: string): Promise<ShodanHost | null> {
  if (!SHODAN_API_KEY) return null;

  try {
    const res = await fetch(`https://api.shodan.io/shodan/host/${ip}?key=${SHODAN_API_KEY}`, {
      signal: AbortSignal.timeout(15000),
    });

    if (!res.ok) return null;

    const data = await res.json() as ShodanApiResponse;

    if (data.error) return null;

    const services: ShodanService[] = (data.data || []).map(svc => ({
      port: svc.port,
      transport: svc.transport,
      product: svc.product,
      version: svc.version,
      banner: svc.data?.substring(0, 300),
      cpe: svc.cpe,
    }));

    return {
      ip: data.ip_str,
      org: data.org,
      isp: data.isp,
      country: data.country_name,
      city: data.city,
      os: data.os || undefined,
      ports: data.ports,
      vulns: data.vulns || [],
      tags: data.tags || [],
      hostnames: data.hostnames || [],
      services,
      asn: data.asn,
      lastUpdate: data.last_update,
    };
  } catch {
    return null;
  }
}

export async function shodanScan(target: string): Promise<ShodanHost[]> {
  if (!SHODAN_API_KEY) return [];

  const cleanTarget = target.replace(/^https?:\/\//, "").split("/")[0].split(":")[0];
  const isIp = /^(\d{1,3}\.){3}\d{1,3}$/.test(cleanTarget);

  if (isIp) {
    const result = await shodanLookupIp(cleanTarget);
    return result ? [result] : [];
  }

  try {
    const ips: string[] = [];

    try {
      const aRecords = await dns.resolve4(cleanTarget);
      ips.push(...aRecords.slice(0, 3));
    } catch {
      // No A records
    }

    if (ips.length === 0) return [];

    const results = await Promise.all(ips.map(ip => shodanLookupIp(ip)));
    return results.filter((r): r is ShodanHost => r !== null);
  } catch {
    return [];
  }
}
