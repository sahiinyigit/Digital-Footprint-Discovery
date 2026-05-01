import { format } from "date-fns";
import {
  Shield, ShieldAlert, ShieldCheck, Server, Globe, Mail, Network,
  Search, AlertCircle, Terminal, FileText, Database, Code, Zap,
  Lock, Key, Eye, Wifi, AlertTriangle, CheckCircle, XCircle,
  Activity, Cpu, Clock
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import type {
  ScanResult, ShodanService, ShodanHost, SecurityHeader,
  SslCertificate, BreachResult, ThreatIntelResult, ThreatIntelResultPassiveDnsItem,
  DnsRecord, SubdomainResult, TechnologyResult, IpNetblockResult,
  EmailResult
} from "@workspace/api-client-react";

interface ScanResultDisplayProps {
  result: ScanResult;
}

function ModuleLabel({ icon: Icon, label, count, ok }: { icon: React.ElementType; label: string; count?: number | string; ok?: boolean }) {
  return (
    <div className="flex items-center gap-2 p-3 rounded border border-border/50 bg-muted/20">
      <Icon className={`h-4 w-4 ${ok === false ? 'text-destructive' : ok === true ? 'text-success' : 'text-primary'}`} />
      <div className="flex-1 min-w-0">
        <p className="font-mono text-[10px] text-muted-foreground uppercase tracking-wider">{label}</p>
        <p className={`font-mono text-sm font-bold truncate ${ok === false ? 'text-destructive' : ok === true ? 'text-success' : 'text-primary'}`}>
          {count ?? '—'}
        </p>
      </div>
    </div>
  );
}

function SectionHeader({ icon: Icon, title, badge, glowClass = "text-primary" }: {
  icon: React.ElementType; title: string; badge?: string; glowClass?: string;
}) {
  return (
    <div className="flex items-center justify-between px-5 py-4 border-b border-border/50 bg-muted/20">
      <div className="flex items-center gap-2">
        <Icon className={`h-5 w-5 ${glowClass}`} />
        <span className="font-sans text-base font-semibold text-foreground">{title}</span>
      </div>
      {badge && (
        <Badge variant="outline" className="font-mono text-[10px] border-primary/40 text-primary">{badge}</Badge>
      )}
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="h-32 flex items-center justify-center font-mono text-sm text-muted-foreground/60">
      {message}
    </div>
  );
}

function SslSection({ cert }: { cert: SslCertificate }) {
  const validDays = cert.daysRemaining ?? 0;
  const gradeColor = cert.grade?.startsWith("A") ? "text-success" : cert.grade?.startsWith("B") ? "text-warning" : "text-destructive";
  const expiryColor = cert.isExpired ? "text-destructive" : validDays < 30 ? "text-warning" : "text-success";
  return (
    <Card className="border-border/60 bg-card">
      <SectionHeader icon={Lock} title="SSL Certificate" badge={cert.grade ?? "N/A"} glowClass={gradeColor} />
      <CardContent className="p-5 space-y-5">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="p-3 rounded bg-muted/30 border border-border/40">
            <p className="font-mono text-[10px] text-muted-foreground uppercase">Grade</p>
            <p className={`font-mono text-2xl font-black ${gradeColor}`}>{cert.grade ?? "?"}</p>
          </div>
          <div className="p-3 rounded bg-muted/30 border border-border/40">
            <p className="font-mono text-[10px] text-muted-foreground uppercase">Status</p>
            <p className={`font-mono text-sm font-bold mt-1 ${expiryColor}`}>
              {cert.isExpired ? "EXPIRED" : `${validDays}d left`}
            </p>
          </div>
          <div className="p-3 rounded bg-muted/30 border border-border/40 col-span-2">
            <p className="font-mono text-[10px] text-muted-foreground uppercase">Issuer</p>
            <p className="font-mono text-xs font-bold text-foreground mt-1 break-all">{cert.issuer ?? "Unknown"}</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="p-3 rounded bg-muted/30 border border-border/40">
            <p className="font-mono text-[10px] text-muted-foreground uppercase">Subject</p>
            <p className="font-mono text-xs text-foreground mt-1 break-all">{cert.subject ?? "—"}</p>
          </div>
          <div className="p-3 rounded bg-muted/30 border border-border/40">
            <p className="font-mono text-[10px] text-muted-foreground uppercase">Validity</p>
            <p className="font-mono text-xs text-foreground mt-1">
              {cert.validFrom ? format(new Date(cert.validFrom), "yyyy-MM-dd") : "?"} →{" "}
              {cert.validTo ? format(new Date(cert.validTo), "yyyy-MM-dd") : "?"}
            </p>
          </div>
        </div>
        {cert.signatureAlgorithm && (
          <div className="p-3 rounded bg-muted/30 border border-border/40">
            <p className="font-mono text-[10px] text-muted-foreground uppercase">Signature Algorithm</p>
            <p className="font-mono text-sm text-foreground mt-1">{cert.signatureAlgorithm}</p>
          </div>
        )}
        {cert.sans && cert.sans.length > 0 && (
          <div>
            <p className="font-mono text-[10px] text-muted-foreground uppercase mb-2">Subject Alternative Names ({cert.sans.length})</p>
            <ScrollArea className="h-32">
              <div className="flex flex-wrap gap-1">
                {cert.sans.map((san: string, i: number) => (
                  <Badge key={i} variant="outline" className="font-mono text-[10px] border-primary/30 text-primary/80">{san}</Badge>
                ))}
              </div>
            </ScrollArea>
          </div>
        )}
        {cert.issues && cert.issues.length > 0 && (
          <div className="p-3 rounded bg-destructive/10 border border-destructive/30">
            <p className="font-mono text-[10px] text-destructive uppercase mb-2 font-bold">Issues Found</p>
            {cert.issues.map((issue: string, i: number) => (
              <div key={i} className="flex items-start gap-2 text-destructive text-xs font-mono">
                <XCircle className="h-3 w-3 mt-0.5 shrink-0" />
                <span>{issue}</span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function SecurityHeadersSection({ result }: { result: NonNullable<ScanResult["securityHeaders"]> }) {
  const severityConfig: Record<string, { color: string; icon: React.ElementType }> = {
    ok: { color: "text-success", icon: CheckCircle },
    warning: { color: "text-warning", icon: AlertTriangle },
    critical: { color: "text-destructive", icon: XCircle },
    info: { color: "text-info", icon: AlertCircle },
  };
  const gradeColor = result.grade?.startsWith("A") ? "text-success" :
    result.grade?.startsWith("B") ? "text-warning" : "text-destructive";

  return (
    <Card className="border-border/60 bg-card">
      <SectionHeader icon={Shield} title="HTTP Security Headers" badge={result.grade ?? "N/A"} glowClass={gradeColor} />
      <CardContent className="p-5 space-y-4">
        <div className="grid grid-cols-3 gap-3">
          <div className="p-3 rounded bg-muted/30 border border-border/40">
            <p className="font-mono text-[10px] text-muted-foreground uppercase">Grade</p>
            <p className={`font-mono text-2xl font-black ${gradeColor}`}>{result.grade ?? "?"}</p>
          </div>
          <div className="p-3 rounded bg-muted/30 border border-border/40">
            <p className="font-mono text-[10px] text-muted-foreground uppercase">Score</p>
            <p className="font-mono text-2xl font-black text-primary">{result.score ?? 0}</p>
          </div>
          <div className="p-3 rounded bg-muted/30 border border-border/40">
            <p className="font-mono text-[10px] text-muted-foreground uppercase">HTTPS</p>
            <p className={`font-mono text-sm font-bold mt-1 ${result.redirectsToHttps ? "text-success" : "text-warning"}`}>
              {result.redirectsToHttps ? "Yes" : "No"}
            </p>
          </div>
        </div>
        {result.serverInfo && (
          <div className="p-3 rounded bg-muted/30 border border-border/40">
            <p className="font-mono text-[10px] text-muted-foreground uppercase">Server</p>
            <p className="font-mono text-sm text-foreground mt-1">{result.serverInfo}</p>
          </div>
        )}
        {result.headers && result.headers.length > 0 && (
          <Table>
            <TableHeader className="bg-muted/30">
              <TableRow className="border-border/40">
                <TableHead className="font-mono text-[10px] text-muted-foreground uppercase w-8">ST</TableHead>
                <TableHead className="font-mono text-[10px] text-muted-foreground uppercase">Header</TableHead>
                <TableHead className="font-mono text-[10px] text-muted-foreground uppercase">Value</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {result.headers.map((h: SecurityHeader, i: number) => {
                const cfg = severityConfig[h.severity] ?? severityConfig.info;
                const Icon = cfg.icon;
                return (
                  <TableRow key={i} className="border-border/30">
                    <TableCell>
                      <Icon className={`h-4 w-4 ${cfg.color}`} />
                    </TableCell>
                    <TableCell className="font-mono text-xs font-bold text-foreground">{h.name}</TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground break-all max-w-xs">
                      {h.present ? (h.value || "Present") : <span className="text-muted-foreground/50 italic">Missing</span>}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}

function BreachSection({ breaches }: { breaches: BreachResult[] }) {
  if (!breaches || breaches.length === 0) {
    return (
      <Card className="border-success/30 bg-card glow-green">
        <CardContent className="p-8 flex flex-col items-center gap-3 text-center">
          <CheckCircle className="h-12 w-12 text-success" />
          <div>
            <h3 className="font-mono text-lg font-bold text-success">No Breaches Found</h3>
            <p className="font-mono text-xs text-muted-foreground mt-1">This domain was not found in known breach databases.</p>
          </div>
        </CardContent>
      </Card>
    );
  }
  return (
    <Card className="border-destructive/30 bg-card border-glow-red">
      <SectionHeader icon={ShieldAlert} title={`Data Breaches (${breaches.length})`} glowClass="text-destructive" />
      <CardContent className="p-0">
        <ScrollArea className="h-[500px]">
          {breaches.map((breach: BreachResult, i: number) => (
            <div key={i} className="p-4 border-b border-border/30 last:border-0 hover:bg-muted/10 transition-colors">
              <div className="flex items-start justify-between gap-4 mb-2">
                <div>
                  <h4 className="font-mono font-bold text-destructive text-sm">{breach.name}</h4>
                  {breach.domain && <p className="font-mono text-xs text-muted-foreground">{breach.domain}</p>}
                </div>
                <div className="flex flex-col items-end gap-1 shrink-0">
                  {breach.breachDate && (
                    <Badge variant="outline" className="font-mono text-[10px] border-destructive/40 text-destructive/80">
                      {breach.breachDate}
                    </Badge>
                  )}
                  {breach.pwCount && (
                    <span className="font-mono text-[10px] text-muted-foreground">
                      {breach.pwCount.toLocaleString()} records
                    </span>
                  )}
                </div>
              </div>
              {breach.dataClasses && breach.dataClasses.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {breach.dataClasses.map((dc: string, j: number) => (
                    <Badge key={j} variant="secondary" className="font-mono text-[9px] bg-destructive/10 text-destructive/80 border-0">
                      {dc}
                    </Badge>
                  ))}
                </div>
              )}
              {breach.description && (
                <p className="font-mono text-[11px] text-muted-foreground mt-2 leading-relaxed line-clamp-3"
                  dangerouslySetInnerHTML={{ __html: breach.description.replace(/<[^>]*>/g, '') }} />
              )}
            </div>
          ))}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}

function ThreatIntelSection({ intel }: { intel: ThreatIntelResult }) {
  const riskColor = (intel.riskScore ?? 0) > 70 ? "text-destructive" :
    (intel.riskScore ?? 0) > 30 ? "text-warning" : "text-success";
  const riskLabel = (intel.riskScore ?? 0) > 70 ? "HIGH RISK" :
    (intel.riskScore ?? 0) > 30 ? "MODERATE" : "LOW RISK";

  return (
    <Card className="border-border/60 bg-card">
      <SectionHeader icon={Cpu} title="AlienVault OTX Threat Intelligence" glowClass={riskColor} />
      <CardContent className="p-5 space-y-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className={`p-3 rounded border ${(intel.riskScore ?? 0) > 70 ? 'bg-destructive/10 border-destructive/30' : (intel.riskScore ?? 0) > 30 ? 'bg-warning/10 border-warning/30' : 'bg-success/10 border-success/30'}`}>
            <p className="font-mono text-[10px] text-muted-foreground uppercase">Risk Score</p>
            <p className={`font-mono text-2xl font-black ${riskColor}`}>{intel.riskScore ?? 0}</p>
            <p className={`font-mono text-[9px] ${riskColor} font-bold`}>{riskLabel}</p>
          </div>
          <div className="p-3 rounded bg-muted/30 border border-border/40">
            <p className="font-mono text-[10px] text-muted-foreground uppercase">Malicious</p>
            <p className={`font-mono text-2xl font-black ${(intel.maliciousCount ?? 0) > 0 ? 'text-destructive' : 'text-success'}`}>
              {intel.maliciousCount ?? 0}
            </p>
          </div>
          <div className="p-3 rounded bg-muted/30 border border-border/40">
            <p className="font-mono text-[10px] text-muted-foreground uppercase">Suspicious</p>
            <p className={`font-mono text-2xl font-black ${(intel.suspiciousCount ?? 0) > 0 ? 'text-warning' : 'text-success'}`}>
              {intel.suspiciousCount ?? 0}
            </p>
          </div>
          <div className="p-3 rounded bg-muted/30 border border-border/40">
            <p className="font-mono text-[10px] text-muted-foreground uppercase">OTX Pulses</p>
            <p className="font-mono text-2xl font-black text-primary">{intel.pulseCount ?? 0}</p>
          </div>
        </div>

        {intel.tags && intel.tags.length > 0 && (
          <div>
            <p className="font-mono text-[10px] text-muted-foreground uppercase mb-2">Tags</p>
            <div className="flex flex-wrap gap-1">
              {intel.tags.map((tag: string, i: number) => (
                <Badge key={i} variant="outline" className="font-mono text-[10px] border-primary/40 text-primary/80">{tag}</Badge>
              ))}
            </div>
          </div>
        )}

        {intel.malwareFamilies && intel.malwareFamilies.length > 0 && (
          <div>
            <p className="font-mono text-[10px] text-muted-foreground uppercase mb-2 text-destructive font-bold">Malware Families</p>
            <div className="flex flex-wrap gap-1">
              {intel.malwareFamilies.map((mw: string, i: number) => (
                <Badge key={i} variant="destructive" className="font-mono text-[10px] bg-destructive/20 text-destructive border-destructive/30">{mw}</Badge>
              ))}
            </div>
          </div>
        )}

        {intel.passiveDns && intel.passiveDns.length > 0 && (
          <div>
            <p className="font-mono text-[10px] text-muted-foreground uppercase mb-2">Passive DNS ({intel.passiveDns.length})</p>
            <Table>
              <TableHeader className="bg-muted/30">
                <TableRow className="border-border/40">
                  <TableHead className="font-mono text-[10px] text-muted-foreground">Hostname</TableHead>
                  <TableHead className="font-mono text-[10px] text-muted-foreground">IP</TableHead>
                  <TableHead className="font-mono text-[10px] text-muted-foreground">Last Seen</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {intel.passiveDns.slice(0, 20).map((entry: ThreatIntelResultPassiveDnsItem, i: number) => (
                  <TableRow key={i} className="border-border/30">
                    <TableCell className="font-mono text-xs text-primary">{entry.hostname}</TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">{entry.ip ?? "—"}</TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">{entry.last ?? "—"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function ScanResultDisplay({ result }: ScanResultDisplayProps) {
  const hasErrors = result.errors && Object.keys(result.errors).length > 0;
  const threatScore = result.blacklist?.listed ? "LISTED" :
    (result.threatIntel?.riskScore ?? 0) > 50 ? "ELEVATED" :
    (result.breaches && result.breaches.length > 0) ? "BREACHED" : "CLEAN";
  const threatScoreColor = threatScore === "LISTED" || threatScore === "ELEVATED" ? "text-destructive text-glow-red" :
    threatScore === "BREACHED" ? "text-warning" : "text-success text-glow-green";

  return (
    <div className="space-y-5 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Stat banner */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="rounded border border-primary/30 bg-card p-4 border-glow-cyan">
          <p className="font-mono text-[10px] text-muted-foreground uppercase tracking-widest">Target</p>
          <p className="font-mono text-xl font-black text-primary truncate">{result.target}</p>
          <div className="flex gap-2 mt-1">
            <Badge variant="outline" className="font-mono text-[9px] border-primary/40 text-primary/70 uppercase">
              {result.scanType}
            </Badge>
            <Badge variant="outline" className="font-mono text-[9px] border-border text-muted-foreground">
              {format(new Date(result.timestamp), "HH:mm:ss")}
            </Badge>
          </div>
        </div>

        <div className={`rounded border bg-card p-4 ${threatScore === "CLEAN" ? "border-success/30 glow-green" : "border-destructive/30 glow-red"}`}>
          <p className="font-mono text-[10px] text-muted-foreground uppercase tracking-widest">Security Posture</p>
          <p className={`font-mono text-xl font-black ${threatScoreColor}`}>{threatScore}</p>
          <p className="font-mono text-[10px] text-muted-foreground mt-1">
            {result.blacklist?.listCount ? `${result.blacklist.listCount} blacklists` : "All clear"}
          </p>
        </div>

        <div className="rounded border border-border/50 bg-card p-4">
          <p className="font-mono text-[10px] text-muted-foreground uppercase tracking-widest">Attack Surface</p>
          <div className="flex items-end gap-3 mt-1">
            <span className="font-mono text-xl font-black text-primary">{result.subdomains?.length ?? 0}</span>
            <span className="font-mono text-xs text-muted-foreground pb-0.5">subdomains</span>
          </div>
          <div className="flex gap-3 mt-1">
            <span className="font-mono text-[10px] text-muted-foreground">{result.shodan?.[0]?.ports?.length ?? 0} ports</span>
            <span className="font-mono text-[10px] text-muted-foreground">{result.emails?.length ?? 0} emails</span>
          </div>
        </div>

        <div className="rounded border border-border/50 bg-card p-4">
          <p className="font-mono text-[10px] text-muted-foreground uppercase tracking-widest">Intel Sources</p>
          <p className="font-mono text-xl font-black text-primary">
            {12 - Object.keys(result.errors ?? {}).length}
            <span className="text-muted-foreground font-normal text-sm">/12</span>
          </p>
          <p className="font-mono text-[10px] text-muted-foreground mt-1">modules succeeded</p>
        </div>
      </div>

      {hasErrors && (
        <div className="rounded border border-destructive/30 bg-destructive/5 p-4">
          <p className="font-mono text-xs font-bold text-destructive uppercase tracking-wider mb-2 flex items-center gap-2">
            <AlertCircle className="h-4 w-4" /> Module Errors
          </p>
          <div className="space-y-1">
            {Object.entries(result.errors ?? {}).map(([module, error]: [string, string]) => (
              <p key={module} className="font-mono text-xs text-muted-foreground">
                <span className="text-destructive font-bold">{module}</span>: {error}
              </p>
            ))}
          </div>
        </div>
      )}

      <Tabs defaultValue="infra" className="w-full">
        <TabsList className="flex flex-wrap h-auto gap-1 p-1.5 bg-muted/50 border border-border/50 rounded-lg">
          {[
            { value: "infra", label: "INFRA" },
            { value: "recon", label: "RECON" },
            { value: "whois", label: "WHOIS" },
            { value: "ports", label: "SHODAN" },
            { value: "security", label: "SECURITY" },
            { value: "osint", label: "OSINT" },
            { value: "threat", label: "THREAT" },
          ].map(({ value, label }) => (
            <TabsTrigger
              key={value}
              value={value}
              className="font-mono text-[11px] tracking-widest py-1.5 px-3 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:glow-cyan"
            >
              {label}
            </TabsTrigger>
          ))}
        </TabsList>

        {/* ─── INFRA TAB ─── */}
        <TabsContent value="infra" className="space-y-4 mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="border-border/60 bg-card">
              <SectionHeader icon={Database} title="DNS Records" badge={`${result.dns?.length ?? 0} records`} />
              <CardContent className="p-0">
                <ScrollArea className="h-[400px]">
                  <Table>
                    <TableHeader className="bg-muted/30 sticky top-0">
                      <TableRow className="border-border/40">
                        <TableHead className="font-mono text-[10px] text-muted-foreground w-16">TYPE</TableHead>
                        <TableHead className="font-mono text-[10px] text-muted-foreground">VALUE</TableHead>
                        <TableHead className="font-mono text-[10px] text-muted-foreground w-16">TTL</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {result.dns?.map((record: DnsRecord, i: number) => (
                        <TableRow key={i} className="border-border/30">
                          <TableCell className="font-mono text-[10px] font-black text-primary">{record.type}</TableCell>
                          <TableCell className="font-mono text-xs break-all">{record.value}</TableCell>
                          <TableCell className="font-mono text-[10px] text-muted-foreground">{record.ttl || '—'}</TableCell>
                        </TableRow>
                      ))}
                      {!result.dns?.length && <TableRow><TableCell colSpan={3}><EmptyState message="No DNS records found" /></TableCell></TableRow>}
                    </TableBody>
                  </Table>
                </ScrollArea>
              </CardContent>
            </Card>

            <Card className="border-border/60 bg-card">
              <SectionHeader icon={Network} title="IP Netblocks" badge={`${result.ipNetblocks?.length ?? 0} blocks`} />
              <CardContent className="p-0">
                <ScrollArea className="h-[400px]">
                  <Table>
                    <TableHeader className="bg-muted/30 sticky top-0">
                      <TableRow className="border-border/40">
                        <TableHead className="font-mono text-[10px] text-muted-foreground">NETBLOCK</TableHead>
                        <TableHead className="font-mono text-[10px] text-muted-foreground">ASN</TableHead>
                        <TableHead className="font-mono text-[10px] text-muted-foreground">ORG</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {result.ipNetblocks?.map((block: IpNetblockResult, i: number) => (
                        <TableRow key={i} className="border-border/30">
                          <TableCell className="font-mono text-xs text-primary">{block.netblock || block.ip}</TableCell>
                          <TableCell className="font-mono text-[10px] text-muted-foreground">{block.asn}</TableCell>
                          <TableCell className="font-mono text-xs">{block.org || block.asnName || '—'}</TableCell>
                        </TableRow>
                      ))}
                      {!result.ipNetblocks?.length && <TableRow><TableCell colSpan={3}><EmptyState message="No netblock data" /></TableCell></TableRow>}
                    </TableBody>
                  </Table>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ─── RECON TAB ─── */}
        <TabsContent value="recon" className="space-y-4 mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="border-border/60 bg-card">
              <SectionHeader icon={Globe} title="Subdomains" badge={`${result.subdomains?.length ?? 0} found`} />
              <CardContent className="p-0">
                <ScrollArea className="h-[500px]">
                  <Table>
                    <TableHeader className="bg-muted/30 sticky top-0">
                      <TableRow className="border-border/40">
                        <TableHead className="font-mono text-[10px] text-muted-foreground">HOSTNAME</TableHead>
                        <TableHead className="font-mono text-[10px] text-muted-foreground">IP</TableHead>
                        <TableHead className="font-mono text-[10px] text-muted-foreground w-24">SOURCE</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {result.subdomains?.map((sub: SubdomainResult, i: number) => (
                        <TableRow key={i} className="border-border/30">
                          <TableCell className="font-mono text-xs text-primary">{sub.subdomain}</TableCell>
                          <TableCell className="font-mono text-[10px] text-muted-foreground">{sub.ip || '—'}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className="font-mono text-[9px] border-border/50 text-muted-foreground">{sub.source || '—'}</Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                      {!result.subdomains?.length && <TableRow><TableCell colSpan={3}><EmptyState message="No subdomains found" /></TableCell></TableRow>}
                    </TableBody>
                  </Table>
                </ScrollArea>
              </CardContent>
            </Card>

            <Card className="border-border/60 bg-card">
              <SectionHeader icon={Code} title="Technologies Detected" badge={`${result.technologies?.length ?? 0} found`} />
              <CardContent className="p-0">
                <ScrollArea className="h-[500px]">
                  <Table>
                    <TableHeader className="bg-muted/30 sticky top-0">
                      <TableRow className="border-border/40">
                        <TableHead className="font-mono text-[10px] text-muted-foreground">TECHNOLOGY</TableHead>
                        <TableHead className="font-mono text-[10px] text-muted-foreground">CATEGORY</TableHead>
                        <TableHead className="font-mono text-[10px] text-muted-foreground w-24">VERSION</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {result.technologies?.map((tech: TechnologyResult, i: number) => (
                        <TableRow key={i} className="border-border/30">
                          <TableCell className="font-mono text-xs font-bold text-foreground">{tech.name}</TableCell>
                          <TableCell className="font-mono text-[10px] text-muted-foreground">{tech.category || '—'}</TableCell>
                          <TableCell className="font-mono text-[10px] text-primary">{tech.version || '—'}</TableCell>
                        </TableRow>
                      ))}
                      {!result.technologies?.length && <TableRow><TableCell colSpan={3}><EmptyState message="No technologies detected" /></TableCell></TableRow>}
                    </TableBody>
                  </Table>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ─── WHOIS TAB ─── */}
        <TabsContent value="whois" className="mt-4">
          {result.whois ? (
            <Card className="border-border/60 bg-card">
              <SectionHeader icon={FileText} title="WHOIS Registration Data" />
              <CardContent className="p-5 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {([
                    { label: "Registrar", value: result.whois.registrar },
                    { label: "Status", value: Array.isArray(result.whois.status) ? result.whois.status.join(", ") : result.whois.status },
                    { label: "Created", value: result.whois.createdDate },
                    { label: "Updated", value: result.whois.updatedDate },
                    { label: "Expires", value: result.whois.expiresDate },
                    { label: "Owner", value: result.whois.registrantName || result.whois.registrantOrg },
                    { label: "Country", value: result.whois.registrantCountry },
                    { label: "Email", value: result.whois.registrantEmail },
                  ] as { label: string; value: string | undefined }[]).filter(f => f.value).map(({ label, value }) => (
                    <div key={label} className="p-3 rounded bg-muted/30 border border-border/40">
                      <p className="font-mono text-[10px] text-muted-foreground uppercase">{label}</p>
                      <p className="font-mono text-sm text-foreground mt-1 break-all">{value}</p>
                    </div>
                  ))}
                </div>
                {result.whois.nameServers && result.whois.nameServers.length > 0 && (
                  <div>
                    <p className="font-mono text-[10px] text-muted-foreground uppercase mb-2">Nameservers</p>
                    <div className="flex flex-wrap gap-2">
                      {result.whois.nameServers.map((ns: string, i: number) => (
                        <Badge key={i} variant="outline" className="font-mono text-[10px] border-primary/30 text-primary/80">{ns}</Badge>
                      ))}
                    </div>
                  </div>
                )}
                {result.whois.rawText && (
                  <details className="mt-2">
                    <summary className="font-mono text-xs text-muted-foreground cursor-pointer hover:text-primary transition-colors">
                      Raw WHOIS data
                    </summary>
                    <ScrollArea className="h-64 mt-2">
                      <pre className="font-mono text-[10px] text-muted-foreground/80 whitespace-pre-wrap p-3 bg-muted/20 rounded border border-border/30">{result.whois.rawText}</pre>
                    </ScrollArea>
                  </details>
                )}
              </CardContent>
            </Card>
          ) : (
            <Card className="border-border/60 bg-card">
              <CardContent><EmptyState message="No WHOIS data available" /></CardContent>
            </Card>
          )}
        </TabsContent>

        {/* ─── PORTS TAB ─── */}
        <TabsContent value="ports" className="space-y-4 mt-4">
          {result.shodan && result.shodan.length > 0 ? (
            result.shodan.map((host: ShodanHost, idx: number) => (
              <Card key={idx} className="border-border/60 bg-card">
                <SectionHeader icon={Server} title={`${host.ip} — ${host.org || 'Unknown Org'}`} badge={host.country} />
                <CardContent className="p-5 space-y-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <ModuleLabel icon={Server} label="IP" count={host.ip} />
                    <ModuleLabel icon={Globe} label="Country" count={host.country} />
                    <ModuleLabel icon={Network} label="ISP" count={host.isp} />
                    <ModuleLabel icon={Cpu} label="OS" count={host.os || "Unknown"} />
                  </div>
                  {host.ports && (
                    <div>
                      <p className="font-mono text-[10px] text-muted-foreground uppercase mb-2">Open Ports ({host.ports.length})</p>
                      <div className="flex flex-wrap gap-1">
                        {host.ports.map((port: number) => (
                          <Badge key={port} variant="outline" className="font-mono text-[10px] border-primary/40 text-primary glow-cyan">{port}</Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  {host.vulns && host.vulns.length > 0 && (
                    <div>
                      <p className="font-mono text-[10px] text-destructive uppercase mb-2 font-bold flex items-center gap-1">
                        <AlertTriangle className="h-3 w-3" /> CVE Vulnerabilities ({host.vulns.length})
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {host.vulns.map((vuln: string) => (
                          <Badge key={vuln} className="font-mono text-[10px] bg-destructive/20 text-destructive border border-destructive/30">{vuln}</Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  {host.services && host.services.length > 0 && (
                    <Table>
                      <TableHeader className="bg-muted/30">
                        <TableRow className="border-border/40">
                          <TableHead className="font-mono text-[10px] text-muted-foreground w-24">PORT</TableHead>
                          <TableHead className="font-mono text-[10px] text-muted-foreground">PRODUCT / VERSION</TableHead>
                          <TableHead className="font-mono text-[10px] text-muted-foreground">BANNER</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {host.services.map((svc: ShodanService, i: number) => (
                          <TableRow key={i} className="border-border/30">
                            <TableCell className="font-mono text-xs font-black text-primary">
                              {svc.port}/{svc.transport || 'tcp'}
                            </TableCell>
                            <TableCell className="font-mono text-xs">
                              {svc.product ? <>{svc.product} <span className="text-muted-foreground text-[10px]">{svc.version}</span></> : '—'}
                            </TableCell>
                            <TableCell className="font-mono text-[10px] text-muted-foreground max-w-xs truncate">
                              {svc.banner ? svc.banner.substring(0, 60) + (svc.banner.length > 60 ? '…' : '') : '—'}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            ))
          ) : (
            <Card className="border-border/60 bg-card">
              <CardContent><EmptyState message="No Shodan data available for this target" /></CardContent>
            </Card>
          )}
        </TabsContent>

        {/* ─── SECURITY TAB ─── */}
        <TabsContent value="security" className="space-y-4 mt-4">
          {result.sslCertificate ? (
            <SslSection cert={result.sslCertificate} />
          ) : (
            <Card className="border-border/60 bg-card">
              <SectionHeader icon={Lock} title="SSL Certificate" />
              <CardContent><EmptyState message="No SSL certificate data available" /></CardContent>
            </Card>
          )}
          {result.securityHeaders ? (
            <SecurityHeadersSection result={result.securityHeaders} />
          ) : (
            <Card className="border-border/60 bg-card">
              <SectionHeader icon={Shield} title="HTTP Security Headers" />
              <CardContent><EmptyState message="No security header data available" /></CardContent>
            </Card>
          )}
        </TabsContent>

        {/* ─── OSINT TAB ─── */}
        <TabsContent value="osint" className="mt-4 space-y-4">
          {result.emailStats && (
            <div className="grid grid-cols-3 gap-3">
              <ModuleLabel icon={Mail} label="Total Emails" count={result.emailStats.total ?? 0} />
              <ModuleLabel icon={Code} label="Pattern" count={result.emailStats.pattern || "Unknown"} />
              <ModuleLabel icon={Search} label="Organization" count={result.emailStats.organization || "Unknown"} />
            </div>
          )}
          <Card className="border-border/60 bg-card">
            <SectionHeader icon={Mail} title="Discovered Email Addresses" badge={`${result.emails?.length ?? 0} found`} />
            <CardContent className="p-0">
              <ScrollArea className="h-[500px]">
                <Table>
                  <TableHeader className="bg-muted/30 sticky top-0">
                    <TableRow className="border-border/40">
                      <TableHead className="font-mono text-[10px] text-muted-foreground">EMAIL ADDRESS</TableHead>
                      <TableHead className="font-mono text-[10px] text-muted-foreground">NAME</TableHead>
                      <TableHead className="font-mono text-[10px] text-muted-foreground">ROLE</TableHead>
                      <TableHead className="font-mono text-[10px] text-muted-foreground w-20">CONF.</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {result.emails?.map((email: EmailResult, i: number) => (
                      <TableRow key={i} className="border-border/30">
                        <TableCell className="font-mono text-xs font-bold text-primary">{email.email}</TableCell>
                        <TableCell className="font-mono text-xs">
                          {email.firstName || email.lastName ? `${email.firstName || ''} ${email.lastName || ''}`.trim() : '—'}
                        </TableCell>
                        <TableCell className="font-mono text-[10px] text-muted-foreground">
                          {email.position && email.department ? `${email.position} (${email.department})` : email.position || email.department || '—'}
                        </TableCell>
                        <TableCell>
                          {email.confidence ? (
                            <Badge className={`font-mono text-[9px] ${email.confidence > 80 ? 'bg-success/20 text-success border-success/30' : 'bg-muted text-muted-foreground border-border/50'} border`}>
                              {email.confidence}%
                            </Badge>
                          ) : '—'}
                        </TableCell>
                      </TableRow>
                    ))}
                    {!result.emails?.length && (
                      <TableRow><TableCell colSpan={4}><EmptyState message="No emails discovered" /></TableCell></TableRow>
                    )}
                  </TableBody>
                </Table>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ─── THREAT TAB ─── */}
        <TabsContent value="threat" className="space-y-4 mt-4">
          {/* Blacklist */}
          <Card className={`border-border/60 bg-card ${result.blacklist?.listed ? 'border-destructive/40 glow-red' : 'border-success/30 glow-green'}`}>
            <SectionHeader
              icon={result.blacklist?.listed ? ShieldAlert : ShieldCheck}
              title="Blacklist / DNSBL Check"
              badge={result.blacklist?.listed ? `${result.blacklist.listCount} LISTINGS` : "CLEAN"}
              glowClass={result.blacklist?.listed ? "text-destructive" : "text-success"}
            />
            <CardContent className="p-5">
              {result.blacklist ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <div className={`h-14 w-14 rounded-full flex items-center justify-center shrink-0 ${result.blacklist.listed ? 'bg-destructive/20 text-destructive' : 'bg-success/20 text-success'}`}>
                      {result.blacklist.listed ? <AlertTriangle className="h-7 w-7" /> : <CheckCircle className="h-7 w-7" />}
                    </div>
                    <div>
                      <h3 className={`font-mono text-lg font-bold ${result.blacklist.listed ? 'text-destructive' : 'text-success'}`}>
                        {result.blacklist.listed ? "Threats Detected" : "No Listings Found"}
                      </h3>
                      <p className="font-mono text-xs text-muted-foreground">
                        Listed on {result.blacklist.listCount || 0} threat intelligence feeds
                      </p>
                    </div>
                  </div>
                  {result.blacklist.listed && result.blacklist.lists && result.blacklist.lists.length > 0 && (
                    <div className="rounded border border-destructive/20 bg-destructive/5 overflow-hidden">
                      <p className="px-4 py-2 font-mono text-[10px] text-destructive font-bold uppercase border-b border-destructive/20">Active Listings</p>
                      {result.blacklist.lists.map((list: string, i: number) => (
                        <div key={i} className="flex items-center gap-3 px-4 py-2.5 border-b border-destructive/10 last:border-0">
                          <Zap className="h-3.5 w-3.5 text-destructive shrink-0" />
                          <span className="font-mono text-sm text-foreground">{list}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : <EmptyState message="No blacklist data available" />}
            </CardContent>
          </Card>

          {/* Breaches */}
          {result.breaches !== undefined && <BreachSection breaches={result.breaches ?? []} />}

          {/* Threat Intel */}
          {result.threatIntel && <ThreatIntelSection intel={result.threatIntel} />}
        </TabsContent>
      </Tabs>
    </div>
  );
}
