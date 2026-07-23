"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowLeft } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ProjectContextHeaderProps {
  projectId: string;
  projectName: string;
  companyName?: string;
  sectionTitle: string;
  sectionDescription?: string;
  actions?: React.ReactNode;
}

export function ProjectContextHeader({
  projectId,
  projectName,
  companyName,
  sectionTitle,
  sectionDescription,
  actions,
}: ProjectContextHeaderProps) {
  return (
    <div className="space-y-4">
      <Link
        href={`/app/projects/${projectId}`}
        className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
      >
        <ArrowLeft />
        Volver al proyecto
      </Link>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 space-y-1">
          <p className="text-sm text-muted-foreground">
            {companyName ? `${companyName} · ` : ""}
            {projectName}
          </p>
          <h1 className="line-clamp-2 text-xl font-bold tracking-tight break-words sm:text-2xl lg:text-3xl">
            {sectionTitle}
          </h1>
          {sectionDescription ? (
            <p className="text-sm text-muted-foreground">{sectionDescription}</p>
          ) : null}
        </div>
        {actions ? (
          <div className="flex shrink-0 flex-wrap items-center gap-2 sm:justify-end">
            {actions}
          </div>
        ) : null}
      </div>
    </div>
  );
}
