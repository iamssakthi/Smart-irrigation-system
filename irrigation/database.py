import sqlite3
from datetime import datetime, timezone
from pathlib import Path

from config import DATABASE_PATH


def get_db_connection():
    conn = sqlite3.connect(DATABASE_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_db():
    conn = get_db_connection()
    conn.execute(
        """
        CREATE TABLE IF NOT EXISTS sensor_readings (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            device_id TEXT,
            soil_moisture REAL NOT NULL,
            raw_adc REAL,
            soil_status TEXT,
            pump_status TEXT,
            operating_mode TEXT,
            source TEXT,
            timestamp TEXT NOT NULL
        )
        """
    )
    conn.execute(
        """
        CREATE TABLE IF NOT EXISTS irrigation_events (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            event_type TEXT NOT NULL,
            description TEXT NOT NULL,
            moisture_value REAL,
            operating_mode TEXT,
            source TEXT,
            timestamp TEXT NOT NULL
        )
        """
    )
    conn.execute(
        """
        CREATE TABLE IF NOT EXISTS settings (
            id INTEGER PRIMARY KEY CHECK (id = 1),
            dry_threshold REAL NOT NULL,
            wet_threshold REAL NOT NULL,
            reading_interval REAL NOT NULL,
            stale_data_seconds REAL NOT NULL,
            updated_at TEXT NOT NULL
        )
        """
    )
    # ── Migration: add current_mode to pre-existing databases ──────────────
    # MUST run before INSERT OR IGNORE so the column exists at insert time.
    try:
        conn.execute(
            "ALTER TABLE settings ADD COLUMN current_mode TEXT NOT NULL DEFAULT 'AUTOMATIC'"
        )
        conn.commit()
    except sqlite3.OperationalError:
        pass  # column already exists — safe to skip

    # Seed the single settings row if it doesn't exist yet.
    # current_mode is omitted from the column list; DEFAULT 'AUTOMATIC' fills it.
    conn.execute(
        """
        INSERT OR IGNORE INTO settings
            (id, dry_threshold, wet_threshold, reading_interval, stale_data_seconds, updated_at)
        VALUES (1, 35.0, 45.0, 1.0, 30.0, ?)
        """,
        (datetime.now(timezone.utc).isoformat(),),
    )
    conn.commit()
    conn.close()


def get_settings():
    conn = get_db_connection()
    row = conn.execute("SELECT * FROM settings WHERE id = 1").fetchone()
    conn.close()
    if row is None:
        return {"dry_threshold": 35.0, "wet_threshold": 45.0, "reading_interval": 1.0, "stale_data_seconds": 30.0}
    return {
        "dry_threshold": float(row["dry_threshold"]),
        "wet_threshold": float(row["wet_threshold"]),
        "reading_interval": float(row["reading_interval"]),
        "stale_data_seconds": float(row["stale_data_seconds"]),
        "current_mode": row["current_mode"] if row["current_mode"] else "AUTOMATIC",
        "updated_at": row["updated_at"],
    }


def save_settings(dry_threshold, wet_threshold, reading_interval=1.0, stale_data_seconds=30.0):
    conn = get_db_connection()
    conn.execute(
        "UPDATE settings SET dry_threshold = ?, wet_threshold = ?, reading_interval = ?, stale_data_seconds = ?, updated_at = ? WHERE id = 1",
        (dry_threshold, wet_threshold, reading_interval, stale_data_seconds, datetime.now(timezone.utc).isoformat()),
    )
    conn.commit()
    conn.close()


def save_mode(mode: str):
    """Persist the operating mode to the settings row so it survives across requests."""
    conn = get_db_connection()
    conn.execute(
        "UPDATE settings SET current_mode = ?, updated_at = ? WHERE id = 1",
        (mode, datetime.now(timezone.utc).isoformat()),
    )
    conn.commit()
    conn.close()


def insert_reading(record):
    conn = get_db_connection()
    conn.execute(
        """
        INSERT INTO sensor_readings (device_id, soil_moisture, raw_adc, soil_status, pump_status, operating_mode, source, timestamp)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """,
        (
            record.get("device_id"),
            record["soil_moisture"],
            record.get("raw_adc"),
            record.get("soil_status"),
            record.get("pump_status"),
            record.get("operating_mode"),
            record.get("source", "dashboard_simulation"),
            record.get("timestamp") or datetime.now(timezone.utc).isoformat(),
        ),
    )
    conn.commit()
    conn.close()


def insert_event(event_type, description, moisture_value=None, operating_mode=None, source="dashboard"):
    conn = get_db_connection()
    conn.execute(
        """
        INSERT INTO irrigation_events (event_type, description, moisture_value, operating_mode, source, timestamp)
        VALUES (?, ?, ?, ?, ?, ?)
        """,
        (event_type, description, moisture_value, operating_mode, source, datetime.now(timezone.utc).isoformat()),
    )
    conn.commit()
    conn.close()


def get_recent_readings(limit=20, source=None, soil_status=None, start_date=None, end_date=None):
    conn = get_db_connection()
    query = "SELECT * FROM sensor_readings WHERE 1=1"
    params = []
    if source and source != "all":
        query += " AND source = ?"
        params.append(source)
    if soil_status and soil_status != "all":
        query += " AND soil_status = ?"
        params.append(soil_status)
    if start_date:
        query += " AND timestamp >= ?"
        params.append(start_date)
    if end_date:
        query += " AND timestamp <= ?"
        params.append(end_date)
    query += " ORDER BY id DESC LIMIT ?"
    params.append(int(limit))
    rows = conn.execute(query, params).fetchall()
    conn.close()
    return [dict(row) for row in rows]


def get_recent_events(limit=20, event_type=None):
    conn = get_db_connection()
    query = "SELECT * FROM irrigation_events WHERE 1=1"
    params = []
    if event_type and event_type != "all":
        query += " AND event_type = ?"
        params.append(event_type)
    query += " ORDER BY id DESC LIMIT ?"
    params.append(int(limit))
    rows = conn.execute(query, params).fetchall()
    conn.close()
    return [dict(row) for row in rows]


def get_latest_reading():
    conn = get_db_connection()
    row = conn.execute("SELECT * FROM sensor_readings ORDER BY id DESC LIMIT 1").fetchone()
    conn.close()
    return dict(row) if row else None


def clear_history_data(target="all"):
    conn = get_db_connection()
    reading_count = conn.execute("SELECT COUNT(*) FROM sensor_readings").fetchone()[0]
    event_count = conn.execute("SELECT COUNT(*) FROM irrigation_events").fetchone()[0]
    deleted_readings = 0
    deleted_events = 0
    if target in ("all", "readings"):
        conn.execute("DELETE FROM sensor_readings")
        deleted_readings = int(reading_count)
    if target in ("all", "events"):
        conn.execute("DELETE FROM irrigation_events")
        deleted_events = int(event_count)
    conn.commit()
    conn.close()
    return {
        "deleted_readings": int(deleted_readings),
        "deleted_events": int(deleted_events),
        "target": target,
    }


def reset_demo_data():
    conn = get_db_connection()
    conn.execute("DELETE FROM sensor_readings")
    conn.execute("DELETE FROM irrigation_events")
    conn.execute("DELETE FROM settings")
    conn.execute(
        """
        INSERT INTO settings
            (id, dry_threshold, wet_threshold, reading_interval, stale_data_seconds, current_mode, updated_at)
        VALUES (1, 35.0, 45.0, 1.0, 30.0, 'AUTOMATIC', ?)
        """,
        (datetime.now(timezone.utc).isoformat(),),
    )
    conn.commit()
    conn.close()
    insert_event("system_reset", "Demo database reset completed.", source="system")
