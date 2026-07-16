"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowLeft, CircleHelp } from "lucide-react";
import {
  HELP_CATEGORIES,
  getHelpArticlesByCategory,
  type HelpCategoryId,
} from "@/lib/help";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Accordion,
  AccordionItem,
  AccordionPanel,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { cn } from "@/lib/utils";
import { HelpSectionView } from "./help-content";

const visibleCategories = HELP_CATEGORIES.filter(
  (category) => getHelpArticlesByCategory(category.id).length > 0,
);

export function HelpPage() {
  const [activeCategory, setActiveCategory] = React.useState<HelpCategoryId>(
    visibleCategories[0]?.id ?? "general",
  );

  const sectionRefs = React.useRef<Record<string, HTMLElement | null>>({});

  const handleNavClick = (categoryId: HelpCategoryId) => {
    setActiveCategory(categoryId);
    sectionRefs.current[categoryId]?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  };

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="space-y-2">
        <Link
          href="/app"
          className={buttonVariants({ variant: "outline", size: "sm" })}
        >
          <ArrowLeft />
          Volver
        </Link>
        <div className="flex items-center gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <CircleHelp className="size-5" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Ayuda</h1>
            <p className="text-sm text-muted-foreground">
              Guías, especificaciones y comandos del sistema.
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[220px_1fr] lg:items-start">
        <aside className="top-3 z-10 self-start lg:sticky">
          <nav
            aria-label="Categorías de ayuda"
            className="rounded-xl border border-border/70 bg-background/95 p-2 shadow-xs backdrop-blur supports-backdrop-filter:bg-background/80"
          >
            <ul className="flex flex-wrap gap-2 lg:max-h-[calc(100svh-8rem)] lg:flex-col lg:gap-1 lg:overflow-y-auto">
              {visibleCategories.map((category) => (
                <li key={category.id}>
                  <button
                    type="button"
                    onClick={() => handleNavClick(category.id)}
                    className={cn(
                      "w-full rounded-lg px-3 py-2 text-left text-sm font-medium transition-colors",
                      activeCategory === category.id
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:bg-muted/60 hover:text-foreground",
                    )}
                  >
                    {category.label}
                  </button>
                </li>
              ))}
            </ul>
          </nav>
        </aside>

        <div className="space-y-8">
          {visibleCategories.map((category) => {
            const articles = getHelpArticlesByCategory(category.id);

            return (
              <section
                key={category.id}
                ref={(node) => {
                  sectionRefs.current[category.id] = node;
                }}
                className="scroll-mt-4 space-y-3"
              >
                <Card>
                  <CardHeader>
                    <CardTitle>{category.label}</CardTitle>
                    <CardDescription>
                      {articles.length}{" "}
                      {articles.length === 1 ? "artículo" : "artículos"}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Accordion
                      defaultValue={articles.length === 1 ? [articles[0].id] : []}
                    >
                      {articles.map((article) => (
                        <AccordionItem key={article.id} value={article.id}>
                          <AccordionTrigger>
                            <span className="flex flex-col gap-0.5">
                              <span>{article.title}</span>
                              {article.description ? (
                                <span className="text-xs font-normal text-muted-foreground">
                                  {article.description}
                                </span>
                              ) : null}
                            </span>
                          </AccordionTrigger>
                          <AccordionPanel>
                            <div className="space-y-6">
                              {article.sections.map((section, index) => (
                                <HelpSectionView
                                  key={`${article.id}-${index}`}
                                  section={section}
                                />
                              ))}
                            </div>
                          </AccordionPanel>
                        </AccordionItem>
                      ))}
                    </Accordion>
                  </CardContent>
                </Card>
              </section>
            );
          })}
        </div>
      </div>
    </div>
  );
}
