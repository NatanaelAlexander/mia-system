"use client";

import { CircleHelp } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface HelpHintProps {
  label: string;
  text: string;
  side?: "top" | "bottom" | "left" | "right";
}

export function HelpHint({ label, text, side = "top" }: HelpHintProps) {
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <span
            role="img"
            tabIndex={0}
            className="inline-flex size-4 shrink-0 cursor-help items-center justify-center rounded-full text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            aria-label={label}
            onClick={(event) => {
              event.preventDefault();
              event.stopPropagation();
            }}
          />
        }
      >
        <CircleHelp className="size-3.5" />
      </TooltipTrigger>
      <TooltipContent
        side={side}
        className="max-w-[240px] text-left leading-relaxed"
      >
        {text}
      </TooltipContent>
    </Tooltip>
  );
}
