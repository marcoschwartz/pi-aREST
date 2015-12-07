// Require
var gpio = require('rpi-gpio');
var RaspiCam = require("raspicam");
var mqtt = require('mqtt');
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

      var answer = pi.getVariable(req.params.variable);
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

      // Determine state
      var pinState = false;
      if (parseInt(req.params.state) == 1) {
        pinState = true;
      }
      if (parseInt(req.params.state) == 0) {
        pinState = false;
      }

      gpio.setup(parseInt(req.params.pin), gpio.DIR_OUT, function() {
        gpio.write(parseInt(req.params.pin), pinState, function(err) {
          if (err) console.log(err);
          console.log('Written to pin');

          // Send answer
          res.json(answer);

        });
      });

    });

    // Digital read
    app.get('/digital/:pin', function(req, res){

      gpio.setup(parseInt(req.params.pin), gpio.DIR_IN, function() {

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

      });

  });

  return {
    getVariable: function(variable) {

      var answer = new Object();

      answer.id = pi.id;
      answer.name  = pi.name;
      answer.hardware  = "rpi";
      answer.connected = true;

      if (pi.variables[variable]){
        answer[variable] = pi.variables[variable];
      }

      return answer;

    },
    connect: function() {

      // Connect to MQTT
      var client  = mqtt.connect({clientId: pi.id, host: '45.55.79.41', port: 1883 });
      var in_topic = pi.id + '_in';
      var out_topic = pi.id + '_out';

      // If connected
      client.on('connect', function () {

        console.log('Connected to aREST.io');

        // Subscribe
        client.subscribe(in_topic);

      });

      // Handle messages
      client.on('message', function (topic, message) {

        // Message is Buffer
        var incomingMessage = message.toString();
        console.log(incomingMessage);

        // Process
        splitMessage = incomingMessage.split('/');
        var answer = {};

        if (splitMessage.length == 1) {
          answer = pi.getVariable(splitMessage);
        }

        // Answer
        client.publish(out_topic, answer);

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
