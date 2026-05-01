import type { EmailResult, EmailStats } from "./types.js";

const HUNTER_API_KEY = process.env.HUNTER_API_KEY;

interface HunterEmail {
  value: string;
  first_name?: string;
  last_name?: string;
  position?: string;
  department?: string;
  confidence?: number;
  sources?: Array<{ uri: string }>;
  linkedin?: string;
}

interface HunterResponse {
  data?: {
    emails?: HunterEmail[];
    pattern?: string;
    organization?: string;
    meta?: {
      results?: number;
      limit?: number;
    };
  };
  errors?: Array<{ details: string }>;
}

export async function findEmails(domain: string): Promise<{ emails: EmailResult[]; stats: EmailStats }> {
  if (!HUNTER_API_KEY) return { emails: [], stats: {} };

  const cleanDomain = domain.replace(/^https?:\/\//, "").split("/")[0].split(":")[0];

  try {
    const url = `https://api.hunter.io/v2/domain-search?domain=${encodeURIComponent(cleanDomain)}&api_key=${HUNTER_API_KEY}&limit=20`;
    const res = await fetch(url, {
      signal: AbortSignal.timeout(12000),
    });

    if (!res.ok) return { emails: [], stats: {} };

    const json = await res.json() as HunterResponse;

    if (json.errors?.length) return { emails: [], stats: {} };

    const rawEmails = json.data?.emails || [];

    const emails: EmailResult[] = rawEmails.map(e => ({
      email: e.value,
      firstName: e.first_name,
      lastName: e.last_name,
      position: e.position,
      department: e.department,
      confidence: e.confidence,
      sources: e.sources?.map(s => s.uri) || [],
      linkedin: e.linkedin,
    }));

    const stats: EmailStats = {
      total: json.data?.meta?.results,
      pattern: json.data?.pattern,
      organization: json.data?.organization,
    };

    return { emails, stats };
  } catch {
    return { emails: [], stats: {} };
  }
}
