import { Injectable } from '@nestjs/common';
import { AuditAction } from '../audit/types/audit.types';
import { AuditService } from '../audit/audit.service';
import { PermissionsService } from '../auth/permissions/permissions.service';
import { AuthService } from '../auth/auth.service';
import { EmpresaNoEncontradaException } from '../companies/exceptions/companies.exceptions';
import { DatabaseService } from '../common/database/database.service';
import {
  AdminChangePasswordDto,
  AssignUserRolesDto,
  ChangePasswordDto,
  CreateUserDto,
  CreateJobTitleDto,
  FilterUsersDto,
  LinkUserCompanyDto,
  UpdateProfileDto,
  UpdateUserDto,
  UpdateJobTitleDto,
} from './dto/users.dto';
import {
  CargoNoEncontradoException,
  CargoNombreDuplicadoException,
  ContrasenaActualIncorrectaException,
  EmailUsuarioDuplicadoException,
  NoPuedesDesactivarTuCuentaException,
  RolNoEncontradoException,
  SoloClientesPuedenVincularseEmpresaException,
  SoloPuedesModificarTuPerfilException,
  UsuarioNoEncontradoException,
  VinculoUsuarioEmpresaNoEncontradoException,
} from './exceptions/users.exceptions';
import {
  SQL_DELETE_USER_COMPANY,
  SQL_DELETE_USER_JOB_TITLES,
  SQL_DELETE_USER_ROLES,
  SQL_EXISTS_COMPANY_ACTIVE,
  SQL_EXISTS_USER_COMPANY,
  SQL_FIND_ALL_JOB_TITLES,
  SQL_FIND_ALL_ROLES,
  SQL_INSERT_JOB_TITLE,
  SQL_UPDATE_JOB_TITLE,
  SQL_DELETE_JOB_TITLE,
  SQL_EXISTS_JOB_TITLE_BY_NAME,
  SQL_FIND_JOB_TITLE_BY_ID,
  SQL_FIND_ROLE_BY_ID,
  SQL_FIND_USER_COMPANIES,
  SQL_FIND_USER_JOB_TITLES,
  SQL_FIND_USER_ROLE_IDS,
  SQL_FIND_USER_ROLE_NAMES,
  SQL_INSERT_USER_COMPANY,
  SQL_INSERT_USER_JOB_TITLE,
  SQL_INSERT_USER_ROLE,
} from './queries/user-relations.queries';
import {
  SQL_DEACTIVATE_USER,
  SQL_EXISTS_USER_BY_EMAIL,
  SQL_FIND_ALL_USERS,
  SQL_FIND_USER_BY_ID,
  SQL_INSERT_USER,
  SQL_UPDATE_USER_PASSWORD,
  SQL_UPDATE_USER_PASSWORD_FORCE,
  USER_COLUMNS,
} from './queries/users.queries';
import {
  JobTitleListItem,
  JobTitleOption,
  RoleOption,
  User,
  UserDetail,
} from './types/user.types';

interface UpdateUserOptions {
  /** true = admin con `users:update` puede modificar otro usuario */
  asAdmin?: boolean;
}

const AUDIT_TABLE = {
  USERS: 'users',
  USERS_ROLES: 'users_roles',
  USERS_COMPANIES: 'users_companies',
  USERS_JOB_TITLES: 'users_job_titles',
  JOB_TITLES: 'job_titles',
} as const;

const PORTAL_CLIENT_ROLE = 'cliente';
const INTERNAL_ROLES = new Set(['admin', 'super_admin']);

@Injectable()
export class UsersService {
  constructor(
    private readonly db: DatabaseService,
    private readonly auditService: AuditService,
    private readonly permissionsService: PermissionsService,
    private readonly authService: AuthService,
  ) {}

  async findAll(filters: FilterUsersDto = {}): Promise<User[]> {
    const { rows } = await this.db.query<User>(SQL_FIND_ALL_USERS, [
      filters.isActive ?? null,
      filters.roleName ?? null,
      filters.companyId ?? null,
    ]);

    return rows;
  }

  async findById(id: string): Promise<UserDetail> {
    const user = await this.findUserById(id);
    return this.toUserDetail(user);
  }

