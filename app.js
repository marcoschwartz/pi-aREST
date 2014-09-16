// Require
var express = require('express');
var gpio = require("pi-gpio");

// Create app
var app = express();

// Parameters
var id = 'cQ4eR';
var name = 'my_pi';

// Variables
var variables = new Object();
variables['temperature'] = 24;
variables['humidity'] = 40;

// Id
app.get('/id', function(req, res){
  
  var answer = new Object();
  answer.id = id;
  answer.name  = name;
  answer.connected = true;
  
  res.json(answer);
});

// Variables
app.get('/:variable', function(req, res){

  var answer = new Object();

  answer.id = id;
  answer.name  = name;
  answer.connected = true;

  answer.req.params.variable = variables[req.params.variable];

  res.json(answer);
});

// Digital write
app.get('/digital/:pin/:state', function(req, res){

  var answer = new Object();

  answer.id = id;
  answer.name  = name;
  answer.connected = true;

  answer.message = 'Pin ' + req.params.pin + ' set to ' + req.params.state;

  gpio.open(parseInt(req.params.pin), "output", function(err) {     
    gpio.write(parseInt(req.params.pin), parseInt(req.params.state), function() {  
      gpio.close(parseInt(req.params.pin));                   
    });
  });

  // Send answer
  res.json(answer);
});

// Digital read
app.get('/digital/:pin', function(req, res){
  
  gpio.open(parseInt(req.params.pin), "input", function(err) {
    gpio.read(parseInt(req.params.pin), function(err, value) {

      var answer = new Object();
      answer.id = id;
      answer.name  = name;
      answer.connected = true;
      answer.return_value = value;
      res.json(answer);

      gpio.close(parseInt(req.params.pin));  
    });
  });
  
});

var server = app.listen(80, function() {
    console.log('Listening on port %d', server.address().port);
});