/* eslint-disable no-console */
import { Server } from 'http';
import mongoose from 'mongoose';
import app from './app';
import config from './app/config';
import telegramBot from './app/Modules/Telegram/telegram.bot';

let server: Server;

async function main() {
  try {
    await mongoose.connect(config.DatabaseURL as string);

    server = app.listen(config.port, () => {
      console.log(`App is listening on port ${config.port}`);
    });

    // Start Telegram bot
    if (config.telegram_bot_token) {
      telegramBot.launch({
        dropPendingUpdates: true,
      });
      console.log('✅ Telegram bot started successfully');
    } else {
      console.log('⚠️  Telegram bot token not found. Bot is disabled.');
    }
  } catch (err) {
    console.error(err);
  }
}

main();

// Graceful shutdown for Telegram bot
process.once('SIGINT', () => {
  console.log('SIGINT received, stopping bot...');
  telegramBot.stop('SIGINT');
});

process.once('SIGTERM', () => {
  console.log('SIGTERM received, stopping bot...');
  telegramBot.stop('SIGTERM');
});

process.on('unhandledRejection', () => {
  console.log('Unhandled rejection detected, shutting down...');
  if (server) {
    server.close(() => {
      process.exit(1);
    });
  }
  process.exit(1);
});

process.on('uncaughtException', () => {
  console.log('Uncaught exception detected, shutting down...');
  process.exit(1);
});
