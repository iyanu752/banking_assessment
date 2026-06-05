import sqlite3, { Database } from "sqlite3";
import config from "../config/config";
import logger from "../config/logger";

let db: Database;

export function getDb(): Database {
  return db;
}

export const dbRun = (sql: string, params: unknown[] = []): Promise<void> =>
  new Promise((resolve, reject) =>
    getDb().run(sql, params, (err) => (err ? reject(err) : resolve()))
  );

export const dbGet = <T>(sql: string, params: unknown[] = []): Promise<T | undefined> =>
  new Promise((resolve, reject) =>
    getDb().get(sql, params, (err, row) => (err ? reject(err) : resolve(row as T)))
  );

export const dbAll = <T>(sql: string, params: unknown[] = []): Promise<T[]> =>
  new Promise((resolve, reject) =>
    getDb().all(sql, params, (err, rows) => (err ? reject(err) : resolve(rows as T[])))
  );

export function connectDb(): Promise<Database> {
  return new Promise((resolve, reject) => {
    db = new sqlite3.Database(config.dbPath, (err) => {
      if (err) return reject(err);
      logger.info("Connected to SQLite database", { path: config.dbPath });
      resolve(db);
    });
  });
}