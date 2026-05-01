import type { BreachResult } from "./types.js";

interface HibpBreach {
  Name: string;
  Domain: string;
  BreachDate: string;
  AddedDate: string;
  Description: string;
  DataClasses: string[];
  IsVerified: boolean;
  IsFabricated: boolean;
  IsSensitive: boolean;
  PwnCount: number;
  LogoPath: string;
}

export async function checkBreaches(domain: string): Promise<BreachResult[]> {
  const cleanDomain = domain.replace(/^https?:\/\//, "").split("/")[0].split(":")[0];

  try {
    // HaveIBeenPwned public breach list (no auth required for listing all breaches)
    const res = await fetch("https://haveibeenpwned.com/api/v3/breaches", {
      headers: {
        "User-Agent": "OSINTPlatform/1.0",
      },
      signal: AbortSignal.timeout(12000),
    });

    if (res.ok) {
      const breaches = await res.json() as HibpBreach[];

      // Filter breaches that match the domain or its root domain
      const rootDomain = cleanDomain.split(".").slice(-2).join(".");

      const matching = breaches.filter(b => {
        if (!b.Domain) return false;
        return b.Domain.toLowerCase() === cleanDomain.toLowerCase() ||
          b.Domain.toLowerCase() === rootDomain.toLowerCase() ||
          cleanDomain.toLowerCase().endsWith(`.${b.Domain.toLowerCase()}`);
      });

      return matching.map(b => ({
        name: b.Name,
        domain: b.Domain,
        breachDate: b.BreachDate,
        addedDate: b.AddedDate,
        description: b.Description.replace(/<[^>]*>/g, "").substring(0, 400),
        dataClasses: b.DataClasses,
        isVerified: b.IsVerified,
        isFabricated: b.IsFabricated,
        isSensitive: b.IsSensitive,
        pwCount: b.PwnCount,
        logoPath: b.LogoPath,
      }));
    }
  } catch {
    // HIBP unavailable
  }

  return [];
}
