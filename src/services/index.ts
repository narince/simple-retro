
import { IDataService } from './interface';
import { PostgresService } from './postgres-service';
import { ApiService } from './api-service';

// Use Postgres if available (Neon), otherwise fallback to API (File) or LocalStorage
// For this migration, we default to PostgresService as we have credentials
export const dataService: IDataService = new PostgresService();
