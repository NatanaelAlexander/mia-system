"use client";

import {
  LayoutDashboard,
  LifeBuoy,
  LogOut,
  UserRound,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { canAccessModule } from "@/components/app/shared/permissions";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
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
  SidebarSeparator,
} from "@/components/ui/sidebar";
import { appModuleNav } from "./navigation";

const mainNav = [
  { title: "Dashboard", href: "/app", icon: LayoutDashboard },
];

const systemNav = [
  { title: "Perfil", href: "/app/profile", icon: UserRound },
  { title: "Soporte", href: "#", icon: LifeBuoy },
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

        <SidebarSeparator />

        <SidebarGroup>
          <SidebarGroupLabel>Sistema</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className={menuListClassName}>
              {systemNav.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    className={menuButtonClassName}
                    render={<Link href={item.href} />}
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
                  "flex w-full items-center gap-2 rounded-lg p-2 text-left text-sm outline-hidden hover:bg-sidebar-accent",
                )}
                render={<button type="button" />}
              >
                <Avatar className="size-8">
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
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuGroup>
                  <DropdownMenuLabel>Mi cuenta</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => logout()}>
                    <LogOut />
                    Cerrar sesión
                  </DropdownMenuItem>
                </DropdownMenuGroup>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}
