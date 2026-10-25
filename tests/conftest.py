"""
conftest.py — pytest fixtures for the Smart Irrigation System test suite.

Key fix: all tests run against a temporary SQLite database (via tmp_path),
so they never touch or pollute the development irrigation.db.
"""
import os
import pytest
from unittest.mock import patch


@pytest.fixture(autouse=True)
def isolated_db(tmp_path):
    """
    Redirect DATABASE_PATH to a fresh temp file for every test.
    Automatically applied to all test functions (autouse=True).
    """
    db_file = tmp_path / "test_irrigation.db"

    # Patch the path in config and the string used inside database.py
    with patch("config.DATABASE_PATH", db_file), \
         patch("irrigation.database.DATABASE_PATH", db_file):
        from irrigation.database import init_db
        init_db()
        yield db_file


@pytest.fixture()
def app_client(isolated_db):
    """
    Flask test client backed by the isolated temp database.
    Use this fixture in API tests instead of importing app directly.
    """
    # Import app after isolated_db is active so it uses the patched path
    from app import app as flask_app
    flask_app.config["TESTING"] = True
    with flask_app.test_client() as client:
        yield client
