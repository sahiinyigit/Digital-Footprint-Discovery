# OSINT Intelligence Platform

## Overview

A comprehensive OSINT (Open Source Intelligence) platform built as a pnpm workspace monorepo. Users enter a domain or IP address and the app automatically runs 12 intelligence modules:

1. **DNS** — A, MX, CNAME, TXT, NS record enumeration
2. **WHOIS** — Universal WHOIS using node-whois + RDAP fallback
3. **Shodan** — Open ports, services, CVE vulnerabilities, geo-location
4. **Subdomains** — crt.sh + AlienVault OTX + HackerTarget + brute-force
5. **Email Discovery** — Hunter.io API integration
6. **Blacklist** — 13 DNSBL feeds checked
7. **Technologies** — CMS, frameworks, analytics detected from HTTP headers
8. **IP Netblocks** — ASN, CIDR ranges, organization via ipwho.is / rdap
9. **SSL Certificate** — Grade, expiry, SANs, signature algorithm, issues
10. **HTTP Security Headers** — Graded analysis of security posture
11. **Breach Detection** — HaveIBeenPwned domain breach lookup
12. **Threat Intel** — AlienVault OTX risk score, passive DNS, malware families

## UI Design

Dark cyberpunk terminal theme:
- Deep black background (`222 84% 5%`) with electric cyan accent (`185 100% 52%`)
- JetBrains Mono for data, Space Grotesk for headings
- Glowing borders/text effects via custom CSS utilities (`.glow-cyan`, `.border-glow-cyan`, `.text-glow-cyan`)
- Scanline animation on the input area
- Blinking cursor effect on the main heading

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/api-server run dev` — run API server locally

See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.
