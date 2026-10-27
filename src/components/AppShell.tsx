import { useEffect } from "react";
import { Link, Outlet, useLocation, useRouter } from "@tanstack/react-router";
import { TonConnectUIProvider } from "@tonconnect/ui-react";
import { Gift, ListChecks, Trophy, UserRound } from "lucide-react";
import { StoreProvider, useStore } from "@/lib/store";
import { getWebApp } from "@/lib/telegram";
import { Toaster } from "@/components/ui/sonner";
import logo from "@/assets/tesla-icon.png";

const tabs = [
  { to: "/", icon: Gift, label: "Cases" },
  { to: "/earn", icon: ListChecks, label: "Earn" },
  { to: "/events", icon: Trophy, label: "Season" },
  { to: "/profile", icon: UserRound, label: "Profile" },
] as const;

function BackButtonSync() {
  const { pathname } = useLocation();
  const router = useRouter();
  useEffect(() => {
    const bb = getWebApp()?.BackButton;
    if (!bb) return;
    const onBack = () => router.history.back();
    if (pathname === "/") bb.hide();
    else { bb.show(); bb.onClick(onBack); }
    return () => bb.offClick?.(onBack);
  }, [pathname, router]);
  return null;
}

function Frame() {
  const { data, error, t, x, demo } = useStore();
  const { pathname } = useLocation();
  const router = useRouter();
  useEffect(() => { if (data) tabs.forEach(tab => { router.preloadRoute({ to: tab.to }).catch(() => {}); }); }, [!!data, router]);
  if (error) {
    return <div className="flex min-h-dvh items-center justify-center p-8 text-center text-muted-foreground">{error}</div>;
  }
  if (!data) {
    return (
      <div className="flex min-h-dvh items-center justify-center">
        <img src={logo} alt="TSLA" className="size-20 animate-pulse rounded-full" />
      </div>
    );
  }
  return (
    <div className="safe-top mx-auto flex min-h-dvh max-w-md flex-col px-5 pb-28">
      <div key={pathname} className="page-motion"><Outlet /></div>
      <nav className="safe-bottom fixed inset-x-0 bottom-0 z-40 mx-auto max-w-md px-5">
        <div className="glass-strong flex items-center justify-between gap-1 rounded-full p-1.5">
          {tabs.map(({ to, icon: Icon, label }) => {
            const active = to === "/" ? pathname === "/" || pathname.startsWith("/case/") : pathname === to;
            return (
              <Link key={to} to={to} preload="render"
                aria-label={label} aria-current={active ? "page" : undefined} data-active={active}
                className={`nav-item flex h-14 min-w-0 flex-col items-center justify-center gap-0.5 rounded-full ${active ? "" : "text-muted-foreground"}`}>
                <Icon className="size-6 shrink-0" strokeWidth={2.4} fill={active ? "currentColor" : "none"} />
                <span className="text-[12px] font-medium">{label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}

export default function AppShell() {
  const manifestUrl = `${window.location.origin}/tonconnect-manifest.json`;
  return (
    <TonConnectUIProvider manifestUrl={manifestUrl}>
      <StoreProvider>
        <BackButtonSync />
        <Frame />
        <Toaster className="app-notifications" position="bottom-center" offset={88} mobileOffset={88} duration={3500} visibleToasts={1} closeButton
          toastOptions={{ classNames: { toast: "glass-strong mx-auto flex w-[calc(100vw-40px)] max-w-sm items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold text-foreground", description: "text-xs font-medium text-muted-foreground", icon: "text-primary" } }} />
      </StoreProvider>
    </TonConnectUIProvider>
  );
}
