import { LoginForm } from "./login-form";
import { LoginHero } from "./login-hero";

export function LoginPage() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-background">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,oklch(0.7214_0.1337_49.9802_/_0.12),transparent_35%),radial-gradient(circle_at_bottom_right,oklch(0.5940_0.0443_196.0233_/_0.14),transparent_30%)]" />

      <div className="relative mx-auto flex min-h-screen w-full max-w-7xl items-center px-6 py-10">
        <div className="grid w-full items-stretch gap-10 lg:grid-cols-[1.1fr_0.9fr]">
          <LoginHero />

          <section className="flex">
            <div className="flex w-full max-w-lg flex-col justify-center rounded-3xl border border-border/70 bg-card/70 p-8 shadow-xl backdrop-blur-sm sm:p-10">
              <LoginForm />
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
