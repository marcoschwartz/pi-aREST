// Start
var express = require('express');
var app = express();
var piREST = require('./../../index.js')(app);

piREST.set_id('p5dgwt');
piREST.setKey('your_key');
piREST.set_name('pi_cloud');
piREST.set_mode('bcm');

temperature = 24;
humidity = 40;
piREST.variable('temperature',temperature);
piREST.variable('humidity',humidity);

// Connect to cloud.aREST.io
piREST.connect();

// Start server
var server = app.listen(80, function() {
    console.log('Listening on port %d', server.address().port);
});
