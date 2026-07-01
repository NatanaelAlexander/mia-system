import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface DashboardHomeProps {
  userName?: string;
  surfaces?: string[];
  stats: Array<{ label: string; value: number | string; helper: string }>;
  loadError?: string | null;
}

export function DashboardHome({
  userName,
  surfaces = [],
  stats,
  loadError,
}: DashboardHomeProps) {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">
          Hola{userName ? `, ${userName}` : ""}
        </h1>
        <p className="text-sm text-muted-foreground">
          Panel principal del sistema. Los módulos se irán habilitando según tus
          permisos.
        </p>
        {surfaces.length > 0 ? (
          <div className="flex flex-wrap gap-2 pt-1">
            {surfaces.map((surface) => (
              <Badge key={surface} variant="secondary">
                {surface}
              </Badge>
            ))}
          </div>
        ) : null}
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <CardHeader className="pb-2">
              <CardDescription>{stat.label}</CardDescription>
              <CardTitle className="font-mono text-3xl">{stat.value}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">
                {stat.helper}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Actividad reciente</CardTitle>
          <CardDescription>
            Resumen inicial del sistema según tus permisos.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loadError ? (
            <p className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
              {loadError}
            </p>
          ) : (
            <p className="rounded-lg border border-dashed border-border/70 p-4 text-sm text-muted-foreground">
              Sin actividad reciente para mostrar todavía.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
