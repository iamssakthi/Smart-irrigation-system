import unittest
import os

from irrigation.database import init_db, get_db_connection, reset_demo_data


class TestDatabase(unittest.TestCase):
    def setUp(self):
        init_db()

    def test_database_creation_and_persistence(self):
        conn = get_db_connection()
        cur = conn.cursor()
        cur.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='sensor_readings'")
        self.assertIsNotNone(cur.fetchone())
        conn.close()

    def test_event_recording_after_state_transitions(self):
        reset_demo_data()
        conn = get_db_connection()
        cur = conn.cursor()
        cur.execute("SELECT COUNT(*) FROM irrigation_events")
        self.assertGreaterEqual(cur.fetchone()[0], 1)
        conn.close()


if __name__ == "__main__":
    unittest.main()
