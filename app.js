// Require
var express = require('express');

// Create app
var app = express();

// Parameters
var id = 'cQ4eR';
var name = 'my_pi';

// Answer
var answer = new Object();

app.get('/id', function(req, res){
  
  answer.id = id;
  answer.name  = name;
  answer.connected = true;
  
  res.json(answer);
});

// Mode
app.get('/mode/:pin/:state', function(req, res){
  res.send('Mode selected' + req.params.pin + req.params.state);
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
  res.send('Digital command' + req.params.pin + req.params.state);
});

app.get('/analog/:pin', function(req, res){
  res.send('Digital command' + req.params.pin);
});

var server = app.listen(80, function() {
    console.log('Listening on port %d', server.address().port);
});