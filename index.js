// pi-aREST - REST API for Raspberry Pi with MQTT Cloud Connectivity
// Version 2.0.0 - MQTT Protocol

// Require
var rpio = require('rpio');
var mqtt = require('mqtt');

// Try to build camera object
var camera = null;
try {
    var RaspiCam = require("raspicam");
    camera = new RaspiCam({
        mode: "photo",
        width: 1280,
        height: 720,
        output: "./public/pictures/image.jpg",
        encoding: "jpg",
        timeout: 0,
        n: true
    });
} catch (err) {
    // Camera module not available
}

// Default MQTT server settings
const AREST_MQTT_SERVER = 'mqtt.arest.io';
const AREST_MQTT_PORT = 1883;

// Pi aREST state
var pi = {
    id: '001',
    name: 'my_pi',
    apiKey: null,
    variables: {},
    functions: {},
    client: null,
    connected: false,
    mqttHost: AREST_MQTT_SERVER,
    mqttPort: AREST_MQTT_PORT,
    heartbeatInterval: null,
    lastPublishTimes: {}  // For rate-limited publishing
};

// Topics
function getCommandsTopic() {
    return 'devices/' + pi.id + '/commands';
}

function getResponseTopic() {
    return 'devices/' + pi.id + '/response';
}

function getTelemetryTopic() {
    return 'devices/' + pi.id + '/telemetry';
}

function getStateTopic() {
    return 'devices/' + pi.id + '/state';
}

// Process incoming command
function processCommand(message) {
    var command;
    try {
        command = JSON.parse(message);
    } catch (e) {
        console.log('Invalid JSON command:', message);
        return;
    }

    var response = {
        id: pi.id,
        name: pi.name,
        hardware: "rpi",
        connected: true
    };

    // Include command_id in response if present
    if (command.command_id) {
        response.command_id = command.command_id;
    }

    var commandType = command.type || command.command_type;

    switch (commandType) {
        case 'digital_write':
            var pin = parseInt(command.pin);
            var value = parseInt(command.value);

            rpio.open(pin, rpio.OUTPUT, rpio.LOW);
            if (value === 1) {
                rpio.write(pin, rpio.HIGH);
            } else {
                rpio.write(pin, rpio.LOW);
            }

            response.message = 'Pin ' + pin + ' set to ' + value;
            response.return_value = value;
            break;

        case 'digital_read':
            var pin = parseInt(command.pin);

            rpio.open(pin, rpio.INPUT);
            var value = rpio.read(pin);

            response.return_value = value;
            break;

        case 'function':
            var funcName = command.function || command.name;
            var params = command.params || command.args || '';

            // Convert params to string if it's an object
            if (typeof params === 'object') {
                if (params.value !== undefined) {
                    params = String(params.value);
                } else {
                    params = JSON.stringify(params);
                }
            }

            if (pi.functions[funcName]) {
                // Execute function with callback
                pi.functions[funcName](params, function(result) {
                    response.return_value = result;
                    publishResponse(response);
                });
                return; // Don't publish here, will be done in callback
            } else {
                response.error = 'Function not found: ' + funcName;
            }
            break;

        case 'get_variable':
            var varName = command.variable || command.name;

            if (pi.variables[varName] !== undefined) {
                response[varName] = pi.variables[varName];
                response.return_value = pi.variables[varName];
            } else {
                response.error = 'Variable not found: ' + varName;
            }
            break;

        case 'get_info':
            response.variables = pi.variables;
            break;

        default:
            response.error = 'Unknown command type: ' + commandType;
    }

    publishResponse(response);
}

// Publish response to MQTT
function publishResponse(response) {
    if (pi.client && pi.connected) {
        pi.client.publish(getResponseTopic(), JSON.stringify(response));
    }
}

// Publish state/heartbeat
function publishState() {
    if (pi.client && pi.connected) {
        var state = {
            id: pi.id,
            name: pi.name,
            hardware: "rpi",
            connected: true,
            uptime: process.uptime(),
            timestamp: Date.now()
        };
        pi.client.publish(getStateTopic(), JSON.stringify(state));
    }
}

