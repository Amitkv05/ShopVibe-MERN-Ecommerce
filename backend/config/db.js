import mongoose from "mongoose";
import { detectDatabaseCapabilities } from "./databaseCapabilities.js";
import { logger } from "./logger.js";

export const connectMongoDatabase = async () => {
  let connection;
  try {
    connection = await mongoose.connect(process.env.DB_URI, {
      serverSelectionTimeoutMS: Number(process.env.DB_SERVER_SELECTION_TIMEOUT_MS) || 10000,
      autoIndex: process.env.NODE_ENV !== "production",
      maxPoolSize: Number(process.env.DB_MAX_POOL_SIZE) || 20,
      minPoolSize: Number(process.env.DB_MIN_POOL_SIZE) || 0,
    });

    const capabilities = await detectDatabaseCapabilities(connection.connection);
    logger.info({
      host: connection.connection.host,
      database: connection.connection.name,
      topology: capabilities.topology,
      transactionsEnabled: capabilities.transactionsEnabled,
      transactionMode: capabilities.transactionMode,
    }, "MongoDB connected");
    return connection;
  } catch (error) {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.close(false).catch(() => {});
    }
    throw error;
  }
};

export const disconnectMongoDatabase = async () => {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.connection.close(false);
  }
};
