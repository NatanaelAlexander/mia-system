"use client";

import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { RealtimeProvider } from "@/providers/realtime-provider";
import { NotificationsProvider } from "@/providers/notifications-provider";
import { AppSidebar } from "./app-sidebar";
import { Breadcrumbs } from "./breadcrumbs";
import { StyleThemeSwitcher } from "./style-theme-switcher";

export function DashboardShell({ children }: { children: React.ReactNode }) {
  return (
    <RealtimeProvider>
      <NotificationsProvider>
        <SidebarProvider defaultOpen>
          <AppSidebar />
          <SidebarInset>
            <header className="flex h-14 shrink-0 items-center gap-2 border-b px-4">
              <SidebarTrigger />
              <Separator orientation="vertical" className="mr-1 h-4" />
              <Breadcrumbs />
              <div className="ml-auto flex items-center gap-1">
                <StyleThemeSwitcher />
              </div>
            </header>
            <main className="flex-1 p-4 md:p-6">{children}</main>
          </SidebarInset>
        </SidebarProvider>
      </NotificationsProvider>
    </RealtimeProvider>
  );
}
