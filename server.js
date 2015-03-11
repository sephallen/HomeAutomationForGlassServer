var arduino = require('johnny-five')
  , board = new arduino.Board()
  , express = require('express')
  , http = require('http')
  , io = require('socket.io').listen(board.on.server);

board.on("ready", function() {

  var status = {light:"OFF", door:"locked", temp:"0", thermostat:"0"};

  function statusEmit() {
    io.emit('ack button status', { statusLight: status.light, statusDoor: status.door, statusTemp: status.temp,
    statusThermostat: status.thermostat });
  }

  var led = new arduino.Led(13);
  var servo = new arduino.Servo(9);
  // Start the servo (lock) at 1 (locked position) servo.min was causing issues
  // servo.to(20);
  servo.min();
  var temperature = new arduino.Temperature({
    controller: "LM35",
    pin: "A0"
  });
  temperature.on("data", function(err, data) {
    status.temp = Math.round(data.celsius);
  });
  var lcd = new arduino.LCD({
    // LCD pin name  RS  EN  DB4 DB5 DB6 DB7
    // Arduino pin # 12  11   5   4  3  2
    pins: [ 12, 11, 5, 4, 3, 2 ],
    rows: 2,
    cols: 16
  });
  function printLCD() {
    lcd.clear().cursor(0, 0);
    lcd.print("Thermostat");
    lcd.cursor(1, 0);
    lcd.print("temperature: " + status.thermostat + "C");
  }
  printLCD();

  var app = express();
  var server = http.createServer(app);
  app.get('/lighton', function(req, res) {
    res.send('Light turned on');
    status.light = 'ON';
    led.on();
    statusEmit();
  });
  app.get('/lightoff', function(req, res) {
    res.send('Light turned off');
    status.light = 'OFF';
    led.off();
    statusEmit();
  });
  app.get('/lock', function(req, res) {
    res.send('Door locked');
    status.door = 'locked';
    // servo.to(20);
    servo.min();
    statusEmit();
  });
  app.get('/unlock', function(req, res) {
    res.send('Door unlocked');
    status.door = 'unlocked';
    servo.max();
    statusEmit();
  });
  app.get('/thermostat/:thermTemp', function(req, res) {
    var newThermTemp = req.params.thermTemp;
    if (newThermTemp >= 0 && newThermTemp <= 30) {
      res.send('The thermostat temperature is ' + newThermTemp);
      status.thermostat = newThermTemp;
      printLCD();
      statusEmit();
    } else {
      res.send(newThermTemp + ' is not a valid temperature');
    }
  });
  app.get('/json', function(req, res) {
    res.json(status);
  });
  app.use(express.static('public'));
  server.listen(3000);
  io.listen(server);

  io.sockets.on('connection', function (socket) {

    setInterval(function(){
      // socket.emit('ack button status', { statusTemp: status.temp, statusThermostat: status.thermostat })
      statusEmit();
    }, 1000);

    //Set the current common status to the new client
    // socket.emit('ack button status', { statusLight: status.light, statusDoor: status.door, statusTemp: status.temp });

    socket.on('button update event', function (data) {
      // console.log(data.statusLight);

      //acknowledge with inverted status,
      //to toggle button text in client
      if(data.statusLight == 'OFF') {
          // console.log("OFF->ON");
          status.light = 'ON';
          led.on();
      } else if(data.statusLight == 'ON') {
          // console.log("ON->OFF");
          status.light = 'OFF';
          led.off();
      }
      if(data.statusDoor == 'unlocked') {
        status.door = 'locked';
        // servo.to(20);
        servo.min();
      } else if(data.statusDoor == 'locked') {
        status.door = 'unlocked';
        servo.max();
      }

      if (data.statusThermostat != status.thermostat && data.statusThermostat != null) {
        status.thermostat = data.statusThermostat;
        printLCD();
      }
      statusEmit();
    });

    //Info all clients if this client disconnect
    socket.on('disconnect', function () {
        // io.sockets.emit('on disconnect');
            // { client: socket.id,
            //   // clientCount: io.sockets.clients().length-1,
            // });
    });
  });

});
