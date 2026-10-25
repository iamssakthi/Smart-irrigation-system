# API Documentation

## GET /api/status

Returns the current system state.

Example response:

```json
{
  "moisture": 42.0,
  "soil_status": "TRANSITION",
  "pump_status": "OFF",
  "mode": "AUTOMATIC",
  "dry_threshold": 35.0,
  "wet_threshold": 45.0,
  "source": "dashboard_simulation",
  "last_updated": "2026-10-21T12:00:00+00:00",
  "connection_status": "SIMULATED"
}
```

## GET /api/readings

Returns recent sensor readings with a configurable `limit` parameter.

Example:

```text
GET /api/readings?limit=20
```

## POST /api/simulate

Accepts a simulated moisture reading.

Request body example:

```json
{
  "moisture": 30.0,
  "source": "dashboard_simulation"
}
```

## POST /api/control

Manual pump command in manual mode only.

Example:

```json
{
  "command": "ON"
}
```

## POST /api/mode

Switch between automatic and manual modes.

Example:

```json
{
  "mode": "MANUAL"
}
```

## POST /api/settings

Update thresholds.

Example:

```json
{
  "dry_threshold": 35.0,
  "wet_threshold": 45.0
}
```

## POST /api/telemetry

Accepts an ESP32-type telemetry payload.

Example:

```json
{
  "device_id": "irrigation-unit-01",
  "raw_adc": 1228,
  "soil_moisture": 30.0,
  "pump_status": "ON",
  "source": "wokwi_esp32"
}
```

## Error handling

The API returns JSON error responses with HTTP 400 for validation failures and 200 for successful requests.
