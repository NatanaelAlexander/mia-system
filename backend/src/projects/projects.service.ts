import { Injectable } from '@nestjs/common';
import { AssetsService } from '../assets/assets.service';
import { Asset } from '../assets/types/asset.types';
import { AuditAction } from '../audit/types/audit.types';
import { AuditService } from '../audit/audit.service';
import { CompaniesService } from '../companies/companies.service';
import { PortalAccessService } from '../common/portal/portal-access.service';
import { DatabaseService } from '../common/database/database.service';
import {
  ArchivoYaVinculadoAlProyectoException,
  ProyectoNoEncontradoException,
  VinculoProyectoArchivoNoEncontradoException,
} from './exceptions/projects.exceptions';
import {
  SQL_DELETE_PROJECT_ASSET,
  SQL_EXISTS_PROJECT_ASSET_LINK,
  SQL_FIND_PROJECT_ASSETS,
  SQL_INSERT_PROJECT_ASSET,
} from './queries/project-assets.queries';
import {
  PROJECT_COLUMNS,
  SQL_DEACTIVATE_PROJECT,
  SQL_FIND_ALL_ACTIVE_PROJECTS,
  SQL_FIND_PROJECTS_FILTERED,
  SQL_FIND_PROJECTS_FOR_PORTAL_USER,
  SQL_FIND_PROJECT_BY_ID,
  SQL_INSERT_PROJECT,
} from './queries/projects.queries';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { FilterProjectsDto } from './dto/filter-projects.dto';
import { Project, ProjectStatus } from './types/project.types';

const AUDIT_TABLE = {
  PROJECTS: 'projects',
  PROJECTS_ASSETS: 'projects_assets',
} as const;

@Injectable()
export class ProjectsService {
  constructor(
    private readonly db: DatabaseService,
    private readonly auditService: AuditService,
    private readonly portalAccess: PortalAccessService,
    private readonly companiesService: CompaniesService,
    private readonly assetsService: AssetsService,
  ) {}

  async findAllActive(actorUserId: string): Promise<Project[]> {
    const { rows } = await this.db.query<Project>(SQL_FIND_ALL_ACTIVE_PROJECTS, [
      ProjectStatus.ACTIVE,
    ]);

    await this.auditRead(actorUserId, AUDIT_TABLE.PROJECTS, null, {
      scope: 'list',
      resultCount: rows.length,
    });

    return rows;
  }

  async findAllFiltered(
    actorUserId: string,
    filters: FilterProjectsDto = {},
  ): Promise<Project[]> {
    const { rows } = await this.db.query<Project>(SQL_FIND_PROJECTS_FILTERED, [
      filters.status ?? null,
      filters.companyId ?? null,
      filters.companySearch?.trim() || null,
    ]);

    await this.auditRead(actorUserId, AUDIT_TABLE.PROJECTS, null, {
      scope: 'list_filtered',
      status: filters.status ?? null,
      companyId: filters.companyId ?? null,
      companySearch: filters.companySearch?.trim() || null,
      resultCount: rows.length,
    });

    return rows;
  }

  async findAllForPortal(
    userId: string,
    filters: { companyId?: string; companySearch?: string } = {},
  ): Promise<Project[]> {
    const companyId = filters.companyId;
    const companySearch = filters.companySearch?.trim() || null;

    if (companyId) {
      await this.portalAccess.assertCompany(userId, companyId, () => {
        throw new ProyectoNoEncontradoException();
      });
    }

    const { rows } = await this.db.query<Project>(
      SQL_FIND_PROJECTS_FOR_PORTAL_USER,
      [userId, ProjectStatus.ACTIVE, companyId ?? null, companySearch],
    );

    await this.auditRead(userId, AUDIT_TABLE.PROJECTS, null, {
      scope: 'portal_list',
      companyId: companyId ?? null,
      companySearch,
      resultCount: rows.length,
    });

    return rows;
  }

  async findByIdForPortal(userId: string, id: string): Promise<Project> {
    await this.portalAccess.assertProject(userId, id, () => {
      throw new ProyectoNoEncontradoException();
    });

    const project = await this.findProjectRowById(id);

    await this.auditRead(userId, AUDIT_TABLE.PROJECTS, id, {
      scope: 'portal_detail',
    });

    return project;
  }

  async findById(actorUserId: string, id: string): Promise<Project> {
    const project = await this.findProjectRowById(id);

    await this.auditRead(actorUserId, AUDIT_TABLE.PROJECTS, id, { scope: 'detail' });

    return project;
  }

  async create(actorUserId: string, dto: CreateProjectDto): Promise<Project> {
    await this.companiesService.findById(actorUserId, dto.companyId);

    const { rows } = await this.db.query<Project>(SQL_INSERT_PROJECT, [
      dto.companyId,
      dto.name,
      dto.description?.trim() || null,
      dto.type,
      ProjectStatus.ACTIVE,
    ]);

    const project = rows[0];

    await this.auditService.log({
      userId: actorUserId,
      action: AuditAction.CREATE,
      tableName: AUDIT_TABLE.PROJECTS,
      recordId: project.id,
      newValues: this.asJson(project),
    });

    return project;
  }

