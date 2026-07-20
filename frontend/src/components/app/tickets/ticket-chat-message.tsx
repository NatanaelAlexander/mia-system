"use client";

import { Download, FileText, Loader2 } from "lucide-react";
import type { AssetListItem } from "@/components/app/api/assets";
import type { TicketComment } from "@/components/app/api/tickets";
import { formatChatTime, formatFileSize } from "@/components/app/shared/format";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface TicketChatComment extends TicketComment {
  assets: AssetListItem[];
  assetSyncStatus?: "uploading" | "receiving";
}

interface TicketChatMessageProps {
  comment: TicketChatComment;
  isOwn: boolean;
  authorLabel: string;
  canDownload: boolean;
  onDownload: (asset: AssetListItem) => void;
}

function getInitials(label: string) {
  const parts = label.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) {
    return "?";
  }

  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }

  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

function AuthorNameWithCargos({
  label,
  jobTitles,
  isClient = false,
  alignEnd = false,
}: {
  label: string;
  jobTitles: string[];
  isClient?: boolean;
  alignEnd?: boolean;
}) {
  const hoverLabels = isClient ? ["Cliente"] : jobTitles;
  const hasHoverInfo = hoverLabels.length > 0;

  if (!hasHoverInfo) {
    return <span className="text-sm font-bold text-primary">{label}</span>;
  }

  return (
    <span className="group/author relative inline-flex flex-col gap-1">
      <span className="text-sm font-bold text-primary transition-opacity group-hover/author:opacity-90 group-focus-within/author:opacity-90">
        {label}
      </span>
      <span className="flex max-w-[15rem] flex-wrap gap-1 sm:hidden">
        {hoverLabels.map((title) => (
          <span
            key={title}
            className="inline-flex rounded-md bg-primary/15 px-2 py-0.5 text-[11px] font-medium leading-tight text-primary"
          >
            {title}
          </span>
        ))}
      </span>
      <span
        role="tooltip"
        className={cn(
          "pointer-events-none absolute bottom-[calc(100%+6px)] z-50 hidden",
          "max-w-[15rem] flex-wrap gap-1 rounded-lg p-1 sm:flex",
          "border border-primary/15 bg-popover/90 shadow-md backdrop-blur-md",
          "opacity-0 translate-y-0.5 transition-all duration-150",
          "group-hover/author:opacity-100 group-hover/author:translate-y-0",
          "group-focus-within/author:opacity-100 group-focus-within/author:translate-y-0",
          alignEnd ? "right-0" : "left-0",
        )}
      >
        {hoverLabels.map((title) => (
          <span
            key={title}
            className="inline-flex rounded-md bg-primary/15 px-2 py-0.5 text-[11px] font-medium leading-tight text-primary"
          >
            {title}
          </span>
        ))}
      </span>
    </span>
  );
}

