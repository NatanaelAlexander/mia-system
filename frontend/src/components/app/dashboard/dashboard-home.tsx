import { Building2, Ticket, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsPanel, TabsTab, TabsIndicator } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { DashboardActivity } from "./dashboard-activity";
import { DashboardCard } from "./dashboard-card";
import { DashboardConnectedUsers } from "./dashboard-connected-users";
import { DashboardStatCard } from "./dashboard-stat-card";
import { DashboardTicketsAreaChart } from "./dashboard-tickets-area-chart";
import { DonutChart } from "./donut-chart";

export interface CompanyStats {
  total: number;
  active: number;
  inactive: number;
}

export interface TicketStats {
  total: number;
  active: number;
  closed: number;
}

interface DashboardHomeProps {
  surfaces?: string[];
  companies: CompanyStats | null;
  tickets: TicketStats | null;
  canViewTicketsChart: boolean;
  canViewActivity: boolean;
  loadError?: string | null;
}

export function DashboardHome({
  surfaces = [],
  companies,
  tickets,
  canViewTicketsChart,
  canViewActivity,
  loadError,
}: DashboardHomeProps) {
  const hasMetrics = Boolean(companies) || Boolean(tickets);

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-8">
      <section className="animate-in fade-in slide-in-from-bottom-3 flex flex-wrap items-center gap-3 duration-500">
        <h1 className="text-xl font-semibold tracking-tight">Panel de control</h1>
        {surfaces.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {surfaces.map((surface) => (
              <Badge key={surface} variant="secondary" className="px-3 py-1">
                {surface}
              </Badge>
            ))}
          </div>
        ) : null}
      </section>

      {loadError ? (
        <p className="animate-in fade-in rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-center text-sm text-destructive duration-300">
          {loadError}
        </p>
      ) : null}

      {hasMetrics ? (
        <section
          className={cn(
            "animate-in fade-in slide-in-from-bottom-4 grid gap-4 duration-500",
            companies && tickets ? "sm:grid-cols-2 xl:grid-cols-4" : "sm:grid-cols-2",
          )}
          style={{ animationDelay: "80ms" }}
        >
          {companies ? (
            <>
              <DashboardStatCard
                label="Empresas totales"
                value={companies.total}
                helper="Registros visibles para tu usuario."
                icon={Building2}
              />
              <DashboardStatCard
                label="Empresas activas"
                value={companies.active}
                helper={`${companies.inactive} desactivadas en el sistema.`}
                icon={Building2}
              />
            </>
          ) : null}
          {tickets ? (
            <>
              <DashboardStatCard
                label="Tickets totales"
                value={tickets.total}
                helper="Incluye activos y cerrados."
                icon={Ticket}
              />
              <DashboardStatCard
                label="Tickets activos"
                value={tickets.active}
                helper={`${tickets.closed} cerrados actualmente.`}
                icon={Ticket}
              />
            </>
          ) : null}
        </section>
      ) : null}

      {canViewTicketsChart ? (
        <section
          className="animate-in fade-in slide-in-from-bottom-4 duration-500"
          style={{ animationDelay: "110ms" }}
        >
          <DashboardTicketsAreaChart />
        </section>
      ) : null}

      <section
        className="animate-in fade-in slide-in-from-bottom-4 grid gap-4 duration-500 lg:grid-cols-2 xl:grid-cols-3"
        style={{ animationDelay: "140ms" }}
      >
        {companies ? (
          <DashboardCard className="h-full">
            <div className="space-y-4 p-5">
              <div className="space-y-1 text-center sm:text-left">
                <p className="text-base font-medium">Empresas</p>
                <p className="text-sm text-muted-foreground">
                  Activas vs. desactivadas
                </p>
              </div>
              <DonutChart
                total={companies.total}
                centerLabel="Total"
                segments={[
                  {
                    label: "Activas",
                    value: companies.active,
                    color: "var(--chart-2)",
                  },
                  {
                    label: "Desactivadas",
                    value: companies.inactive,
                    color: "var(--muted-foreground)",
                  },
                ]}
              />
            </div>
          </DashboardCard>
        ) : null}

        {tickets ? (
          <DashboardCard className="h-full">
            <div className="space-y-4 p-5">
              <div className="space-y-1 text-center sm:text-left">
                <p className="text-base font-medium">Tickets</p>
                <p className="text-sm text-muted-foreground">
                  Activos vs. cerrados
                </p>
              </div>
              <DonutChart
                total={tickets.total}
                centerLabel="Total"
                segments={[
                  {
                    label: "Activos",
                    value: tickets.active,
                    color: "var(--chart-2)",
                  },
                  {
                    label: "Cerrados",
                    value: tickets.closed,
                    color: "var(--muted-foreground)",
                  },
                ]}
              />
            </div>
          </DashboardCard>
        ) : null}

        <DashboardConnectedUsers className="xl:col-span-1" />
      </section>

      <section
        className="animate-in fade-in slide-in-from-bottom-4 duration-500"
        style={{ animationDelay: "200ms" }}
      >
        <div className="overflow-hidden rounded-xl border border-border/70 bg-background">
          <div className="p-5 md:p-6">
            <Tabs defaultValue="activity">
              <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="space-y-1 text-center sm:text-left">
                  <p className="text-base font-medium">Última actividad</p>
                  <p className="text-sm text-muted-foreground">
                    Registros de auditoría con filtros y paginación.
                  </p>
                </div>
                <TabsList className="mx-auto sm:mx-0">
                  <TabsTab value="activity">Actividad</TabsTab>
                  <TabsTab value="summary">Resumen</TabsTab>
                  <TabsIndicator />
                </TabsList>
              </div>

              <TabsPanel value="activity">
                {canViewActivity ? (
                  <DashboardActivity />
                ) : (
                  <div className="rounded-xl border border-dashed border-border/70 p-8 text-center text-sm text-muted-foreground">
                    Tu usuario no tiene permiso para ver los registros de
                    auditoría.
                  </div>
                )}
              </TabsPanel>

              <TabsPanel value="summary">
                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="rounded-xl border border-border/60 bg-muted/20 p-4 text-center">
                    <Users className="mx-auto mb-2 size-5 text-primary" />
                    <p className="text-2xl font-semibold tabular-nums">
                      {companies?.total ?? "—"}
                    </p>
                    <p className="text-xs text-muted-foreground">Empresas</p>
                  </div>
                  <div className="rounded-xl border border-border/60 bg-muted/20 p-4 text-center">
                    <Ticket className="mx-auto mb-2 size-5 text-primary" />
                    <p className="text-2xl font-semibold tabular-nums">
                      {tickets?.active ?? "—"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Tickets activos
                    </p>
                  </div>
                  <div className="rounded-xl border border-border/60 bg-muted/20 p-4 text-center">
                    <Building2 className="mx-auto mb-2 size-5 text-primary" />
                    <p className="text-2xl font-semibold tabular-nums">
                      {companies?.active ?? "—"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Empresas activas
                    </p>
                  </div>
                </div>
              </TabsPanel>
            </Tabs>
          </div>
        </div>
      </section>
    </div>
  );
}
