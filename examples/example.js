// Start
var express = require('express');
var app = express();
var piREST = require('./../index.js')(app);

//piREST.set_id('34f5eQ');
//piREST.set_name('my_new_Pi');

temperature = 24;
humidity = 40;
//piREST.variable('temperature',temperature);
//piREST.variable('humidity',humidity);

app.get('/', function(req, res){
  
  res.send("Welcome to the home page");

});

var server = app.listen(80, function() {
    console.log('Listening on port %d', server.address().port);
});