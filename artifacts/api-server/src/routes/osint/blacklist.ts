import dns from "dns/promises";
import type { BlacklistResult } from "./types.js";

const DNSBL_LISTS = [
  "zen.spamhaus.org",
  "bl.spamcop.net",
  "dnsbl.sorbs.net",
  "b.barracudacentral.org",
  "dnsbl-1.uceprotect.net",
  "pbl.spamhaus.org",
  "sbl.spamhaus.org",
  "xbl.spamhaus.org",
  "cbl.abuseat.org",
  "dnsbl.dronebl.org",
  "spam.dnsbl.sorbs.net",
  "http.dnsbl.sorbs.net",
  "socks.dnsbl.sorbs.net",
];

function reverseIp(ip: string): string {
  return ip.split(".").reverse().join(".");
}

async function resolveIpForDomain(domain: string): Promise<string | null> {
  try {
    const ips = await dns.resolve4(domain);
    return ips[0] || null;
  } catch {
    return null;
  }
}

async function checkDnsbl(reversedIp: string, list: string): Promise<boolean> {
  try {
    await dns.resolve4(`${reversedIp}.${list}`);
    return true;
  } catch {
    return false;
  }
}

export async function checkBlacklist(target: string): Promise<BlacklistResult> {
  const cleanTarget = target.replace(/^https?:\/\//, "").split("/")[0].split(":")[0];
  const isIp = /^(\d{1,3}\.){3}\d{1,3}$/.test(cleanTarget);

  let ip: string | null = isIp ? cleanTarget : await resolveIpForDomain(cleanTarget);

  if (!ip) {
    return {
      listed: false,
      listCount: 0,
      lists: [],
      details: "Could not resolve IP for blacklist check",
    };
  }

  const reversedIp = reverseIp(ip);
  const listedOn: string[] = [];

  await Promise.allSettled(
    DNSBL_LISTS.map(async (list) => {
      const found = await checkDnsbl(reversedIp, list);
      if (found) listedOn.push(list);
    })
  );

  return {
    listed: listedOn.length > 0,
    listCount: listedOn.length,
    lists: listedOn,
    details: listedOn.length > 0
      ? `IP ${ip} is listed on ${listedOn.length} blacklist(s)`
      : `IP ${ip} is clean (checked ${DNSBL_LISTS.length} lists)`,
  };
}
