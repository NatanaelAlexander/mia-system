"use client";

import * as React from "react";
import { Loader2, X } from "lucide-react";
import type { TicketAssignee } from "@/components/app/api/tickets";
import type { UserListItem } from "@/components/app/api/users";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

const ALL_FILTER = "__all__";

export type TicketAssigneeCandidate = UserListItem & {
  roles: string[];
};

export function mergeAssigneeCandidates(
  superAdminUsers: UserListItem[],
  adminUsers: UserListItem[],
): TicketAssigneeCandidate[] {
  const map = new Map<string, TicketAssigneeCandidate>();

  for (const user of superAdminUsers) {
    map.set(user.id, { ...user, roles: ["super_admin"] });
  }

  for (const user of adminUsers) {
    const existing = map.get(user.id);
    if (existing) {
      if (!existing.roles.includes("admin")) {
        existing.roles = [...existing.roles, "admin"];
      }
    } else {
      map.set(user.id, { ...user, roles: ["admin"] });
    }
  }

  return [...map.values()].sort((a, b) => {
    const labelA = userLabel(a);
    const labelB = userLabel(b);
    return labelA.localeCompare(labelB, "es");
  });
}

function userLabel(
  user: Pick<UserListItem, "firstName" | "lastName" | "email">,
) {
  return `${user.firstName} ${user.lastName}`.trim() || user.email;
}

function roleLabel(role: string) {
  if (role === "super_admin") return "Superadmin";
  if (role === "admin") return "Admin";
  return role;
}

function formatRoles(roles: string[]) {
  const order = ["super_admin", "admin"];
  return [...roles]
    .sort((a, b) => order.indexOf(a) - order.indexOf(b))
    .map(roleLabel)
    .join(" · ");
}

interface TicketAssigneeCandidateListProps {
  candidates: TicketAssigneeCandidate[];
  assignees: TicketAssignee[];
  isDisabled?: boolean;
  isSaving?: boolean;
  isMandatory: (userId: string) => boolean;
  onAdd: (userId: string) => void;
  onRemove: (userId: string) => void;
  className?: string;
  /** When false, only shows the add dropdown (assignees rendered by parent). Default true. */
  showAssigned?: boolean;
}

