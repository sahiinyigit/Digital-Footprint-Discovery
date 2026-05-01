import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useStartScan } from "@workspace/api-client-react";
import { Activity, ShieldAlert, Terminal, Play, Cpu, Globe, Lock, Database, Mail, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { ScanResultDisplay } from "@/components/scan-result";
import { useToast } from "@/hooks/use-toast";
import type { ScanResult } from "@workspace/api-client-react";

const scanSchema = z.object({
  target: z.string().min(3, "Target is required").refine((val) => {
    const clean = val.trim().replace(/^https?:\/\//, "").split("/")[0];
    const ipRegex = /^(\d{1,3}\.){3}\d{1,3}$/;
    const domainRegex = /^[a-zA-Z0-9]([a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?)+$/;
    return ipRegex.test(clean) || domainRegex.test(clean);
  }, "Must be a valid IP address or domain name"),
});

const MODULES = [
  { icon: Database, label: "DNS Lookup" },
  { icon: Globe, label: "WHOIS" },
  { icon: Cpu, label: "Shodan" },
  { icon: Globe, label: "Subdomains" },
  { icon: Mail, label: "Email Discovery" },
  { icon: ShieldAlert, label: "Blacklists" },
  { icon: Terminal, label: "Technologies" },
  { icon: Database, label: "IP Netblocks" },
  { icon: Lock, label: "SSL Cert" },
  { icon: Shield, label: "HTTP Headers" },
  { icon: ShieldAlert, label: "Breach Check" },
  { icon: Globe, label: "Threat Intel" },
];

export function Home() {
  const [activeScan, setActiveScan] = useState<ScanResult | null>(null);
  const { toast } = useToast();

  const form = useForm<z.infer<typeof scanSchema>>({
    resolver: zodResolver(scanSchema),
    defaultValues: { target: "" },
  });

  const startScan = useStartScan();

  const onSubmit = async (values: z.infer<typeof scanSchema>) => {
    try {
      setActiveScan(null);
      const cleanTarget = values.target.trim().replace(/^https?:\/\//, "").split("/")[0].split(":")[0];
      const result = await startScan.mutateAsync({ data: { target: cleanTarget } });
      setActiveScan(result);
      toast({ title: "Scan Complete", description: `Intelligence gathered for ${cleanTarget}` });
    } catch (error: any) {
      toast({ variant: "destructive", title: "Scan Failed", description: error.message || "An error occurred during the scan." });
    }
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      {/* Header */}
      <div className="space-y-1">
        <h1 className="text-4xl font-bold tracking-tight font-sans text-primary text-glow-cyan cursor-blink">
          Intelligence Scanner
        </h1>
        <p className="text-muted-foreground font-mono text-sm">
          12 active modules · passive + active reconnaissance · DNS · WHOIS · Shodan · OSINT
        </p>
      </div>

      {/* Scanner Input */}
      <div className="relative rounded-lg border border-primary/30 bg-card border-glow-cyan scanline p-1">
        <div className="absolute inset-0 rounded-lg bg-gradient-to-br from-primary/5 via-transparent to-accent/5 pointer-events-none" />
        <div className="p-5">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="flex items-start gap-4">
              <FormField
                control={form.control}
                name="target"
                render={({ field }) => (
                  <FormItem className="flex-1">
                    <FormControl>
                      <div className="relative">
                        <span className="absolute left-3 top-3 font-mono text-primary text-lg font-bold">›_</span>
                        <Input
                          placeholder="target.domain.com or 192.168.1.1"
                          className="pl-10 font-mono text-lg h-12 bg-background/80 border-primary/40 text-primary placeholder:text-muted-foreground/50 focus:border-primary focus:ring-1 focus:ring-primary/50"
                          {...field}
                          disabled={startScan.isPending}
                        />
                      </div>
                    </FormControl>
                    <FormMessage className="font-mono text-xs mt-2 text-destructive" />
                  </FormItem>
                )}
              />
              <Button
                type="submit"
                size="lg"
                className="h-12 px-8 font-mono tracking-widest font-bold bg-primary text-primary-foreground hover:bg-primary/90 glow-cyan border-0"
                disabled={startScan.isPending}
              >
                {startScan.isPending ? (
                  <>
                    <Activity className="mr-2 h-4 w-4 animate-spin" />
                    SCANNING
                  </>
                ) : (
                  <>
                    <Play className="mr-2 h-4 w-4" />
                    LAUNCH SCAN
                  </>
                )}
              </Button>
            </form>
          </Form>

          {/* Module pills */}
          <div className="mt-4 flex flex-wrap gap-2">
            {MODULES.map(({ icon: Icon, label }) => (
              <span key={label} className="inline-flex items-center gap-1 rounded px-2 py-0.5 font-mono text-[10px] text-muted-foreground bg-muted/50 border border-border/50">
                <Icon className="h-3 w-3" />
                {label}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Scanning state */}
      {startScan.isPending && (
        <div className="relative rounded-lg border border-primary/40 bg-card/60 border-glow-cyan overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-accent/5 animate-pulse" />
          <div className="p-12 text-center flex flex-col items-center justify-center space-y-6 relative">
            <div className="relative">
              <div className="h-16 w-16 rounded-full border-2 border-primary/30 flex items-center justify-center">
                <Activity className="h-8 w-8 animate-spin text-primary" />
              </div>
              <div className="absolute inset-0 rounded-full border border-primary/20 animate-ping" />
            </div>
            <div className="space-y-1">
              <h3 className="font-mono font-bold text-xl text-primary text-glow-cyan">Executing Intelligence Modules</h3>
              <p className="text-sm font-mono text-muted-foreground">Running 12 parallel modules · This may take 15–45 seconds</p>
            </div>
            <div className="w-full max-w-sm">
              <div className="h-px w-full bg-border overflow-hidden rounded-full">
                <div className="h-full bg-primary animate-pulse w-full" style={{ boxShadow: '0 0 8px hsl(185 100% 52%)' }} />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Results */}
      {activeScan && !startScan.isPending && (
        <ScanResultDisplay result={activeScan} />
      )}

      {/* Awaiting state */}
      {!activeScan && !startScan.isPending && (
        <div className="rounded-lg border border-dashed border-border/40 bg-card/10">
          <div className="p-16 text-center flex flex-col items-center justify-center space-y-4">
            <div className="relative">
              <ShieldAlert className="h-16 w-16 text-primary/30" />
              <div className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-primary/40 pulse-dot" style={{ color: 'hsl(185 100% 52%)' }} />
            </div>
            <div className="space-y-2 max-w-md">
              <h3 className="font-sans font-bold text-2xl text-foreground/80">Awaiting Target</h3>
              <p className="text-sm text-muted-foreground font-mono leading-relaxed">
                Enter a domain or IP above to begin. All 12 intelligence modules will execute automatically — DNS, WHOIS, Shodan, subdomains, emails, SSL, security headers, breach data, and threat intelligence.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