// Exports
module.exports = function(app) {

    // HTTP Routes (local access)
    if (app) {
        // Root - device info
        app.get('/', function(req, res) {
            var answer = {
                id: pi.id,
                name: pi.name,
                hardware: "rpi",
                variables: pi.variables,
                connected: pi.connected
            };
            res.json(answer);
        });

        // Variables and functions
        app.get('/:variable', function(req, res) {
            var variable = req.params.variable;
            var answer = {
                id: pi.id,
                name: pi.name,
                hardware: "rpi",
                connected: pi.connected
            };

            // Variable?
            if (pi.variables[variable] !== undefined) {
                answer[variable] = pi.variables[variable];
                res.json(answer);
            }
            // Function?
            else if (pi.functions[variable]) {
                var params = req.query.params || '';

                pi.functions[variable](params, function(result) {
                    answer.return_value = result;
                    res.json(answer);
                });
            } else {
                res.json(answer);
            }
        });

        // Camera snapshot
        app.get('/camera/snapshot', function(req, res) {
            var answer = {
                id: pi.id,
                name: pi.name,
                hardware: "rpi",
                connected: pi.connected
            };

            if (camera) {
                camera.start({ rotation: 180 });
                camera.once("read", function(err, timestamp, filename) {
                    console.log("Picture recorded");
                    camera.stop();
                });
                answer.message = 'Picture saved';
            } else {
                answer.error = 'Camera not available';
            }
            res.json(answer);
        });

        // Digital read
        app.get('/digital/:pin', function(req, res) {
            var pin = parseInt(req.params.pin);

            rpio.open(pin, rpio.INPUT);
            var value = rpio.read(pin);

            var answer = {
                id: pi.id,
                name: pi.name,
                hardware: "rpi",
                connected: pi.connected,
                return_value: value
            };
            res.json(answer);
        });

        // Digital write
        app.get('/digital/:pin/:state', function(req, res) {
            var pin = parseInt(req.params.pin);
            var state = parseInt(req.params.state);

            rpio.open(pin, rpio.OUTPUT, rpio.LOW);
            if (state === 1) {
                rpio.write(pin, rpio.HIGH);
            } else {
                rpio.write(pin, rpio.LOW);
            }

            var answer = {
                id: pi.id,
                name: pi.name,
                hardware: "rpi",
                connected: pi.connected,
                message: 'Pin ' + pin + ' set to ' + state
            };
            res.json(answer);
        });
    }

    return {
        // Connect to MQTT broker
        connect: function(host, port) {
            // Allow custom server
            if (host) {
                pi.mqttHost = host;
            }
            if (port) {
                pi.mqttPort = port;
            }

            // Build MQTT connection options
            var options = {
                clientId: 'pi_' + pi.id + '_' + Date.now(),
                host: pi.mqttHost,
                port: pi.mqttPort,
                clean: true,
                reconnectPeriod: 5000
            };

            // Add authentication if API key is set
            if (pi.apiKey) {
                options.username = pi.id;
                options.password = pi.apiKey;
            }

            console.log('Connecting to MQTT broker at ' + pi.mqttHost + ':' + pi.mqttPort);

            // Connect to MQTT broker
            var client = mqtt.connect(options);
            pi.client = client;

            // On connect
            client.on('connect', function() {
                console.log('Connected to aREST cloud');
                pi.connected = true;

                // Subscribe to commands topic
                client.subscribe(getCommandsTopic(), function(err) {
                    if (err) {
                        console.log('Subscribe error:', err);
                    } else {
                        console.log('Subscribed to: ' + getCommandsTopic());
                    }
                });

                // Send initial state
                publishState();

                // Start heartbeat (every 30 seconds)
                if (pi.heartbeatInterval) {
                    clearInterval(pi.heartbeatInterval);
                }
                pi.heartbeatInterval = setInterval(publishState, 30000);
            });

            // On disconnect
            client.on('close', function() {
                console.log('Disconnected from MQTT broker');
                pi.connected = false;
            });

            // On error
            client.on('error', function(err) {
                console.log('MQTT error:', err.message);
            });

            // On reconnect
            client.on('reconnect', function() {
                console.log('Reconnecting to MQTT broker...');
            });

            // Handle incoming messages
            client.on('message', function(topic, message) {
                var messageStr = message.toString();
                console.log('Received command:', messageStr);
                processCommand(messageStr);
            });
        },

        // Set device ID
        set_id: function(new_id) {
            pi.id = new_id;
        },

        // Set API key for authentication
        setKey: function(key) {
            pi.apiKey = key;
        },

        // Set custom MQTT server
        setServer: function(host, port) {
            pi.mqttHost = host || AREST_MQTT_SERVER;
            pi.mqttPort = port || AREST_MQTT_PORT;
        },

        // Set pin mode (bcm/gpio or physical/rpi)
        set_mode: function(mode) {
            if (mode === 'gpio' || mode === 'bcm') {
                rpio.init({ mapping: 'gpio' });
            } else if (mode === 'rpi' || mode === 'physical') {
                rpio.init({ mapping: 'physical' });
            }
        },

        // Set device name
        set_name: function(new_name) {
            pi.name = new_name;
        },

        // Expose a variable
        variable: function(variable_name, variable_value) {
            pi.variables[variable_name] = variable_value;
        },

        // Update a variable value
        setVariable: function(variable_name, variable_value) {
            pi.variables[variable_name] = variable_value;
        },

        // Expose a function
        function: function(function_name, function_definition) {
            pi.functions[function_name] = function_definition;
        },

        // Digital read
        digitalRead: function(pin, callback) {
            rpio.open(parseInt(pin), rpio.INPUT);
            var value = rpio.read(parseInt(pin));
            if (callback) {
                callback(value);
            }
            return value;
        },

        // Digital write
        digitalWrite: function(pin, state) {
            var pinState = false;

            rpio.open(parseInt(pin), rpio.OUTPUT, rpio.LOW);

            if (typeof(state) === "boolean") {
                pinState = state;
            } else {
                pinState = (parseInt(state) === 1);
            }

            if (pinState) {
                rpio.write(parseInt(pin), rpio.HIGH);
            } else {
                rpio.write(parseInt(pin), rpio.LOW);
            }
        },

        // Publish telemetry data
        publish: function(variable, value, interval) {
            if (!pi.client || !pi.connected) {
                return;
            }

            // Rate limiting
            if (interval) {
                var now = Date.now();
                var lastTime = pi.lastPublishTimes[variable] || 0;
                if (now - lastTime < interval) {
                    return;
                }
                pi.lastPublishTimes[variable] = now;
            }

            var telemetry = {
                id: pi.id,
                name: pi.name,
                variable: variable,
                value: value,
                timestamp: Date.now()
            };

            pi.client.publish(getTelemetryTopic(), JSON.stringify(telemetry));
        },

        // Check if connected
        isConnected: function() {
            return pi.connected;
        },

        // Get MQTT client (for advanced usage)
        getClient: function() {
            return pi.client;
        }
    };
};