export function TicketChatMessage({
  comment,
  isOwn,
  authorLabel,
  canDownload,
  onDownload,
}: TicketChatMessageProps) {
  const initials = getInitials(authorLabel === "Tú" ? "TU" : authorLabel);
  const jobTitles = comment.authorJobTitles ?? [];
  const isClient = Boolean(comment.authorIsClient);
  const assetStatusLabel =
    comment.assetSyncStatus === "uploading"
      ? "Subiendo adjuntos..."
      : comment.assetSyncStatus === "receiving"
        ? "Recibiendo adjuntos..."
        : null;

  return (
    <div
      className={cn(
        "flex w-full gap-2",
        isOwn ? "justify-end" : "justify-start",
      )}
    >
      {!isOwn ? (
        <Avatar size="sm" className="mt-6 shrink-0">
          <AvatarFallback className="bg-muted-foreground/15 text-[10px] font-semibold text-muted-foreground">
            {initials}
          </AvatarFallback>
        </Avatar>
      ) : null}

      <div
        className={cn(
          "flex max-w-[min(100%,34rem)] flex-col gap-1",
          isOwn ? "items-end" : "items-start",
        )}
      >
        <div
          className={cn(
            "flex flex-wrap items-center gap-x-2.5 gap-y-0.5",
            isOwn ? "justify-end" : "justify-start",
          )}
        >
          <AuthorNameWithCargos
            label={authorLabel}
            jobTitles={jobTitles}
            isClient={isClient}
            alignEnd={isOwn}
          />
          <span className="text-xs text-muted-foreground">
            {formatChatTime(comment.createdAt)}
          </span>
          {comment.isInternal ? (
            <Badge variant="outline" className="text-[10px]">
              Interno
            </Badge>
          ) : null}
        </div>

        <div
          className={cn(
            "w-full rounded-2xl px-3.5 py-2.5 text-sm shadow-sm",
            isOwn
              ? "rounded-br-md bg-primary text-primary-foreground"
              : "rounded-bl-md bg-muted text-foreground",
            comment.isInternal &&
              (isOwn
                ? "ring-2 ring-amber-400/40"
                : "bg-muted/80 ring-1 ring-amber-500/25"),
          )}
        >
          <p className="whitespace-pre-wrap leading-relaxed">{comment.comment}</p>

          {comment.assets.length > 0 ? (
            <div className="mt-2 space-y-2">
              {comment.assets.map((asset) => (
                <div
                  key={asset.id}
                  className={cn(
                    "flex items-center gap-2 rounded-xl px-2.5 py-2",
                    isOwn ? "bg-primary-foreground/10" : "bg-background/70",
                  )}
                >
                  <div
                    className={cn(
                      "flex size-9 shrink-0 items-center justify-center rounded-lg",
                      isOwn
                        ? "bg-primary-foreground/15 text-primary-foreground"
                        : "bg-muted-foreground/10 text-muted-foreground",
                    )}
                  >
                    <FileText className="size-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{asset.fileName}</p>
                    <p
                      className={cn(
                        "text-xs",
                        isOwn ? "text-primary-foreground/75" : "text-muted-foreground",
                      )}
                    >
                      {formatFileSize(asset.fileSize)}
                    </p>
                  </div>
                  {canDownload ? (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      className={cn(
                        isOwn &&
                          "text-primary-foreground hover:bg-primary-foreground/15 hover:text-primary-foreground",
                      )}
                      onClick={() => onDownload(asset)}
                    >
                      <Download />
                    </Button>
                  ) : null}
                </div>
              ))}
            </div>
          ) : null}

          {assetStatusLabel ? (
            <div
              className={cn(
                "mt-2 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs",
                isOwn
                  ? "bg-primary-foreground/10 text-primary-foreground/80"
                  : "bg-background/70 text-muted-foreground",
              )}
            >
              <Loader2 className="size-3 animate-spin" />
              {assetStatusLabel}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

export function TicketChatTypingIndicator({ names }: { names: string[] }) {
  if (names.length === 0) {
    return null;
  }

  const label = names.join(", ");

  return (
    <div className="flex w-full min-w-0 items-end gap-2">
      <Avatar size="sm" className="shrink-0">
        <AvatarFallback className="bg-muted-foreground/15 text-[10px] font-semibold text-muted-foreground">
          {getInitials(label)}
        </AvatarFallback>
      </Avatar>
      <div className="shrink-0 rounded-2xl rounded-bl-md bg-muted px-4 py-3">
        <div className="flex items-center gap-1">
          <span className="size-1.5 animate-bounce rounded-full bg-muted-foreground/70 [animation-delay:0ms]" />
          <span className="size-1.5 animate-bounce rounded-full bg-muted-foreground/70 [animation-delay:150ms]" />
          <span className="size-1.5 animate-bounce rounded-full bg-muted-foreground/70 [animation-delay:300ms]" />
        </div>
      </div>
      <span className="min-w-0 flex-1 truncate pb-1 text-xs text-muted-foreground">
        {label} está escribiendo...
      </span>
    </div>
  );
}
