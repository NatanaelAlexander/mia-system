"use client";

import { Users, Wifi, WifiOff } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Avatar,
  AvatarFallback,
  AvatarGroup,
  AvatarGroupCount,
} from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { useRealtime } from "@/providers/realtime-provider";
import { cn } from "@/lib/utils";
import { DashboardCard } from "./dashboard-card";

function getInitials(firstName: string, lastName: string): string {
  return `${firstName[0] ?? ""}${lastName[0] ?? ""}`.toUpperCase();
}

function formatRole(role: string): string {
  if (role === "super_admin") return "Superadmin";
  if (role === "admin") return "Admin";
  if (role === "cliente") return "Cliente";
  return role;
}

function primaryRole(roles: string[]): string {
  if (roles.includes("super_admin")) return "super_admin";
  if (roles.includes("admin")) return "admin";
  if (roles.includes("cliente")) return "cliente";
  return roles[0] ?? "usuario";
}

export function DashboardConnectedUsers({
  className,
}: {
  className?: string;
}) {
  const { onlineUsers, isConnected, canWatchPresence } = useRealtime();

  if (!canWatchPresence) {
    return null;
  }

  const previewUsers = onlineUsers.slice(0, 5);
  const overflowCount = Math.max(0, onlineUsers.length - previewUsers.length);

  return (
    <DashboardCard className={cn("h-full", className)}>
      <div className="flex h-full flex-col gap-4 p-5">
        <div className="flex flex-col items-start gap-2 sm:flex-row sm:items-start sm:justify-between sm:gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Users className="size-5" />
              </div>
              <div>
                <p className="text-sm font-medium">Usuarios conectados</p>
                <p className="text-xs text-muted-foreground">
                  Sesiones activas en tiempo real
                </p>
              </div>
            </div>
          </div>
          <Badge
            variant={isConnected ? "secondary" : "outline"}
            className="gap-1.5"
          >
            {isConnected ? (
              <>
                <span className="relative flex size-2">
                  <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex size-2 rounded-full bg-emerald-500" />
                </span>
                <Wifi className="size-3.5" />
                <span className="hidden sm:inline">En vivo</span>
              </>
            ) : (
              <>
                <WifiOff className="size-3.5" />
                <span className="hidden sm:inline">Desconectado</span>
              </>
            )}
          </Badge>
        </div>

        <div className="flex items-center gap-3">
          <span className="font-mono text-4xl font-semibold tabular-nums">
            {onlineUsers.length}
          </span>
          {onlineUsers.length > 0 ? (
            <AvatarGroup>
              {previewUsers.map((user) => (
                <Avatar key={user.userId} size="sm">
                  <AvatarFallback>
                    {getInitials(user.firstName, user.lastName)}
                  </AvatarFallback>
                </Avatar>
              ))}
              {overflowCount > 0 ? (
                <AvatarGroupCount>+{overflowCount}</AvatarGroupCount>
              ) : null}
            </AvatarGroup>
          ) : (
            <p className="text-sm text-muted-foreground">
              Nadie conectado por ahora
            </p>
          )}
        </div>

        <div className="min-h-0 flex-1 space-y-2 overflow-y-auto">
          {!isConnected ? (
            <div className="space-y-2">
              {Array.from({ length: 3 }).map((_, index) => (
                <Skeleton key={index} className="h-10 w-full rounded-lg" />
              ))}
            </div>
          ) : onlineUsers.length === 0 ? (
            <div className="rounded-lg border border-dashed border-border/70 p-4 text-center text-sm text-muted-foreground">
              Sin usuarios conectados en este momento.
            </div>
          ) : (
            onlineUsers.map((user) => (
              <div
                key={user.userId}
                className="flex items-center justify-between gap-3 rounded-lg border border-border/60 bg-muted/20 px-3 py-2 transition-colors hover:bg-muted/40"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <Avatar size="sm">
                    <AvatarFallback>
                      {getInitials(user.firstName, user.lastName)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">
                      {user.firstName} {user.lastName}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {user.surfaces.join(" · ")}
                    </p>
                  </div>
                </div>
                <Badge variant="outline" className="shrink-0">
                  {formatRole(primaryRole(user.roles))}
                </Badge>
              </div>
            ))
          )}
        </div>
      </div>
    </DashboardCard>
  );
}
