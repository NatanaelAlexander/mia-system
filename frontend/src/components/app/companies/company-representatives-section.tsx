"use client";

import * as React from "react";
import { Edit2, LinkIcon, Plus, Trash2, UserRound } from "lucide-react";
import { toast } from "sonner";
import {
  createLegalRepresentative,
  linkRepresentativeToCompany,
  listLegalRepresentatives,
  unlinkRepresentativeFromCompany,
  updateCompanyRepresentative,
  updateLegalRepresentative,
  type CompanyRepresentativeLink,
  type LegalRepresentative,
} from "@/components/app/api/companies";
import { ConfirmDialog } from "@/components/app/shared/confirm-dialog";
import { ApiError } from "@/lib/api/errors";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface RepresentativeFormValues {
  firstName: string;
  lastName: string;
  identificationNumber: string;
  email: string;
  phoneNumber: string;
  position: string;
}

interface CompanyRepresentativesSectionProps {
  companyId: string;
  representativeLinks: CompanyRepresentativeLink[];
  canManage: boolean;
  onChanged: () => Promise<void>;
}

const emptyFormValues: RepresentativeFormValues = {
  firstName: "",
  lastName: "",
  identificationNumber: "",
  email: "",
  phoneNumber: "",
  position: "",
};

function representativeName(representative: LegalRepresentative) {
  return `${representative.firstName} ${representative.lastName}`.trim();
}

function toFormValues(link: CompanyRepresentativeLink): RepresentativeFormValues {
  const representative = link.legalRepresentative;

  return {
    firstName: representative?.firstName ?? "",
    lastName: representative?.lastName ?? "",
    identificationNumber: representative?.identificationNumber ?? "",
    email: representative?.email ?? "",
    phoneNumber: representative?.phoneNumber ?? "",
    position: link.position ?? "",
  };
}

function toRepresentativePayload(values: RepresentativeFormValues) {
  return {
    firstName: values.firstName.trim(),
    lastName: values.lastName.trim(),
    identificationNumber: values.identificationNumber.trim(),
    email: values.email.trim() || undefined,
    phoneNumber: values.phoneNumber.trim() || undefined,
  };
}

function RepresentativeFields({
  values,
  onChange,
  disabled,
}: {
  values: RepresentativeFormValues;
  onChange: (values: RepresentativeFormValues) => void;
  disabled?: boolean;
}) {
  const update = (field: keyof RepresentativeFormValues, value: string) => {
    onChange({ ...values, [field]: value });
  };

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <div className="space-y-2">
        <Label htmlFor="representative-first-name">Nombre</Label>
        <Input
          id="representative-first-name"
          value={values.firstName}
          onChange={(event) => update("firstName", event.target.value)}
          disabled={disabled}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="representative-last-name">Apellido</Label>
        <Input
          id="representative-last-name"
          value={values.lastName}
          onChange={(event) => update("lastName", event.target.value)}
          disabled={disabled}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="representative-id-number">RUT / Identificación</Label>
        <Input
          id="representative-id-number"
          value={values.identificationNumber}
          onChange={(event) => update("identificationNumber", event.target.value)}
          disabled={disabled}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="representative-position">Cargo en esta empresa</Label>
        <Input
          id="representative-position"
          value={values.position}
          onChange={(event) => update("position", event.target.value)}
          disabled={disabled}
          placeholder="Gerente General"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="representative-email">Correo</Label>
        <Input
          id="representative-email"
          type="email"
          value={values.email}
          onChange={(event) => update("email", event.target.value)}
          disabled={disabled}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="representative-phone">Teléfono</Label>
        <Input
          id="representative-phone"
          type="tel"
          value={values.phoneNumber}
          onChange={(event) => update("phoneNumber", event.target.value)}
          disabled={disabled}
        />
      </div>
    </div>
  );
}

