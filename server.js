var arduino = require('johnny-five')
  , board = new arduino.Board()
  , express = require('express')
  , http = require('http')
  , io = require('socket.io').listen(board.on.server);

board.on("ready", function() {

  var status = {light:"OFF", door:"locked", temp:"0"};
  function statusEmit() {
    io.emit('ack button status', { statusLight: status.light, statusDoor: status.door, statusTemp: status.temp });
  }

  var led = new arduino.Led(13);
  var servo = new arduino.Servo(9);
  // Start the servo (lock) at 1 (locked position) servo.min was causing issues
  servo.to(1);
  var temperature = new arduino.Temperature({
    controller: "LM35",
    pin: "A0"
  });
  temperature.on("data", function(err, data) {
    status.temp = Math.round(data.celsius);
  });

  var app = express();
  var server = http.createServer(app);
  app.get('/lighton', function(req, res) {
    res.send('Light on');
    status.light = 'ON';
    led.on();
    statusEmit();
    // io.emit('ack button status', statusEmit);
  });
  app.get('/lightoff', function(req, res) {
    res.send('Light off');
    status.light = 'OFF';
    led.off();
    statusEmit();
    // io.emit('ack button status', { statusLight: status.light, statusDoor: status.door });
  });
  app.get('/lock', function(req, res) {
    res.send('Door locked');
    status.door = 'locked';
    servo.to(1);
    statusEmit();
    // io.emit('ack button status', { statusLight: status.light, statusDoor: status.door });
  });
  app.get('/unlock', function(req, res) {
    res.send('Door unlocked');
    status.door = 'unlocked';
    servo.max();
    statusEmit();
    // io.emit('ack button status', { statusLight: status.light, statusDoor: status.door });
  });
  app.get('/json', function(req, res) {
    res.json(status);
  });
  app.use(express.static('public'));
  server.listen(3000);
  io.listen(server);

  io.sockets.on('connection', function (socket) {

    setInterval(function(){
      socket.emit('ack button status', { statusTemp: status.temp })
    }, 1000);

    //Set the current common status to the new client
    statusEmit();
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
        servo.to(1);
      } else if(data.statusDoor == 'locked') {
        status.door = 'unlocked';
        servo.max();
      }
      statusEmit();
      // io.sockets.emit('ack button status', {
      //   statusLight: status.light, statusDoor: status.door, statusTemp : status.temp
      // });
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
