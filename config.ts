import * as dotenv from 'dotenv';

import * as path from 'path';

dotenv.config();

export const config = {
  url: process.env.URL || 'http://localhost:3000',
  authToken: process.env.AUTH_TOKEN || '',
  filePath: process.env.FILE_PATH || path.join(__dirname, 'rental_cars_backend_booking_testcases.json'),
};

export default config;
