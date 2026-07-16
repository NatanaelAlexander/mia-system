"use client";

import type { HelpCommandBlock, HelpSection } from "@/lib/help";

function CommandBlock({ block }: { block: HelpCommandBlock }) {
  const hasSplit = Boolean(block.windows || block.linux);

  return (
    <div className="space-y-2">
      {block.label ? (
        <p className="text-xs font-medium text-muted-foreground">{block.label}</p>
      ) : null}

      {block.universal ? (
        <pre className="overflow-x-auto rounded-lg border border-border/70 bg-muted/40 p-3 font-mono text-xs leading-relaxed text-foreground">
          <code>{block.universal}</code>
        </pre>
      ) : null}

      {hasSplit ? (
        <div className="grid gap-2 sm:grid-cols-2">
          {block.windows ? (
            <div className="space-y-1">
              <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                Windows
              </p>
              <pre className="overflow-x-auto rounded-lg border border-border/70 bg-muted/40 p-3 font-mono text-xs leading-relaxed">
                <code>{block.windows}</code>
              </pre>
            </div>
          ) : null}
          {block.linux ? (
            <div className="space-y-1">
              <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                Linux
              </p>
              <pre className="overflow-x-auto rounded-lg border border-border/70 bg-muted/40 p-3 font-mono text-xs leading-relaxed">
                <code>{block.linux}</code>
              </pre>
            </div>
          ) : null}
        </div>
      ) : null}

      {block.note ? (
        <p className="text-xs text-muted-foreground">{block.note}</p>
      ) : null}
    </div>
  );
}

export function HelpSectionView({ section }: { section: HelpSection }) {
  return (
    <section className="space-y-3">
      {section.title ? (
        <h3 className="text-sm font-semibold text-foreground">{section.title}</h3>
      ) : null}

      {section.paragraphs?.map((paragraph) => (
        <p key={paragraph} className="text-sm leading-relaxed text-muted-foreground">
          {paragraph}
        </p>
      ))}

      {section.bullets?.length ? (
        <ul className="list-disc space-y-1.5 pl-5 text-sm text-muted-foreground">
          {section.bullets.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      ) : null}

      {section.table ? (
        <div className="overflow-x-auto rounded-lg border border-border/70">
          <table className="w-full min-w-[280px] text-left text-sm">
            <thead>
              <tr className="border-b border-border/70 bg-muted/30">
                {section.table.headers.map((header) => (
                  <th
                    key={header}
                    className="px-3 py-2 font-medium text-foreground"
                  >
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {section.table.rows.map((row) => (
                <tr
                  key={row.join("-")}
                  className="border-b border-border/50 last:border-0"
                >
                  {row.map((cell) => (
                    <td
                      key={cell}
                      className="px-3 py-2 align-top text-muted-foreground"
                    >
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}

      {section.commands?.map((command) => (
        <CommandBlock
          key={command.label ?? command.universal ?? command.windows}
          block={command}
        />
      ))}
    </section>
  );
}
