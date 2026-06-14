import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(process.cwd(), '.env') });

export default {
  port: process.env.PORT,
  DatabaseURL: process.env.DatabaseURL,
  bycrypt_salt_round: process.env.BCRYPT_SALT_ROUND,
  default_password: process.env.DEFAULT_PASSWORD,
  NODE_ENV: process.env.NODE_ENV,
  JWT_ACCESS_SECRET: process.env.JWT_ACCESS_SECRET,
  GEMINI_API_KEY: process.env.GEMINI_API_KEY,
  telegram_bot_token: process.env.TELEGRAM_BOT_TOKEN,
  frontend_url: process.env.FRONTEND_URL || 'http://localhost:5173',
  ollama_host: process.env.OLLAMA_HOST || 'http://localhost:11434',
};
