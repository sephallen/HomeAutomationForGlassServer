var arduino = require('johnny-five')
  , board = new arduino.Board({ device: "ACM" })
  , express = require('express')
  , http = require('http')
  , io = require('socket.io').listen(board.on.server);

board.on("ready", function() {

  //All clients have a common status
  var status = {light:"OFF"};

  var led = new arduino.Led(13);

  var servo = new arduino.Servo(9);

  var app = express();
  var server = http.createServer(app);
  app.get('/lighton', function(req, res) {
    res.send('Light on');
    status.light = 'ON';
    led.on();
    io.emit('ack button status', { status: status.light });
  });
  app.get('/lightoff', function(req, res) {
    res.send('Light off');
    status.light = 'OFF';
    led.off();
    io.emit('ack button status', { status: status.light });
  });
  app.get('/json', function(req, res) {
    res.json(status);
  });
  app.use(express.static('public'));
  server.listen(3000);
  io.listen(server);

  io.sockets.on('connection', function (socket) {

      //Send client with his socket id
      socket.emit('your id',
          { id: socket.id});

      //Info all clients a new client connected
      io.sockets.emit('on connection',
          { client: socket.id,
            // clientCount: io.sockets.clients().length,
          });

      //Set the current common status to the new client
      socket.emit('ack button status', { status: status.light });

      socket.on('button update event', function (data) {
          console.log(data.status);

          //acknowledge with inverted status,
          //to toggle button text in client
          if(data.status == 'OFF'){
              console.log("OFF->ON");
              status.light = 'ON';
              led.on();
              servo.max();
          }else{
              console.log("ON->OFF");
              status.light = 'OFF';
              led.off();
              servo.min();
          }
          io.sockets.emit('ack button status',
              { status: status.light,
                by: socket.id
              });
      });

      //Info all clients if this client disconnect
      socket.on('disconnect', function () {
          io.sockets.emit('on disconnect',
              { client: socket.id,
                // clientCount: io.sockets.clients().length-1,
              });
      });
  });

});
