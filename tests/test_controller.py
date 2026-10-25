import unittest

from irrigation.controller import IrrigationController


class TestIrrigationController(unittest.TestCase):
    def setUp(self):
        self.controller = IrrigationController()

    def test_moisture_below_dry_threshold(self):
        result = self.controller.decide(20.0)
        self.assertEqual(result["pump_status"], "ON")
        self.assertEqual(result["soil_status"], "DRY")

    def test_moisture_above_adequate_threshold(self):
        self.controller.set_pump_status("ON")
        result = self.controller.decide(70.0)
        self.assertEqual(result["pump_status"], "OFF")
        self.assertEqual(result["soil_status"], "ADEQUATE")

    def test_hysteresis_band_when_pump_off(self):
        self.controller.set_pump_status("OFF")
        result = self.controller.decide(38.0)
        self.assertEqual(result["pump_status"], "OFF")

    def test_hysteresis_band_when_pump_on(self):
        self.controller.set_pump_status("ON")
        result = self.controller.decide(44.0)
        self.assertEqual(result["pump_status"], "ON")

    def test_invalid_moisture_values(self):
        with self.assertRaises(ValueError):
            self.controller.decide(-1)
        with self.assertRaises(ValueError):
            self.controller.decide(101)

    def test_invalid_threshold_combinations(self):
        with self.assertRaises(ValueError):
            self.controller.set_thresholds(50.0, 40.0)
        with self.assertRaises(ValueError):
            self.controller.set_thresholds(120.0, 60.0)

    def test_manual_control_in_manual_mode(self):
        self.controller.set_mode("MANUAL")
        result = self.controller.manual_control("ON")
        self.assertEqual(result["pump_status"], "ON")

    def test_manual_control_rejected_in_automatic_mode(self):
        self.controller.set_mode("AUTOMATIC")
        with self.assertRaises(ValueError):
            self.controller.manual_control("ON")

    # ── New boundary & edge-case tests ────────────────────────────────────────

    def test_boundary_exactly_at_dry_threshold_stays_off(self):
        """Moisture == dry_threshold (35) should NOT trigger pump ON (condition is strictly <)."""
        self.controller.set_pump_status("OFF")
        result = self.controller.decide(35.0)
        self.assertEqual(result["pump_status"], "OFF")
        self.assertEqual(result["soil_status"], "TRANSITION")

    def test_boundary_exactly_at_wet_threshold_turns_off(self):
        """Moisture == wet_threshold (45) should turn pump OFF (condition is >=)."""
        self.controller.set_pump_status("ON")
        result = self.controller.decide(45.0)
        self.assertEqual(result["pump_status"], "OFF")
        self.assertEqual(result["soil_status"], "ADEQUATE")

    def test_manual_mode_ignores_dry_condition(self):
        """In MANUAL mode, decide() must not override the pump even if moisture is very low."""
        self.controller.set_mode("MANUAL")
        self.controller.set_pump_status("OFF")
        result = self.controller.decide(10.0)   # would trigger ON in AUTOMATIC
        self.assertEqual(result["pump_status"], "OFF")
        self.assertEqual(result["mode"], "MANUAL")

    def test_transition_soil_status(self):
        """Moisture in 35–44.9 range must be classified as TRANSITION."""
        result = self.controller.decide(40.0)
        self.assertEqual(result["soil_status"], "TRANSITION")

    def test_set_mode_returns_correct_keys(self):
        result = self.controller.set_mode("MANUAL")
        self.assertIn("mode", result)
        self.assertIn("last_updated", result)
        self.assertEqual(result["mode"], "MANUAL")

    def test_invalid_mode_raises_value_error(self):
        with self.assertRaises(ValueError):
            self.controller.set_mode("TURBO")

    def test_equal_thresholds_raises_value_error(self):
        """Wet threshold must be strictly greater than dry threshold."""
        with self.assertRaises(ValueError):
            self.controller.set_thresholds(40.0, 40.0)


if __name__ == "__main__":
    unittest.main()
