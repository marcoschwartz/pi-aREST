// Require
var express = require('express');
var gpio = require("pi-gpio");

// Create app
var app = express();

// Parameters
var id = 'cQ4eR';
var name = 'my_pi';

app.get('/id', function(req, res){
  
  var answer = new Object();
  answer.id = id;
  answer.name  = name;
  answer.connected = true;
  
  res.json(answer);
});

// Mode
app.get('/mode/:pin/:state', function(req, res){

  // Process command
  var answer = new Object();
  answer.id = id;
  answer.name  = name;
  answer.connected = true;

  if (req.params.state == 'o') {
  	gpio.open(req.params.pin, "output", function(){
  		gpio.close(req.params.pin);
  	});
  	answer.message = 'Pin ' + req.params.pin + ' set to output.';
  }

  if (req.params.state == 'i') {
  	gpio.open(req.params.pin, "input", function(){
  		gpio.close(req.params.pin);
  	});
  	answer.message = 'Pin ' + req.params.pin + ' set to input.';
  }
  
  // Send answer
  res.json(answer);
});

// Analog
app.get('/analog/:pin/:state', function(req, res){
  res.send('Analog command' + req.params.pin + req.params.state);
});

app.get('/analog/:pin', function(req, res){
  res.send('Analog command' + req.params.pin);
});

// Digital
app.get('/digital/:pin/:state', function(req, res){
  gpio.write(req.params.pin, req.params.state, function(){
  		gpio.close(req.params.pin);
  });
  res.send('Digital command' + req.params.pin + req.params.state);
});

app.get('/digital/:pin', function(req, res){
  res.send('Digital command' + req.params.pin);
});

var server = app.listen(80, function() {
    console.log('Listening on port %d', server.address().port);
});