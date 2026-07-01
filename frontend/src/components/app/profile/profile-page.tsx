"use client";

import * as React from "react";
import { getProfile, type ProfileDetail } from "@/components/app/api/profile";
import { ErrorState } from "@/components/app/shared/list-states";
import { formatRoles } from "@/components/app/shared/format";
import { preferredSurface } from "@/components/app/shared/surface";
import { useAuth } from "@/hooks/use-auth";
import { ApiError } from "@/lib/api/errors";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ProfilePasswordForm } from "./profile-password-form";
import { ProfilePersonalForm } from "./profile-personal-form";

function ProfileSkeleton() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-4 w-72" />
      </div>
      <Card>
        <CardContent className="flex items-center gap-4 pt-6">
          <Skeleton className="size-16 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-32" />
          </div>
        </CardContent>
      </Card>
      <Skeleton className="h-80 w-full rounded-xl" />
      <Skeleton className="h-72 w-full rounded-xl" />
    </div>
  );
}

export function ProfilePage() {
  const { claims, isLoading: isAuthLoading } = useAuth();
  const surface = claims ? preferredSurface(claims) : "portal";
  const [profile, setProfile] = React.useState<ProfileDetail | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);

  const loadProfile = React.useCallback(async () => {
    if (!claims) {
      setProfile(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const data = await getProfile(surface);
      setProfile(data);
    } catch (error) {
      const message =
        error instanceof ApiError
          ? error.message
          : "No se pudo cargar tu perfil.";
      setErrorMessage(message);
      setProfile(null);
    } finally {
      setIsLoading(false);
    }
  }, [claims, surface]);

  React.useEffect(() => {
    if (!isAuthLoading) {
      void loadProfile();
    }
  }, [isAuthLoading, loadProfile]);

  if (isAuthLoading || isLoading) {
    return <ProfileSkeleton />;
  }

  if (errorMessage || !profile) {
    return (
      <div className="space-y-6">
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold tracking-tight">Mi perfil</h1>
          <p className="text-sm text-muted-foreground">
            Administra tus datos personales y contraseña.
          </p>
        </div>
        <ErrorState
          message={errorMessage ?? "Perfil no disponible."}
          onRetry={loadProfile}
        />
      </div>
    );
  }

  const initials = `${profile.firstName[0] ?? ""}${profile.lastName[0] ?? ""}`.toUpperCase();
  const roleLabel = formatRoles(profile.roles);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">Mi perfil</h1>
        <p className="text-sm text-muted-foreground">
          Administra tus datos personales y contraseña.
        </p>
      </div>

      <Card>
        <CardContent className="flex flex-col gap-4 pt-6 sm:flex-row sm:items-center">
          <Avatar className="size-16">
            <AvatarFallback className="text-lg">{initials}</AvatarFallback>
          </Avatar>
          <div className="min-w-0 space-y-2">
            <div>
              <p className="text-lg font-medium">
                {profile.firstName} {profile.lastName}
              </p>
              <p className="text-sm text-muted-foreground">{profile.email}</p>
            </div>
            <span className="text-sm font-medium text-primary">{roleLabel}</span>
          </div>
        </CardContent>
      </Card>

      <ProfilePersonalForm
        profile={profile}
        surface={surface}
        onUpdated={setProfile}
      />

      <ProfilePasswordForm surface={surface} />
    </div>
  );
}