  async create(dto: CreateUserDto, actorUserId: string | null): Promise<UserDetail> {
    await this.ensureEmailAvailable(dto.email);

    const { rows } = await this.db.query<User>(SQL_INSERT_USER, [
      dto.email.trim().toLowerCase(),
      dto.password,
      dto.firstName.trim(),
      dto.lastName.trim(),
      dto.phoneNumber ?? null,
      dto.isActive ?? true,
    ]);

    const user = rows[0];

    if (dto.roleIds?.length) {
      await this.replaceRoles(user.id, dto.roleIds, actorUserId, false);
    }

    if (dto.jobTitleIds?.length) {
      await this.replaceJobTitles(user.id, dto.jobTitleIds, actorUserId, false);
    }

    if (dto.companyIds?.length) {
      for (const companyId of dto.companyIds) {
        await this.linkCompany(user.id, { companyId }, actorUserId, false);
      }
    }

    await this.auditService.log({
      userId: actorUserId,
      action: AuditAction.CREATE,
      tableName: AUDIT_TABLE.USERS,
      recordId: user.id,
      newValues: this.asJson(await this.toUserDetail(user)),
    });

    return this.toUserDetail(user);
  }

  async update(
    id: string,
    dto: UpdateUserDto,
    actorUserId: string,
    options: UpdateUserOptions = {},
  ): Promise<UserDetail> {
    this.assertSelfOrAdmin(id, actorUserId, options.asAdmin === true);

    const previous = await this.toUserDetail(await this.findUserById(id));

    if (dto.email) {
      await this.ensureEmailAvailable(dto.email, id);
    }

    const { sets, values } = this.buildUserUpdate(dto);
    let user = previous;

    if (sets.length > 0) {
      values.push(id);
      const idParam = values.length;

      const { rows } = await this.db.query<User>(
        `UPDATE users SET ${sets.join(', ')}, updated_at = NOW()
         WHERE id = $${idParam}
         RETURNING ${USER_COLUMNS}`,
        values,
      );

      if (!rows[0]) {
        throw new UsuarioNoEncontradoException();
      }

      user = await this.toUserDetail(rows[0]);
    }

    if (dto.jobTitleIds) {
      await this.replaceJobTitles(id, dto.jobTitleIds, actorUserId, false);
      user = await this.toUserDetail(await this.findUserById(id));
    }

    await this.auditService.log({
      userId: actorUserId,
      action: AuditAction.UPDATE,
      tableName: AUDIT_TABLE.USERS,
      recordId: id,
      oldValues: this.asJson(previous),
      newValues: this.asJson(user),
    });

    return user;
  }

  async deactivate(id: string, actorUserId: string | null): Promise<User> {
    if (actorUserId && actorUserId === id) {
      throw new NoPuedesDesactivarTuCuentaException();
    }

    const previous = await this.findUserById(id);
    const { rows } = await this.db.query<User>(SQL_DEACTIVATE_USER, [id]);

    if (!rows[0]) {
      throw new UsuarioNoEncontradoException();
    }

    this.permissionsService.invalidateUser(id);
    await this.authService.revokeAllSessionsForUser(id);

    await this.auditService.log({
      userId: actorUserId,
      action: AuditAction.SOFT_DELETE,
      tableName: AUDIT_TABLE.USERS,
      recordId: id,
      oldValues: this.asJson(previous),
      newValues: this.asJson(rows[0]),
    });

    return rows[0];
  }

  async assignRoles(
    id: string,
    dto: AssignUserRolesDto,
    actorUserId: string | null,
  ): Promise<UserDetail> {
    await this.findUserById(id);
    await this.replaceRoles(id, dto.roleIds, actorUserId, true);
    return this.findById(id);
  }

  async linkCompany(
    userId: string,
    dto: LinkUserCompanyDto,
    actorUserId: string | null,
    audit = true,
  ): Promise<UserDetail> {
    await this.findUserById(userId);
    await this.ensurePortalClientUser(userId);
    await this.ensureActiveCompany(dto.companyId);

    await this.db.query(SQL_INSERT_USER_COMPANY, [userId, dto.companyId]);

    if (audit) {
      await this.auditService.log({
        userId: actorUserId,
        action: AuditAction.ASSIGN,
        tableName: AUDIT_TABLE.USERS_COMPANIES,
        recordId: userId,
        newValues: { userId, companyId: dto.companyId },
      });
    }

    return this.findById(userId);
  }

