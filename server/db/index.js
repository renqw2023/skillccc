/**
 * SQLite Database Module
 * Manages user accounts, stars, and comments
 */

import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_PATH = path.join(__dirname, 'skillccc.db');

let db;

export function getDB() {
    if (!db) {
        db = new Database(DB_PATH);
        db.pragma('journal_mode = WAL');
        db.pragma('foreign_keys = ON');
        initTables();
    }
    return db;
}

function initTables() {
    db.exec(`
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            github_id INTEGER UNIQUE NOT NULL,
            username TEXT NOT NULL,
            avatar_url TEXT,
            access_token TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS stars (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL REFERENCES users(id),
            skill_id TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(user_id, skill_id)
        );

        CREATE TABLE IF NOT EXISTS comments (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL REFERENCES users(id),
            skill_id TEXT NOT NULL,
            content TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        CREATE INDEX IF NOT EXISTS idx_stars_skill ON stars(skill_id);
        CREATE INDEX IF NOT EXISTS idx_stars_user ON stars(user_id);
        CREATE INDEX IF NOT EXISTS idx_comments_skill ON comments(skill_id);
        CREATE INDEX IF NOT EXISTS idx_comments_user ON comments(user_id);
    `);
    console.log('📦 Database initialized');
}

// ============ User Operations ============

export function findOrCreateUser({ github_id, username, avatar_url, access_token }) {
    const existing = db.prepare('SELECT * FROM users WHERE github_id = ?').get(github_id);
    if (existing) {
        db.prepare('UPDATE users SET username = ?, avatar_url = ?, access_token = ? WHERE github_id = ?')
            .run(username, avatar_url, access_token, github_id);
        return { ...existing, username, avatar_url, access_token };
    }
    const result = db.prepare('INSERT INTO users (github_id, username, avatar_url, access_token) VALUES (?, ?, ?, ?)')
        .run(github_id, username, avatar_url, access_token);
    return { id: result.lastInsertRowid, github_id, username, avatar_url };
}

export function getUserById(id) {
    return db.prepare('SELECT id, github_id, username, avatar_url, created_at FROM users WHERE id = ?').get(id);
}

// ============ Star Operations ============

export function addStar(userId, skillId) {
    try {
        db.prepare('INSERT INTO stars (user_id, skill_id) VALUES (?, ?)').run(userId, skillId);
        return true;
    } catch (e) {
        if (e.code === 'SQLITE_CONSTRAINT_UNIQUE') return false; // already starred
        throw e;
    }
}

export function removeStar(userId, skillId) {
    const result = db.prepare('DELETE FROM stars WHERE user_id = ? AND skill_id = ?').run(userId, skillId);
    return result.changes > 0;
}

export function getStarStatus(userId, skillId) {
    const starred = userId
        ? !!db.prepare('SELECT 1 FROM stars WHERE user_id = ? AND skill_id = ?').get(userId, skillId)
        : false;
    const count = db.prepare('SELECT COUNT(*) as count FROM stars WHERE skill_id = ?').get(skillId).count;
    return { starred, count };
}

export function getUserStars(userId) {
    return db.prepare('SELECT skill_id, created_at FROM stars WHERE user_id = ? ORDER BY created_at DESC').all(userId);
}

// ============ Comment Operations ============

export function addComment(userId, skillId, content) {
    const result = db.prepare('INSERT INTO comments (user_id, skill_id, content) VALUES (?, ?, ?)')
        .run(userId, skillId, content);
    return getCommentById(result.lastInsertRowid);
}

export function getCommentById(id) {
    return db.prepare(`
        SELECT c.*, u.username, u.avatar_url
        FROM comments c
        JOIN users u ON c.user_id = u.id
        WHERE c.id = ?
    `).get(id);
}

export function getComments(skillId, page = 1, limit = 20) {
    const offset = (page - 1) * limit;
    const comments = db.prepare(`
        SELECT c.*, u.username, u.avatar_url
        FROM comments c
        JOIN users u ON c.user_id = u.id
        WHERE c.skill_id = ?
        ORDER BY c.created_at DESC
        LIMIT ? OFFSET ?
    `).all(skillId, limit, offset);

    const total = db.prepare('SELECT COUNT(*) as count FROM comments WHERE skill_id = ?').get(skillId).count;
    return { comments, total, page, totalPages: Math.ceil(total / limit) };
}

export function deleteComment(commentId, userId) {
    const result = db.prepare('DELETE FROM comments WHERE id = ? AND user_id = ?').run(commentId, userId);
    return result.changes > 0;
}

export function getCommentCount(skillId) {
    return db.prepare('SELECT COUNT(*) as count FROM comments WHERE skill_id = ?').get(skillId).count;
}
