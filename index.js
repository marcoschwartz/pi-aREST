// Require
var rpio = require('rpio');
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
        res.json(answer);
      }

      // Function ?
      else if (pi.functions[variable]) {

        // Parameters ?
        if (req.query.params) {

          // Execute function
          pi.functions[variable](req.query.params, function(result) {
            answer.return_value = result;
            res.json(answer);
          });

        }
        else {

          // Execute function
          pi.functions[variable](function(result) {
            answer.return_value = result;
            res.json(answer);
          });

        }

      }
      else {
        res.json(answer);
      }

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

    // Digital read
    app.get('/:command/:pin', function(req, res){

      if (req.params.command == 'digital') {

        // Read
        rpio.open(parseInt(req.params.pin), rpio.INPUT);
        value = rpio.read(parseInt(req.params.pin));

        // Send answer
        var answer = new Object();
        answer.id = pi.id;
        answer.name  = pi.name;
        answer.hardware  = "rpi";
        answer.connected = true;
        answer.return_value = value;
        res.json(answer);

        // gpio.setup(parseInt(req.params.pin), gpio.DIR_IN, function() {
        //
        //   gpio.read(parseInt(req.params.pin), function(err, value) {
        //
        //
        //
        //     //console.log('The value is ' + value);
        //   });

        // });

      }

  });

    // Digital write
    app.get('/digital/:pin/:state', function(req, res){

      var answer = new Object();

      answer.id = pi.id;
      answer.name  = pi.name;
      answer.hardware  = "rpi";
      answer.connected = true;

      answer.message = 'Pin ' + req.params.pin + ' set to ' + req.params.state;

      // Open for write
      rpio.open(parseInt(req.params.pin), rpio.OUTPUT, rpio.LOW);

      // Determine state & write
      if (parseInt(req.params.state) == 1) {
        rpio.write(parseInt(req.params.pin), rpio.HIGH);
      }
      if (parseInt(req.params.state) == 0) {
        rpio.write(parseInt(req.params.pin), rpio.LOW);
      }

      // Send answer
     res.json(answer);

      // gpio.setup(parseInt(req.params.pin), gpio.DIR_OUT, function() {
      //   gpio.write(parseInt(req.params.pin), pinState, function(err) {
      //     if (err) console.log(err);
      //     console.log('Written to pin');
      //
      //     // Send answer
      //     res.json(answer);
      //
      //   });
      // });

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

          // Variable ?
          if (pi.variables[splitMessage[0]]){
            answer[splitMessage[0]] = pi.variables[splitMessage[0]];
            client.publish(out_topic, JSON.stringify(answer));
          }

          else {
            client.publish(out_topic, JSON.stringify(answer));
          }

        }

        if (splitMessage.length == 2) {

          // Read
          rpio.open(parseInt(splitMessage[1]), rpio.INPUT);
          value = rpio.read(parseInt(splitMessage[1]));

          answer.id = pi.id;
          answer.name  = pi.name;
          answer.hardware  = "rpi";
          answer.connected = true;
          answer.return_value = value;

          client.publish(out_topic, JSON.stringify(answer));
          //
          //   });
          //
          // });

        }

        if (splitMessage.length == 3) {

          answer.id = pi.id;
          answer.name  = pi.name;
          answer.hardware  = "rpi";
          answer.connected = true;

          answer.message = 'Pin ' + splitMessage[1] + ' set to ' + splitMessage[2];

          // Open for write
          rpio.open(parseInt(splitMessage[1]), rpio.OUTPUT, rpio.LOW);

          // Determine state
          if (parseInt(splitMessage[2]) == 1) {
            rpio.write(parseInt(splitMessage[1]), rpio.HIGH);
          }
          if (parseInt(splitMessage[2]) == 0) {
            rpio.write(parseInt(splitMessage[1]), rpio.LOW);
          }

          // Send answer
          client.publish(out_topic, JSON.stringify(answer));

          // gpio.setup(parseInt(splitMessage[1]), gpio.DIR_OUT, function() {
          //   gpio.write(parseInt(splitMessage[1]), pinState, function(err) {
          //     if (err) console.log(err);
          //     //console.log('Written to pin');
          //
          //
          //
          //   });
          // });

        }

      });

    },
    set_id: function(new_id) {
      pi.id = new_id;
    },
    set_mode: function(mode) {

      if (mode == 'gpio') {
        rpio.init({mapping: 'gpio'});
      }
      if (mode == 'bcm') {
        rpio.init({mapping: 'gpio'});
      }
      if (mode == 'rpi') {
        rpio.init({mapping: 'physical'});
      }
      if (mode == 'physical') {
        rpio.init({mapping: 'physical'});
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
    digitalRead: function(pin, callback) {

      // Read
      rpio.open(parseInt(pin), rpio.INPUT);
      value = rpio.read(parseInt(pin));
      callback(value);

      //   });
      //
      // });
    },
    digitalWrite: function(pin, state) {

      // Determine state
      var pinState = false;

      // Open for write
      rpio.open(parseInt(pin), rpio.OUTPUT, rpio.LOW);

      if( typeof(state) === "boolean") {
        pinState = state;
      }
      else {

        if (parseInt(state) == 1) {
          pinState = true;
        }
        if (parseInt(state) == 0) {
          pinState = false;
        }

      }

      // Write
      if (pinState) {rpio.write(parseInt(pin), rpio.HIGH);}
      if (!pinState) {rpio.write(parseInt(pin), rpio.LOW);}

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
