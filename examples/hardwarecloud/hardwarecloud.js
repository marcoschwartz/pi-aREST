// Start
var express = require('express');
var app = express();
var piREST = require('./../../index.js')(app);

piREST.set_id('p5dtgwwt');
piREST.set_name('dummy');

temperature = 24;
humidity = 40;
piREST.variable('temperature',temperature);
piREST.variable('humidity',humidity);

var server = app.listen(3000, function() {
    console.log('Listening on port %d', 3000);
});

// Connect to remote
piREST.connect_ws('http://marcolivier-arest-cloud-test.jit.su/', 3000);