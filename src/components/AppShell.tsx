import { useEffect } from "react";
import { Link, Outlet, useLocation, useRouter } from "@tanstack/react-router";
import { TonConnectUIProvider } from "@tonconnect/ui-react";
import { Gift, ListChecks, Rocket, Trophy, UserRound } from "lucide-react";
import { StoreProvider, useStore } from "@/lib/store";
import { getWebApp } from "@/lib/telegram";
import { Toaster } from "@/components/ui/sonner";
import logo from "@/assets/tesla-icon.png";
import { AmbientBackdrop } from "@/components/AmbientBackdrop";

const tabs = [
  { to: "/crash", icon: Rocket, label: "Crash" },
  { to: "/", icon: Gift, label: "Cases" },
  { to: "/earn", icon: ListChecks, label: "Tasks" },
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
  const isActive = (to: string) => to === "/" ? pathname === "/" || pathname.startsWith("/case/") : pathname === to;
  const current = tabs.findIndex(tab => isActive(tab.to));
  return (
    <>
      <AmbientBackdrop vivid={pathname === "/crash"} />
      <div className={`app-frame relative z-10 mx-auto flex min-h-dvh max-w-md flex-col px-5 pb-28 ${pathname === "/crash" ? "crash-frame" : "safe-top"}`}>
        <div key={pathname} className={pathname === "/crash" ? "" : "page-motion"}><Outlet /></div>
        <nav aria-label="Main navigation" className="safe-bottom fixed inset-x-0 bottom-0 z-40 mx-auto max-w-md px-4">
          <div className="tabbar" style={{ ["--tab" as any]: current }}>
            {current >= 0 && <span className="tabbar-indicator" aria-hidden="true" />}
            {tabs.map(({ to, icon: Icon, label }) => {
              const active = isActive(to);
              return (
                <Link key={to} to={to} preload="render" aria-label={label} aria-current={active ? "page" : undefined} data-active={active} className="tab-item">
                  <Icon className="size-[22px]" strokeWidth={active ? 2.2 : 1.8} />
                  <span className="tab-label">{label}</span>
                </Link>
              );
            })}
          </div>
        </nav>
      </div>
    </>
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
