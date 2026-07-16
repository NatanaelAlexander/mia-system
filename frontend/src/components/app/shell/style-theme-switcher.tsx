"use client";

import { Palette } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useStyleTheme } from "@/providers/style-theme-provider";
import type { AppStyleId } from "@/lib/themes/registry";

export function StyleThemeSwitcher() {
  const { styleId, setStyleId, styles } = useStyleTheme();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            variant="ghost"
            size="icon"
            className="size-8"
            aria-label="Cambiar estilo"
          />
        }
      >
        <Palette />
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" sideOffset={8} className="min-w-56 p-1">
        <DropdownMenuRadioGroup
          value={styleId}
          onValueChange={(value) => {
            if (typeof value === "string") {
              setStyleId(value as AppStyleId);
            }
          }}
        >
          <DropdownMenuLabel>Apariencia</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {styles.map((style) => (
            <DropdownMenuRadioItem
              key={style.id}
              value={style.id}
              className="items-start gap-2 py-2"
            >
              <span
                aria-hidden
                className="mt-0.5 size-3.5 shrink-0 rounded-full ring-1 ring-border"
                style={{ backgroundColor: style.swatch }}
              />
              <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                <span className="truncate font-medium">{style.label}</span>
                <span className="truncate text-xs text-muted-foreground">
                  {style.description}
                </span>
              </span>
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
