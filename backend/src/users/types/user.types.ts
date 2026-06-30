export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phoneNumber: string | null;
  isActive: boolean;
  permissionsVersion: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserCompanySummary {
  id: string;
  name: string;
}

export interface UserDetail extends User {
  roles: string[];
  roleIds: string[];
  jobTitles: string[];
  jobTitleIds: string[];
  companies: UserCompanySummary[];
}

export interface RoleOption {
  id: string;
  name: string;
}

export interface JobTitleOption {
  id: string;
  name: string;
}

export interface FilterUsersInput {
  isActive?: boolean;
  roleName?: string;
  companyId?: string;
}
