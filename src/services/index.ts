
import { IDataService } from './interface';
import { ApiService } from './api-service';

// Client-side code should ALWAYS use the API service
// The API service calls the Next.js API Routes, which then use the PostgresService
export const dataService: IDataService = new ApiService();
