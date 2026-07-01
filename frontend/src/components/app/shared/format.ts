export function formatDate(value: string) {
  return new Intl.DateTimeFormat("es-CL", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

export function formatFileSize(value: number | null) {
  if (!value) {
    return "—";
  }

  if (value < 1024 * 1024) {
    return `${Math.round(value / 1024)} KB`;
  }

  return `${(value / (1024 * 1024)).toFixed(1)} MB`;
}

export function formatRole(role: string) {
  return role
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export function formatRoles(roles: string[]) {
  if (roles.length === 0) {
    return "Sin rol";
  }

  return roles.map(formatRole).join(", ");
}

export function formatCompanyStatus(status: string) {
  if (status === "active") {
    return "Activa";
  }

  if (status === "inactive") {
    return "Inactiva";
  }

  return status;
}
