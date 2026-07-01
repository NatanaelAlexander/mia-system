"use client";

import { Download, FileText } from "lucide-react";
import type { AssetListItem } from "@/components/app/api/assets";
import type { TicketComment } from "@/components/app/api/tickets";
import { formatChatTime, formatFileSize } from "@/components/app/shared/format";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface TicketChatComment extends TicketComment {
  assets: AssetListItem[];
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

export function TicketChatMessage({
  comment,
  isOwn,
  authorLabel,
  canDownload,
  onDownload,
}: TicketChatMessageProps) {
  const initials = getInitials(authorLabel === "Tú" ? "TU" : authorLabel);

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
          <span className="text-sm font-bold text-primary">{authorLabel}</span>
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
    <div className="flex w-full items-end gap-2">
      <Avatar size="sm" className="shrink-0">
        <AvatarFallback className="bg-muted-foreground/15 text-[10px] font-semibold text-muted-foreground">
          {getInitials(label)}
        </AvatarFallback>
      </Avatar>
      <div className="rounded-2xl rounded-bl-md bg-muted px-4 py-3">
        <div className="flex items-center gap-1">
          <span className="size-1.5 animate-bounce rounded-full bg-muted-foreground/70 [animation-delay:0ms]" />
          <span className="size-1.5 animate-bounce rounded-full bg-muted-foreground/70 [animation-delay:150ms]" />
          <span className="size-1.5 animate-bounce rounded-full bg-muted-foreground/70 [animation-delay:300ms]" />
        </div>
      </div>
      <span className="pb-1 text-xs text-muted-foreground">{label} está escribiendo...</span>
    </div>
  );
}
