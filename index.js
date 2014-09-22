// Require
var express = require('express');
var gpio = require("pi-gpio");
var RaspiCam = require("raspicam");

// Camera object
var camera = new RaspiCam({mode: "photo",
  output: "./public/pictures/image.jpg",
  encoding: "jpg",
  timeout: 0
});

camera.start();

// Create app
var app = express();

// Expose pictures dir
app.use(express.static(path.join(__dirname, 'public')));

// Pi aREST class
var pi = {
  id: '001',
  name: 'my_pi',
  variables: {}
}

// Variables
var variables = new Object();
variables['temperature'] = 24;
variables['humidity'] = 40;

// Id
app.get('/id', function(req, res){
  
  var answer = new Object();
  answer.id = pi.id;
  answer.name  = pi.name;
  answer.connected = true;
  
  res.json(answer);
});

// Variables
app.get('/:variable', function(req, res){

  var answer = new Object();

  answer.id = pi.id;
  answer.name  = pi.name;
  answer.connected = true;

  answer[req.params.variable] = variables[req.params.variable];

  res.json(answer);
});

// Camera snapshot
app.get('/camera/snapshot', function(req, res){

  camera.on("read", function(err, timestamp, filename){
     res.redirect('./../pictures' + filename);
  });

});

// Digital write
app.get('/digital/:pin/:state', function(req, res){

  var answer = new Object();

  answer.id = pi.id;
  answer.name  = pi.name;
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
      answer.id = pi.id;
      answer.name  = pi.name;
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

// Expose functions
module.exports = {
  set_id: function(new_id) {
    pi.id = new_id;
  },
  set_name: function(new_name) {
    pi.name = new_name;
  },
  variable: function(variable_name,variable_value){
    pi.variables[variable_name] = variable_value;  
  }
};