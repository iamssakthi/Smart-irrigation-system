# Raspberry Pi Hardware Guide

## Intended physical deployment

This guide describes the intended real-world implementation of the system. It is not a claim that the physical hardware was tested in this environment.

### Components

- Raspberry Pi (4 or 5 recommended)
- Capacitive soil moisture sensor
- MCP3008 ADC or alternative ADC module
- Relay or MOSFET driver
- External pump power supply
- 5V/12V supply as required by the pump
- GPIO wiring and safe enclosure

## Circuit connection concept

- Soil sensor output connected to ADC input
- ADC connected to Raspberry Pi SPI bus
- Relay or MOSFET used to control pump power
- Pump not driven directly from GPIO

### SPI wiring example

- ADC CS -> CE0 or GPIO chip select
- ADC DIN -> MOSI
- ADC DOUT -> MISO
- ADC CLK -> SCLK

## Sensor calibration

A physical sensor system must be calibrated against the actual soil conditions in use. The dashboard simulation does not represent actual sensor calibration values. This is a professional software prototype only.

## GPIO safety

- Do not connect a pump directly to the Raspberry Pi GPIO pins.
- Use a proper relay module or MOSFET driver.
- Use a separate pump supply and include flyback protection.
- Keep wiring insulated and mounted safely.

## Software separation

The application is designed to run without Raspberry Pi libraries present. The sensor abstraction can be replaced with a Raspberry Pi-specific implementation later.

## Operating note

The Raspberry Pi path is a documented future deployment architecture and is intentionally kept separate from the currently verified simulation.
