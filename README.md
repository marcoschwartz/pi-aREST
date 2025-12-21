# pi-aREST

**Version 2.0.0**

## Overview

A simple Node.js package that implements a REST API for the Raspberry Pi with MQTT cloud connectivity.

**Version 2.0.0**: This version uses MQTT protocol for cloud connectivity, providing lightweight, reliable IoT communication with automatic reconnection.

It is designed to be universal and currently supports REST calls via HTTP locally, and MQTT for cloud access from anywhere in the world.

## Contents

- index.js: the package file
- examples: several examples using the pi-aREST package

## Supported Hardware

The library is compatible with all Raspberry Pi boards, including:
- Raspberry Pi 5, 4, 3, 2, 1
- Raspberry Pi Zero / Zero W / Zero 2 W
- Raspberry Pi Pico (with appropriate Node.js runtime)

## Requirements

### Node.js

Install Node.js on your Raspberry Pi:

```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
```

### Install pi-aREST

```bash
sudo npm install pi-arest --unsafe-perm
```

## Cloud Setup - Getting Started

### Step 1: Create an Account

1. Go to [dashboard.arest.io](https://dashboard.arest.io)
2. Create an account or sign in

### Step 2: Create a Device

1. Click "Add Device" in the dashboard
2. Give your device a name (e.g., "Living Room Pi")
3. The dashboard will generate:
   - **Device ID**: A unique identifier (e.g., `rpi_living_room_a1b2c3`)
   - **API Key**: A secret key for authentication (e.g., `k8f92j4kd8f7g6h5j4k3l2m1`)

**Important**: Save your API Key! It's only shown once.

### Step 3: Create Your Script

```javascript
var express = require('express');
var app = express();
var piREST = require('pi-arest')(app);

// Device credentials from dashboard
piREST.set_id('rpi_living_room_a1b2c3');  // Your Device ID
piREST.setKey('k8f92j4kd8f7g6h5j4k3l2m1'); // Your API Key
piREST.set_name('Living Room Pi');
piREST.set_mode('bcm');

// Variables to expose
var temperature = 24;
piREST.variable('temperature', temperature);

// Custom function
function ledControl(params, callback) {
    var state = parseInt(params) || 0;
    piREST.digitalWrite(18, state);
    callback(state);
}
piREST.function('led', ledControl);

// Connect to cloud
piREST.connect();

// Publish telemetry every 5 seconds
setInterval(function() {
    temperature = 20 + Math.random() * 10;
    piREST.setVariable('temperature', Math.round(temperature));
    piREST.publish('temperature', Math.round(temperature));
}, 5000);

// Start local server
app.listen(80, function() {
    console.log('Server running on port 80');
});
```

### Step 4: Run Your Script

```bash
sudo node your-script.js
```

### Step 5: Control Your Device

Once connected, control your device via:

**REST API:**
```bash
# Set pin HIGH
curl https://cloud.arest.io/{device_id}/digital/18/1

# Read pin
curl https://cloud.arest.io/{device_id}/digital/18

# Call function
curl https://cloud.arest.io/{device_id}/led?params=1

# Get variable
curl https://cloud.arest.io/{device_id}/temperature

# Get device info
curl https://cloud.arest.io/{device_id}
```

**Dashboard:**
- View real-time telemetry
- Send commands
- Create dashboards with widgets

## MQTT Topic Structure

The library uses the following MQTT topics:

| Topic | Direction | Purpose |
|-------|-----------|---------|
| `devices/{device_id}/commands` | Server -> Device | Receive commands |
| `devices/{device_id}/response` | Device -> Server | Send command responses |
| `devices/{device_id}/telemetry` | Device -> Server | Send sensor data |
| `devices/{device_id}/state` | Device -> Server | Send heartbeat/status |

## Custom MQTT Server

To use your own MQTT broker instead of mqtt.arest.io:

```javascript
piREST.setServer('your-broker.com', 1883);
piREST.connect();
```

Or pass directly to connect:

```javascript
piREST.connect('your-broker.com', 1883);
```

## API Documentation

### Digital

```
/digital/18/0    - Set GPIO18 LOW
/digital/18/1    - Set GPIO18 HIGH
/digital/18      - Read GPIO18
```

### Variables

Expose variables in your script:

```javascript
var temperature = 25;
piREST.variable('temperature', temperature);

// Update variable value
piREST.setVariable('temperature', 30);
```

Access via: `/temperature`

### Functions

Define custom functions:

```javascript
function motorControl(params, callback) {
    var speed = parseInt(params) || 0;
    // Control motor...
    callback(speed);
}
piREST.function('motor', motorControl);
```

Call via: `/motor?params=100`

### Telemetry

Send data to the cloud:

```javascript
piREST.publish('temperature', 25);           // Send immediately
piREST.publish('temperature', 25, 5000);     // Rate-limited (max every 5 seconds)
```

## Command Format (MQTT)

Commands received on the `commands` topic use JSON format:

```json
{
  "command_id": "cmd_123456",
  "type": "function",
  "function": "led",
  "params": "1"
}
```

Supported command types:
- `digital_write` - Write to digital pin
- `digital_read` - Read digital pin
- `function` - Call custom function
- `get_variable` - Get variable value
- `get_info` - Get device info

## Pin Modes

```javascript
piREST.set_mode('bcm');      // BCM GPIO numbering (recommended)
piREST.set_mode('physical'); // Physical pin numbering
```

## Local Access

You can also access your Pi locally via HTTP:

```bash
# Local access
curl http://192.168.1.x/temperature
curl http://192.168.1.x/digital/18/1
```

## Troubleshooting

### Device not connecting

1. Check your Device ID and API Key are correct
2. Ensure your network allows outbound MQTT (port 1883)
3. Check console output for error messages

### Commands not working

1. Ensure device shows as "online" in dashboard
2. Check that the function/variable is registered
3. Look at console output for incoming commands

### GPIO permission errors

Run with sudo:
```bash
sudo node your-script.js
```

Or add your user to the gpio group:
```bash
sudo usermod -a -G gpio $USER
```

## Migration from v1.x

If upgrading from version 1.x:

1. The MQTT topic structure has changed
2. Commands are now JSON format instead of path-based
3. Add API key authentication with `setKey()`

```javascript
// Old (v1.x)
piREST.set_id('device_id');
piREST.connect();

// New (v2.0.0)
piREST.set_id('device_id');
piREST.setKey('your_api_key');  // New: API key authentication
piREST.connect();
```

## License

This work is licensed under the ISC License.
