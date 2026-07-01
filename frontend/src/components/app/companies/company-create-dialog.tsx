"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { createCompany } from "@/components/app/api/companies";
import { ApiError } from "@/lib/api/errors";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  CompanyForm,
  toCompanyPayload,
  type CompanyFormValues,
} from "./company-form";

interface CompanyCreateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated?: () => void;
}

const emptyValues: CompanyFormValues = {
  name: "",
  taxId: "",
  email: "",
  phoneNumber: "",
  address: "",
  status: "active",
};

export function CompanyCreateDialog({
  open,
  onOpenChange,
  onCreated,
}: CompanyCreateDialogProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);

  const handleSubmit = async (values: CompanyFormValues) => {
    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const company = await createCompany(toCompanyPayload(values));
      toast.success("Empresa creada correctamente");
      onOpenChange(false);
      onCreated?.();
      router.push(`/app/companies/${company.id}`);
    } catch (error) {
      const message =
        error instanceof ApiError
          ? error.message
          : "No se pudo crear la empresa.";
      setErrorMessage(message);
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Nueva empresa</DialogTitle>
          <DialogDescription>
            Registra una empresa para vincular proyectos, archivos y tickets.
          </DialogDescription>
        </DialogHeader>

        {errorMessage ? (
          <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {errorMessage}
          </p>
        ) : null}

        <CompanyForm
          key={open ? "create-open" : "create-closed"}
          defaultValues={emptyValues}
          onSubmit={handleSubmit}
          submitLabel="Crear empresa"
          isSubmitting={isSubmitting}
        />

        <div className="flex justify-end pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            Cancelar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
