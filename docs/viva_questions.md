# Viva Questions and Answers

## 1. What is the purpose of a soil moisture sensor in an irrigation system?
It measures water content in the soil so the controller can decide when irrigation is necessary.

## 2. What is ADC and why is it used?
ADC converts analog sensor voltage into a digital value that can be processed by a microcontroller.

## 3. Why use an ESP32 in the project?
It is a low-cost embedded platform suitable for demonstration and telemetry use.

## 4. Why is Raspberry Pi used in the physical design?
It can host the Flask dashboard, logic, and data processing in a more complete deployment model.

## 5. What is GPIO?
GPIO refers to general-purpose input/output pins used to connect sensors, LEDs, and driver circuits.

## 6. What is IoT in this context?
It refers to the communication between sensing devices and an interface or server using protocols such as HTTP.

## 7. What is the difference between HTTP and MQTT?
HTTP is request-response based; MQTT is lightweight publish-subscribe messaging often used for IoT devices.

## 8. What is hysteresis?
Hysteresis prevents rapid switching by using different thresholds for turning ON and OFF.

## 9. Why choose 35% and 45% thresholds?
These are demonstration thresholds that create a stable control band for the prototype.

## 10. What is Flask?
Flask is a Python micro-framework used to create the web application and API endpoints.

## 11. Why use SQLite?
It provides simple local persistence without requiring a separate database server.

## 12. What does Wokwi simulate?
Wokwi simulates the embedded ESP32 environment and its connected hardware.

## 13. What is the role of the dashboard?
It shows current status, trends, alerts, and control options for human monitoring.

## 14. Why are manual and automatic modes separate?
Automatic logic follows thresholds; manual mode allows an explicit user command.

## 15. What is the main limitation of the prototype?
It is a simulation-based academic prototype and not a field-validated agricultural deployment.
