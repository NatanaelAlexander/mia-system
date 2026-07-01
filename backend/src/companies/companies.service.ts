import { Injectable } from '@nestjs/common';
import { AuditAction } from '../audit/types/audit.types';
import { AuditService } from '../audit/audit.service';
import { PortalAccessService } from '../common/portal/portal-access.service';
import { normalizeRutForStorage } from '../common/utils/rut.util';
import { DatabaseService } from '../common/database/database.service';
import {
  EmpresaNoEncontradaException,
  RepresentanteLegalNoEncontradoException,
  RepresentanteYaVinculadoException,
  RutEmpresaDuplicadoException,
  RutInvalidoException,
  VinculoEmpresaRepresentanteNoEncontradoException,
} from './exceptions/companies.exceptions';
import {
  SQL_DEACTIVATE_COMPANY,
  SQL_EXISTS_COMPANY_BY_TAX_ID,
  SQL_FIND_COMPANIES_FILTERED,
  SQL_FIND_COMPANIES_FOR_PORTAL_USER,
  SQL_FIND_COMPANY_BY_ID_ACTIVE,
  SQL_FIND_COMPANY_BY_ID,
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
import { FilterCompaniesDto } from './dto/filter-companies.dto';

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

const AUDIT_TABLE = {
  COMPANIES: 'companies',
  LEGAL_REPRESENTATIVES: 'legal_representatives',
  COMPANY_REPRESENTATIVES: 'company_representatives',
} as const;

@Injectable()
export class CompaniesService {
  constructor(
    private readonly db: DatabaseService,
    private readonly auditService: AuditService,
    private readonly portalAccess: PortalAccessService,
  ) {}

  async findAll(actorUserId: string): Promise<Company[]> {
    return this.findAllFiltered(actorUserId, { status: CompanyStatus.ACTIVE });
  }

  async findAllFiltered(
    actorUserId: string,
    filters: FilterCompaniesDto = {},
  ): Promise<Company[]> {
    const { rows } = await this.db.query<Company>(SQL_FIND_COMPANIES_FILTERED, [
      filters.status ?? null,
      filters.search?.trim() || null,
    ]);

    await this.auditRead(actorUserId, AUDIT_TABLE.COMPANIES, null, {
      scope: 'list',
      resultCount: rows.length,
      filters,
    });

    return rows;
  }

  async findById(actorUserId: string, id: string): Promise<CompanyDetail> {
    const company = await this.findCompanyById(id);
    const representativeLinks = await this.fetchCompanyRepresentatives(id);
    const detail = { ...company, representativeLinks };

    await this.auditRead(actorUserId, AUDIT_TABLE.COMPANIES, id, {
      scope: 'detail',
      representativeCount: representativeLinks.length,
    });

    return detail;
  }

  async create(actorUserId: string, dto: CreateCompanyDto): Promise<Company> {
    const taxId = this.normalizeTaxId(dto.taxId);
    await this.ensureTaxIdAvailable(taxId);

    const { rows } = await this.db.query<Company>(SQL_INSERT_COMPANY, [
      dto.name,
      taxId,
      dto.address ?? null,
      dto.phoneNumber ?? null,
      dto.email ?? null,
      dto.status ?? CompanyStatus.ACTIVE,
    ]);

    const company = rows[0];

    await this.auditService.log({
      userId: actorUserId,
      action: AuditAction.CREATE,
      tableName: AUDIT_TABLE.COMPANIES,
      recordId: company.id,
      newValues: this.asJson(company),
    });

    return company;
  }

  async update(
    actorUserId: string,
    id: string,
    dto: UpdateCompanyDto,
  ): Promise<Company> {
    const previous = await this.findCompanyById(id);

    if (dto.taxId) {
      try {
        const formatted = normalizeRutForStorage(dto.taxId);
        if (formatted === previous.taxId) {
          delete dto.taxId;
        } else {
          dto.taxId = formatted;
          await this.ensureTaxIdAvailable(dto.taxId, id);
        }
      } catch {
        throw new RutInvalidoException();
      }
    }

    const { sets, values } = this.buildCompanyUpdate(dto);
    if (sets.length === 0) {
      return previous;
    }

    const idParam = values.length + 1;
    values.push(id);

    const { rows } = await this.db.query<Company>(
      `UPDATE companies SET ${sets.join(', ')}, updated_at = NOW()
       WHERE id = $${idParam}
       RETURNING ${COMPANY_COLUMNS}`,
      values,
    );

    if (!rows[0]) {
      throw new EmpresaNoEncontradaException();
    }

    const updated = rows[0];

    await this.auditService.log({
      userId: actorUserId,
      action: AuditAction.UPDATE,
      tableName: AUDIT_TABLE.COMPANIES,
      recordId: id,
      oldValues: this.asJson(previous),
      newValues: this.asJson(updated),
    });

    return updated;
  }

  async deactivate(actorUserId: string, id: string): Promise<Company> {
    const previous = await this.findActiveCompanyById(id);

    const { rows } = await this.db.query<Company>(SQL_DEACTIVATE_COMPANY, [
      CompanyStatus.INACTIVE,
      id,
      CompanyStatus.ACTIVE,
    ]);

    if (!rows[0]) {
      throw new EmpresaNoEncontradaException();
    }

    const deactivated = rows[0];

    await this.auditService.log({
      userId: actorUserId,
      action: AuditAction.SOFT_DELETE,
      tableName: AUDIT_TABLE.COMPANIES,
      recordId: id,
      oldValues: this.asJson(previous),
      newValues: this.asJson(deactivated),
    });

    return deactivated;
  }

  async findAllForPortal(userId: string): Promise<Company[]> {
    const { rows } = await this.db.query<Company>(
      SQL_FIND_COMPANIES_FOR_PORTAL_USER,
      [userId, CompanyStatus.ACTIVE],
    );

    await this.auditRead(userId, AUDIT_TABLE.COMPANIES, null, {
      scope: 'portal_list',
      resultCount: rows.length,
    });

    return rows;
  }

  async findByIdForPortal(userId: string, id: string): Promise<CompanyDetail> {
    const hasAccess = await this.portalAccess.userHasCompany(userId, id);
    if (!hasAccess) {
      throw new EmpresaNoEncontradaException();
    }

    const company = await this.findActiveCompanyById(id);
    const representativeLinks = await this.fetchCompanyRepresentatives(id);
    const detail = { ...company, representativeLinks };

    await this.auditRead(userId, AUDIT_TABLE.COMPANIES, id, {
      scope: 'portal_detail',
      representativeCount: representativeLinks.length,
    });

    return detail;
  }

  async findAllLegalRepresentatives(
    actorUserId: string,
  ): Promise<LegalRepresentative[]> {
    const { rows } = await this.db.query<LegalRepresentative>(
      SQL_FIND_ALL_LEGAL_REPRESENTATIVES,
    );

    await this.auditRead(actorUserId, AUDIT_TABLE.LEGAL_REPRESENTATIVES, null, {
      scope: 'list',
      resultCount: rows.length,
    });

    return rows;
  }

  async findLegalRepresentativeById(
    actorUserId: string,
    id: string,
  ): Promise<LegalRepresentative> {
    const representative = await this.findLegalRepresentativeRowById(id);

    await this.auditRead(actorUserId, AUDIT_TABLE.LEGAL_REPRESENTATIVES, id, {
      scope: 'detail',
    });

    return representative;
  }

  async createLegalRepresentative(
    actorUserId: string,
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

    const representative = rows[0];

    await this.auditService.log({
      userId: actorUserId,
      action: AuditAction.CREATE,
      tableName: AUDIT_TABLE.LEGAL_REPRESENTATIVES,
      recordId: representative.id,
      newValues: this.asJson(representative),
    });

    return representative;
  }

  async updateLegalRepresentative(
    actorUserId: string,
    id: string,
    dto: UpdateLegalRepresentativeDto,
  ): Promise<LegalRepresentative> {
    const previous = await this.findLegalRepresentativeRowById(id);

    const { sets, values } = this.buildLegalRepUpdate(dto);
    if (sets.length === 0) {
      return previous;
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

    const updated = rows[0];

    await this.auditService.log({
      userId: actorUserId,
      action: AuditAction.UPDATE,
      tableName: AUDIT_TABLE.LEGAL_REPRESENTATIVES,
      recordId: id,
      oldValues: this.asJson(previous),
      newValues: this.asJson(updated),
    });

    return updated;
  }

  async getCompanyRepresentatives(
    actorUserId: string,
    companyId: string,
  ): Promise<CompanyRepresentative[]> {
    await this.findActiveCompanyById(companyId);
    const representatives = await this.fetchCompanyRepresentatives(companyId);

    await this.auditRead(actorUserId, AUDIT_TABLE.COMPANY_REPRESENTATIVES, companyId, {
      scope: 'list_by_company',
      resultCount: representatives.length,
    });

    return representatives;
  }

  async linkRepresentativeToCompany(
    actorUserId: string,
    companyId: string,
    dto: LinkRepresentativeDto,
  ): Promise<CompanyRepresentative> {
    await this.findActiveCompanyById(companyId);
    await this.findLegalRepresentativeRowById(dto.legalRepresentativeId);

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

    const legalRepresentative = await this.findLegalRepresentativeRowById(
      dto.legalRepresentativeId,
    );

    const link = { ...rows[0], legalRepresentative };

    await this.auditService.log({
      userId: actorUserId,
      action: AuditAction.ASSIGN,
      tableName: AUDIT_TABLE.COMPANY_REPRESENTATIVES,
      recordId: companyId,
      newValues: {
        companyId,
        legalRepresentativeId: dto.legalRepresentativeId,
        position: dto.position ?? null,
      },
    });

    return link;
  }

  async unlinkRepresentativeFromCompany(
    actorUserId: string,
    companyId: string,
    legalRepresentativeId: string,
  ): Promise<void> {
    const representatives = await this.fetchCompanyRepresentatives(companyId);
    const existingLink = representatives.find(
      (link) => link.legalRepresentativeId === legalRepresentativeId,
    );

    const result = await this.db.query(SQL_DELETE_COMPANY_REPRESENTATIVE, [
      companyId,
      legalRepresentativeId,
    ]);

    if (!result.rowCount) {
      throw new VinculoEmpresaRepresentanteNoEncontradoException();
    }

    await this.auditService.log({
      userId: actorUserId,
      action: AuditAction.UNLINK,
      tableName: AUDIT_TABLE.COMPANY_REPRESENTATIVES,
      recordId: companyId,
      oldValues: {
        companyId,
        legalRepresentativeId,
        position: existingLink?.position ?? null,
      },
    });
  }

  private async findCompanyById(id: string): Promise<Company> {
    const { rows } = await this.db.query<Company>(SQL_FIND_COMPANY_BY_ID, [id]);

    if (!rows[0]) {
      throw new EmpresaNoEncontradaException();
    }

    return rows[0];
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

  private async findLegalRepresentativeRowById(
    id: string,
  ): Promise<LegalRepresentative> {
    const { rows } = await this.db.query<LegalRepresentative>(
      SQL_FIND_LEGAL_REPRESENTATIVE_BY_ID,
      [id],
    );

    if (!rows[0]) {
      throw new RepresentanteLegalNoEncontradoException();
    }

    return rows[0];
  }

  private async auditRead(
    actorUserId: string,
    tableName: string,
    recordId: string | null,
    metadata: Record<string, unknown>,
  ): Promise<void> {
    await this.auditService.log({
      userId: actorUserId,
      action: AuditAction.READ,
      tableName,
      recordId,
      newValues: metadata,
    });
  }

  private asJson(value: object): Record<string, unknown> {
    return { ...value } as Record<string, unknown>;
  }

  private normalizeTaxId(taxId: string): string {
    try {
      return normalizeRutForStorage(taxId);
    } catch {
      throw new RutInvalidoException();
    }
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
