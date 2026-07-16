"use client";

import * as React from "react";
import type { UserListItem } from "@/components/app/api/users";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

const ALL_JOB_TITLES = "__all__";

function userLabel(
  user: Pick<UserListItem, "firstName" | "lastName" | "email">,
) {
  return `${user.firstName} ${user.lastName}`.trim() || user.email;
}

interface TicketAssigneeCandidateListProps {
  candidates: UserListItem[];
  selectedIds: string[];
  isDisabled?: boolean;
  isMandatory: (userId: string) => boolean;
  onToggle: (userId: string, checked: boolean) => void;
  className?: string;
  gridClassName?: string;
}

export function TicketAssigneeCandidateList({
  candidates,
  selectedIds,
  isDisabled = false,
  isMandatory,
  onToggle,
  className,
  gridClassName,
}: TicketAssigneeCandidateListProps) {
  const [nameFilter, setNameFilter] = React.useState("");
  const [jobTitleFilter, setJobTitleFilter] = React.useState(ALL_JOB_TITLES);

  const jobTitleOptions = React.useMemo(() => {
    const titles = new Set<string>();
    for (const candidate of candidates) {
      for (const title of candidate.jobTitles ?? []) {
        titles.add(title);
      }
    }
    return [...titles].sort((a, b) => a.localeCompare(b, "es"));
  }, [candidates]);

  const filteredCandidates = React.useMemo(() => {
    const query = nameFilter.trim().toLowerCase();

    return candidates.filter((candidate) => {
      const label = userLabel(candidate).toLowerCase();
      const email = candidate.email.toLowerCase();
      const matchesName =
        query.length === 0 ||
        label.includes(query) ||
        email.includes(query);

      const matchesJobTitle =
        jobTitleFilter === ALL_JOB_TITLES ||
        (candidate.jobTitles ?? []).includes(jobTitleFilter);

      return matchesName && matchesJobTitle;
    });
  }, [candidates, jobTitleFilter, nameFilter]);

  const jobTitleItems = [
    { value: ALL_JOB_TITLES, label: "Todos los cargos" },
    ...jobTitleOptions.map((title) => ({ value: title, label: title })),
  ];

  return (
    <div className={cn("space-y-2", className)}>
      <div className="grid gap-2 sm:grid-cols-2">
        <Input
          value={nameFilter}
          onChange={(event) => setNameFilter(event.target.value)}
          placeholder="Filtrar por nombre..."
          aria-label="Filtrar responsables por nombre"
        />
        <Select
          items={jobTitleItems}
          value={jobTitleFilter}
          onValueChange={(value: string | null) =>
            setJobTitleFilter(value ?? ALL_JOB_TITLES)
          }
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Filtrar por cargo" />
          </SelectTrigger>
          <SelectContent>
            {jobTitleItems.map((item) => (
              <SelectItem key={item.value} value={item.value}>
                {item.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div
        className={cn(
          "max-h-56 space-y-1 overflow-y-auto",
          gridClassName,
        )}
      >
        {filteredCandidates.length === 0 ? (
          <p className="px-1 py-3 text-sm text-muted-foreground">
            No hay usuarios que coincidan con el filtro.
          </p>
        ) : (
          filteredCandidates.map((candidate) => {
            const mandatory = isMandatory(candidate.id);
            const checked = selectedIds.includes(candidate.id);
            const titles = candidate.jobTitles ?? [];

            return (
              <label
                key={candidate.id}
                className={cn(
                  "flex items-center gap-2 rounded-md border px-2 py-1.5 text-sm",
                  checked
                    ? "border-primary/30 bg-primary/5"
                    : "border-transparent hover:bg-muted/40",
                )}
              >
                <input
                  type="checkbox"
                  checked={checked}
                  disabled={mandatory || isDisabled}
                  onChange={(event) =>
                    onToggle(candidate.id, event.target.checked)
                  }
                />
                <span className="min-w-0 flex-1">
                  <span className="block truncate">{userLabel(candidate)}</span>
                  {titles.length > 0 ? (
                    <span className="block truncate text-xs text-muted-foreground">
                      {titles.join(" · ")}
                    </span>
                  ) : null}
                </span>
                {mandatory ? (
                  <span className="shrink-0 text-xs text-muted-foreground">
                    Permanente
                  </span>
                ) : null}
              </label>
            );
          })
        )}
      </div>
    </div>
  );
}