export function CompanyRepresentativesSection({
  companyId,
  representativeLinks,
  canManage,
  onChanged,
}: CompanyRepresentativesSectionProps) {
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [createOpen, setCreateOpen] = React.useState(false);
  const [linkOpen, setLinkOpen] = React.useState(false);
  const [editingLink, setEditingLink] =
    React.useState<CompanyRepresentativeLink | null>(null);
  const [formValues, setFormValues] =
    React.useState<RepresentativeFormValues>(emptyFormValues);
  const [allRepresentatives, setAllRepresentatives] = React.useState<
    LegalRepresentative[]
  >([]);
  const [selectedRepresentativeId, setSelectedRepresentativeId] =
    React.useState("");
  const [selectedPosition, setSelectedPosition] = React.useState("");
  const [unlinkTarget, setUnlinkTarget] =
    React.useState<CompanyRepresentativeLink | null>(null);

  const linkedRepresentativeIds = React.useMemo(
    () => new Set(representativeLinks.map((link) => link.legalRepresentativeId)),
    [representativeLinks],
  );

  const availableRepresentatives = React.useMemo(
    () =>
      allRepresentatives.filter(
        (representative) => !linkedRepresentativeIds.has(representative.id),
      ),
    [allRepresentatives, linkedRepresentativeIds],
  );

  const representativeItems = React.useMemo(
    () =>
      availableRepresentatives.map((representative) => ({
        value: representative.id,
        label: `${representativeName(representative)} (${representative.identificationNumber})`,
      })),
    [availableRepresentatives],
  );

  const loadRepresentatives = React.useCallback(async () => {
    try {
      const data = await listLegalRepresentatives();
      setAllRepresentatives(data);
    } catch (error) {
      const message =
        error instanceof ApiError
          ? error.message
          : "No se pudieron cargar los representantes.";
      toast.error(message);
    }
  }, []);

  const openCreateDialog = () => {
    setFormValues(emptyFormValues);
    setCreateOpen(true);
  };

  const openLinkDialog = async () => {
    setSelectedRepresentativeId("");
    setSelectedPosition("");
    setLinkOpen(true);
    await loadRepresentatives();
  };

  const openEditDialog = (link: CompanyRepresentativeLink) => {
    setEditingLink(link);
    setFormValues(toFormValues(link));
  };

  const handleCreateAndLink = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);

    try {
      const representative = await createLegalRepresentative(
        toRepresentativePayload(formValues),
      );
      await linkRepresentativeToCompany(companyId, {
        legalRepresentativeId: representative.id,
        position: formValues.position.trim() || undefined,
      });
      toast.success("Representante creado y vinculado");
      setCreateOpen(false);
      await onChanged();
    } catch (error) {
      const message =
        error instanceof ApiError
          ? error.message
          : "No se pudo crear el representante.";
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLinkExisting = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!selectedRepresentativeId) {
      toast.error("Selecciona un representante.");
      return;
    }

    setIsSubmitting(true);

    try {
      await linkRepresentativeToCompany(companyId, {
        legalRepresentativeId: selectedRepresentativeId,
        position: selectedPosition.trim() || undefined,
      });
      toast.success("Representante vinculado");
      setLinkOpen(false);
      await onChanged();
    } catch (error) {
      const message =
        error instanceof ApiError
          ? error.message
          : "No se pudo vincular el representante.";
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!editingLink?.legalRepresentative) {
      return;
    }

    setIsSubmitting(true);

    try {
      await updateLegalRepresentative(
        editingLink.legalRepresentative.id,
        toRepresentativePayload(formValues),
      );
      await updateCompanyRepresentative(
        companyId,
        editingLink.legalRepresentative.id,
        { position: formValues.position.trim() || undefined },
      );
      toast.success("Representante actualizado");
      setEditingLink(null);
      await onChanged();
    } catch (error) {
      const message =
        error instanceof ApiError
          ? error.message
          : "No se pudo actualizar el representante.";
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUnlink = async () => {
    if (!unlinkTarget) {
      return;
    }

    setIsSubmitting(true);

    try {
      await unlinkRepresentativeFromCompany(
        companyId,
        unlinkTarget.legalRepresentativeId,
      );
      toast.success("Representante desvinculado");
      setUnlinkTarget(null);
      await onChanged();
    } catch (error) {
      const message =
        error instanceof ApiError
          ? error.message
          : "No se pudo quitar el representante.";
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const unlinkTargetName = unlinkTarget?.legalRepresentative
    ? representativeName(unlinkTarget.legalRepresentative)
    : "este representante";

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <CardTitle>Representantes legales</CardTitle>
              <CardDescription>
                Personas que representan legalmente a esta empresa.
              </CardDescription>
            </div>
            {canManage ? (
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={openLinkDialog}
                  disabled={isSubmitting}
                >
                  <LinkIcon />
                  Agregar existente
                </Button>
                <Button
                  type="button"
                  size="sm"
                  onClick={openCreateDialog}
                  disabled={isSubmitting}
                >
                  <Plus />
                  Nuevo representante
                </Button>
              </div>
            ) : null}
          </div>
        </CardHeader>

        <CardContent>
          {representativeLinks.length === 0 ? (
            <p className="rounded-lg border border-dashed border-border/70 p-4 text-sm text-muted-foreground">
              Esta empresa aún no tiene representantes legales vinculados.
            </p>
          ) : (
            <div className="divide-y divide-border/70 rounded-xl border border-border/70">
              {representativeLinks.map((link) => {
                const representative = link.legalRepresentative;

                return (
                  <div
                    key={link.legalRepresentativeId}
                    className="flex flex-col gap-3 p-3 text-sm sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="min-w-0 space-y-1">
                      <div className="flex items-center gap-2">
                        <UserRound className="size-4 text-primary" />
                        <p className="font-medium">
                          {representative
                            ? representativeName(representative)
                            : "Representante sin detalle"}
                        </p>
                      </div>
                      <p className="text-muted-foreground">
                        {link.position ?? "Sin cargo registrado"}
                      </p>
                      {representative ? (
                        <p className="truncate text-muted-foreground">
                          {representative.identificationNumber}
                          {representative.email ? ` · ${representative.email}` : ""}
                          {representative.phoneNumber
                            ? ` · ${representative.phoneNumber}`
                            : ""}
                        </p>
                      ) : null}
                    </div>

                    {canManage ? (
                      <div className="flex shrink-0 gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => openEditDialog(link)}
                          disabled={isSubmitting || !representative}
                        >
                          <Edit2 />
                          Editar
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setUnlinkTarget(link)}
                          disabled={isSubmitting}
                        >
                          <Trash2 />
                          Quitar
                        </Button>
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-2xl">
          <form onSubmit={handleCreateAndLink} className="space-y-4">
            <DialogHeader>
              <DialogTitle>Nuevo representante legal</DialogTitle>
              <DialogDescription>
                Crea el representante y lo vincula inmediatamente a esta empresa.
              </DialogDescription>
            </DialogHeader>
            <RepresentativeFields
              values={formValues}
              onChange={setFormValues}
              disabled={isSubmitting}
            />
            <DialogFooter>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Guardando..." : "Crear y vincular"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={linkOpen} onOpenChange={setLinkOpen}>
        <DialogContent className="sm:max-w-lg">
          <form onSubmit={handleLinkExisting} className="space-y-4">
            <DialogHeader>
              <DialogTitle>Agregar representante existente</DialogTitle>
              <DialogDescription>
                Selecciona un representante ya creado y asígnalo a esta empresa.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-2">
              <Label htmlFor="existing-representative">Representante</Label>
              <Select
                items={representativeItems}
                value={selectedRepresentativeId || null}
                onValueChange={(value) =>
                  setSelectedRepresentativeId(typeof value === "string" ? value : "")
                }
                disabled={availableRepresentatives.length === 0 || isSubmitting}
              >
                <SelectTrigger id="existing-representative" className="w-full">
                  <SelectValue placeholder="Selecciona un representante" />
                </SelectTrigger>
                <SelectContent>
                  {representativeItems.map((item) => (
                    <SelectItem key={item.value} value={item.value}>
                      {item.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {availableRepresentatives.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No hay representantes disponibles para vincular.
                </p>
              ) : null}
            </div>

            <div className="space-y-2">
              <Label htmlFor="existing-position">Cargo en esta empresa</Label>
              <Input
                id="existing-position"
                value={selectedPosition}
                onChange={(event) => setSelectedPosition(event.target.value)}
                disabled={isSubmitting}
                placeholder="Gerente General"
              />
            </div>

            <DialogFooter>
              <Button
                type="submit"
                disabled={
                  isSubmitting ||
                  availableRepresentatives.length === 0 ||
                  !selectedRepresentativeId
                }
              >
                {isSubmitting ? "Vinculando..." : "Vincular"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog
        open={Boolean(editingLink)}
        onOpenChange={(open) => {
          if (!open) {
            setEditingLink(null);
          }
        }}
      >
        <DialogContent className="sm:max-w-2xl">
          <form onSubmit={handleEdit} className="space-y-4">
            <DialogHeader>
              <DialogTitle>Editar representante legal</DialogTitle>
              <DialogDescription>
                Actualiza sus datos y el cargo registrado para esta empresa.
              </DialogDescription>
            </DialogHeader>
            <RepresentativeFields
              values={formValues}
              onChange={setFormValues}
              disabled={isSubmitting}
            />
            <DialogFooter>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Guardando..." : "Guardar cambios"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={unlinkTarget !== null}
        onOpenChange={(open) => {
          if (!open) {
            setUnlinkTarget(null);
          }
        }}
        title="Quitar representante"
        description={`¿Quitar a ${unlinkTargetName} de esta empresa? Solo se desvincula de esta empresa; el representante seguirá existiendo en el sistema.`}
        confirmLabel="Quitar"
        onConfirm={handleUnlink}
        isConfirming={isSubmitting}
      />
    </>
  );
}
