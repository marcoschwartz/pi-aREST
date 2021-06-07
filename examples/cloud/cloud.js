// Start
var express = require('express');
var app = express();
var piREST = require('pi-arest')(app);

// Set Raspberry Pi
piREST.set_id('your_device_id');
piREST.setKey('your_api_key');
piREST.set_name('pi_cloud');
piREST.set_mode('bcm');

// Variables
temperature = 24;
humidity = 40;
piREST.variable('temperature', temperature);
piREST.variable('humidity', humidity);

// Connect to cloud.aREST.io
piREST.connect();

// Publish data on feed temperature, with random value, every 5 seconds
setInterval(function () {
    piREST.publish("temperature", Math.random() * 40);
}, 5000);

// Start server
var server = app.listen(80, function () {
    console.log('Listening on port %d', server.address().port);
});
