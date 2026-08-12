import * as dotenv from 'dotenv';
dotenv.config();

interface Config {
  url: string;
  authToken: string;
  filePath: string;
}

const config: Config = {
  url: process.env.URL!,
  authToken: process.env.AUTH_TOKEN!,
  filePath: process.env.FILE_PATH!,
};

export default config;
