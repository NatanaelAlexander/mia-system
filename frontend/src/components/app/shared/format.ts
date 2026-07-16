export function formatDate(value: string) {
  return new Intl.DateTimeFormat("es-CL", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

export function formatChatTime(value: string) {
  const date = new Date(value);
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = String(date.getFullYear()).slice(-2);
  const time = new Intl.DateTimeFormat("es-CL", {
    hour: "numeric",
    minute: "2-digit",
  }).format(date);

  return `${day}-${month}-${year} ${time}`;
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

export function formatProjectType(type: string) {
  if (type === "internal") {
    return "Interno";
  }

  if (type === "external") {
    return "Externo";
  }

  return type;
}

export function formatProjectStatus(status: string) {
  if (status === "active") {
    return "Activo";
  }

  if (status === "inactive") {
    return "Inactivo";
  }

  if (status === "completed") {
    return "Completado";
  }

  return status;
}
