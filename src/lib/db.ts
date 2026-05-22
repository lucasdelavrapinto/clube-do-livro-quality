import Database from 'better-sqlite3';
import path from 'path';

const DB_PATH = path.join(process.cwd(), 'data', 'books.db');

let db: Database.Database;

export function getDb(): Database.Database {
  if (!db) {
    const { mkdirSync } = require('fs');
    mkdirSync(path.dirname(DB_PATH), { recursive: true });
    db = new Database(DB_PATH);
    db.exec(`
      CREATE TABLE IF NOT EXISTS books (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'disponível',
        owner TEXT NOT NULL,
        created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))
      );
      CREATE TABLE IF NOT EXISTS retiradas (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        book_id INTEGER NOT NULL REFERENCES books(id),
        pessoa TEXT NOT NULL,
        retirado_em TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))
      );
      CREATE TABLE IF NOT EXISTS devolucoes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        book_id INTEGER NOT NULL REFERENCES books(id),
        devolvido_em TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))
      );
    `);
    const retiradaCols = db.prepare("PRAGMA table_info(retiradas)").all() as { name: string }[];
    if (!retiradaCols.some((c) => c.name === 'telefone')) {
      db.exec("ALTER TABLE retiradas ADD COLUMN telefone TEXT NOT NULL DEFAULT ''");
    }
    const bookCols = db.prepare("PRAGMA table_info(books)").all() as { name: string }[];
    if (!bookCols.some((c) => c.name === 'descricao')) {
      db.exec("ALTER TABLE books ADD COLUMN descricao TEXT NOT NULL DEFAULT ''");
    }
  }
  return db;
}

export type BookStatus = 'disponível' | 'indisponível';

export interface Book {
  id: number;
  name: string;
  status: BookStatus;
  owner: string;
  descricao: string;
  created_at: string;
}

export interface Retirada {
  id: number;
  book_id: number;
  pessoa: string;
  telefone: string;
  retirado_em: string;
  book_name?: string;
}

export interface Devolucao {
  id: number;
  book_id: number;
  devolvido_em: string;
  book_name?: string;
}
