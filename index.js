// Require
var gpio = require('rpi-gpio');
var RaspiCam = require("raspicam");
var WebSocket = require('ws');
var request = require('request');

// Try to build camera object
try {
  var camera = new RaspiCam({mode: "photo",
    width: 1280,
    height: 720,
    output: "./public/pictures/image.jpg",
    encoding: "jpg",
    timeout: 0,
    n: true
  });
}
catch(err) {
    console.log('Camera module off');
}

// Pi aREST class
var pi = {
  id: '001',
  name: 'my_pi',
  variables: {}
}

// Variables
var variables = new Object();

// Exports
module.exports = function (app) {
    
    // All
    app.get('/', function(req, res){
      
      var answer = new Object();
      answer.id = pi.id;
      answer.name  = pi.name;
      answer.hardware  = "rpi";
      answer.variables = pi.variables;
      answer.connected = true;
      
      res.json(answer);
    });

    // Variables
    app.get('/:variable', function(req, res){

      var answer = new Object();

      answer.id = pi.id;
      answer.name  = pi.name;
      answer.hardware  = "rpi";
      answer.connected = true;

      if (pi.variables[req.params.variable]){
        answer[req.params.variable] = pi.variables[req.params.variable];
      }

      res.json(answer);
    });

    // Camera snapshot
    app.get('/camera/snapshot', function(req, res){

      var answer = new Object();

      camera.start({rotation: 180});

      camera.once("read", function(err, timestamp, filename){
         console.log("Picture recorded");
         camera.stop();
      });

      answer.id = pi.id;
      answer.name  = pi.name;
      answer.hardware  = "rpi";
      answer.connected = true;
      answer.message = 'Picture saved';
      res.json(answer);

    });

    // Digital write
    app.get('/digital/:pin/:state', function(req, res){

      var answer = new Object();

      answer.id = pi.id;
      answer.name  = pi.name;
      answer.hardware  = "rpi";
      answer.connected = true;

      answer.message = 'Pin ' + req.params.pin + ' set to ' + req.params.state;

      gpio.setup(parseInt(req.params.pin), gpio.DIR_OUT, write);

      function write() {
        gpio.write(parseInt(req.params.pin), parseInt(req.params.state), function(err) {
          if (err) throw err;
          console.log('Written to pin');
        });
      }

      // Send answer
      res.json(answer);
    });

    // Digital read
    app.get('/digital/:pin', function(req, res){

      gpio.setup(parseInt(req.params.pin), gpio.DIR_IN, readInput);

      function readInput() {
        gpio.read(parseInt(req.params.pin), function(err, value) {

          var answer = new Object();
          answer.id = pi.id;
          answer.name  = pi.name;
          answer.hardware  = "rpi";
          answer.connected = true;
          answer.return_value = value;
          res.json(answer);

          //console.log('The value is ' + value);
        });
      }
  
  });

  return {
    connect_ws: function(remote_server, port) {

      var ws = new WebSocket(remote_server);

      ws.on('open', function() {
        console.log('Opened WebSocket connection');

        ws.on('message', function(message) {
          console.log('Received command: %s', message);
          request('http://localhost:' + port + '/' + message, function(error, response, body) {
            console.log('Returned command: %s', body);
            ws.send(body);
          });
        });

      });
    
    },
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
};
