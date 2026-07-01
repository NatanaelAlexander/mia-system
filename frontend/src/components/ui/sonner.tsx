"use client";

import { Toaster as Sonner, type ToasterProps } from "sonner";

export function Toaster({ ...props }: ToasterProps) {
  return (
    <Sonner
      theme="dark"
      position="top-right"
      closeButton
      closeButtonPosition="right"
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            "group toast relative !bg-primary !text-primary-foreground !border-primary/30 !shadow-lg !rounded-lg !font-sans !pr-10",
          title: "!text-primary-foreground !font-medium",
          description: "!text-primary-foreground/80",
          content: "!text-primary-foreground",
          icon: "!text-primary-foreground",
          closeButton:
            "!absolute !right-2 !top-2 !left-auto !translate-x-0 !translate-y-0 !size-6 !rounded-md !bg-primary-foreground/10 !text-primary-foreground !border-primary-foreground/20 hover:!bg-primary-foreground/20",
          actionButton:
            "!bg-primary-foreground !text-primary !font-medium",
          cancelButton:
            "!bg-primary-foreground/10 !text-primary-foreground",
          success: "!bg-primary !text-primary-foreground !border-primary/30",
          info: "!bg-primary !text-primary-foreground !border-primary/30",
          warning:
            "!bg-primary !text-primary-foreground !border-l-4 !border-l-amber-300",
          error:
            "!bg-primary !text-primary-foreground !border-l-4 !border-l-destructive",
        },
      }}
      {...props}
    />
  );
}
