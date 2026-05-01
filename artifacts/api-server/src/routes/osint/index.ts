import { Router } from "express";
import { db } from "@workspace/db";
import { scansTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { logger } from "../../lib/logger.js";
import { lookupDns } from "./dns.js";
import { lookupWhois } from "./whois.js";
import { shodanScan } from "./shodan.js";
import { findSubdomains } from "./subdomains.js";
import { findEmails } from "./emails.js";
import { checkBlacklist } from "./blacklist.js";
import { detectTechnologies } from "./technologies.js";
import { getNetblocks } from "./netblocks.js";
import type { ScanResult } from "./types.js";

const router = Router();

function detectScanType(target: string): "domain" | "ip" {
  const clean = target.replace(/^https?:\/\//, "").split("/")[0].split(":")[0];
  return /^(\d{1,3}\.){3}\d{1,3}$/.test(clean) ? "ip" : "domain";
}

router.post("/scan", async (req, res) => {
  const { target, modules } = req.body as { target?: string; modules?: string[] };

  if (!target || typeof target !== "string" || target.trim().length === 0) {
    res.status(400).json({ error: "invalid_input", message: "target is required" });
    return;
  }

  const cleanTarget = target.trim();
  const scanType = detectScanType(cleanTarget);
  const timestamp = new Date().toISOString();
  const errors: Record<string, string> = {};

  const runModule = (name: string) =>
    !modules || modules.includes(name);

  req.log.info({ target: cleanTarget, scanType }, "Starting OSINT scan");

  const [
    dnsResult,
    whoisResult,
    shodanResult,
    subdomainsResult,
    emailsResult,
    blacklistResult,
    techResult,
    netblockResult,
  ] = await Promise.allSettled([
    runModule("dns") && scanType === "domain" ? lookupDns(cleanTarget) : Promise.resolve([]),
    runModule("whois") && scanType === "domain" ? lookupWhois(cleanTarget) : Promise.resolve({}),
    runModule("shodan") ? shodanScan(cleanTarget) : Promise.resolve([]),
    runModule("subdomains") && scanType === "domain" ? findSubdomains(cleanTarget) : Promise.resolve([]),
    runModule("emails") && scanType === "domain" ? findEmails(cleanTarget) : Promise.resolve({ emails: [], stats: {} }),
    runModule("blacklist") ? checkBlacklist(cleanTarget) : Promise.resolve({ listed: false }),
    runModule("technologies") && scanType === "domain" ? detectTechnologies(cleanTarget) : Promise.resolve([]),
    runModule("netblocks") ? getNetblocks(cleanTarget) : Promise.resolve([]),
  ]);

  const extractValue = <T>(result: PromiseSettledResult<T>, moduleName: string, fallback: T): T => {
    if (result.status === "fulfilled") return result.value;
    errors[moduleName] = result.reason instanceof Error ? result.reason.message : "Unknown error";
    return fallback;
  };

  const emailData = extractValue(emailsResult, "emails", { emails: [], stats: {} });

  const scanResult: ScanResult = {
    target: cleanTarget,
    scanType,
    timestamp,
    dns: extractValue(dnsResult, "dns", []),
    whois: extractValue(whoisResult, "whois", {}),
    shodan: extractValue(shodanResult, "shodan", []),
    subdomains: extractValue(subdomainsResult, "subdomains", []),
    emails: emailData.emails,
    emailStats: emailData.stats,
    blacklist: extractValue(blacklistResult, "blacklist", { listed: false }),
    technologies: extractValue(techResult, "technologies", []),
    ipNetblocks: extractValue(netblockResult, "netblocks", []),
    errors: Object.keys(errors).length > 0 ? errors : undefined,
  };

  // Save to DB
  try {
    await db.insert(scansTable).values({
      target: cleanTarget,
      scanType,
      result: scanResult as unknown as Record<string, unknown>,
    });
  } catch (err) {
    logger.error({ err }, "Failed to save scan to DB");
  }

  req.log.info({ target: cleanTarget, modules: Object.keys(errors) }, "Scan complete");
  res.json(scanResult);
});

router.get("/scans", async (req, res) => {
  const scans = await db
    .select()
    .from(scansTable)
    .orderBy(scansTable.timestamp)
    .limit(100);

  // Return in descending order (newest first)
  res.json(scans.reverse().map(s => ({
    id: s.id,
    target: s.target,
    scanType: s.scanType,
    timestamp: s.timestamp.toISOString(),
    result: s.result,
  })));
});

router.get("/scans/:id", async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) {
    res.status(400).json({ error: "invalid_id", message: "Invalid scan ID" });
    return;
  }

  const [scan] = await db.select().from(scansTable).where(eq(scansTable.id, id));

  if (!scan) {
    res.status(404).json({ error: "not_found", message: "Scan not found" });
    return;
  }

  res.json({
    id: scan.id,
    target: scan.target,
    scanType: scan.scanType,
    timestamp: scan.timestamp.toISOString(),
    result: scan.result,
  });
});

router.delete("/scans/:id", async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) {
    res.status(400).json({ error: "invalid_id", message: "Invalid scan ID" });
    return;
  }

  const [scan] = await db.select().from(scansTable).where(eq(scansTable.id, id));

  if (!scan) {
    res.status(404).json({ error: "not_found", message: "Scan not found" });
    return;
  }

  await db.delete(scansTable).where(eq(scansTable.id, id));
  res.json({ success: true, message: "Scan deleted" });
});

export default router;
