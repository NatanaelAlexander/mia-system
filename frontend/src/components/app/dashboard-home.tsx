import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

interface DashboardHomeProps {
  userName?: string;
  surfaces?: string[];
}

export function DashboardHome({ userName, surfaces = [] }: DashboardHomeProps) {
  const stats = [
    { label: "Tickets abiertos", value: "—" },
    { label: "En progreso", value: "—" },
    { label: "Resueltos hoy", value: "—" },
    { label: "SLA en riesgo", value: "—" },
  ];

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
                Métricas disponibles cuando se conecte el módulo de tickets.
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Actividad reciente</CardTitle>
          <CardDescription>
            Vista resumen del sistema. Próximamente con datos en vivo.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-5/6" />
        </CardContent>
      </Card>
    </div>
  );
}
