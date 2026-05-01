import type { TechnologyResult } from "./types.js";

interface WappalyzerResult {
  technologies?: Array<{
    name: string;
    categories: Array<{ name: string }>;
    versions?: string[];
    confidence?: number;
    website?: string;
  }>;
}

export async function detectTechnologies(target: string): Promise<TechnologyResult[]> {
  const cleanTarget = target.replace(/^https?:\/\//, "").split("/")[0].split(":")[0];
  const url = `https://${cleanTarget}`;

  try {
    const apiRes = await fetch(
      `https://api.wappalyzer.com/lookup/v2/?urls=${encodeURIComponent(url)}&denoise=1`,
      {
        headers: { "x-api-key": "wappalyzer_free" },
        signal: AbortSignal.timeout(10000),
      }
    );

    if (apiRes.ok) {
      const data = await apiRes.json() as WappalyzerResult[];
      if (Array.isArray(data) && data[0]?.technologies?.length) {
        return data[0].technologies.map(t => ({
          name: t.name,
          category: t.categories?.[0]?.name,
          version: t.versions?.[0],
          confidence: t.confidence,
          website: t.website,
        }));
      }
    }
  } catch {
    // Fall through to header-based detection
  }

  // Fallback: fetch the page and detect from headers/HTML
  return await detectFromHeaders(url);
}

async function detectFromHeaders(url: string): Promise<TechnologyResult[]> {
  const technologies: TechnologyResult[] = [];

  try {
    const res = await fetch(url, {
      signal: AbortSignal.timeout(10000),
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; OSINTScanner/1.0)",
      },
    });

    const headers = res.headers;
    const html = await res.text().catch(() => "");

    // Server header
    const server = headers.get("server");
    if (server) {
      const [name, version] = server.split("/");
      technologies.push({ name: name.trim(), category: "Web Servers", version: version?.trim() });
    }

    // X-Powered-By
    const poweredBy = headers.get("x-powered-by");
    if (poweredBy) {
      const [name, version] = poweredBy.split("/");
      technologies.push({ name: name.trim(), category: "Programming Languages", version: version?.trim() });
    }

    // Content-Type hints
    const contentType = headers.get("content-type");
    if (contentType?.includes("application/json")) {
      technologies.push({ name: "JSON API", category: "Miscellaneous" });
    }

    // Security headers
    if (headers.get("cf-ray")) {
      technologies.push({ name: "Cloudflare", category: "CDN", website: "https://cloudflare.com" });
    }
    if (headers.get("x-amz-request-id") || headers.get("x-amz-id-2")) {
      technologies.push({ name: "Amazon Web Services", category: "Hosting", website: "https://aws.amazon.com" });
    }
    if (headers.get("x-azure-ref")) {
      technologies.push({ name: "Microsoft Azure", category: "Hosting", website: "https://azure.microsoft.com" });
    }

    // HTML-based detection
    if (html) {
      const patterns: Array<[RegExp, string, string, string?]> = [
        [/wp-content|wp-includes/i, "WordPress", "CMS", "https://wordpress.org"],
        [/drupal/i, "Drupal", "CMS", "https://drupal.org"],
        [/joomla/i, "Joomla", "CMS", "https://joomla.org"],
        [/shopify/i, "Shopify", "Ecommerce", "https://shopify.com"],
        [/woocommerce/i, "WooCommerce", "Ecommerce", "https://woocommerce.com"],
        [/react/i, "React", "JavaScript Frameworks", "https://react.dev"],
        [/angular/i, "Angular", "JavaScript Frameworks", "https://angular.io"],
        [/vue\.js|vuejs/i, "Vue.js", "JavaScript Frameworks", "https://vuejs.org"],
        [/jquery/i, "jQuery", "JavaScript Libraries", "https://jquery.com"],
        [/bootstrap/i, "Bootstrap", "UI Frameworks", "https://getbootstrap.com"],
        [/tailwind/i, "Tailwind CSS", "UI Frameworks", "https://tailwindcss.com"],
        [/google-analytics|gtag|analytics\.js/i, "Google Analytics", "Analytics", "https://analytics.google.com"],
        [/gtm\.js|googletagmanager/i, "Google Tag Manager", "Analytics"],
        [/nginx/i, "Nginx", "Web Servers"],
        [/apache/i, "Apache", "Web Servers"],
      ];

      for (const [regex, name, category, website] of patterns) {
        if (regex.test(html) && !technologies.find(t => t.name === name)) {
          technologies.push({ name, category, website });
        }
      }
    }
  } catch {
    // Could not fetch
  }

  return technologies;
}
