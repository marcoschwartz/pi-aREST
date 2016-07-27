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
  variables: {},
  functions: {}
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

      var variable = req.params.variable;
      var answer = new Object();

      answer.id = pi.id;
      answer.name  = pi.name;
      answer.hardware  = "rpi";
      answer.connected = true;

      // Variable ?
      if (pi.variables[variable]){
        answer[variable] = pi.variables[variable];
      }

      // Function ?
      if (pi.functions[variable]) {

        // Execute function
        answer.return_value = pi.functions[variable]();

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
    connect: function(host) {

      // Generate MQTT clientId
      var clientId = makeId(6) + pi.id;

      // Own server?
      if (typeof host !== 'undefined') {
        remoteHost = host;
      }
      else {
        remoteHost = '45.55.196.201';
      }

      // Connect to MQTT
      var client  = mqtt.connect({clientId: clientId, host: remoteHost, port: 1883 });
      var in_topic = clientId + '_in';
      var out_topic = clientId + '_out';

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

        // Process
        splitMessage = incomingMessage.split('/');
        var answer = {};

        if (splitMessage.length == 1) {

          var answer = new Object();

          answer.id = pi.id;
          answer.name  = pi.name;
          answer.hardware  = "rpi";
          answer.connected = true;

          if (pi.variables[splitMessage[0]]){
            answer[splitMessage[0]] = pi.variables[splitMessage[0]];
          }

          client.publish(out_topic, JSON.stringify(answer));

        }

        if (splitMessage.length == 2) {

          gpio.setup(parseInt(splitMessage[1]), gpio.DIR_IN, function() {

            gpio.read(parseInt(splitMessage[1]), function(err, value) {

              answer.id = pi.id;
              answer.name  = pi.name;
              answer.hardware  = "rpi";
              answer.connected = true;
              answer.return_value = value;

              client.publish(out_topic, JSON.stringify(answer));

            });

          });

        }

        if (splitMessage.length == 3) {

          answer.id = pi.id;
          answer.name  = pi.name;
          answer.hardware  = "rpi";
          answer.connected = true;

          answer.message = 'Pin ' + splitMessage[1] + ' set to ' + splitMessage[2];

          // Determine state
          var pinState = false;
          if (parseInt(splitMessage[2]) == 1) {
            pinState = true;
          }
          if (parseInt(splitMessage[2]) == 0) {
            pinState = false;
          }

          gpio.setup(parseInt(splitMessage[1]), gpio.DIR_OUT, function() {
            gpio.write(parseInt(splitMessage[1]), pinState, function(err) {
              if (err) console.log(err);
              //console.log('Written to pin');

              // Send answer
              client.publish(out_topic, JSON.stringify(answer));

            });
          });

        }

      });

    },
    set_id: function(new_id) {
      pi.id = new_id;
    },
    set_mode: function(mode) {

      if (mode == 'bcm') {
        gpio.setMode(gpio.MODE_BCM);
      }
      if (mode == 'rpi') {
        gpio.setMode(gpio.MODE_RPI);
      }

    },
    set_name: function(new_name) {
      pi.name = new_name;
    },
    variable: function(variable_name, variable_value){
      pi.variables[variable_name] = variable_value;
    },
    function: function(function_name, function_definition) {
      pi.functions[function_name] = function_definition;
    },
    digitalRead: function(pin) {
      gpio.setup(parseInt(pin), gpio.DIR_IN, function() {

        gpio.read(parseInt(pin), function(err, value) {

          return value;

        });

      });
    },
    digitalWrite: function(pin, state) {

      // Determine state
      var pinState = false;
      if (parseInt(state) == 1) {
        pinState = true;
      }
      if (parseInt(state) == 0) {
        pinState = false;
      }

      gpio.setup(parseInt(pin), gpio.DIR_OUT, function() {
        gpio.write(parseInt(pin), pinState);
      });

    }
  };
};

function makeId(length)
{
    var text = "";
    var possible = "abcdefghijklmnopqrstuvwxyz0123456789";

    for( var i = 0; i < length; i++ )
        text += possible.charAt(Math.floor(Math.random() * possible.length));

    return text;
}
