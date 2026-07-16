export enum ProjectType {
  INTERNAL = 'internal',
  EXTERNAL = 'external',
}

export enum ProjectStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  COMPLETED = 'completed',
}

export interface Project {
  id: string;
  companyId: string;
  name: string;
  description: string | null;
  type: ProjectType;
  status: ProjectStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface ProjectAssetLink {
  projectId: string;
  assetId: string;
}