  async unlinkCompany(
    userId: string,
    companyId: string,
    actorUserId: string | null,
  ): Promise<UserDetail> {
    await this.findUserById(userId);

    const { rowCount } = await this.db.query(SQL_DELETE_USER_COMPANY, [
      userId,
      companyId,
    ]);

    if (!rowCount) {
      throw new VinculoUsuarioEmpresaNoEncontradoException();
    }

    await this.auditService.log({
      userId: actorUserId,
      action: AuditAction.UNLINK,
      tableName: AUDIT_TABLE.USERS_COMPANIES,
      recordId: userId,
      oldValues: { userId, companyId },
    });

    return this.findById(userId);
  }

  async adminChangePassword(
    id: string,
    dto: AdminChangePasswordDto,
    actorUserId: string | null,
  ): Promise<void> {
    await this.findUserById(id);

    const { rows } = await this.db.query<{ id: string }>(
      SQL_UPDATE_USER_PASSWORD_FORCE,
      [id, dto.password],
    );

    if (!rows[0]) {
      throw new UsuarioNoEncontradoException();
    }

    this.permissionsService.invalidateUser(id);
    await this.authService.revokeAllSessionsForUser(id);

    await this.auditService.log({
      userId: actorUserId,
      action: AuditAction.UPDATE,
      tableName: AUDIT_TABLE.USERS,
      recordId: id,
      newValues: { passwordChanged: true },
    });
  }

  async updateProfile(
    requesterUserId: string,
    dto: UpdateProfileDto,
  ): Promise<UserDetail> {
    this.assertSelfOrAdmin(requesterUserId, requesterUserId, false);
    return this.update(requesterUserId, dto, requesterUserId, { asAdmin: false });
  }

  async changeOwnPassword(
    requesterUserId: string,
    dto: ChangePasswordDto,
  ): Promise<void> {
    this.assertSelfOrAdmin(requesterUserId, requesterUserId, false);

    const { rows } = await this.db.query<{ id: string }>(SQL_UPDATE_USER_PASSWORD, [
      requesterUserId,
      dto.newPassword,
      dto.currentPassword,
    ]);

    if (!rows[0]) {
      throw new ContrasenaActualIncorrectaException();
    }

    this.permissionsService.invalidateUser(requesterUserId);
    await this.authService.revokeAllSessionsForUser(requesterUserId);

    await this.auditService.log({
      userId: requesterUserId,
      action: AuditAction.UPDATE,
      tableName: AUDIT_TABLE.USERS,
      recordId: requesterUserId,
      newValues: { passwordChanged: true },
    });
  }

  async findAllRoles(): Promise<RoleOption[]> {
    const { rows } = await this.db.query<RoleOption>(SQL_FIND_ALL_ROLES);
    return rows;
  }

  async findAllJobTitles(): Promise<JobTitleOption[]> {
    const { rows } = await this.db.query<JobTitleOption>(SQL_FIND_ALL_JOB_TITLES);
    return rows;
  }

  async findAllJobTitlesWithUsage(): Promise<JobTitleListItem[]> {
    const { rows } = await this.db.query<JobTitleListItem>(`
      SELECT jt.id, jt.name, COUNT(ujt.user_id)::int AS "userCount"
      FROM job_titles jt
      LEFT JOIN users_job_titles ujt ON ujt.job_title_id = jt.id
      GROUP BY jt.id, jt.name
      ORDER BY jt.name ASC
    `);

    return rows;
  }

  async createJobTitle(
    dto: CreateJobTitleDto,
    actorUserId: string | null,
  ): Promise<JobTitleOption> {
    const name = dto.name.trim();
    await this.ensureJobTitleNameAvailable(name);

    const { rows } = await this.db.query<JobTitleOption>(SQL_INSERT_JOB_TITLE, [
      name,
    ]);

    const jobTitle = rows[0];

    await this.auditService.log({
      userId: actorUserId,
      action: AuditAction.CREATE,
      tableName: AUDIT_TABLE.JOB_TITLES,
      recordId: jobTitle.id,
      newValues: this.asJson(jobTitle),
    });

    return jobTitle;
  }

