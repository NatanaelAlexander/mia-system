import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../common/database/database.service';
import {
  EmpresaNoEncontradaException,
  RepresentanteLegalNoEncontradoException,
  RepresentanteYaVinculadoException,
  RutEmpresaDuplicadoException,
  VinculoEmpresaRepresentanteNoEncontradoException,
} from './exceptions/companies.exceptions';
import {
  SQL_DEACTIVATE_COMPANY,
  SQL_EXISTS_COMPANY_BY_TAX_ID,
  SQL_FIND_ALL_ACTIVE_COMPANIES,
  SQL_FIND_COMPANY_BY_ID_ACTIVE,
  SQL_INSERT_COMPANY,
  COMPANY_COLUMNS,
} from './queries/companies.queries';
import {
  SQL_FIND_ALL_LEGAL_REPRESENTATIVES,
  SQL_FIND_LEGAL_REPRESENTATIVE_BY_ID,
  SQL_INSERT_LEGAL_REPRESENTATIVE,
  LEGAL_REP_COLUMNS,
} from './queries/legal-representatives.queries';
import {
  SQL_DELETE_COMPANY_REPRESENTATIVE,
  SQL_EXISTS_COMPANY_REPRESENTATIVE_LINK,
  SQL_FIND_COMPANY_REPRESENTATIVES,
  SQL_INSERT_COMPANY_REPRESENTATIVE,
} from './queries/company-representatives.queries';
import {
  Company,
  CompanyDetail,
  CompanyRepresentative,
  CompanyStatus,
  LegalRepresentative,
} from './types/company.types';
import { CreateCompanyDto } from './dto/create-company.dto';
import { UpdateCompanyDto } from './dto/update-company.dto';
import { CreateLegalRepresentativeDto } from './dto/create-legal-representative.dto';
import { UpdateLegalRepresentativeDto } from './dto/update-legal-representative.dto';
import { LinkRepresentativeDto } from './dto/link-representative.dto';

type CompanyRepresentativeRow = {
  companyId: string;
  legalRepresentativeId: string;
  position: string | null;
  lr_id: string;
  lr_firstName: string;
  lr_lastName: string;
  lr_identificationNumber: string;
  lr_email: string | null;
  lr_phoneNumber: string | null;
  lr_userId: string | null;
  lr_createdAt: Date;
  lr_updatedAt: Date;
};

@Injectable()
export class CompaniesService {
  constructor(private readonly db: DatabaseService) {}

  async findAll(): Promise<Company[]> {
    const { rows } = await this.db.query<Company>(SQL_FIND_ALL_ACTIVE_COMPANIES, [
      CompanyStatus.ACTIVE,
    ]);
    return rows;
  }

  async findById(id: string): Promise<CompanyDetail> {
    const company = await this.findActiveCompanyById(id);
    const representativeLinks = await this.fetchCompanyRepresentatives(id);
    return { ...company, representativeLinks };
  }

  async create(dto: CreateCompanyDto): Promise<Company> {
    await this.ensureTaxIdAvailable(dto.taxId);

    const { rows } = await this.db.query<Company>(SQL_INSERT_COMPANY, [
      dto.name,
      dto.taxId,
      dto.address ?? null,
      dto.phoneNumber ?? null,
      dto.email ?? null,
      dto.status ?? CompanyStatus.ACTIVE,
    ]);

    return rows[0];
  }

  async update(id: string, dto: UpdateCompanyDto): Promise<Company> {
    await this.findActiveCompanyById(id);

    if (dto.taxId) {
      await this.ensureTaxIdAvailable(dto.taxId, id);
    }

    const { sets, values } = this.buildCompanyUpdate(dto);
    if (sets.length === 0) {
      return this.findActiveCompanyById(id);
    }

    values.push(id, CompanyStatus.ACTIVE);
    const idParam = values.length;
    const statusParam = values.length + 1;

    const { rows } = await this.db.query<Company>(
      `UPDATE companies SET ${sets.join(', ')}, updated_at = NOW()
       WHERE id = $${idParam} AND status = $${statusParam}
       RETURNING ${COMPANY_COLUMNS}`,
      values,
    );

    if (!rows[0]) {
      throw new EmpresaNoEncontradaException();
    }

    return rows[0];
  }

