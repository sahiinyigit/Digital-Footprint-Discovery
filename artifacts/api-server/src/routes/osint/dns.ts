import dns from "dns/promises";
import type { DnsRecord } from "./types.js";

export async function lookupDns(domain: string): Promise<DnsRecord[]> {
  const records: DnsRecord[] = [];
  const cleanDomain = domain.replace(/^https?:\/\//, "").split("/")[0].split(":")[0];

  const recordTypes: Array<"A" | "AAAA" | "MX" | "TXT" | "NS" | "CNAME" | "SOA"> = [
    "A", "AAAA", "MX", "TXT", "NS", "CNAME", "SOA"
  ];

  await Promise.allSettled(
    recordTypes.map(async (type) => {
      try {
        if (type === "A") {
          const addrs = await dns.resolve4(cleanDomain);
          for (const addr of addrs) {
            records.push({ type: "A", value: addr });
          }
        } else if (type === "AAAA") {
          const addrs = await dns.resolve6(cleanDomain);
          for (const addr of addrs) {
            records.push({ type: "AAAA", value: addr });
          }
        } else if (type === "MX") {
          const mxRecords = await dns.resolveMx(cleanDomain);
          for (const mx of mxRecords) {
            records.push({ type: "MX", value: `${mx.priority} ${mx.exchange}` });
          }
        } else if (type === "TXT") {
          const txtRecords = await dns.resolveTxt(cleanDomain);
          for (const txt of txtRecords) {
            records.push({ type: "TXT", value: txt.join(" ") });
          }
        } else if (type === "NS") {
          const nsRecords = await dns.resolveNs(cleanDomain);
          for (const ns of nsRecords) {
            records.push({ type: "NS", value: ns });
          }
        } else if (type === "CNAME") {
          const cnames = await dns.resolveCname(cleanDomain);
          for (const cname of cnames) {
            records.push({ type: "CNAME", value: cname });
          }
        } else if (type === "SOA") {
          const soa = await dns.resolveSoa(cleanDomain);
          records.push({ type: "SOA", value: `${soa.nsname} ${soa.hostmaster} ${soa.serial}` });
        }
      } catch {
        // Record type not available, skip
      }
    })
  );

  return records;
}
