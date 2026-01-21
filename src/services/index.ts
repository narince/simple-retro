
import { IDataService } from './interface';
import { LocalStorageService } from './local-storage-service';

// For now, force Local First (Netlify Compatibility)
export const dataService: IDataService = new LocalStorageService();