  async deactivate(id: string): Promise<Company> {
    const { rows } = await this.db.query<Company>(SQL_DEACTIVATE_COMPANY, [
      CompanyStatus.INACTIVE,
      id,
      CompanyStatus.ACTIVE,
    ]);

    if (!rows[0]) {
      throw new EmpresaNoEncontradaException();
    }

    return rows[0];
  }

  async findAllActive(): Promise<Company[]> {
    return this.findAll();
  }

  async findAllLegalRepresentatives(): Promise<LegalRepresentative[]> {
    const { rows } = await this.db.query<LegalRepresentative>(
      SQL_FIND_ALL_LEGAL_REPRESENTATIVES,
    );
    return rows;
  }

  async findLegalRepresentativeById(id: string): Promise<LegalRepresentative> {
    const { rows } = await this.db.query<LegalRepresentative>(
      SQL_FIND_LEGAL_REPRESENTATIVE_BY_ID,
      [id],
    );

    if (!rows[0]) {
      throw new RepresentanteLegalNoEncontradoException();
    }

    return rows[0];
  }

  async createLegalRepresentative(
    dto: CreateLegalRepresentativeDto,
  ): Promise<LegalRepresentative> {
    const { rows } = await this.db.query<LegalRepresentative>(
      SQL_INSERT_LEGAL_REPRESENTATIVE,
      [
        dto.firstName,
        dto.lastName,
        dto.identificationNumber,
        dto.email ?? null,
        dto.phoneNumber ?? null,
        dto.userId ?? null,
      ],
    );

    return rows[0];
  }

  async updateLegalRepresentative(
    id: string,
    dto: UpdateLegalRepresentativeDto,
  ): Promise<LegalRepresentative> {
    await this.findLegalRepresentativeById(id);

    const { sets, values } = this.buildLegalRepUpdate(dto);
    if (sets.length === 0) {
      return this.findLegalRepresentativeById(id);
    }

    values.push(id);
    const idParam = values.length;

    const { rows } = await this.db.query<LegalRepresentative>(
      `UPDATE legal_representatives SET ${sets.join(', ')}, updated_at = NOW()
       WHERE id = $${idParam}
       RETURNING ${LEGAL_REP_COLUMNS}`,
      values,
    );

    if (!rows[0]) {
      throw new RepresentanteLegalNoEncontradoException();
    }

    return rows[0];
  }

  async getCompanyRepresentatives(
    companyId: string,
  ): Promise<CompanyRepresentative[]> {
    await this.findActiveCompanyById(companyId);
    return this.fetchCompanyRepresentatives(companyId);
  }

  async linkRepresentativeToCompany(
    companyId: string,
    dto: LinkRepresentativeDto,
  ): Promise<CompanyRepresentative> {
    await this.findActiveCompanyById(companyId);
    await this.findLegalRepresentativeById(dto.legalRepresentativeId);

    const exists = await this.db.query(SQL_EXISTS_COMPANY_REPRESENTATIVE_LINK, [
      companyId,
      dto.legalRepresentativeId,
    ]);

    if (exists.rowCount && exists.rowCount > 0) {
      throw new RepresentanteYaVinculadoException();
    }

    const { rows } = await this.db.query<CompanyRepresentative>(
      SQL_INSERT_COMPANY_REPRESENTATIVE,
      [companyId, dto.legalRepresentativeId, dto.position ?? null],
    );

    const legalRepresentative = await this.findLegalRepresentativeById(
      dto.legalRepresentativeId,
    );

    return { ...rows[0], legalRepresentative };
  }

