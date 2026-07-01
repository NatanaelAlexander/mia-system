"use client";

import * as React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { toast } from "sonner";
import {
  type ProfileDetail,
  updateProfile,
} from "@/components/app/api/profile";
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

const profileSchema = z.object({
  firstName: z.string().min(1, "El nombre es obligatorio").max(100),
  lastName: z.string().min(1, "El apellido es obligatorio").max(100),
  email: z.string().email("Ingresa un correo válido").max(255),
  phoneNumber: z.string().max(50),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

interface ProfilePersonalFormProps {
  profile: ProfileDetail;
  surface: ResourceSurface;
  onUpdated: (profile: ProfileDetail) => void;
}

export function ProfilePersonalForm({
  profile,
  surface,
  onUpdated,
}: ProfilePersonalFormProps) {
  const { refreshSession } = useAuth();
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      firstName: profile.firstName,
      lastName: profile.lastName,
      email: profile.email,
      phoneNumber: profile.phoneNumber ?? "",
    },
  });

  React.useEffect(() => {
    reset({
      firstName: profile.firstName,
      lastName: profile.lastName,
      email: profile.email,
      phoneNumber: profile.phoneNumber ?? "",
    });
  }, [profile, reset]);

  const onSubmit = handleSubmit(async (values) => {
    setErrorMessage(null);

    try {
      const updated = await updateProfile(surface, {
        firstName: values.firstName.trim(),
        lastName: values.lastName.trim(),
        email: values.email.trim().toLowerCase(),
        phoneNumber: values.phoneNumber.trim() || null,
      });

      onUpdated(updated);
      await refreshSession();
      reset({
        firstName: updated.firstName,
        lastName: updated.lastName,
        email: updated.email,
        phoneNumber: updated.phoneNumber ?? "",
      });
      toast.success("Datos personales actualizados");
    } catch (error) {
      const message =
        error instanceof ApiError
          ? error.message
          : "No se pudieron guardar los cambios.";
      setErrorMessage(message);
      toast.error(message);
    }
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Datos personales</CardTitle>
        <CardDescription>
          Nombre, correo y teléfono de contacto.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="firstName">Nombre</Label>
              <Input
                id="firstName"
                autoComplete="given-name"
                aria-invalid={Boolean(errors.firstName)}
                {...register("firstName")}
              />
              {errors.firstName ? (
                <p className="text-sm text-destructive">
                  {errors.firstName.message}
                </p>
              ) : null}
            </div>

            <div className="space-y-2">
              <Label htmlFor="lastName">Apellido</Label>
              <Input
                id="lastName"
                autoComplete="family-name"
                aria-invalid={Boolean(errors.lastName)}
                {...register("lastName")}
              />
              {errors.lastName ? (
                <p className="text-sm text-destructive">
                  {errors.lastName.message}
                </p>
              ) : null}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Correo electrónico</Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              aria-invalid={Boolean(errors.email)}
              {...register("email")}
            />
            {errors.email ? (
              <p className="text-sm text-destructive">{errors.email.message}</p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="phoneNumber">Teléfono</Label>
            <Input
              id="phoneNumber"
              type="tel"
              autoComplete="tel"
              placeholder="+56912345678"
              aria-invalid={Boolean(errors.phoneNumber)}
              {...register("phoneNumber")}
            />
            {errors.phoneNumber ? (
              <p className="text-sm text-destructive">
                {errors.phoneNumber.message}
              </p>
            ) : null}
          </div>

          {errorMessage ? (
            <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {errorMessage}
            </p>
          ) : null}

          <div className="flex justify-end">
            <Button type="submit" disabled={isSubmitting || !isDirty}>
              {isSubmitting ? "Guardando..." : "Guardar cambios"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
