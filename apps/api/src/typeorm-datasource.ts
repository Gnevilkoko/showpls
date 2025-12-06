import { DataSource } from 'typeorm';
import { ConfigService } from './config/config.service';
import databaseConfig from './config/database.config';
import * as path from 'path';

// Load environment variables (e.g., .env.development)
ConfigService.loadEnv();

// Get the shared database configuration
const config = databaseConfig();

// Export the DataSource instance for TypeORM CLI
export default new DataSource({
  ...config,
  // Ensure migrations are correctly located
  migrations: [
    path.join(__dirname, 'db/migrations/*{.ts,.js}'),
  ],
  // Ensure synchronize is false for migration generation to avoid auto-syncing during CLI operations
  synchronize: false,
});