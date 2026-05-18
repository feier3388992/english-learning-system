import sqlite3
import json
import os
from pathlib import Path

DATA_DIR = Path(__file__).resolve().parent.parent / "data"
DB_PATH = DATA_DIR / "english.db"
PHRASES_JSON = DATA_DIR / "phrases.json"

DATA_DIR.mkdir(parents=True, exist_ok=True)


def get_connection() -> sqlite3.Connection:
    conn = sqlite3.connect(str(DB_PATH), check_same_thread=False)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA journal_mode=WAL")
    conn.execute("PRAGMA foreign_keys=ON")
    return conn


def init_db():
    conn = get_connection()
    conn.executescript("""
        CREATE TABLE IF NOT EXISTS categories (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL UNIQUE,
            description TEXT
        );

        CREATE TABLE IF NOT EXISTS phrases (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            category_id INTEGER NOT NULL,
            en TEXT NOT NULL,
            zh TEXT,
            phonetic TEXT,
            example TEXT,
            FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS progress (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            phrase_id INTEGER NOT NULL UNIQUE,
            status TEXT DEFAULT 'new',
            correct_count INTEGER DEFAULT 0,
            wrong_count INTEGER DEFAULT 0,
            last_review INTEGER,
            next_review INTEGER,
            FOREIGN KEY (phrase_id) REFERENCES phrases(id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS stats (
            id INTEGER PRIMARY KEY DEFAULT 1,
            total_answers INTEGER DEFAULT 0,
            correct_answers INTEGER DEFAULT 0,
            wrong_answers INTEGER DEFAULT 0
        );

        INSERT OR IGNORE INTO stats (id, total_answers, correct_answers, wrong_answers)
        VALUES (1, 0, 0, 0);
    """)
    conn.commit()

    for col in ("type", "audio_file"):
        try:
            conn.execute(f"ALTER TABLE phrases ADD COLUMN {col} TEXT")
        except sqlite3.OperationalError:
            pass

    conn.commit()
    conn.close()


def seed_from_json(force: bool = False):
    if not PHRASES_JSON.exists():
        return

    conn = get_connection()
    count = conn.execute("SELECT COUNT(*) FROM categories").fetchone()[0]
    if count > 0 and not force:
        conn.close()
        return

    with open(PHRASES_JSON, "r", encoding="utf-8") as f:
        data = json.load(f)

    seen_categories = {}
    for item in data:
        cat_name = item["category"]
        if cat_name not in seen_categories:
            conn.execute(
                "INSERT OR IGNORE INTO categories (name, description) VALUES (?, ?)",
                (cat_name, cat_name),
            )
            row = conn.execute(
                "SELECT id FROM categories WHERE name = ?", (cat_name,)
            ).fetchone()
            seen_categories[cat_name] = row["id"]

        cat_id = seen_categories[cat_name]
        for phrase in item.get("phrases", []):
            conn.execute(
                "INSERT OR IGNORE INTO phrases (category_id, en, zh) VALUES (?, ?, ?)",
                (cat_id, phrase["en"], phrase.get("zh", "")),
            )

    conn.commit()
    conn.close()
    print(f"已导入种子数据: {len(seen_categories)} 分类")
