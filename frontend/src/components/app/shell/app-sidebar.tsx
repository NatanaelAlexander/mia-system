"use client";

import {
  EllipsisVertical,
  ChevronDown,
  LayoutDashboard,
  LogOut,
  UserRound,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import * as React from "react";
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
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarRail,
} from "@/components/ui/sidebar";
import {
  appStandaloneNav,
  administrationNav,
  companiesNavGroup,
  companiesSectionHrefs,
  type NavModule,
} from "./navigation";

const mainNav = [
  { title: "Dashboard", href: "/app", icon: LayoutDashboard },
];

const menuButtonClassName = cn(
  "rounded-lg",
  "data-active:bg-primary data-active:font-medium data-active:text-primary-foreground",
  "data-active:hover:bg-primary/90 data-active:hover:text-primary-foreground",
  "data-active:[&_svg]:text-primary-foreground",
);

const subMenuButtonClassName = cn(
  "rounded-md",
  "data-active:bg-primary data-active:font-medium data-active:text-primary-foreground",
  "data-active:hover:bg-primary/90 data-active:hover:text-primary-foreground",
  "data-active:[&_svg]:text-primary-foreground",
);

const menuListClassName = "gap-2";

function isActivePath(pathname: string, href: string) {
  if (href === "/app") {
    return pathname === "/app";
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

function isCompaniesSection(pathname: string) {
  return companiesSectionHrefs.some((href) => isActivePath(pathname, href));
}

export function AppSidebar() {
  const pathname = usePathname();
  const { claims, logout } = useAuth();
  const roleLabel = formatRoles(claims?.roles ?? []);

  const companiesChildren = companiesNavGroup.children.filter((item) =>
    canAccessModule(claims, item),
  );
  const canAccessCompaniesParent = canAccessModule(claims, companiesNavGroup.parent);
  const showCompaniesGroup =
    canAccessCompaniesParent || companiesChildren.length > 0;

  const standaloneNav = appStandaloneNav.filter((item) =>
    canAccessModule(claims, item),
  );
  const adminNav = administrationNav.filter((item) =>
    canAccessModule(claims, item),
  );

  const [companiesOpen, setCompaniesOpen] = React.useState(() =>
    isCompaniesSection(pathname),
  );

  React.useEffect(() => {
    if (isCompaniesSection(pathname)) {
      setCompaniesOpen(true);
    }
  }, [pathname]);

  const initials = claims
    ? `${claims.firstName[0] ?? ""}${claims.lastName[0] ?? ""}`.toUpperCase()
    : "M";

  const renderNavItem = (item: NavModule) => (
    <SidebarMenuItem key={item.href}>
      <SidebarMenuButton
        className={menuButtonClassName}
        render={<Link href={item.href} />}
        isActive={isActivePath(pathname, item.href)}
        tooltip={item.title}
      >
        <item.icon />
        <span>{item.title}</span>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );

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
                    isActive={isActivePath(pathname, item.href)}
                    tooltip={item.title}
                  >
                    <item.icon />
                    <span>{item.title}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}

              {showCompaniesGroup ? (
                <SidebarMenuItem>
                  <div className="flex items-center gap-1">
                    {canAccessCompaniesParent ? (
                      <SidebarMenuButton
                        className={cn(menuButtonClassName, "min-w-0 flex-1")}
                        render={<Link href={companiesNavGroup.parent.href} />}
                        isActive={isActivePath(
                          pathname,
                          companiesNavGroup.parent.href,
                        )}
                        tooltip={companiesNavGroup.parent.title}
                      >
                        <companiesNavGroup.parent.icon />
                        <span>{companiesNavGroup.parent.title}</span>
                      </SidebarMenuButton>
                    ) : (
                      <SidebarMenuButton
                        className={cn(menuButtonClassName, "min-w-0 flex-1")}
                        tooltip={companiesNavGroup.parent.title}
                        onClick={() => setCompaniesOpen((open) => !open)}
                      >
                        <companiesNavGroup.parent.icon />
                        <span>{companiesNavGroup.parent.title}</span>
                      </SidebarMenuButton>
                    )}

                    {companiesChildren.length > 0 ? (
                      <button
                        type="button"
                        aria-label={
                          companiesOpen
                            ? "Ocultar submenú de empresas"
                            : "Mostrar submenú de empresas"
                        }
                        aria-expanded={companiesOpen}
                        onClick={() => setCompaniesOpen((open) => !open)}
                        className={cn(
                          "flex size-8 shrink-0 items-center justify-center rounded-lg text-muted-foreground outline-hidden transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground group-data-[collapsible=icon]:hidden",
                        )}
                      >
                        <ChevronDown
                          className={cn(
                            "size-4 transition-transform",
                            companiesOpen && "rotate-180",
                          )}
                        />
                      </button>
                    ) : null}
                  </div>

                  {companiesOpen && companiesChildren.length > 0 ? (
                    <SidebarMenuSub className="mt-1 gap-1.5 border-l border-sidebar-border/80">
                      {companiesChildren.map((item) => (
                        <SidebarMenuSubItem key={item.href}>
                          <SidebarMenuSubButton
                            className={subMenuButtonClassName}
                            render={<Link href={item.href} />}
                            isActive={isActivePath(pathname, item.href)}
                          >
                            <item.icon />
                            <span>{item.title}</span>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                      ))}
                    </SidebarMenuSub>
                  ) : null}
                </SidebarMenuItem>
              ) : null}

              {standaloneNav.map(renderNavItem)}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {adminNav.length > 0 ? (
          <SidebarGroup>
            <SidebarGroupLabel>Administración</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu className={menuListClassName}>
                {adminNav.map(renderNavItem)}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ) : null}
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
