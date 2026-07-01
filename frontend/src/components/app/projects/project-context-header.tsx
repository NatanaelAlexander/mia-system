"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ProjectContextHeaderProps {
  projectId: string;
  projectName: string;
  companyName?: string;
  sectionTitle: string;
  sectionDescription?: string;
}

export function ProjectContextHeader({
  projectId,
  projectName,
  companyName,
  sectionTitle,
  sectionDescription,
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

      <div className="space-y-1">
        <p className="text-sm text-muted-foreground">
          {companyName ? `${companyName} · ` : ""}
          {projectName}
        </p>
        <h1 className="text-2xl font-semibold tracking-tight">{sectionTitle}</h1>
        {sectionDescription ? (
          <p className="text-sm text-muted-foreground">{sectionDescription}</p>
        ) : null}
      </div>
    </div>
  );
}
