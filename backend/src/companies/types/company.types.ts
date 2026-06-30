export enum CompanyStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
}

export interface Company {
  id: string;
  name: string;
  taxId: string;
  address: string | null;
  phoneNumber: string | null;
  email: string | null;
  status: CompanyStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface LegalRepresentative {
  id: string;
  firstName: string;
  lastName: string;
  identificationNumber: string;
  email: string | null;
  phoneNumber: string | null;
  userId: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CompanyRepresentative {
  companyId: string;
  legalRepresentativeId: string;
  position: string | null;
  legalRepresentative?: LegalRepresentative;
}

export interface CompanyDetail extends Company {
  representativeLinks: CompanyRepresentative[];
}

export interface CreateCompanyInput {
  name: string;
  taxId: string;
  address: string | null;
  phoneNumber: string | null;
  email: string | null;
  status: CompanyStatus;
}

export interface CreateLegalRepresentativeInput {
  firstName: string;
  lastName: string;
  identificationNumber: string;
  email: string | null;
  phoneNumber: string | null;
  userId: string | null;
}
