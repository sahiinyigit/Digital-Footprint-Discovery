import dns from "dns/promises";
import type { IpNetblockResult } from "./types.js";

interface RdapIp {
  startAddress?: string;
  endAddress?: string;
  handle?: string;
  name?: string;
  country?: string;
  entities?: Array<{
    roles?: string[];
    vcardArray?: unknown[][];
  }>;
}

export async function getNetblocks(target: string): Promise<IpNetblockResult[]> {
  const cleanTarget = target.replace(/^https?:\/\//, "").split("/")[0].split(":")[0];
  const isIp = /^(\d{1,3}\.){3}\d{1,3}$/.test(cleanTarget);

  const ips: string[] = [];

  if (isIp) {
    ips.push(cleanTarget);
  } else {
    try {
      const aRecords = await dns.resolve4(cleanTarget);
      ips.push(...aRecords.slice(0, 3));
    } catch {
      return [];
    }
  }

  const results: IpNetblockResult[] = [];

  await Promise.allSettled(
    ips.map(async (ip) => {
      try {
        const rdapRes = await fetch(`https://rdap.arin.net/registry/ip/${ip}`, {
          signal: AbortSignal.timeout(10000),
        });

        if (rdapRes.ok) {
          const data = await rdapRes.json() as RdapIp;

          let org = "";
          if (Array.isArray(data.entities)) {
            for (const entity of data.entities) {
              if (entity.roles?.includes("registrant") && Array.isArray(entity.vcardArray)) {
                const vcard = entity.vcardArray[1] as unknown[][];
                if (Array.isArray(vcard)) {
                  for (const field of vcard) {
                    if (Array.isArray(field) && field[0] === "fn") {
                      org = String(field[3]);
                    }
                  }
                }
              }
            }
          }

          const startAddr = data.startAddress;
          const endAddr = data.endAddress;
          const cidr = startAddr && endAddr ? `${startAddr}-${endAddr}` : startAddr;

          results.push({
            ip,
            netblock: cidr,
            asn: data.handle,
            asnName: data.name,
            country: data.country,
            org,
          });
        }
      } catch {
        // RDAP lookup failed for this IP
        results.push({ ip });
      }
    })
  );

  return results;
}
