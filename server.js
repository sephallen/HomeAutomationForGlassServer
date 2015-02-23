var arduino = require('johnny-five')
  , board = new arduino.Board()
  , express = require('express')
  , http = require('http')
  , io = require('socket.io').listen(board.on.server);

board.on("ready", function() {

  var status = {light:"OFF", door:"locked"};

  var led = new arduino.Led(13);

  var servo = new arduino.Servo(9);

  var app = express();
  var server = http.createServer(app);
  app.get('/lighton', function(req, res) {
    res.send('Light on');
    status.light = 'ON';
    led.on();
    io.emit('ack button status', { statusLight: status.light });
  });
  app.get('/lightoff', function(req, res) {
    res.send('Light off');
    status.light = 'OFF';
    led.off();
    io.emit('ack button status', { statusLight: status.light });
  });
  app.get('/json', function(req, res) {
    res.json(status);
  });
  app.use(express.static('public'));
  server.listen(3000);
  io.listen(server);

  io.sockets.on('connection', function (socket) {

      //Set the current common status to the new client
      socket.emit('ack button status', { statusLight: status.light, statusDoor: status.door });

      socket.on('button update event', function (data) {
          console.log(data.statusLight);

          //acknowledge with inverted status,
          //to toggle button text in client
          if(data.statusLight == 'OFF') {
              console.log("OFF->ON");
              status.light = 'ON';
              led.on();
          } else if(data.statusLight == 'ON') {
              console.log("ON->OFF");
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
          io.sockets.emit('ack button status',
              { statusLight: status.light, statusDoor: status.door
                // by: socket.id
              });
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
