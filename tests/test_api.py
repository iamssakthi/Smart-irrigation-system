import json
import unittest

from app import app


class TestAPI(unittest.TestCase):
    def setUp(self):
        self.client = app.test_client()

    def test_successful_reading_api_responses(self):
        response = self.client.get("/api/status")
        self.assertEqual(response.status_code, 200)
        data = response.get_json()
        self.assertIn("moisture", data)

    def test_sensor_input_api_validation(self):
        response = self.client.post("/api/simulate", json={"moisture": -1})
        self.assertEqual(response.status_code, 400)

    def test_telemetry_payload_validation(self):
        response = self.client.post(
            "/api/telemetry",
            json={"device_id": "unit-1", "soil_moisture": 30.0, "source": "wokwi_esp32"},
        )
        self.assertEqual(response.status_code, 200)

    def test_clear_history_endpoint(self):
        self.client.post("/api/simulate", json={"moisture": 25, "source": "dashboard_simulation"})

        clear_response = self.client.post("/api/history/clear")
        self.assertEqual(clear_response.status_code, 200)
        clear_data = clear_response.get_json()
        self.assertTrue(clear_data["success"])

        readings_response = self.client.get("/api/readings?limit=20")
        events_response = self.client.get("/api/events?limit=20")
        self.assertEqual(len(readings_response.get_json().get("readings", [])), 0)
        self.assertEqual(len(events_response.get_json().get("events", [])), 0)

    def test_targeted_clear_history(self):
        # Insert a reading which generates an event
        self.client.post("/api/simulate", json={"moisture": 20, "source": "test_sim"})

        # Clear ONLY readings
        res = self.client.post("/api/history/clear", json={"target": "readings"})
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertTrue(data["success"])
        self.assertEqual(data["target"], "readings")

        # Verify readings are 0 but events still exist
        readings = self.client.get("/api/readings").get_json().get("readings", [])
        events = self.client.get("/api/events").get_json().get("events", [])
        self.assertEqual(len(readings), 0)
        self.assertGreaterEqual(len(events), 1)

    def test_readings_query_filters(self):
        self.client.post("/api/history/clear")
        self.client.post("/api/simulate", json={"moisture": 20, "source": "source_a"})
        self.client.post("/api/simulate", json={"moisture": 60, "source": "source_b"})

        res_a = self.client.get("/api/readings?source=source_a")
        readings_a = res_a.get_json().get("readings", [])
        self.assertEqual(len(readings_a), 1)
        self.assertEqual(readings_a[0]["source"], "source_a")

    def test_react_spa_routing(self):
        for route in ["/", "/simulation", "/history", "/monitoring", "/settings", "/system-info"]:
            res = self.client.get(route)
            self.assertEqual(res.status_code, 200)
            self.assertIn(b"TerraSense IQ", res.data)


if __name__ == "__main__":
    unittest.main()


