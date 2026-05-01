import { format } from "date-fns";
import { Shield, ShieldAlert, ShieldCheck, Server, Globe, Mail, Network, Search, AlertCircle, Terminal, FileText, Database, Code, Zap } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { ScanResult, ShodanService } from "@workspace/api-client-react/src/generated/api.schemas";

interface ScanResultDisplayProps {
  result: ScanResult;
}

export function ScanResultDisplay({ result }: ScanResultDisplayProps) {
  const hasErrors = result.errors && Object.keys(result.errors).length > 0;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Overview Header */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-border bg-card">
          <CardHeader className="pb-2">
            <CardDescription className="font-mono text-xs font-bold uppercase tracking-wider text-muted-foreground">Target Ident</CardDescription>
            <CardTitle className="font-mono text-2xl text-primary">{result.target}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="font-mono bg-background border-border text-primary uppercase text-xs">
                {result.scanType}
              </Badge>
              <Badge variant="outline" className="font-mono bg-background border-border text-muted-foreground uppercase text-xs">
                {format(new Date(result.timestamp), "HH:mm:ss")}
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border bg-card">
          <CardHeader className="pb-2">
            <CardDescription className="font-mono text-xs font-bold uppercase tracking-wider text-muted-foreground">Security Posture</CardDescription>
            <CardTitle className="font-sans text-lg">
              {result.blacklist?.listed ? (
                <span className="text-destructive flex items-center gap-2">
                  <ShieldAlert className="h-5 w-5" /> Threat Detected
                </span>
              ) : (
                <span className="text-success flex items-center gap-2">
                  <ShieldCheck className="h-5 w-5" /> Clean Baseline
                </span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm font-mono text-muted-foreground">
              {result.blacklist?.listed 
                ? `Listed on ${result.blacklist.listCount} blacklists`
                : "No active threat listings found"}
            </div>
          </CardContent>
        </Card>

        <Card className="border-border bg-card">
          <CardHeader className="pb-2">
            <CardDescription className="font-mono text-xs font-bold uppercase tracking-wider text-muted-foreground">Surface Area</CardDescription>
            <CardTitle className="font-sans text-lg flex items-center gap-4">
              <span className="flex items-center gap-1 text-primary">
                <Globe className="h-4 w-4" /> {result.subdomains?.length || 0}
              </span>
              <span className="flex items-center gap-1 text-primary">
                <Server className="h-4 w-4" /> {result.shodan?.[0]?.ports?.length || 0}
              </span>
              <span className="flex items-center gap-1 text-primary">
                <Mail className="h-4 w-4" /> {result.emails?.length || 0}
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm font-mono text-muted-foreground flex gap-4">
              <span>Subdomains</span>
              <span>Open Ports</span>
              <span>Emails</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {hasErrors && (
        <Alert variant="destructive" className="border-destructive/50 bg-destructive/10 text-destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle className="font-mono font-bold tracking-wider uppercase text-sm">Module Execution Errors</AlertTitle>
          <AlertDescription className="font-mono text-xs mt-2">
            <ul className="list-disc list-inside space-y-1">
              {Object.entries(result.errors || {}).map(([module, error]) => (
                <li key={module}><span className="font-bold">{module}:</span> {error}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="infrastructure" className="w-full">
        <TabsList className="grid grid-cols-2 md:grid-cols-6 h-auto p-1 bg-muted border border-border">
          <TabsTrigger value="infrastructure" className="font-mono text-xs py-2 px-3">INFRA</TabsTrigger>
          <TabsTrigger value="recon" className="font-mono text-xs py-2 px-3">RECON</TabsTrigger>
          <TabsTrigger value="whois" className="font-mono text-xs py-2 px-3">WHOIS</TabsTrigger>
          <TabsTrigger value="shodan" className="font-mono text-xs py-2 px-3">SHODAN</TabsTrigger>
          <TabsTrigger value="emails" className="font-mono text-xs py-2 px-3">OSINT</TabsTrigger>
          <TabsTrigger value="threat" className="font-mono text-xs py-2 px-3">THREAT</TabsTrigger>
        </TabsList>

        {/* INFRASTRUCTURE TAB */}
        <TabsContent value="infrastructure" className="space-y-4 mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="border-border bg-card">
              <CardHeader className="border-b border-border bg-muted/30">
                <CardTitle className="font-sans text-lg flex items-center gap-2">
                  <Database className="h-5 w-5 text-primary" /> DNS Records
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <ScrollArea className="h-[400px]">
                  <Table>
                    <TableHeader className="bg-muted/50 sticky top-0">
                      <TableRow className="border-border">
                        <TableHead className="font-mono text-xs text-muted-foreground w-20">TYPE</TableHead>
                        <TableHead className="font-mono text-xs text-muted-foreground">VALUE</TableHead>
                        <TableHead className="font-mono text-xs text-muted-foreground w-20">TTL</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {result.dns?.map((record, i) => (
                        <TableRow key={i} className="border-border">
                          <TableCell className="font-mono text-xs font-bold text-primary">{record.type}</TableCell>
                          <TableCell className="font-mono text-sm break-all">{record.value}</TableCell>
                          <TableCell className="font-mono text-xs text-muted-foreground">{record.ttl || '-'}</TableCell>
                        </TableRow>
                      ))}
                      {!result.dns?.length && (
                        <TableRow>
                          <TableCell colSpan={3} className="h-24 text-center font-mono text-muted-foreground text-sm">
                            No DNS records found
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </ScrollArea>
              </CardContent>
            </Card>

            <Card className="border-border bg-card">
              <CardHeader className="border-b border-border bg-muted/30">
                <CardTitle className="font-sans text-lg flex items-center gap-2">
                  <Network className="h-5 w-5 text-primary" /> IP Netblocks
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <ScrollArea className="h-[400px]">
                  <Table>
                    <TableHeader className="bg-muted/50 sticky top-0">
                      <TableRow className="border-border">
                        <TableHead className="font-mono text-xs text-muted-foreground">NETBLOCK</TableHead>
                        <TableHead className="font-mono text-xs text-muted-foreground">ASN</TableHead>
                        <TableHead className="font-mono text-xs text-muted-foreground">ORG</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {result.ipNetblocks?.map((block, i) => (
                        <TableRow key={i} className="border-border">
                          <TableCell className="font-mono text-sm text-primary">{block.netblock || block.ip}</TableCell>
                          <TableCell className="font-mono text-xs text-muted-foreground">{block.asn}</TableCell>
                          <TableCell className="font-mono text-sm">{block.org || block.asnName || '-'}</TableCell>
                        </TableRow>
                      ))}
                      {!result.ipNetblocks?.length && (
                        <TableRow>
                          <TableCell colSpan={3} className="h-24 text-center font-mono text-muted-foreground text-sm">
                            No Netblock data found
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* RECON TAB */}
        <TabsContent value="recon" className="space-y-4 mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="border-border bg-card">
              <CardHeader className="border-b border-border bg-muted/30">
                <CardTitle className="font-sans text-lg flex items-center gap-2">
                  <Globe className="h-5 w-5 text-primary" /> Subdomains
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <ScrollArea className="h-[400px]">
                  <Table>
                    <TableHeader className="bg-muted/50 sticky top-0">
                      <TableRow className="border-border">
                        <TableHead className="font-mono text-xs text-muted-foreground">SUBDOMAIN</TableHead>
                        <TableHead className="font-mono text-xs text-muted-foreground">IP</TableHead>
                        <TableHead className="font-mono text-xs text-muted-foreground">STATUS</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {result.subdomains?.map((sub, i) => (
                        <TableRow key={i} className="border-border">
                          <TableCell className="font-mono text-sm text-primary">{sub.subdomain}</TableCell>
                          <TableCell className="font-mono text-xs text-muted-foreground">{sub.ip || '-'}</TableCell>
                          <TableCell>
                            {sub.status ? (
                              <Badge variant={sub.status >= 200 && sub.status < 400 ? 'default' : 'secondary'} className="font-mono text-[10px]">
                                {sub.status}
                              </Badge>
                            ) : '-'}
                          </TableCell>
                        </TableRow>
                      ))}
                      {!result.subdomains?.length && (
                        <TableRow>
                          <TableCell colSpan={3} className="h-24 text-center font-mono text-muted-foreground text-sm">
                            No subdomains discovered
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </ScrollArea>
              </CardContent>
            </Card>

            <Card className="border-border bg-card">
              <CardHeader className="border-b border-border bg-muted/30">
                <CardTitle className="font-sans text-lg flex items-center gap-2">
                  <Code className="h-5 w-5 text-primary" /> Technologies
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <ScrollArea className="h-[400px]">
                  <Table>
                    <TableHeader className="bg-muted/50 sticky top-0">
                      <TableRow className="border-border">
                        <TableHead className="font-mono text-xs text-muted-foreground">NAME</TableHead>
                        <TableHead className="font-mono text-xs text-muted-foreground">CATEGORY</TableHead>
                        <TableHead className="font-mono text-xs text-muted-foreground">VERSION</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {result.technologies?.map((tech, i) => (
                        <TableRow key={i} className="border-border">
                          <TableCell className="font-mono text-sm font-bold text-primary">{tech.name}</TableCell>
                          <TableCell className="font-mono text-xs text-muted-foreground">{tech.category || '-'}</TableCell>
                          <TableCell className="font-mono text-xs">{tech.version || '-'}</TableCell>
                        </TableRow>
                      ))}
                      {!result.technologies?.length && (
                        <TableRow>
                          <TableCell colSpan={3} className="h-24 text-center font-mono text-muted-foreground text-sm">
                            No technologies detected
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* WHOIS TAB */}
        <TabsContent value="whois" className="mt-4">
          <Card className="border-border bg-card">
            <CardHeader className="border-b border-border bg-muted/30">
              <CardTitle className="font-sans text-lg flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" /> WHOIS Registration
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              {result.whois ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-6">
                    <div>
                      <h4 className="font-mono text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Registrar Info</h4>
                      <div className="grid grid-cols-2 gap-2 text-sm font-mono border border-border rounded-md p-4 bg-muted/20">
                        <div className="text-muted-foreground">Registrar:</div>
                        <div className="text-foreground text-right">{result.whois.registrar || '-'}</div>
                        <div className="text-muted-foreground">Organization:</div>
                        <div className="text-foreground text-right">{result.whois.registrantOrg || '-'}</div>
                        <div className="text-muted-foreground">Country:</div>
                        <div className="text-foreground text-right">{result.whois.registrantCountry || '-'}</div>
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="font-mono text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Important Dates</h4>
                      <div className="grid grid-cols-2 gap-2 text-sm font-mono border border-border rounded-md p-4 bg-muted/20">
                        <div className="text-muted-foreground">Created:</div>
                        <div className="text-foreground text-right">{result.whois.createdDate ? format(new Date(result.whois.createdDate), "yyyy-MM-dd") : '-'}</div>
                        <div className="text-muted-foreground">Expires:</div>
                        <div className="text-foreground text-right">{result.whois.expiresDate ? format(new Date(result.whois.expiresDate), "yyyy-MM-dd") : '-'}</div>
                        <div className="text-muted-foreground">Updated:</div>
                        <div className="text-foreground text-right">{result.whois.updatedDate ? format(new Date(result.whois.updatedDate), "yyyy-MM-dd") : '-'}</div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div>
                      <h4 className="font-mono text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Name Servers</h4>
                      <div className="border border-border rounded-md p-4 bg-muted/20">
                        {result.whois.nameServers && result.whois.nameServers.length > 0 ? (
                          <ul className="font-mono text-sm space-y-1">
                            {result.whois.nameServers.map((ns, i) => (
                              <li key={i} className="flex items-center gap-2">
                                <Terminal className="h-3 w-3 text-primary" /> {ns}
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <span className="font-mono text-sm text-muted-foreground">No nameservers found</span>
                        )}
                      </div>
                    </div>

                    <div>
                      <h4 className="font-mono text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Status</h4>
                      <div className="border border-border rounded-md p-4 bg-muted/20 flex flex-wrap gap-2">
                        {result.whois.status && result.whois.status.length > 0 ? (
                          result.whois.status.map((status, i) => (
                            <Badge key={i} variant="secondary" className="font-mono text-[10px] uppercase">
                              {status.split(' ')[0]}
                            </Badge>
                          ))
                        ) : (
                          <span className="font-mono text-sm text-muted-foreground">No status info</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="h-40 flex items-center justify-center font-mono text-muted-foreground">
                  No WHOIS data available
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* SHODAN TAB */}
        <TabsContent value="shodan" className="mt-4 space-y-4">
          {result.shodan && result.shodan.length > 0 ? (
            result.shodan.map((host, i) => (
              <Card key={i} className="border-border bg-card">
                <CardHeader className="border-b border-border bg-muted/30">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="font-sans text-lg flex items-center gap-2">
                        <Server className="h-5 w-5 text-primary" /> Shodan Host: {host.ip}
                      </CardTitle>
                      <CardDescription className="font-mono text-xs mt-1">
                        {host.org} • {host.city ? `${host.city}, ` : ''}{host.country} • ASN: {host.asn}
                      </CardDescription>
                    </div>
                    {host.lastUpdate && (
                      <Badge variant="outline" className="font-mono text-xs bg-background">
                        Updated: {format(new Date(host.lastUpdate), "yyyy-MM-dd")}
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="grid grid-cols-1 lg:grid-cols-3 divide-y lg:divide-y-0 lg:divide-x border-b border-border">
                    <div className="p-4 bg-muted/10">
                      <h4 className="font-mono text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">Host Info</h4>
                      <div className="space-y-2 font-mono text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">OS:</span>
                          <span>{host.os || '-'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">ISP:</span>
                          <span className="text-right">{host.isp || '-'}</span>
                        </div>
                      </div>
                      
                      {host.tags && host.tags.length > 0 && (
                        <div className="mt-4">
                          <h5 className="font-mono text-xs text-muted-foreground mb-2">Tags</h5>
                          <div className="flex flex-wrap gap-1">
                            {host.tags.map(tag => (
                              <Badge key={tag} variant="secondary" className="text-[10px] font-mono">{tag}</Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      {host.vulns && host.vulns.length > 0 && (
                        <div className="mt-4">
                          <h5 className="font-mono text-xs text-destructive mb-2 flex items-center gap-1">
                            <AlertTriangle className="h-3 w-3" /> Vulnerabilities (CVE)
                          </h5>
                          <div className="flex flex-wrap gap-1">
                            {host.vulns.map(vuln => (
                              <Badge key={vuln} variant="destructive" className="text-[10px] font-mono bg-destructive/20 text-destructive border-destructive/30 hover:bg-destructive/30">
                                {vuln}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                    
                    <div className="lg:col-span-2 p-0">
                      <Table>
                        <TableHeader className="bg-muted/20">
                          <TableRow className="border-border">
                            <TableHead className="font-mono text-xs text-muted-foreground w-20">PORT</TableHead>
                            <TableHead className="font-mono text-xs text-muted-foreground w-32">SERVICE</TableHead>
                            <TableHead className="font-mono text-xs text-muted-foreground">PRODUCT / VERSION</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {host.services?.map((svc: ShodanService, idx: number) => (
                            <TableRow key={idx} className="border-border">
                              <TableCell className="font-mono font-bold text-primary">
                                <div className="flex items-center gap-1">
                                  <Terminal className="h-3 w-3 text-muted-foreground" />
                                  {svc.port}/{svc.transport || 'tcp'}
                                </div>
                              </TableCell>
                              <TableCell className="font-mono text-xs text-muted-foreground">
                                {svc.banner ? (
                                  <span className="truncate max-w-[120px] inline-block" title={svc.banner}>
                                    {svc.banner.substring(0, 20)}...
                                  </span>
                                ) : '-'}
                              </TableCell>
                              <TableCell className="font-mono text-sm">
                                {svc.product ? (
                                  <span>{svc.product} <span className="text-muted-foreground text-xs">{svc.version}</span></span>
                                ) : '-'}
                              </TableCell>
                            </TableRow>
                          ))}
                          {!host.services?.length && host.ports && host.ports.map((port: number) => (
                            <TableRow key={port} className="border-border">
                              <TableCell className="font-mono font-bold text-primary">
                                <div className="flex items-center gap-1">
                                  <Terminal className="h-3 w-3 text-muted-foreground" />
                                  {port}
                                </div>
                              </TableCell>
                              <TableCell colSpan={2} className="font-mono text-xs text-muted-foreground">-</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <Card className="border-border bg-card">
              <CardContent className="h-40 flex items-center justify-center font-mono text-muted-foreground">
                No Shodan data available for this target
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* EMAILS TAB */}
        <TabsContent value="emails" className="mt-4 space-y-4">
          {result.emailStats && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <Card className="border-border bg-card/50">
                <CardContent className="p-4 flex items-center justify-between">
                  <div>
                    <p className="font-mono text-xs text-muted-foreground uppercase">Total Found</p>
                    <p className="font-mono text-2xl text-primary font-bold">{result.emailStats.total || 0}</p>
                  </div>
                  <Mail className="h-8 w-8 text-muted-foreground opacity-50" />
                </CardContent>
              </Card>
              <Card className="border-border bg-card/50">
                <CardContent className="p-4 flex items-center justify-between">
                  <div>
                    <p className="font-mono text-xs text-muted-foreground uppercase">Pattern</p>
                    <p className="font-mono text-sm text-primary font-bold mt-1">{result.emailStats.pattern || 'Unknown'}</p>
                  </div>
                  <Code className="h-8 w-8 text-muted-foreground opacity-50" />
                </CardContent>
              </Card>
              <Card className="border-border bg-card/50">
                <CardContent className="p-4 flex items-center justify-between">
                  <div>
                    <p className="font-mono text-xs text-muted-foreground uppercase">Organization</p>
                    <p className="font-mono text-sm text-primary font-bold mt-1 truncate max-w-[150px]">{result.emailStats.organization || 'Unknown'}</p>
                  </div>
                  <Search className="h-8 w-8 text-muted-foreground opacity-50" />
                </CardContent>
              </Card>
            </div>
          )}

          <Card className="border-border bg-card">
            <CardHeader className="border-b border-border bg-muted/30">
              <CardTitle className="font-sans text-lg flex items-center gap-2">
                <Mail className="h-5 w-5 text-primary" /> Discovered Emails
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="h-[500px]">
                <Table>
                  <TableHeader className="bg-muted/50 sticky top-0">
                    <TableRow className="border-border">
                      <TableHead className="font-mono text-xs text-muted-foreground">EMAIL ADDRESS</TableHead>
                      <TableHead className="font-mono text-xs text-muted-foreground">NAME</TableHead>
                      <TableHead className="font-mono text-xs text-muted-foreground">ROLE / DEPT</TableHead>
                      <TableHead className="font-mono text-xs text-muted-foreground w-24">CONFIDENCE</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {result.emails?.map((email, i) => (
                      <TableRow key={i} className="border-border">
                        <TableCell className="font-mono text-sm font-bold text-primary">{email.email}</TableCell>
                        <TableCell className="font-mono text-sm">
                          {email.firstName || email.lastName ? `${email.firstName || ''} ${email.lastName || ''}`.trim() : '-'}
                        </TableCell>
                        <TableCell className="font-mono text-xs text-muted-foreground">
                          {email.position && email.department 
                            ? `${email.position} (${email.department})`
                            : email.position || email.department || '-'}
                        </TableCell>
                        <TableCell>
                          {email.confidence ? (
                            <Badge variant={email.confidence > 80 ? 'default' : 'secondary'} className="font-mono text-[10px]">
                              {email.confidence}%
                            </Badge>
                          ) : '-'}
                        </TableCell>
                      </TableRow>
                    ))}
                    {!result.emails?.length && (
                      <TableRow>
                        <TableCell colSpan={4} className="h-32 text-center font-mono text-muted-foreground text-sm">
                          No email addresses discovered
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* THREAT TAB */}
        <TabsContent value="threat" className="mt-4">
          <Card className={`border-border ${result.blacklist?.listed ? 'bg-destructive/5' : 'bg-card'}`}>
            <CardHeader className="border-b border-border bg-muted/30">
              <CardTitle className="font-sans text-lg flex items-center gap-2">
                <ShieldAlert className={`h-5 w-5 ${result.blacklist?.listed ? 'text-destructive' : 'text-primary'}`} /> 
                Blacklist Intelligence
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              {result.blacklist ? (
                <div className="space-y-6">
                  <div className="flex items-center gap-4">
                    <div className={`h-16 w-16 rounded-full flex items-center justify-center ${result.blacklist.listed ? 'bg-destructive/20 text-destructive' : 'bg-success/20 text-success'}`}>
                      {result.blacklist.listed ? <AlertTriangle className="h-8 w-8" /> : <ShieldCheck className="h-8 w-8" />}
                    </div>
                    <div>
                      <h3 className="font-mono text-xl font-bold text-foreground">
                        {result.blacklist.listed ? 'Threats Detected' : 'No Threats Found'}
                      </h3>
                      <p className="font-mono text-sm text-muted-foreground">
                        Listed on {result.blacklist.listCount || 0} out of checked threat intelligence feeds.
                      </p>
                    </div>
                  </div>

                  {result.blacklist.listed && result.blacklist.lists && result.blacklist.lists.length > 0 && (
                    <div className="mt-6 border border-destructive/20 rounded-md overflow-hidden">
                      <div className="bg-destructive/10 px-4 py-2 border-b border-destructive/20">
                        <h4 className="font-mono text-sm font-bold text-destructive uppercase">Active Listings</h4>
                      </div>
                      <ul className="divide-y divide-destructive/10">
                        {result.blacklist.lists.map((list, i) => (
                          <li key={i} className="px-4 py-3 flex items-center gap-3">
                            <Zap className="h-4 w-4 text-destructive" />
                            <span className="font-mono text-sm text-foreground">{list}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {result.blacklist.details && (
                    <div className="mt-4 p-4 bg-muted/30 border border-border rounded-md font-mono text-sm text-muted-foreground whitespace-pre-wrap">
                      {result.blacklist.details}
                    </div>
                  )}
                </div>
              ) : (
                <div className="h-40 flex items-center justify-center font-mono text-muted-foreground">
                  No blacklist intelligence available
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function AlertTriangle(props: React.SVGProps<SVGSVGElement>) {
  return <AlertCircle {...props} />;
}
