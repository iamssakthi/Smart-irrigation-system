# Testing Plan and Results

## Test scope

The project includes automated verification of the controller, API behavior, and database initialization.

## Executed tests

- moisture below threshold
- moisture above threshold
- hysteresis OFF case
- hysteresis ON case
- invalid moisture values
- invalid threshold combinations
- manual control in manual mode
- rejection of manual control in automatic mode
- reading API success
- sensor validation
- telemetry validation
- database creation and persistence
- event recording

## Result

13 tests passed successfully using `pytest`.

## Pending manual verification

- Browser UI at desktop and mobile width
- Wokwi hardware simulation run in the browser environment
- Raspberry Pi hardware deployment check
