import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import {
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
}
