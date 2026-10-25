def validate_moisture(value):
    try:
        moisture = float(value)
    except (TypeError, ValueError):
        raise ValueError("Moisture must be a numeric value between 0 and 100.")
    if not 0.0 <= moisture <= 100.0:
        raise ValueError("Moisture must be between 0 and 100.")
    return moisture


def validate_thresholds(dry_threshold, wet_threshold):
    try:
        dry = float(dry_threshold)
        wet = float(wet_threshold)
    except (TypeError, ValueError):
        raise ValueError("Threshold values must be numeric.")
    if not 0.0 <= dry <= 100.0 or not 0.0 <= wet <= 100.0:
        raise ValueError("Threshold values must be between 0 and 100.")
    if wet <= dry:
        raise ValueError("Wet threshold must be greater than dry threshold.")
    return dry, wet


def validate_mode(mode):
    value = str(mode).upper()
    if value not in {"AUTOMATIC", "MANUAL"}:
        raise ValueError("Mode must be AUTOMATIC or MANUAL.")
    return value


def validate_manual_command(command):
    value = str(command).upper()
    if value not in {"ON", "OFF"}:
        raise ValueError("Manual control must be ON or OFF.")
    return value


def validate_telemetry(payload):
    if not isinstance(payload, dict):
        raise ValueError("Telemetry payload must be a JSON object.")
    if "device_id" not in payload or not payload["device_id"]:
        raise ValueError("device_id is required.")
    if "soil_moisture" not in payload:
        raise ValueError("soil_moisture is required.")
    moisture = validate_moisture(payload["soil_moisture"])
    data = {
        "device_id": str(payload["device_id"]),
        "soil_moisture": moisture,
        "raw_adc": payload.get("raw_adc"),
        "pump_status": str(payload.get("pump_status", "UNKNOWN")).upper(),
        "source": str(payload.get("source", "wokwi_esp32")),
    }
    if data["pump_status"] not in {"ON", "OFF", "UNKNOWN"}:
        raise ValueError("pump_status must be ON, OFF, or UNKNOWN.")
    return data
