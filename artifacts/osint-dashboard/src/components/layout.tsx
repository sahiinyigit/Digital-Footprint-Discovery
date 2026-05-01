import { Link, useLocation } from "wouter";
import { Activity, History, Shield, Menu, Radio } from "lucide-react";
import { Button } from "./ui/button";
import { Sheet, SheetContent, SheetTrigger } from "./ui/sheet";

function SidebarContent({ location }: { location: string }) {
  const navLinks = [
    { href: "/", label: "Scanner", icon: Activity },
    { href: "/history", label: "History", icon: History },
  ];

  return (
    <>
      <div className="flex h-14 items-center gap-2.5 border-b border-primary/20 px-4">
        <div className="relative">
          <Shield className="h-6 w-6 text-primary" style={{ filter: 'drop-shadow(0 0 6px hsl(185 100% 52% / 0.8))' }} />
          <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-success pulse-dot" style={{ color: 'hsl(142 100% 45%)' }} />
        </div>
        <span className="font-mono font-bold tracking-tight text-primary text-sm">OSINT Platform</span>
      </div>

      <div className="px-4 py-3 border-b border-border/30">
        <div className="flex items-center gap-1.5">
          <Radio className="h-3 w-3 text-success animate-pulse" />
          <span className="font-mono text-[10px] text-muted-foreground uppercase tracking-widest">Systems Online</span>
        </div>
      </div>

      <nav className="flex-1 space-y-1 p-3">
        {navLinks.map((link) => {
          const Icon = link.icon;
          const isActive = location === link.href || (link.href !== "/" && location.startsWith(link.href));
          return (
            <Link key={link.href} href={link.href} className="block">
              <div className={`flex items-center gap-2.5 px-3 py-2.5 rounded font-mono text-sm transition-all cursor-pointer ${
                isActive
                  ? "bg-primary/15 text-primary border border-primary/30"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50 border border-transparent"
              }`}
                style={isActive ? { boxShadow: '0 0 8px hsl(185 100% 52% / 0.15), inset 0 0 8px hsl(185 100% 52% / 0.05)' } : {}}
              >
                <Icon className={`h-4 w-4 ${isActive ? 'text-primary' : ''}`} />
                {link.label}
                {isActive && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-primary" style={{ boxShadow: '0 0 4px hsl(185 100% 52%)' }} />}
              </div>
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-border/30">
        <p className="font-mono text-[9px] text-muted-foreground/50 uppercase tracking-widest">v1.0.0 · 12 modules</p>
      </div>
    </>
  );
}

export function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();

  return (
    <div className="flex min-h-screen w-full bg-background text-foreground">
      {/* Desktop Sidebar */}
      <aside className="hidden w-56 flex-col border-r border-primary/15 bg-card/80 md:flex" style={{ backdropFilter: 'blur(12px)' }}>
        <SidebarContent location={location} />
      </aside>

      {/* Mobile Header & Content */}
      <div className="flex flex-1 flex-col">
        <header className="flex h-14 items-center gap-4 border-b border-primary/15 bg-card/80 px-4 md:hidden">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="h-5 w-5 text-primary" />
                <span className="sr-only">Toggle navigation menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-56 p-0 bg-card border-primary/15">
              <div className="flex flex-col h-full">
                <SidebarContent location={location} />
              </div>
            </SheetContent>
          </Sheet>
          <div className="flex items-center gap-2 text-primary font-mono font-bold text-sm">
            <Shield className="h-5 w-5" style={{ filter: 'drop-shadow(0 0 4px hsl(185 100% 52% / 0.8))' }} />
            <span>OSINT Platform</span>
          </div>
        </header>

        <main className="flex-1 overflow-auto p-4 md:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
