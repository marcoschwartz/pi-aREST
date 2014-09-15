var express = require('express');
var app = express();

app.get('/id', function(req, res){
  res.send('The board ID');
});

app.get('/mode/:pin/:command', function(req, res){
  res.send('Mode selected' + req.params.pin + req.params.command);
});

var server = app.listen(80, function() {
    console.log('Listening on port %d', server.address().port);
});