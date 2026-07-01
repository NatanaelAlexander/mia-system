"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface MagicCardProps extends React.ComponentProps<"div"> {
  gradientFrom?: string;
  gradientTo?: string;
  gradientSize?: number;
}

export function MagicCard({
  children,
  className,
  gradientFrom = "#e8a85c",
  gradientTo = "#b86a2e",
  gradientSize = 180,
  ...props
}: MagicCardProps) {
  const [position, setPosition] = React.useState({ x: -gradientSize, y: -gradientSize });
  const [hovering, setHovering] = React.useState(false);

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    setPosition({
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    });
  };

  const resetPosition = () => {
    setHovering(false);
    setPosition({ x: -gradientSize, y: -gradientSize });
  };

  return (
    <div
      className={cn(
        "group relative isolate overflow-hidden rounded-xl border border-border/70 bg-background transition-shadow duration-300 hover:shadow-md",
        className,
      )}
      onPointerMove={handlePointerMove}
      onPointerEnter={() => setHovering(true)}
      onPointerLeave={resetPosition}
      style={
        hovering
          ? {
              background: `linear-gradient(var(--color-background) 0 0) padding-box,
                radial-gradient(${gradientSize}px circle at ${position.x}px ${position.y}px,
                  ${gradientFrom},
                  ${gradientTo},
                  var(--color-border) 100%
                ) border-box`,
            }
          : undefined
      }
      {...props}
    >
      <div
        className={cn(
          "pointer-events-none absolute inset-px z-10 rounded-[inherit] bg-background transition-opacity duration-300",
          hovering ? "opacity-100" : "opacity-100",
        )}
      />
      <div
        className={cn(
          "pointer-events-none absolute inset-px z-20 rounded-[inherit] transition-opacity duration-300",
          hovering ? "opacity-100" : "opacity-0",
        )}
        style={{
          background: `radial-gradient(${gradientSize}px circle at ${position.x}px ${position.y}px,
            color-mix(in oklch, var(--primary) 22%, transparent),
            transparent 100%)`,
        }}
      />
      <div className="relative z-30">{children}</div>
    </div>
  );
}
