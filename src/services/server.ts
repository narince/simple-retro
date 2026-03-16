import { PostgresService } from './postgres-service';
import { IDataService } from './interface';

// This file should ONLY be imported by Server Components or API Routes
export const serverDataService: IDataService = new PostgresService();
