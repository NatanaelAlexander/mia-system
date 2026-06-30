import { Injectable } from '@nestjs/common';
import { AssetsService } from '../assets/assets.service';
import { Asset } from '../assets/types/asset.types';
import { CompaniesService } from '../companies/companies.service';
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
  SQL_FIND_PROJECT_BY_ID,
  SQL_INSERT_PROJECT,
} from './queries/projects.queries';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { Project, ProjectStatus } from './types/project.types';

@Injectable()
export class ProjectsService {
  constructor(
    private readonly db: DatabaseService,
    private readonly companiesService: CompaniesService,
    private readonly assetsService: AssetsService,
  ) {}

  async findAllActive(): Promise<Project[]> {
    const { rows } = await this.db.query<Project>(SQL_FIND_ALL_ACTIVE_PROJECTS, [
      ProjectStatus.ACTIVE,
    ]);
    return rows;
  }

  async findById(id: string): Promise<Project> {
    const { rows } = await this.db.query<Project>(SQL_FIND_PROJECT_BY_ID, [id]);

    if (!rows[0]) {
      throw new ProyectoNoEncontradoException();
    }

    return rows[0];
  }

  async create(dto: CreateProjectDto): Promise<Project> {
    await this.companiesService.findById(dto.companyId);

    const { rows } = await this.db.query<Project>(SQL_INSERT_PROJECT, [
      dto.companyId,
      dto.name,
      dto.type,
      ProjectStatus.ACTIVE,
    ]);

    return rows[0];
  }

  async update(id: string, dto: UpdateProjectDto): Promise<Project> {
    await this.findById(id);

    const { sets, values } = this.buildProjectUpdate(dto);
    if (sets.length === 0) {
      return this.findById(id);
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

    return rows[0];
  }

  async deactivate(id: string): Promise<Project> {
    const { rows } = await this.db.query<Project>(SQL_DEACTIVATE_PROJECT, [
      ProjectStatus.INACTIVE,
      id,
    ]);

    if (!rows[0]) {
      throw new ProyectoNoEncontradoException();
    }

    return rows[0];
  }

  async getProjectAssets(projectId: string): Promise<Asset[]> {
    await this.findById(projectId);

    const { rows } = await this.db.query<Asset>(SQL_FIND_PROJECT_ASSETS, [
      projectId,
    ]);

    return rows;
  }

  async linkAsset(projectId: string, assetId: string): Promise<void> {
    await this.findById(projectId);
    await this.assetsService.findById(assetId);

    const exists = await this.db.query(SQL_EXISTS_PROJECT_ASSET_LINK, [
      projectId,
      assetId,
    ]);

    if (exists.rowCount && exists.rowCount > 0) {
      throw new ArchivoYaVinculadoAlProyectoException();
    }

    await this.db.query(SQL_INSERT_PROJECT_ASSET, [projectId, assetId]);
  }

  async unlinkAsset(projectId: string, assetId: string): Promise<void> {
    const result = await this.db.query(SQL_DELETE_PROJECT_ASSET, [
      projectId,
      assetId,
    ]);

    if (!result.rowCount) {
      throw new VinculoProyectoArchivoNoEncontradoException();
    }
  }

  async uploadAssetToProject(
    projectId: string,
    file: Express.Multer.File,
    uploadedById?: string | null,
  ): Promise<Asset> {
    await this.findById(projectId);

    const asset = await this.assetsService.uploadFile({
      buffer: file.buffer,
      originalName: file.originalname,
      mimeType: file.mimetype,
      ownerType: 'projects',
      ownerId: projectId,
      uploadedById,
    });

    await this.db.query(SQL_INSERT_PROJECT_ASSET, [projectId, asset.id]);

    return asset;
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
      { field: 'type', column: 'type' },
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
}
