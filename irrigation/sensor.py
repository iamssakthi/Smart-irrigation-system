from __future__ import annotations

from dataclasses import dataclass, field
from datetime import datetime, timezone
from typing import Optional


@dataclass
class SensorReading:
    moisture: float
    source: str = "simulated"
    timestamp: str = field(default_factory=lambda: datetime.now(timezone.utc).isoformat())


class SensorInterface:
    def read_moisture(self) -> float:
        raise NotImplementedError


class SimulatedSensor(SensorInterface):
    def __init__(self, initial_moisture: float = 50.0):
        self.moisture = float(initial_moisture)

    def set_moisture(self, value: float):
        self.moisture = float(value)

    def read_moisture(self) -> float:
        return self.moisture


class RaspberryPiSensor(SensorInterface):
    def __init__(self, adc_interface=None, calibration_offset: float = 0.0):
        self.adc_interface = adc_interface
        self.calibration_offset = float(calibration_offset)

    def read_moisture(self) -> float:
        if self.adc_interface is None:
            raise RuntimeError("No ADC interface configured for Raspberry Pi sensor.")
        raw_value = self.adc_interface.read_channel(0)
        return max(0.0, min(100.0, raw_value + self.calibration_offset))


class ESP32WokwiSensor(SensorInterface):
    def __init__(self, device_id: str = "irrigation-unit-01"):
        self.device_id = device_id

    def read_moisture(self) -> float:
        raise RuntimeError("Wokwi telemetry is provided over HTTP rather than direct sensor reads.")