  async updateJobTitle(
    id: string,
    dto: UpdateJobTitleDto,
    actorUserId: string | null,
  ): Promise<JobTitleOption> {
    const previous = await this.findJobTitleById(id);
    const name = dto.name.trim();
    await this.ensureJobTitleNameAvailable(name, id);

    const { rows } = await this.db.query<JobTitleOption>(SQL_UPDATE_JOB_TITLE, [
      id,
      name,
    ]);

    if (!rows[0]) {
      throw new CargoNoEncontradoException();
    }

    await this.auditService.log({
      userId: actorUserId,
      action: AuditAction.UPDATE,
      tableName: AUDIT_TABLE.JOB_TITLES,
      recordId: id,
      oldValues: this.asJson(previous),
      newValues: this.asJson(rows[0]),
    });

    return rows[0];
  }

  async deleteJobTitle(id: string, actorUserId: string | null): Promise<JobTitleOption> {
    const previous = await this.findJobTitleById(id);

    const { rows } = await this.db.query<JobTitleOption>(SQL_DELETE_JOB_TITLE, [id]);

    if (!rows[0]) {
      throw new CargoNoEncontradoException();
    }

    await this.auditService.log({
      userId: actorUserId,
      action: AuditAction.SOFT_DELETE,
      tableName: AUDIT_TABLE.JOB_TITLES,
      recordId: id,
      oldValues: this.asJson(previous),
    });

    return rows[0];
  }

  private async replaceRoles(
    userId: string,
    roleIds: string[],
    actorUserId: string | null,
    audit: boolean,
  ): Promise<void> {
    const uniqueRoleIds = [...new Set(roleIds)];
    await Promise.all(uniqueRoleIds.map((roleId) => this.ensureRoleExists(roleId)));

    const { rows: beforeRows } = await this.db.query<{ id: string; name: string }>(
      SQL_FIND_USER_ROLE_IDS,
      [userId],
    );

    await this.db.query(SQL_DELETE_USER_ROLES, [userId]);

    for (const roleId of uniqueRoleIds) {
      await this.db.query(SQL_INSERT_USER_ROLE, [userId, roleId]);
    }

    this.permissionsService.invalidateUser(userId);

    if (audit) {
      await this.auditService.log({
        userId: actorUserId,
        action: AuditAction.PERMISSION_CHANGE,
        tableName: AUDIT_TABLE.USERS_ROLES,
        recordId: userId,
        oldValues: { roleIds: beforeRows.map((row) => row.id) },
        newValues: { roleIds: uniqueRoleIds },
      });
    }
  }

  private async replaceJobTitles(
    userId: string,
    jobTitleIds: string[],
    actorUserId: string | null,
    audit: boolean,
  ): Promise<void> {
    const uniqueIds = [...new Set(jobTitleIds)];
    await Promise.all(uniqueIds.map((id) => this.ensureJobTitleExists(id)));

    const { rows: beforeRows } = await this.db.query<JobTitleOption>(
      SQL_FIND_USER_JOB_TITLES,
      [userId],
    );

    await this.db.query(SQL_DELETE_USER_JOB_TITLES, [userId]);

    for (const jobTitleId of uniqueIds) {
      await this.db.query(SQL_INSERT_USER_JOB_TITLE, [userId, jobTitleId]);
    }

    if (audit) {
      await this.auditService.log({
        userId: actorUserId,
        action: AuditAction.UPDATE,
        tableName: AUDIT_TABLE.USERS_JOB_TITLES,
        recordId: userId,
        oldValues: { jobTitleIds: beforeRows.map((row) => row.id) },
        newValues: { jobTitleIds: uniqueIds },
      });
    }
  }

  private async toUserDetail(user: User): Promise<UserDetail> {
    const [roles, jobTitles, companies] = await Promise.all([
      this.db.query<{ id: string; name: string }>(SQL_FIND_USER_ROLE_IDS, [
        user.id,
      ]),
      this.db.query<JobTitleOption>(SQL_FIND_USER_JOB_TITLES, [user.id]),
      this.db.query<{ id: string; name: string }>(SQL_FIND_USER_COMPANIES, [
        user.id,
      ]),
    ]);

    return {
      ...user,
      roles: roles.rows.map((row) => row.name),
      roleIds: roles.rows.map((row) => row.id),
      jobTitles: jobTitles.rows.map((row) => row.name),
      jobTitleIds: jobTitles.rows.map((row) => row.id),
      companies: companies.rows,
    };
  }

