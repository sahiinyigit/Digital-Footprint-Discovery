import { format } from "date-fns";
import { Link } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import { useListScans, useDeleteScan, getListScansQueryKey } from "@workspace/api-client-react";
import { History as HistoryIcon, Search, ShieldAlert, Trash2, Globe, Server, Activity, ChevronRight, Clock, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export function History() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  const { data: scans, isLoading } = useListScans({ 
    query: { queryKey: getListScansQueryKey() } 
  });
  
  const deleteScan = useDeleteScan();

  const handleDelete = async (id: number) => {
    try {
      await deleteScan.mutateAsync({ id });
      queryClient.invalidateQueries({ queryKey: getListScansQueryKey() });
      toast({
        title: "Scan Deleted",
        description: "The scan record has been removed from history.",
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to delete the scan.",
      });
    }
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight font-sans text-primary">Scan History</h1>
          <p className="text-muted-foreground mt-1 font-mono text-sm">
            Previous intelligence reports and reconnaissance data.
          </p>
        </div>
      </div>

      <Card className="border-border bg-card shadow-sm">
        <CardHeader className="border-b border-border bg-muted/50 px-6 py-4">
          <div className="flex items-center gap-2">
            <HistoryIcon className="h-5 w-5 text-primary" />
            <CardTitle className="font-sans text-lg">Archive</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6 space-y-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="flex items-center space-x-4">
                  <Skeleton className="h-12 w-12" />
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-4 w-[250px]" />
                    <Skeleton className="h-4 w-[200px]" />
                  </div>
                </div>
              ))}
            </div>
          ) : !scans || scans.length === 0 ? (
            <div className="p-16 text-center flex flex-col items-center justify-center space-y-4">
              <ShieldAlert className="h-12 w-12 text-muted-foreground opacity-50" />
              <div className="space-y-2 max-w-md">
                <h3 className="font-sans font-bold text-xl">No Intelligence Data</h3>
                <p className="text-sm text-muted-foreground font-mono">
                  You haven't run any scans yet. Head to the Scanner to begin reconnaissance on a target.
                </p>
              </div>
              <Link href="/">
                <Button variant="outline" className="mt-4 font-mono font-bold tracking-wider">
                  LAUNCH SCANNER
                </Button>
              </Link>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="border-border hover:bg-transparent">
                  <TableHead className="font-mono text-xs font-bold text-muted-foreground">TARGET</TableHead>
                  <TableHead className="font-mono text-xs font-bold text-muted-foreground">TYPE</TableHead>
                  <TableHead className="font-mono text-xs font-bold text-muted-foreground">TIMESTAMP</TableHead>
                  <TableHead className="font-mono text-xs font-bold text-muted-foreground text-right">ACTIONS</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {scans.map((scan) => (
                  <TableRow key={scan.id} className="border-border hover:bg-muted/50 transition-colors">
                    <TableCell className="font-mono font-medium">
                      <div className="flex items-center gap-2">
                        {scan.scanType === 'domain' ? (
                          <Globe className="h-4 w-4 text-primary" />
                        ) : (
                          <Server className="h-4 w-4 text-warning" />
                        )}
                        {scan.target}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="font-mono uppercase text-xs border-border bg-background">
                        {scan.scanType}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-mono text-sm text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <Clock className="h-3 w-3" />
                        {format(new Date(scan.timestamp), 'yyyy-MM-dd HH:mm:ss')}
                      </div>
                    </TableCell>
                    <TableCell className="text-right space-x-2">
                      <Link href={`/scan/${scan.id}`}>
                        <Button variant="secondary" size="sm" className="font-mono text-xs h-8">
                          VIEW REPORT
                          <ChevronRight className="ml-2 h-3 w-3" />
                        </Button>
                      </Link>
                      
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="destructive" size="icon" className="h-8 w-8 bg-background border border-border text-destructive hover:bg-destructive hover:text-destructive-foreground">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent className="border-border bg-card">
                          <AlertDialogHeader>
                            <AlertDialogTitle className="font-sans font-bold">Delete Scan Record?</AlertDialogTitle>
                            <AlertDialogDescription className="font-mono text-sm">
                              This will permanently delete the intelligence report for {scan.target}. This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel className="font-mono font-bold">CANCEL</AlertDialogCancel>
                            <AlertDialogAction 
                              onClick={() => handleDelete(scan.id)}
                              className="font-mono font-bold bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              DELETE RECORD
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
