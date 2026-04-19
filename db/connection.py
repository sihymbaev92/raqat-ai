# -*- coding: utf-8 -*-
import sqlite3


def db_conn(db_path: str):
    """
    SQLite connection with WAL, busy wait, and foreign key enforcement enabled.
    (FK constraints apply only where declared in DDL.)
    """
    conn = sqlite3.connect(db_path, check_same_thread=False)
    conn.row_factory = sqlite3.Row
    try:
        conn.execute("PRAGMA journal_mode=WAL")
        conn.execute("PRAGMA busy_timeout=8000")
        conn.execute("PRAGMA foreign_keys=ON")
        conn.execute("PRAGMA synchronous=NORMAL")
    except Exception:
        pass
    return conn