  private async findUserById(id: string): Promise<User> {
    const { rows } = await this.db.query<User>(SQL_FIND_USER_BY_ID, [id]);

    if (!rows[0]) {
      throw new UsuarioNoEncontradoException();
    }

    return rows[0];
  }

  private async ensureEmailAvailable(
    email: string,
    excludeId?: string,
  ): Promise<void> {
    const { rowCount } = await this.db.query(SQL_EXISTS_USER_BY_EMAIL, [
      email.trim().toLowerCase(),
      excludeId ?? null,
    ]);

    if (rowCount && rowCount > 0) {
      throw new EmailUsuarioDuplicadoException();
    }
  }

  private async ensureRoleExists(roleId: string): Promise<void> {
    const { rowCount } = await this.db.query(SQL_FIND_ROLE_BY_ID, [roleId]);
    if (!rowCount) {
      throw new RolNoEncontradoException();
    }
  }

  private async ensureJobTitleExists(jobTitleId: string): Promise<void> {
    const { rowCount } = await this.db.query(SQL_FIND_JOB_TITLE_BY_ID, [
      jobTitleId,
    ]);
    if (!rowCount) {
      throw new CargoNoEncontradoException();
    }
  }

  private async findJobTitleById(id: string): Promise<JobTitleOption> {
    const { rows } = await this.db.query<JobTitleOption>(SQL_FIND_JOB_TITLE_BY_ID, [
      id,
    ]);

    if (!rows[0]) {
      throw new CargoNoEncontradoException();
    }

    return rows[0];
  }

  private async ensureJobTitleNameAvailable(
    name: string,
    excludeId?: string,
  ): Promise<void> {
    const { rowCount } = await this.db.query(SQL_EXISTS_JOB_TITLE_BY_NAME, [
      name,
      excludeId ?? null,
    ]);

    if (rowCount) {
      throw new CargoNombreDuplicadoException();
    }
  }

  private async ensureActiveCompany(companyId: string): Promise<void> {
    const { rowCount } = await this.db.query(SQL_EXISTS_COMPANY_ACTIVE, [
      companyId,
    ]);
    if (!rowCount) {
      throw new EmpresaNoEncontradaException();
    }
  }

  private async ensurePortalClientUser(userId: string): Promise<void> {
    const { rows } = await this.db.query<{ name: string }>(
      SQL_FIND_USER_ROLE_NAMES,
      [userId],
    );
    const roles = rows.map((row) => row.name);
    const isPortalClient =
      roles.includes(PORTAL_CLIENT_ROLE) &&
      !roles.some((role) => INTERNAL_ROLES.has(role));

    if (!isPortalClient) {
      throw new SoloClientesPuedenVincularseEmpresaException();
    }
  }

  private buildUserUpdate(dto: UpdateUserDto): {
    sets: string[];
    values: unknown[];
  } {
    const sets: string[] = [];
    const values: unknown[] = [];

    if (dto.email !== undefined) {
      values.push(dto.email.trim().toLowerCase());
      sets.push(`email = $${values.length}`);
    }

    if (dto.firstName !== undefined) {
      values.push(dto.firstName.trim());
      sets.push(`first_name = $${values.length}`);
    }

    if (dto.lastName !== undefined) {
      values.push(dto.lastName.trim());
      sets.push(`last_name = $${values.length}`);
    }

    if (dto.phoneNumber !== undefined) {
      values.push(dto.phoneNumber);
      sets.push(`phone_number = $${values.length}`);
    }

    if (dto.isActive !== undefined) {
      values.push(dto.isActive);
      sets.push(`is_active = $${values.length}`);
    }

    return { sets, values };
  }

  private assertSelfOrAdmin(
    targetUserId: string,
    requesterUserId: string,
    asAdmin: boolean,
  ): void {
    if (!asAdmin && targetUserId !== requesterUserId) {
      throw new SoloPuedesModificarTuPerfilException();
    }
  }

  private asJson(value: object): Record<string, unknown> {
    return { ...value } as Record<string, unknown>;
  }
}
