"use client";

import Link from "next/link";
import { ArrowRight, Files, Ticket } from "lucide-react";
import { MagicCard } from "@/components/ui/magic-card";
import { cn } from "@/lib/utils";

interface ProjectSectionCardsProps {
  projectId: string;
  className?: string;
  showTickets?: boolean;
  showAssets?: boolean;
}

const cards = [
  {
    key: "tickets",
    title: "Tickets",
    description: "Solicitudes y seguimiento de trabajo del proyecto.",
    href: (projectId: string) => `/app/projects/${projectId}/tickets`,
    icon: Ticket,
    gradientFrom: "#e8a85c",
    gradientTo: "#c4782f",
  },
  {
    key: "assets",
    title: "Archivos",
    description: "Documentos y adjuntos vinculados al proyecto.",
    href: (projectId: string) => `/app/projects/${projectId}/assets`,
    icon: Files,
    gradientFrom: "#d4a574",
    gradientTo: "#8f6b4f",
  },
] as const;

export function ProjectSectionCards({
  projectId,
  className,
  showTickets = true,
  showAssets = true,
}: ProjectSectionCardsProps) {
  const visibleCards = cards.filter((card) => {
    if (card.key === "tickets") {
      return showTickets;
    }

    if (card.key === "assets") {
      return showAssets;
    }

    return true;
  });

  return (
    <div className={cn("grid gap-4 sm:grid-cols-2", className)}>
      {visibleCards.map((card) => (
        <Link key={card.key} href={card.href(projectId)} className="block">
          <MagicCard
            className="h-full cursor-pointer"
            gradientFrom={card.gradientFrom}
            gradientTo={card.gradientTo}
          >
            <div className="flex h-full flex-col gap-3 p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <card.icon className="size-5" />
                </div>
                <ArrowRight className="size-4 text-muted-foreground transition-transform duration-300 group-hover:translate-x-0.5" />
              </div>
              <div className="space-y-1">
                <p className="text-base font-medium">{card.title}</p>
                <p className="text-sm text-muted-foreground">{card.description}</p>
              </div>
            </div>
          </MagicCard>
        </Link>
      ))}
    </div>
  );
}
