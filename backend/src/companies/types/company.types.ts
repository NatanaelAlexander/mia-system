import { CompanyStatus } from '../entities/company.entity';

export interface CompanyFilters {
  status?: CompanyStatus;
}
