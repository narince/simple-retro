
import { IDataService } from './interface';
import { ApiService } from './api-service';

// For now, force Local First
export const dataService: IDataService = new ApiService();
