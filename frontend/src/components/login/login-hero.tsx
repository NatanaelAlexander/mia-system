import Image from "next/image";

export function LoginHero() {
  return (
    <div className="relative hidden h-full min-h-[28rem] overflow-hidden rounded-3xl border border-border/70 lg:block">
      <Image
        src="/login/crm.webp"
        alt=""
        fill
        priority
        className="object-cover object-center"
        sizes="(min-width: 1024px) 50vw, 0px"
        aria-hidden
      />

      {/* Oscurece la imagen para legibilidad */}
      <div className="absolute inset-0 bg-background/88" />
      <div className="absolute inset-0 bg-black/55" />

      {/* Mismo degradado naranja / teal */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,oklch(0.7214_0.1337_49.9802_/_0.22),transparent_50%),radial-gradient(circle_at_bottom_right,oklch(0.5940_0.0443_196.0233_/_0.28),transparent_45%)]" />

      <div className="relative z-10 flex h-full flex-col justify-center p-8 sm:p-10">
        <div className="space-y-3">
          <p className="text-sm font-medium text-primary">MIA System</p>
          <h2 className="max-w-md text-3xl font-semibold tracking-tight text-foreground">
            Gestión interna y portal de tickets en un solo lugar
          </h2>
          <p className="max-w-md text-sm text-muted-foreground">
            Plataforma cerrada para equipos y clientes autorizados.
          </p>
        </div>
      </div>
    </div>
  );
}
