"use client";

import {
  EllipsisVertical,
  LayoutDashboard,
  LogOut,
  UserRound,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { canAccessModule } from "@/components/app/shared/permissions";
import { formatRoles } from "@/components/app/shared/format";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar";
import { appModuleNav } from "./navigation";

const mainNav = [
  { title: "Dashboard", href: "/app", icon: LayoutDashboard },
];

const menuButtonClassName = cn(
  "rounded-lg",
  "data-active:bg-primary data-active:font-medium data-active:text-primary-foreground",
  "data-active:hover:bg-primary/90 data-active:hover:text-primary-foreground",
  "data-active:[&_svg]:text-primary-foreground",
);
const menuListClassName = "gap-2";

export function AppSidebar() {
  const pathname = usePathname();
  const { claims, logout } = useAuth();
  const moduleNav = appModuleNav.filter((item) => canAccessModule(claims, item));
  const roleLabel = formatRoles(claims?.roles ?? []);

  const initials = claims
    ? `${claims.firstName[0] ?? ""}${claims.lastName[0] ?? ""}`.toUpperCase()
    : "M";

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" render={<Link href="/app" />}>
                <img
                  src="/login/team_prime_dg.PNG"
                  alt="Team Prime"
                  className="h-8 w-auto group-data-[collapsible=icon]:hidden"
                />
                <img
                  src="/login/team_prime_dg.PNG"
                  alt="Team Prime"
                  className="hidden size-8 rounded-md object-contain group-data-[collapsible=icon]:block"
                />
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Principal</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className={menuListClassName}>
              {mainNav.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    className={menuButtonClassName}
                    render={<Link href={item.href} />}
                    isActive={
                      item.href === "/app"
                        ? pathname === "/app"
                        : pathname.startsWith(item.href)
                    }
                    tooltip={item.title}
                  >
                    <item.icon />
                    <span>{item.title}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
              {moduleNav.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    className={menuButtonClassName}
                    render={<Link href={item.href} />}
                    isActive={pathname.startsWith(item.href)}
                    tooltip={item.title}
                  >
                    <item.icon />
                    <span>{item.title}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger
                className={cn(
                  "flex w-full items-center gap-2 rounded-lg border border-sidebar-border/60 bg-sidebar-accent/20 p-2 text-left text-sm outline-hidden transition-colors hover:bg-sidebar-accent",
                )}
                render={<button type="button" />}
              >
                <Avatar className="size-8 shrink-0">
                  <AvatarFallback>{initials}</AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1 group-data-[collapsible=icon]:hidden">
                  <p className="truncate font-medium">
                    {claims?.firstName} {claims?.lastName}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    {claims?.email}
                  </p>
                </div>
                <EllipsisVertical className="size-4 shrink-0 text-muted-foreground group-data-[collapsible=icon]:hidden" />
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="start"
                side="top"
                sideOffset={8}
                className="w-(--anchor-width) min-w-56 p-0"
              >
                <div className="flex items-center gap-3 border-b px-3 py-3">
                  <Avatar className="size-10 shrink-0">
                    <AvatarFallback>{initials}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">
                      {claims?.firstName} {claims?.lastName}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {claims?.email}
                    </p>
                    <span className="mt-1 inline-block text-xs font-medium text-primary">
                      {roleLabel}
                    </span>
                  </div>
                </div>

                <div className="p-1">
                  <DropdownMenuItem
                    className="gap-2 rounded-md px-2 py-2"
                    render={<Link href="/app/profile" />}
                  >
                    <UserRound />
                    Perfil
                  </DropdownMenuItem>
                </div>

                <DropdownMenuSeparator className="mx-0" />

                <div className="p-1">
                  <DropdownMenuItem
                    className="gap-2 rounded-md px-2 py-2"
                    onClick={() => logout()}
                  >
                    <LogOut />
                    Cerrar sesión
                  </DropdownMenuItem>
                </div>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}
