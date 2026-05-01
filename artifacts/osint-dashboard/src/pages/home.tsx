import { useState } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useStartScan } from "@workspace/api-client-react";
import { Activity, Search, ShieldAlert, Terminal, AlertTriangle, AlertCircle, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { ScanResultDisplay } from "@/components/scan-result";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import type { ScanResult } from "@workspace/api-client-react/src/generated/api.schemas";

const scanSchema = z.object({
  target: z.string().min(3, "Target is required").refine((val) => {
    // Basic IP or Domain validation
    const ipRegex = /^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$/;
    const domainRegex = /^[a-zA-Z0-9][a-zA-Z0-9-]{1,61}[a-zA-Z0-9]\.[a-zA-Z]{2,}$/;
    return ipRegex.test(val) || domainRegex.test(val);
  }, "Must be a valid IP address or domain name"),
});

export function Home() {
  const [activeScan, setActiveScan] = useState<ScanResult | null>(null);
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const form = useForm<z.infer<typeof scanSchema>>({
    resolver: zodResolver(scanSchema),
    defaultValues: { target: "" },
  });

  const startScan = useStartScan();

  const onSubmit = async (values: z.infer<typeof scanSchema>) => {
    try {
      setActiveScan(null);
      const result = await startScan.mutateAsync({ data: values });
      setActiveScan(result);
      toast({
        title: "Scan Complete",
        description: `Successfully scanned ${values.target}`,
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Scan Failed",
        description: error.message || "An error occurred during the scan.",
      });
    }
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight font-sans text-primary">Intelligence Scanner</h1>
          <p className="text-muted-foreground mt-1 font-mono text-sm">
            Execute comprehensive reconnaissance on target domains and IP addresses.
          </p>
        </div>
      </div>

      <Card className="border-border bg-card shadow-sm">
        <CardContent className="p-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="flex items-start gap-4">
              <FormField
                control={form.control}
                name="target"
                render={({ field }) => (
                  <FormItem className="flex-1">
                    <FormControl>
                      <div className="relative">
                        <Terminal className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                        <Input
                          placeholder="Enter domain (e.g. example.com) or IP address..."
                          className="pl-10 font-mono text-lg h-12 bg-background border-border"
                          {...field}
                          disabled={startScan.isPending}
                        />
                      </div>
                    </FormControl>
                    <FormMessage className="font-mono text-xs mt-2" />
                  </FormItem>
                )}
              />
              <Button 
                type="submit" 
                size="lg" 
                className="h-12 px-8 font-mono tracking-wider font-bold"
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
        </CardContent>
      </Card>

      {startScan.isPending && (
        <Card className="border-border border-dashed bg-card/50">
          <CardContent className="p-12 text-center flex flex-col items-center justify-center space-y-4">
            <Activity className="h-8 w-8 animate-spin text-primary" />
            <div className="space-y-1">
              <h3 className="font-mono font-bold text-lg">Executing Modules</h3>
              <p className="text-sm font-mono text-muted-foreground">Gathering intelligence. This may take 10-30 seconds...</p>
            </div>
            <div className="w-full max-w-md pt-4">
              <div className="h-1 w-full bg-border overflow-hidden rounded-full">
                <div className="h-full bg-primary animate-pulse w-full origin-left" style={{ animationDuration: '2s' }}></div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {activeScan && !startScan.isPending && (
        <ScanResultDisplay result={activeScan} />
      )}

      {!activeScan && !startScan.isPending && (
        <Card className="border-border border-dashed bg-card/20">
          <CardContent className="p-16 text-center flex flex-col items-center justify-center space-y-4">
            <ShieldAlert className="h-12 w-12 text-muted-foreground opacity-50" />
            <div className="space-y-2 max-w-md">
              <h3 className="font-sans font-bold text-xl">Awaiting Target</h3>
              <p className="text-sm text-muted-foreground font-mono">
                Enter a target above to begin reconnaissance. The scan will query DNS, WHOIS, Shodan, subdomains, open ports, and compile threat intelligence automatically.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
