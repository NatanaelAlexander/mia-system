"use client";

import * as React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { toast } from "sonner";
import { changePassword } from "@/components/app/api/profile";
import type { ResourceSurface } from "@/components/app/api/types";
import { useAuth } from "@/hooks/use-auth";
import { ApiError } from "@/lib/api/errors";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const passwordSchema = z
  .object({
    currentPassword: z
      .string()
      .min(1, "La contraseña actual es obligatoria"),
    newPassword: z
      .string()
      .min(6, "La nueva contraseña debe tener al menos 6 caracteres")
      .max(100, "La contraseña no puede superar 100 caracteres"),
    confirmPassword: z.string().min(1, "Confirma la nueva contraseña"),
  })
  .refine((values) => values.newPassword === values.confirmPassword, {
    message: "Las contraseñas no coinciden",
    path: ["confirmPassword"],
  });

type PasswordFormValues = z.infer<typeof passwordSchema>;

interface ProfilePasswordFormProps {
  surface: ResourceSurface;
}

export function ProfilePasswordForm({ surface }: ProfilePasswordFormProps) {
  const { logout } = useAuth();
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  const onSubmit = handleSubmit(async (values) => {
    setErrorMessage(null);

    try {
      await changePassword(surface, {
        currentPassword: values.currentPassword,
        newPassword: values.newPassword,
      });

      reset();
      toast.success("Contraseña actualizada. Inicia sesión nuevamente.");
      await logout();
    } catch (error) {
      const message =
        error instanceof ApiError
          ? error.message
          : "No se pudo cambiar la contraseña.";
      setErrorMessage(message);
      toast.error(message);
    }
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Contraseña</CardTitle>
        <CardDescription>
          Cambia tu contraseña de acceso. Al guardar se cerrará la sesión actual.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="currentPassword">Contraseña actual</Label>
            <Input
              id="currentPassword"
              type="password"
              autoComplete="current-password"
              aria-invalid={Boolean(errors.currentPassword)}
              {...register("currentPassword")}
            />
            {errors.currentPassword ? (
              <p className="text-sm text-destructive">
                {errors.currentPassword.message}
              </p>
            ) : null}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="newPassword">Nueva contraseña</Label>
              <Input
                id="newPassword"
                type="password"
                autoComplete="new-password"
                aria-invalid={Boolean(errors.newPassword)}
                {...register("newPassword")}
              />
              {errors.newPassword ? (
                <p className="text-sm text-destructive">
                  {errors.newPassword.message}
                </p>
              ) : null}
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirmar contraseña</Label>
              <Input
                id="confirmPassword"
                type="password"
                autoComplete="new-password"
                aria-invalid={Boolean(errors.confirmPassword)}
                {...register("confirmPassword")}
              />
              {errors.confirmPassword ? (
                <p className="text-sm text-destructive">
                  {errors.confirmPassword.message}
                </p>
              ) : null}
            </div>
          </div>

          {errorMessage ? (
            <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {errorMessage}
            </p>
          ) : null}

          <div className="flex justify-end">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Actualizando..." : "Cambiar contraseña"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
