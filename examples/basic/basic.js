// Start
var express = require('express');
var app = express();
var piREST = require('./../../index.js')(app);

// ID should be 6 characters long
piREST.set_id('34f5eQ');
piREST.set_name('my_new_Pi');
piREST.set_mode('bcm');

// Function
function setPin(value, callback) {

  // Set GPIO18
  piREST.digitalWrite(18, value);
  callback(1);

}
piREST.function('pin', setPin);

// Variables
temperature = 24;
humidity = 40;
piREST.variable('temperature',temperature);
piREST.variable('humidity',humidity);

var server = app.listen(80, function() {
    console.log('Listening on port %d', server.address().port);
});
