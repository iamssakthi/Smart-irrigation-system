import os
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent
INSTANCE_DIR = BASE_DIR / "instance"
DATABASE_PATH = BASE_DIR / "irrigation.db"

class Config:
    SECRET_KEY = os.environ.get("SECRET_KEY", "dev-secret-key")
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    DATABASE = str(DATABASE_PATH)
    JSON_SORT_KEYS = False
    DEBUG = False
    SIMULATED_READING_INTERVAL_SECONDS = 1
    STALE_READING_SECONDS = 30
