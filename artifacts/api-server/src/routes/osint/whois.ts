import type { WhoisData } from "./types.js";

function parseWhoisField(text: string, ...fields: string[]): string | undefined {
  for (const field of fields) {
    const regex = new RegExp(`^${field}:\\s*(.+)`, "mi");
    const match = regex.exec(text);
    if (match) return match[1].trim();
  }
  return undefined;
}

function parseWhoisArray(text: string, ...fields: string[]): string[] {
  const results: string[] = [];
  for (const field of fields) {
    const regex = new RegExp(`^${field}:\\s*(.+)`, "gmi");
    let match;
    while ((match = regex.exec(text)) !== null) {
      const val = match[1].trim();
      if (val && !results.includes(val)) results.push(val);
    }
  }
  return results;
}

export async function lookupWhois(target: string): Promise<WhoisData> {
  const cleanTarget = target.replace(/^https?:\/\//, "").split("/")[0].split(":")[0];

  try {
    const res = await fetch(`https://api.whoisjsonapi.com/v1/${encodeURIComponent(cleanTarget)}`, {
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(10000),
    });

    if (res.ok) {
      const json = await res.json() as Record<string, unknown>;
      const data: WhoisData = {};
      if (json.registrar) data.registrar = String(json.registrar);
      if (json.registrant_organization) data.registrantOrg = String(json.registrant_organization);
      if (json.registrant_country) data.registrantCountry = String(json.registrant_country);
      if (json.creation_date) data.createdDate = String(json.creation_date);
      if (json.expiration_date) data.expiresDate = String(json.expiration_date);
      if (json.updated_date) data.updatedDate = String(json.updated_date);
      if (Array.isArray(json.name_servers)) {
        data.nameServers = json.name_servers.map(String);
      }
      if (Array.isArray(json.status)) {
        data.status = json.status.map(String);
      }
      return data;
    }
  } catch {
    // Fall through to rdap
  }

  try {
    const res = await fetch(`https://rdap.verisign.com/com/v1/domain/${encodeURIComponent(cleanTarget)}`, {
      signal: AbortSignal.timeout(10000),
    });

    if (res.ok) {
      const json = await res.json() as Record<string, unknown>;
      const data: WhoisData = {};

      if (Array.isArray(json.entities)) {
        for (const entity of json.entities as Record<string, unknown>[]) {
          if (Array.isArray(entity.roles) && (entity.roles as string[]).includes("registrar")) {
            const vcardArray = (entity.vcardArray as unknown[][]) || [];
            if (Array.isArray(vcardArray[1])) {
              for (const field of vcardArray[1] as unknown[][]) {
                if (field[0] === "fn") data.registrar = String(field[3]);
              }
            }
          }
        }
      }

      if (Array.isArray(json.events)) {
        for (const event of json.events as Record<string, string>[]) {
          if (event.eventAction === "registration") data.createdDate = event.eventDate;
          if (event.eventAction === "expiration") data.expiresDate = event.eventDate;
          if (event.eventAction === "last changed") data.updatedDate = event.eventDate;
        }
      }

      if (Array.isArray(json.nameservers)) {
        data.nameServers = (json.nameservers as Record<string, string>[]).map(ns => ns.ldhName || "");
      }

      if (Array.isArray(json.status)) {
        data.status = json.status as string[];
      }

      return data;
    }
  } catch {
    // Return empty
  }

  return {};
}
