import type { SslCertificate } from "./types.js";

interface CrtShEntry {
  id: number;
  logged_at: string;
  not_before: string;
  not_after: string;
  common_name: string;
  matching_identities: string;
  issuer_name: string;
  serial_number: string;
}

export async function analyzeSsl(domain: string): Promise<SslCertificate> {
  const cleanDomain = domain.replace(/^https?:\/\//, "").split("/")[0].split(":")[0];

  // Use crt.sh to get certificate data
  try {
    const res = await fetch(
      `https://crt.sh/?q=${encodeURIComponent(cleanDomain)}&output=json`,
      { signal: AbortSignal.timeout(12000) }
    );

    if (res.ok) {
      const certs = await res.json() as CrtShEntry[];

      if (!certs || certs.length === 0) {
        return { issues: ["No SSL certificate found in certificate transparency logs"] };
      }

      // Find the most recent certificate
      const sorted = certs.sort((a, b) =>
        new Date(b.not_before).getTime() - new Date(a.not_before).getTime()
      );

      const latest = sorted[0];
      const now = new Date();
      const validTo = new Date(latest.not_after);
      const validFrom = new Date(latest.not_before);
      const daysRemaining = Math.floor((validTo.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      const isExpired = daysRemaining < 0;

      // Extract SANs from all certs for this domain
      const sans = new Set<string>();
      for (const cert of sorted.slice(0, 10)) {
        const identities = cert.matching_identities || cert.common_name || "";
        for (const id of identities.split(/[\n,]/)) {
          const san = id.trim().toLowerCase().replace(/^\*\./, "");
          if (san) sans.add(san);
        }
      }

      // Determine grade based on days remaining and other factors
      let grade = "A";
      const issues: string[] = [];

      if (isExpired) {
        grade = "F";
        issues.push("Certificate is expired");
      } else if (daysRemaining < 14) {
        grade = "C";
        issues.push(`Certificate expires in ${daysRemaining} days — renew immediately`);
      } else if (daysRemaining < 30) {
        grade = "B";
        issues.push(`Certificate expires in ${daysRemaining} days`);
      }

      // Check issuer for known weak CAs
      const issuer = latest.issuer_name || "";
      if (issuer.toLowerCase().includes("let's encrypt")) {
        // Let's Encrypt is fine, no issue
      }

      return {
        subject: latest.common_name,
        issuer: issuer,
        validFrom: validFrom.toISOString(),
        validTo: validTo.toISOString(),
        isExpired,
        daysRemaining,
        sans: [...sans].slice(0, 50),
        serialNumber: latest.serial_number,
        grade,
        issues,
      };
    }
  } catch {
    // fall through
  }

  return { issues: ["Could not retrieve SSL certificate information"] };
}
