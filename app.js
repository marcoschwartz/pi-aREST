var express = require('express');
var app = express();

app.get('/id', function(req, res){
  res.send('The board ID');
});

// Mode
app.get('/mode/:pin/:state', function(req, res){
  res.send('Mode selected' + req.params.pin + req.params.state);
});

// Analog
app.get('/analog/:pin/:state', function(req, res){
  res.send('Mode selected' + req.params.pin + req.params.state);
});

app.get('/analog/:pin', function(req, res){
  res.send('Mode selected' + req.params.pin);
});

// Digital
app.get('/digital/:pin/:state', function(req, res){
  res.send('Mode selected' + req.params.pin + req.params.state);
});

app.get('/analog/:pin', function(req, res){
  res.send('Mode selected' + req.params.pin);
});

var server = app.listen(80, function() {
    console.log('Listening on port %d', server.address().port);
});