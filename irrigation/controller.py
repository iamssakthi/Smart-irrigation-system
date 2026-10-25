from __future__ import annotations

from datetime import datetime, timezone

from irrigation.validation import validate_manual_command, validate_mode, validate_moisture, validate_thresholds


class IrrigationController:
    DEFAULT_DRY_THRESHOLD = 35.0
    DEFAULT_WET_THRESHOLD = 45.0

    def __init__(
        self,
        dry_threshold: float = DEFAULT_DRY_THRESHOLD,
        wet_threshold: float = DEFAULT_WET_THRESHOLD,
        mode: str = "AUTOMATIC",
        pump_status: str = "OFF",
        moisture: float = 50.0,
        source: str = "simulated",
    ):
        self.dry_threshold, self.wet_threshold = validate_thresholds(dry_threshold, wet_threshold)
        self.mode = validate_mode(mode)
        self.pump_status = self._normalize_pump_status(pump_status)
        self.moisture = validate_moisture(moisture)
        self.source = source
        self.last_updated = datetime.now(timezone.utc).isoformat()

    def _normalize_pump_status(self, value):
        value = str(value).upper()
        if value not in {"ON", "OFF"}:
            raise ValueError("Pump status must be ON or OFF.")
        return value

    def _soil_status(self, moisture_value):
        if moisture_value < self.dry_threshold:
            return "DRY"
        if moisture_value >= self.wet_threshold:
            return "ADEQUATE"
        return "TRANSITION"

    def set_thresholds(self, dry_threshold, wet_threshold):
        self.dry_threshold, self.wet_threshold = validate_thresholds(dry_threshold, wet_threshold)
        self.last_updated = datetime.now(timezone.utc).isoformat()
        return {
            "dry_threshold": self.dry_threshold,
            "wet_threshold": self.wet_threshold,
            "last_updated": self.last_updated,
        }

    def set_mode(self, mode):
        self.mode = validate_mode(mode)
        self.last_updated = datetime.now(timezone.utc).isoformat()
        return {
            "mode": self.mode,
            "last_updated": self.last_updated,
        }

    def set_pump_status(self, pump_status):
        self.pump_status = self._normalize_pump_status(pump_status)
        self.last_updated = datetime.now(timezone.utc).isoformat()
        return {"pump_status": self.pump_status, "last_updated": self.last_updated}

    def manual_control(self, command):
        command = validate_manual_command(command)
        if self.mode != "MANUAL":
            raise ValueError("Manual control is only allowed in MANUAL mode.")
        self.pump_status = command
        self.last_updated = datetime.now(timezone.utc).isoformat()
        return {
            "pump_status": self.pump_status,
            "mode": self.mode,
            "last_updated": self.last_updated,
        }

    def decide(self, moisture_value, source="dashboard_simulation"):
        moisture_value = validate_moisture(moisture_value)
        self.moisture = moisture_value
        self.source = source
        now = datetime.now(timezone.utc).isoformat()

        if self.mode == "MANUAL":
            self.last_updated = now
            return {
                "moisture": self.moisture,
                "soil_status": self._soil_status(self.moisture),
                "pump_status": self.pump_status,
                "mode": self.mode,
                "source": self.source,
                "last_updated": self.last_updated,
            }

        if moisture_value < self.dry_threshold:
            self.pump_status = "ON"
        elif moisture_value >= self.wet_threshold:
            self.pump_status = "OFF"
        else:
            self.pump_status = self.pump_status

        self.last_updated = now
        return {
            "moisture": self.moisture,
            "soil_status": self._soil_status(self.moisture),
            "pump_status": self.pump_status,
            "mode": self.mode,
            "source": self.source,
            "last_updated": self.last_updated,
        }

    def get_status(self):
        return {
            "moisture": self.moisture,
            "soil_status": self._soil_status(self.moisture),
            "pump_status": self.pump_status,
            "mode": self.mode,
            "dry_threshold": self.dry_threshold,
            "wet_threshold": self.wet_threshold,
            "source": self.source,
            "last_updated": self.last_updated,
        }
