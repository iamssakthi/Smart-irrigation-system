from __future__ import annotations

from datetime import datetime, timezone

from irrigation.controller import IrrigationController
from irrigation.database import get_latest_reading, get_recent_events, get_recent_readings, get_settings, insert_event, insert_reading, save_mode, save_settings
from irrigation.validation import validate_moisture, validate_thresholds

_controller = IrrigationController()


def load_controller_from_db():
    settings = get_settings()
    _controller.dry_threshold = settings["dry_threshold"]
    _controller.wet_threshold = settings["wet_threshold"]
    # Mode is loaded from settings (authoritative) not from the last reading row.
    # This ensures mode_change() persists correctly across requests.
    _controller.mode = settings.get("current_mode", "AUTOMATIC")
    _controller.last_updated = settings.get("updated_at", datetime.now(timezone.utc).isoformat())
    reading = get_latest_reading()
    if reading:
        _controller.moisture = float(reading["soil_moisture"])
        _controller.pump_status = reading.get("pump_status", _controller.pump_status)
        _controller.source = reading.get("source", _controller.source)
        # operating_mode from reading is NOT used for mode — settings is the source of truth.
    return _controller


def current_status_payload():
    state = load_controller_from_db().get_status()
    settings = get_settings()
    latest = get_latest_reading()
    state.update({
        "device_id": latest["device_id"] if latest else "simulated-device",
        "connection_status": "SIMULATED",
        "data_source": state["source"],
        "reading_timestamp": latest["timestamp"] if latest else state["last_updated"],
        "thresholds": {
            "dry": settings["dry_threshold"],
            "wet": settings["wet_threshold"],
        },
    })
    return state


def process_simulation(moisture_value, source="dashboard_simulation"):
    moisture = validate_moisture(moisture_value)
    controller = load_controller_from_db()
    previous_pump_status = controller.pump_status
    result = controller.decide(moisture, source=source)
    settings = get_settings()
    if result["pump_status"] == "ON" and previous_pump_status != "ON":
        insert_event("pump_on", f"Pump turned ON at {moisture:.1f}% soil moisture.", moisture, controller.mode, source)
    elif result["pump_status"] == "OFF" and previous_pump_status != "OFF":
        insert_event("pump_off", f"Pump turned OFF at {moisture:.1f}% soil moisture.", moisture, controller.mode, source)
    insert_reading({
        "device_id": "simulated-device",
        "soil_moisture": moisture,
        "raw_adc": None,
        "soil_status": result["soil_status"],
        "pump_status": result["pump_status"],
        "operating_mode": controller.mode,
        "source": source,
        "timestamp": result["last_updated"],
    })
    return {
        "status": result,
        "settings": settings,
    }


def process_telemetry(payload):
    from irrigation.validation import validate_telemetry

    validated = validate_telemetry(payload)
    controller = load_controller_from_db()
    moisture = validated["soil_moisture"]
    if controller.mode == "AUTOMATIC":
        calculated = controller.decide(moisture, source=validated["source"])
        pump_status = calculated["pump_status"]
    else:
        pump_status = validated.get("pump_status", controller.pump_status)
    soil_status = controller._soil_status(moisture) if hasattr(controller, "_soil_status") else "UNKNOWN"
    record = {
        "device_id": validated["device_id"],
        "soil_moisture": moisture,
        "raw_adc": validated.get("raw_adc"),
        "soil_status": soil_status,
        "pump_status": pump_status,
        "operating_mode": controller.mode,
        "source": validated["source"],
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }
    insert_reading(record)
    insert_event("sensor_data_received", f"Telemetry received from {validated['device_id']}.", moisture, controller.mode, validated["source"])
    return {"status": "accepted", "record": record}


def apply_settings(dry_threshold, wet_threshold):
    dry, wet = validate_thresholds(dry_threshold, wet_threshold)
    save_settings(dry, wet)
    controller = load_controller_from_db()
    controller.set_thresholds(dry, wet)
    insert_event("threshold_changed", f"Thresholds updated to dry={dry}, wet={wet}.", source="dashboard")
    return {"dry_threshold": dry, "wet_threshold": wet}


def mode_change(mode):
    controller = load_controller_from_db()
    mode_result = controller.set_mode(mode)
    # Persist mode to the settings table so it survives the next load_controller_from_db() call.
    save_mode(mode_result["mode"])
    insert_event("mode_changed", f"Mode changed to {mode_result['mode']}.", operating_mode=mode_result['mode'], source="dashboard")
    return mode_result


def manual_toggle(command):
    controller = load_controller_from_db()
    result = controller.manual_control(command)
    insert_event("pump_manual", f"Manual pump command: {command}.", source="dashboard")
    insert_reading({
        "device_id": "simulated-device",
        "soil_moisture": controller.moisture,
        "raw_adc": None,
        "soil_status": controller._soil_status(controller.moisture),
        "pump_status": result["pump_status"],
        "operating_mode": controller.mode,
        "source": "manual_control",
        "timestamp": result["last_updated"],
    })
    return result
