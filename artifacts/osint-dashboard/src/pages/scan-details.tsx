import { useRoute, Link } from "wouter";
import { useGetScan, getGetScanQueryKey } from "@workspace/api-client-react";
import { Activity, ArrowLeft, Clock, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ScanResultDisplay } from "@/components/scan-result";
import { format } from "date-fns";

export function ScanDetails() {
  const [, params] = useRoute("/scan/:id");
  const id = params?.id ? parseInt(params.id) : 0;

  const { data: scan, isLoading, isError } = useGetScan(id, {
    query: {
      queryKey: getGetScanQueryKey(id),
      enabled: !!id,
    }
  });

  if (isLoading) {
    return (
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/history">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div className="h-8 w-64 bg-muted animate-pulse rounded" />
        </div>
        <Card className="border-border border-dashed bg-card/50">
          <CardContent className="p-12 text-center flex flex-col items-center justify-center space-y-4">
            <Activity className="h-8 w-8 animate-spin text-primary" />
            <div className="space-y-1">
              <h3 className="font-mono font-bold text-lg">Retrieving Report</h3>
              <p className="text-sm font-mono text-muted-foreground">Loading intelligence data from archive...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isError || !scan) {
    return (
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/history">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <h1 className="text-2xl font-bold font-sans text-primary">Error</h1>
        </div>
        <Card className="border-border border-dashed bg-card/20">
          <CardContent className="p-16 text-center flex flex-col items-center justify-center space-y-4">
            <ShieldAlert className="h-12 w-12 text-destructive opacity-80" />
            <div className="space-y-2 max-w-md">
              <h3 className="font-sans font-bold text-xl">Report Not Found</h3>
              <p className="text-sm text-muted-foreground font-mono">
                The requested intelligence report could not be located or has been deleted.
              </p>
            </div>
            <Link href="/history">
              <Button variant="outline" className="mt-4 font-mono font-bold tracking-wider">
                RETURN TO ARCHIVE
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" asChild className="h-10 w-10 rounded-full border-border">
            <Link href="/history">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold tracking-tight font-sans text-primary">{scan.target}</h1>
              <span className="px-2 py-1 rounded bg-muted text-muted-foreground font-mono text-xs uppercase font-bold tracking-wider border border-border">
                {scan.scanType}
              </span>
            </div>
            <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground font-mono">
              <Clock className="h-3 w-3" />
              Saved Report from {format(new Date(scan.timestamp), 'PPpp')}
            </div>
          </div>
        </div>
        <Button variant="default" asChild className="font-mono font-bold tracking-wider">
          <Link href={`/?target=${scan.target}`}>
            RE-SCAN TARGET
          </Link>
        </Button>
      </div>

      <ScanResultDisplay result={scan.result} />
    </div>
  );
}
