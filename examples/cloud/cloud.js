/*
  pi-aREST Cloud Example

  This example demonstrates cloud connectivity for Raspberry Pi using MQTT.
  The device connects to mqtt.arest.io by default for cloud access.

  Topic structure:
  - devices/{device_id}/commands   - Receives commands from server
  - devices/{device_id}/response   - Sends command responses
  - devices/{device_id}/telemetry  - Sends sensor data
  - devices/{device_id}/state      - Sends device state/heartbeat

  Authentication:
  - MQTT username = device_id
  - MQTT password = api_key

  Setup:
  1. Go to dashboard.arest.io and create an account
  2. Create a new device to get your Device ID and API Key
  3. Replace 'your_device_id' and 'your_api_key' below with your credentials
  4. Run: sudo npm install && sudo node cloud.js

  Control your device via:
  - REST API: https://cloud.arest.io/{device_id}/digital/7/1
  - Dashboard: dashboard.arest.io
*/

// Start
var express = require('express');
var app = express();
var piREST = require('pi-arest')(app);

// Device credentials from dashboard.arest.io
const DEVICE_ID = 'your_device_id';     // Replace with your Device ID
const API_KEY = 'your_api_key';         // Replace with your API Key

// Set up device
piREST.set_id(DEVICE_ID);
piREST.setKey(API_KEY);
piREST.set_name('Raspberry Pi');
piREST.set_mode('bcm');  // Use BCM GPIO numbering

// To use a custom MQTT server instead of mqtt.arest.io:
// piREST.setServer('your.server.com', 1883);

// Variables to expose
var temperature = 24;
var humidity = 40;
piREST.variable('temperature', temperature);
piREST.variable('humidity', humidity);

// Custom function: control LED
function ledControl(params, callback) {
    var state = parseInt(params) || 0;
    piREST.digitalWrite(18, state);  // GPIO18
    console.log('LED set to:', state);
    callback(state);
}
piREST.function('led', ledControl);

// Custom function: blink LED
function blinkLED(params, callback) {
    var times = parseInt(params) || 3;
    var count = 0;

    function doBlink() {
        if (count < times * 2) {
            piREST.digitalWrite(18, count % 2);
            count++;
            setTimeout(doBlink, 200);
        } else {
            piREST.digitalWrite(18, 0);
            callback(times);
        }
    }
    doBlink();
}
piREST.function('blink', blinkLED);

// Connect to cloud.aREST.io
piREST.connect();

// Simulate sensor readings and publish telemetry
setInterval(function() {
    // Update variables (simulate sensor readings)
    temperature = 20 + Math.random() * 10;
    humidity = 40 + Math.random() * 20;

    // Update exposed variables
    piREST.setVariable('temperature', Math.round(temperature));
    piREST.setVariable('humidity', Math.round(humidity));

    // Publish telemetry to cloud
    piREST.publish('temperature', Math.round(temperature));
    piREST.publish('humidity', Math.round(humidity));
}, 5000);

// Start local HTTP server for direct access
var server = app.listen(80, function() {
    console.log('Local server listening on port %d', server.address().port);
    console.log('Device ID:', DEVICE_ID);
    console.log('');
    console.log('Access locally: http://localhost/temperature');
    console.log('Access via cloud: https://cloud.arest.io/' + DEVICE_ID + '/temperature');
});