  async update(
    actorUserId: string,
    id: string,
    dto: UpdateProjectDto,
  ): Promise<Project> {
    const previous = await this.findProjectRowById(id);

    const { sets, values } = this.buildProjectUpdate(dto);
    if (sets.length === 0) {
      return previous;
    }

    values.push(id);
    const idParam = values.length;

    const { rows } = await this.db.query<Project>(
      `UPDATE projects SET ${sets.join(', ')}, updated_at = NOW()
       WHERE id = $${idParam}
       RETURNING ${PROJECT_COLUMNS}`,
      values,
    );

    if (!rows[0]) {
      throw new ProyectoNoEncontradoException();
    }

    const updated = rows[0];

    await this.auditService.log({
      userId: actorUserId,
      action: AuditAction.UPDATE,
      tableName: AUDIT_TABLE.PROJECTS,
      recordId: id,
      oldValues: this.asJson(previous),
      newValues: this.asJson(updated),
    });

    return updated;
  }

  async deactivate(actorUserId: string, id: string): Promise<Project> {
    const previous = await this.findProjectRowById(id);

    const { rows } = await this.db.query<Project>(SQL_DEACTIVATE_PROJECT, [
      ProjectStatus.INACTIVE,
      id,
    ]);

    if (!rows[0]) {
      throw new ProyectoNoEncontradoException();
    }

    const deactivated = rows[0];

    await this.auditService.log({
      userId: actorUserId,
      action: AuditAction.SOFT_DELETE,
      tableName: AUDIT_TABLE.PROJECTS,
      recordId: id,
      oldValues: this.asJson(previous),
      newValues: this.asJson(deactivated),
    });

    return deactivated;
  }

  async getProjectAssets(
    actorUserId: string,
    projectId: string,
  ): Promise<Asset[]> {
    await this.findProjectRowById(projectId);

    const { rows } = await this.db.query<Asset>(SQL_FIND_PROJECT_ASSETS, [
      projectId,
    ]);

    await this.auditRead(actorUserId, AUDIT_TABLE.PROJECTS_ASSETS, projectId, {
      scope: 'list_by_project',
      resultCount: rows.length,
    });

    return rows;
  }

  async linkAsset(
    actorUserId: string,
    projectId: string,
    assetId: string,
  ): Promise<void> {
    await this.findProjectRowById(projectId);
    await this.assetsService.findById(assetId);

    const exists = await this.db.query(SQL_EXISTS_PROJECT_ASSET_LINK, [
      projectId,
      assetId,
    ]);

    if (exists.rowCount && exists.rowCount > 0) {
      throw new ArchivoYaVinculadoAlProyectoException();
    }

    await this.db.query(SQL_INSERT_PROJECT_ASSET, [projectId, assetId]);

    await this.auditService.log({
      userId: actorUserId,
      action: AuditAction.ASSIGN,
      tableName: AUDIT_TABLE.PROJECTS_ASSETS,
      recordId: projectId,
      newValues: { projectId, assetId },
    });
  }

  async unlinkAsset(
    actorUserId: string,
    projectId: string,
    assetId: string,
  ): Promise<void> {
    const result = await this.db.query(SQL_DELETE_PROJECT_ASSET, [
      projectId,
      assetId,
    ]);

    if (!result.rowCount) {
      throw new VinculoProyectoArchivoNoEncontradoException();
    }

    await this.auditService.log({
      userId: actorUserId,
      action: AuditAction.UNLINK,
      tableName: AUDIT_TABLE.PROJECTS_ASSETS,
      recordId: projectId,
      oldValues: { projectId, assetId },
    });
  }

  async uploadAssetToProject(
    actorUserId: string,
    projectId: string,
    file: Express.Multer.File,
    displayName?: string,
  ): Promise<Asset> {
    await this.findProjectRowById(projectId);

    const asset = await this.assetsService.uploadFile({
      buffer: file.buffer,
      originalName: file.originalname,
      mimeType: file.mimetype,
      ownerType: 'projects',
      ownerId: projectId,
      uploadedById: actorUserId,
      displayFileName: displayName?.trim() || undefined,
    });

    await this.db.query(SQL_INSERT_PROJECT_ASSET, [projectId, asset.id]);

    await this.auditService.log({
      userId: actorUserId,
      action: AuditAction.ASSIGN,
      tableName: AUDIT_TABLE.PROJECTS_ASSETS,
      recordId: projectId,
      newValues: {
        projectId,
        assetId: asset.id,
        fileName: asset.fileName,
        source: 'upload',
      },
    });

    return asset;
  }

  async findProjectRowById(id: string): Promise<Project> {
    const { rows } = await this.db.query<Project>(SQL_FIND_PROJECT_BY_ID, [id]);

    if (!rows[0]) {
      throw new ProyectoNoEncontradoException();
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

  private buildProjectUpdate(dto: UpdateProjectDto): {
    sets: string[];
    values: unknown[];
  } {
    const sets: string[] = [];
    const values: unknown[] = [];
    let index = 1;

    const columns: Array<{ field: keyof UpdateProjectDto; column: string }> = [
      { field: 'name', column: 'name' },
      { field: 'description', column: 'description' },
      { field: 'type', column: 'type' },
      { field: 'status', column: 'status' },
    ];

    for (const { field, column } of columns) {
      if (dto[field] !== undefined) {
        sets.push(`${column} = $${index++}`);
        const value =
          field === 'description' && typeof dto.description === 'string'
            ? dto.description.trim() || null
            : dto[field];
        values.push(value);
      }
    }

    return { sets, values };
  }
}
