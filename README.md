# pi-aREST

Version 1.6.1

## Overview

A simple Node.js package that implements a REST API for the Raspberry Pi.

It is designed to be universal and currently supports REST calls via HTTP, either using Ethernet or WiFi.

Raspberry Pi boards running aREST can also be accessed from anywhere in the world via an API available at `cloud.arest.io`. Check the rest of this file and the cloud example for more details.

If you want to know more about aREST, go over to [http://arest.io/](http://arest.io/).

## Contents

- index.js: the package file.
- examples: several examples using the pi-aREST package

## Supported hardware

The library is at the moment compatible with all the Raspberry Pi boards, including the Raspberry Pi 3 and Raspberry Pi Zero.

## Requirements

To use the library with your Raspberry Pi board, you will need to have Node.js installed on your Pi. You can find the procedure to install Node.js your Pi at:

[https://learn.adafruit.com/node-embedded-development/installing-node-dot-js](https://learn.adafruit.com/node-embedded-development/installing-node-dot-js)

Once this is done, you can install pi-aREST in your project with:

`sudo npm install pi-arest --unsafe-perm`

## Quick test (Ethernet/WiFi)

1. Connect a LED & resistor to pin number 7 of your Raspberry Pi board (GPIO4)
2. Open the basic example sketch
3. Install the express module with: `sudo npm install express`
3. Start pi-aREST with `sudo basic.js`
4. Get the IP address of your board with `ifconfig`
4. Go to a web browser and type `rpi_ip_address/digital/7/1` and the LED should turn on

## Cloud Access quick test (Ethernet/WiFi)

1. Connect a LED & resistor to pin number 7 of your Raspberry Pi board (GPIO4)
2. Open the cloud example sketch
3. Modify the sketch with an unique ID for your board
3. Install the express module with: `sudo npm install express`
3. Start pi-aREST with `sudo cloud.js`
4. Go to a web browser and type `cloud.arest.io/board_id/digital/7/1` and the LED should turn on

## API documentation

The API currently supports three type of commands: digital, variables, and functions.

### Digital

Digital is to write or read on digital pins on the Raspberry Pi. For example:
  * `/digital/8/0` sets pin number 8 to a low state
  * `/digital/8/1` sets pin number 8 to a high state
  * `/digital/8` reads value from pin number 8 in JSON format (note that for compatibility reasons, `/digital/8/r` produces the same result)

### Variables

You can also directly call variables that are defined in your Node.js application.

To access a variable in your sketch, you have to declare it first, and then call it with a REST call. For example, if your aREST instance is called "piREST" and the variable "temperature":
  * `piREST.variable("temperature",temperature);` declares the temperature in the Node.js application
  * `/temperature` returns the value of the variable in JSON format

### Functions

You can also directly call functions that are defined in your Node.js application.

To access a function in your sketch, you have to declare it first, and then call it with a REST call. For example, if your aREST instance is called "piREST" and the function "motor":
  * `piREST.function("motor",motor);` declares the function in the Node.js application
  * `/motor` executes the function

### Get data about the board

You can also access a description of all the variables that were declared on the board with a single command. This is useful to automatically build graphical interfaces based on the variables exposed to the API. This can be done via the following calls:
  * `/` or `/id`
  * The names & types of the variables will then be stored in the variables field of the returned JSON object