export function TicketAssigneeCandidateList({
  candidates,
  assignees,
  isDisabled = false,
  isSaving = false,
  isMandatory,
  onAdd,
  onRemove,
  className,
  showAssigned = true,
}: TicketAssigneeCandidateListProps) {
  const [nameFilter, setNameFilter] = React.useState("");
  const [jobTitleFilter, setJobTitleFilter] = React.useState(ALL_FILTER);
  const [roleFilter, setRoleFilter] = React.useState(ALL_FILTER);
  const [addSelectKey, setAddSelectKey] = React.useState(0);

  const assignedIds = React.useMemo(
    () => new Set(assignees.map((assignee) => assignee.id)),
    [assignees],
  );

  const jobTitleOptions = React.useMemo(() => {
    const titles = new Set<string>();
    for (const candidate of candidates) {
      for (const title of candidate.jobTitles ?? []) {
        titles.add(title);
      }
    }
    return [...titles].sort((a, b) => a.localeCompare(b, "es"));
  }, [candidates]);

  const availableToAdd = React.useMemo(() => {
    const query = nameFilter.trim().toLowerCase();

    return candidates.filter((candidate) => {
      if (assignedIds.has(candidate.id)) {
        return false;
      }

      const label = userLabel(candidate).toLowerCase();
      const email = candidate.email.toLowerCase();
      const matchesName =
        query.length === 0 ||
        label.includes(query) ||
        email.includes(query);

      const matchesJobTitle =
        jobTitleFilter === ALL_FILTER ||
        (candidate.jobTitles ?? []).includes(jobTitleFilter);

      const matchesRole =
        roleFilter === ALL_FILTER || candidate.roles.includes(roleFilter);

      return matchesName && matchesJobTitle && matchesRole;
    });
  }, [assignedIds, candidates, jobTitleFilter, nameFilter, roleFilter]);

  const jobTitleItems = [
    { value: ALL_FILTER, label: "Todos los cargos" },
    ...jobTitleOptions.map((title) => ({ value: title, label: title })),
  ];

  const roleItems = [
    { value: ALL_FILTER, label: "Todos los roles" },
    { value: "super_admin", label: "Superadmin" },
    { value: "admin", label: "Admin" },
  ];

  const addItems = availableToAdd.map((candidate) => ({
    value: candidate.id,
    label: userLabel(candidate),
  }));

  const handleAdd = (userId: string | null) => {
    if (!userId || isDisabled || isSaving) {
      return;
    }
    onAdd(userId);
    setAddSelectKey((current) => current + 1);
  };

  return (
    <div className={cn("space-y-3", className)}>
      {showAssigned ? (
        <div className="flex flex-wrap gap-2">
          {assignees.length > 0 ? (
            assignees.map((assignee) => {
              const mandatory = isMandatory(assignee.id);
              const label = `${assignee.firstName} ${assignee.lastName}`.trim();
              const roleHint = assignee.isSuperAdmin
                ? "Superadmin"
                : formatRoles(assignee.roles);

              return (
                <Badge
                  key={assignee.id}
                  variant="secondary"
                  className="h-7 gap-1 pr-1"
                >
                  <span className="max-w-[14rem] truncate">
                    {label}
                    {roleHint ? ` · ${roleHint}` : ""}
                  </span>
                  {!mandatory ? (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      className="size-5 rounded-full text-muted-foreground hover:bg-foreground/10 hover:text-foreground"
                      disabled={isDisabled || isSaving}
                      aria-label={`Quitar a ${label}`}
                      onClick={() => onRemove(assignee.id)}
                    >
                      <X className="size-3!" />
                    </Button>
                  ) : null}
                </Badge>
              );
            })
          ) : (
            <span className="text-sm text-muted-foreground">
              Sin responsables
            </span>
          )}
          {isSaving ? (
            <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
              <Loader2 className="size-3.5 animate-spin" />
              Guardando...
            </span>
          ) : null}
        </div>
      ) : null}

      <div className="space-y-2 rounded-lg border border-border/70 p-3">
        <p className="text-sm font-medium">Agregar responsable</p>
        <div className="grid gap-2 sm:grid-cols-3">
          <Input
            value={nameFilter}
            onChange={(event) => setNameFilter(event.target.value)}
            placeholder="Filtrar por nombre..."
            aria-label="Filtrar por nombre"
            disabled={isDisabled || isSaving}
          />
          <Select
            items={jobTitleItems}
            value={jobTitleFilter}
            onValueChange={(value: string | null) =>
              setJobTitleFilter(value ?? ALL_FILTER)
            }
            disabled={isDisabled || isSaving}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Cargo" />
            </SelectTrigger>
            <SelectContent>
              {jobTitleItems.map((item) => (
                <SelectItem key={item.value} value={item.value}>
                  {item.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            items={roleItems}
            value={roleFilter}
            onValueChange={(value: string | null) =>
              setRoleFilter(value ?? ALL_FILTER)
            }
            disabled={isDisabled || isSaving}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Rol" />
            </SelectTrigger>
            <SelectContent>
              {roleItems.map((item) => (
                <SelectItem key={item.value} value={item.value}>
                  {item.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Select
          key={addSelectKey}
          items={addItems}
          value={null}
          onValueChange={handleAdd}
          disabled={isDisabled || isSaving || availableToAdd.length === 0}
        >
          <SelectTrigger className="w-full">
            <SelectValue
              placeholder={
                availableToAdd.length === 0
                  ? "No hay personas para agregar"
                  : "Buscar y agregar persona..."
              }
            />
          </SelectTrigger>
          <SelectContent>
            {availableToAdd.map((candidate) => {
              const titles = candidate.jobTitles ?? [];
              return (
                <SelectItem key={candidate.id} value={candidate.id}>
                  <span className="flex min-w-0 flex-col gap-0.5 py-0.5">
                    <span className="truncate font-medium">
                      {userLabel(candidate)}
                    </span>
                    <span className="truncate text-xs text-muted-foreground">
                      {[formatRoles(candidate.roles), ...titles]
                        .filter(Boolean)
                        .join(" · ")}
                    </span>
                  </span>
                </SelectItem>
              );
            })}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
