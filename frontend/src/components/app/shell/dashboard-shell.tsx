"use client";

import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { RealtimeProvider } from "@/providers/realtime-provider";
import { NotificationsProvider } from "@/providers/notifications-provider";
import { AppSidebar } from "./app-sidebar";
import { Breadcrumbs } from "./breadcrumbs";
import { NotificationsMenu } from "./notifications-menu";
import { StyleThemeSwitcher } from "./style-theme-switcher";

export function DashboardShell({ children }: { children: React.ReactNode }) {
  return (
    <RealtimeProvider>
      <NotificationsProvider>
        <SidebarProvider defaultOpen>
          <AppSidebar />
          <SidebarInset className="min-h-0 min-w-0 h-svh max-h-svh overflow-hidden">
            <header className="z-20 flex h-14 shrink-0 items-center gap-2 border-b bg-background/95 px-3 backdrop-blur supports-backdrop-filter:bg-background/80 sm:px-4 pt-[env(safe-area-inset-top)]">
              <SidebarTrigger />
              <Separator orientation="vertical" className="mr-1 hidden h-4 sm:block" />
              <Breadcrumbs />
              <div className="ml-auto flex shrink-0 items-center gap-0.5 sm:gap-1">
                <NotificationsMenu variant="header" />
                <StyleThemeSwitcher />
              </div>
            </header>
            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-3 pb-[max(1rem,env(safe-area-inset-bottom))] sm:p-4 md:p-6">
              {children}
            </div>
          </SidebarInset>
        </SidebarProvider>
      </NotificationsProvider>
    </RealtimeProvider>
  );
}
