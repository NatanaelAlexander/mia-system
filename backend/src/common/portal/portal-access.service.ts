import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import {
  SQL_USER_HAS_ASSET,
  SQL_USER_HAS_COMPANY,
  SQL_USER_HAS_PROJECT,
  SQL_USER_HAS_TICKET,
} from './queries/portal-access.queries';

@Injectable()
export class PortalAccessService {
  constructor(private readonly db: DatabaseService) {}

  async userHasCompany(userId: string, companyId: string): Promise<boolean> {
    const { rowCount } = await this.db.query(SQL_USER_HAS_COMPANY, [
      userId,
      companyId,
    ]);
    return Boolean(rowCount && rowCount > 0);
  }

  async userHasProject(userId: string, projectId: string): Promise<boolean> {
    const { rowCount } = await this.db.query(SQL_USER_HAS_PROJECT, [
      userId,
      projectId,
    ]);
    return Boolean(rowCount && rowCount > 0);
  }

  async userHasTicket(userId: string, ticketId: string): Promise<boolean> {
    const { rowCount } = await this.db.query(SQL_USER_HAS_TICKET, [
      userId,
      ticketId,
    ]);
    return Boolean(rowCount && rowCount > 0);
  }

  async userHasAsset(userId: string, assetId: string): Promise<boolean> {
    const { rowCount } = await this.db.query(SQL_USER_HAS_ASSET, [
      userId,
      assetId,
    ]);
    return Boolean(rowCount && rowCount > 0);
  }

  async assertCompany(
    userId: string,
    companyId: string,
    onDenied: () => never,
  ): Promise<void> {
    if (!(await this.userHasCompany(userId, companyId))) {
      onDenied();
    }
  }

  async assertProject(
    userId: string,
    projectId: string,
    onDenied: () => never,
  ): Promise<void> {
    if (!(await this.userHasProject(userId, projectId))) {
      onDenied();
    }
  }

  async assertTicket(
    userId: string,
    ticketId: string,
    onDenied: () => never,
  ): Promise<void> {
    if (!(await this.userHasTicket(userId, ticketId))) {
      onDenied();
    }
  }

  async assertAsset(
    userId: string,
    assetId: string,
    onDenied: () => never,
  ): Promise<void> {
    if (!(await this.userHasAsset(userId, assetId))) {
      onDenied();
    }
  }
}
