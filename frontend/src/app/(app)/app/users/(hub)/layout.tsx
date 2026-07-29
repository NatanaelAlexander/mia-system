import { UsersSectionNav } from "@/components/app/users/users-section-nav";

export default function UsersHubLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Usuarios</h1>
        <p className="text-sm text-muted-foreground">
          Cuentas, cargos, roles y permisos del sistema.
        </p>
      </div>
      <UsersSectionNav />
      {children}
    </div>
  );
}
