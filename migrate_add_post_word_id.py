#!/usr/bin/env python3
"""Migration: add word_id column to posts table."""
import sqlite3

DB_PATH = "deutschly.db"

def migrate():
    conn = sqlite3.connect(DB_PATH)
    cur = conn.cursor()

    # Check if column already exists
    cur.execute("PRAGMA table_info(posts)")
    columns = [row[1] for row in cur.fetchall()]
    
    if "word_id" in columns:
        print("Column word_id already exists. Skipping.")
    else:
        cur.execute(
            "ALTER TABLE posts ADD COLUMN word_id INTEGER REFERENCES words(id)"
        )
        conn.commit()
        print("Added word_id column to posts table.")
    
    conn.close()

if __name__ == "__main__":
    migrate()
