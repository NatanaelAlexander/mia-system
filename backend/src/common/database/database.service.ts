import {
  Injectable,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { Pool, QueryResult, QueryResultRow } from 'pg';
import { resolveDatabaseUrl } from './database-url';

@Injectable()
export class DatabaseService implements OnModuleInit, OnModuleDestroy {
  private pool!: Pool;

  onModuleInit(): void {
    this.pool = new Pool({ connectionString: resolveDatabaseUrl() });
  }

  async onModuleDestroy(): Promise<void> {
    await this.pool?.end();
  }

  query<T extends QueryResultRow = QueryResultRow>(
    text: string,
    params?: unknown[],
  ): Promise<QueryResult<T>> {
    return this.pool.query<T>(text, params);
  }

  async transaction<T>(
    fn: (
      query: <R extends QueryResultRow = QueryResultRow>(
        text: string,
        params?: unknown[],
      ) => Promise<QueryResult<R>>,
    ) => Promise<T>,
  ): Promise<T> {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      const query = <R extends QueryResultRow = QueryResultRow>(
        text: string,
        params?: unknown[],
      ) => client.query<R>(text, params);
      const result = await fn(query);
      await client.query('COMMIT');
      return result;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }
}