  async unlinkRepresentativeFromCompany(
    companyId: string,
    legalRepresentativeId: string,
  ): Promise<void> {
    const result = await this.db.query(SQL_DELETE_COMPANY_REPRESENTATIVE, [
      companyId,
      legalRepresentativeId,
    ]);

    if (!result.rowCount) {
      throw new VinculoEmpresaRepresentanteNoEncontradoException();
    }
  }

  private async findActiveCompanyById(id: string): Promise<Company> {
    const { rows } = await this.db.query<Company>(SQL_FIND_COMPANY_BY_ID_ACTIVE, [
      id,
      CompanyStatus.ACTIVE,
    ]);

    if (!rows[0]) {
      throw new EmpresaNoEncontradaException();
    }

    return rows[0];
  }

  private async fetchCompanyRepresentatives(
    companyId: string,
  ): Promise<CompanyRepresentative[]> {
    const { rows } = await this.db.query<CompanyRepresentativeRow>(
      SQL_FIND_COMPANY_REPRESENTATIVES,
      [companyId],
    );

    return rows.map((row) => this.mapCompanyRepresentativeRow(row));
  }

  private mapCompanyRepresentativeRow(
    row: CompanyRepresentativeRow,
  ): CompanyRepresentative {
    return {
      companyId: row.companyId,
      legalRepresentativeId: row.legalRepresentativeId,
      position: row.position,
      legalRepresentative: {
        id: row.lr_id,
        firstName: row.lr_firstName,
        lastName: row.lr_lastName,
        identificationNumber: row.lr_identificationNumber,
        email: row.lr_email,
        phoneNumber: row.lr_phoneNumber,
        userId: row.lr_userId,
        createdAt: row.lr_createdAt,
        updatedAt: row.lr_updatedAt,
      },
    };
  }

  private buildCompanyUpdate(dto: UpdateCompanyDto): {
    sets: string[];
    values: unknown[];
  } {
    const sets: string[] = [];
    const values: unknown[] = [];
    let index = 1;

    const columns: Array<{
      field: keyof UpdateCompanyDto;
      column: string;
    }> = [
      { field: 'name', column: 'name' },
      { field: 'taxId', column: 'tax_id' },
      { field: 'address', column: 'address' },
      { field: 'phoneNumber', column: 'phone_number' },
      { field: 'email', column: 'email' },
      { field: 'status', column: 'status' },
    ];

    for (const { field, column } of columns) {
      if (dto[field] !== undefined) {
        sets.push(`${column} = $${index++}`);
        values.push(dto[field]);
      }
    }

    return { sets, values };
  }

  private buildLegalRepUpdate(dto: UpdateLegalRepresentativeDto): {
    sets: string[];
    values: unknown[];
  } {
    const sets: string[] = [];
    const values: unknown[] = [];
    let index = 1;

    const columns: Array<{
      field: keyof UpdateLegalRepresentativeDto;
      column: string;
    }> = [
      { field: 'firstName', column: 'first_name' },
      { field: 'lastName', column: 'last_name' },
      { field: 'identificationNumber', column: 'identification_number' },
      { field: 'email', column: 'email' },
      { field: 'phoneNumber', column: 'phone_number' },
      { field: 'userId', column: 'user_id' },
    ];

    for (const { field, column } of columns) {
      if (dto[field] !== undefined) {
        sets.push(`${column} = $${index++}`);
        values.push(dto[field]);
      }
    }

    return { sets, values };
  }

  private async ensureTaxIdAvailable(
    taxId: string,
    excludeId?: string,
  ): Promise<void> {
    const { rowCount } = await this.db.query(SQL_EXISTS_COMPANY_BY_TAX_ID, [
      taxId,
      excludeId ?? null,
    ]);

    if (rowCount && rowCount > 0) {
      throw new RutEmpresaDuplicadoException();
    }
  }
}
