// Start
var express = require('express');
var app = express();
var piREST = require('./../../index.js')(app);

// ID should be 6 characters long
piREST.set_id('34f5eQ');
piREST.set_name('my_new_Pi');
piREST.set_mode('bcm');

// Function
function togglePin() {

  // Get GPIO18 value
  piREST.digitalRead(18, function(value) {

    // Set GPIO18 on
    piREST.digitalWrite(18, !value);
    return 1;

  });

}
piREST.function('toggle', togglePin);

// Variables
temperature = 24;
humidity = 40;
piREST.variable('temperature',temperature);
piREST.variable('humidity',humidity);

var server = app.listen(80, function() {
    console.log('Listening on port %d', server.address().port);
});
