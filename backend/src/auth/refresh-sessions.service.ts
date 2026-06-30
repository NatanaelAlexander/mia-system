import { createHash } from 'node:crypto';
import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../common/database/database.service';
import { parseExpiresInToSeconds } from './auth.config';
import { RefreshTokenInvalidoException } from './exceptions/auth.exceptions';
import {
  SQL_FIND_ACTIVE_REFRESH_SESSION,
  SQL_FIND_REFRESH_SESSION_BY_ID,
  SQL_INSERT_REFRESH_SESSION,
  SQL_REVOKE_ALL_USER_REFRESH_SESSIONS,
  SQL_REVOKE_REFRESH_SESSION,
} from './queries/refresh-sessions.queries';
import {
  RefreshSession,
  SessionClientContext,
} from './types/refresh-session.types';

@Injectable()
export class RefreshSessionsService {
  constructor(private readonly db: DatabaseService) {}

  hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  computeExpiresAt(refreshExpiresIn: string): Date {
    const seconds = parseExpiresInToSeconds(refreshExpiresIn);
    return new Date(Date.now() + seconds * 1000);
  }

  async createSession(
    sessionId: string,
    userId: string,
    refreshToken: string,
    refreshExpiresIn: string,
    context: SessionClientContext = {},
  ): Promise<RefreshSession> {
    const tokenHash = this.hashToken(refreshToken);
    const expiresAt = this.computeExpiresAt(refreshExpiresIn);

    const { rows } = await this.db.query<RefreshSession>(
      SQL_INSERT_REFRESH_SESSION,
      [
        sessionId,
        userId,
        tokenHash,
        expiresAt,
        context.userAgent ?? null,
        context.ipAddress ?? null,
      ],
    );

    return rows[0];
  }

  async assertValidForRefresh(
    refreshToken: string,
    sessionId: string,
    userId: string,
  ): Promise<RefreshSession> {
    const { rows } = await this.db.query<RefreshSession>(
      SQL_FIND_ACTIVE_REFRESH_SESSION,
      [sessionId, userId],
    );

    if (rows[0]) {
      if (rows[0].tokenHash !== this.hashToken(refreshToken)) {
        await this.revokeAllForUser(userId);
        throw new RefreshTokenInvalidoException();
      }

      return rows[0];
    }

    const { rows: existingRows } = await this.db.query<RefreshSession>(
      SQL_FIND_REFRESH_SESSION_BY_ID,
      [sessionId],
    );

    const existing = existingRows[0];
    if (
      existing &&
      existing.userId === userId &&
      existing.revokedAt !== null
    ) {
      await this.revokeAllForUser(userId);
    }

    throw new RefreshTokenInvalidoException();
  }

  async revokeSession(
    sessionId: string,
    userId: string,
    replacedById?: string | null,
  ): Promise<void> {
    await this.db.query(SQL_REVOKE_REFRESH_SESSION, [
      sessionId,
      userId,
      replacedById ?? null,
    ]);
  }

  async revokeAllForUser(userId: string): Promise<void> {
    await this.db.query(SQL_REVOKE_ALL_USER_REFRESH_SESSIONS, [userId]);
  }
}
