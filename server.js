var arduino = require('duino')
  , board = new arduino.Board({ device: "ACM" })
  , express = require('express')
  , http = require('http')
  , io = require('socket.io').listen(server);

//All clients have a common status
var commonStatus = 'ON';

var led = new arduino.Led({
  board: board,
  pin: 12
});

var app = express();
var server = http.createServer(app);
app.use('/lighton', function(req, res) {
  res.send('Light on');
  commonStatus = 'OFF';
  led.on();
  io.emit('ack button status', { status: commonStatus });
});
app.use('/lightoff', function(req, res) {
  res.send('Light off');
  commonStatus = 'ON';
  led.off();
  io.emit('ack button status', { status: commonStatus });
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
    socket.emit('ack button status', { status: commonStatus });

    socket.on('button update event', function (data) {
        console.log(data.status);

        //acknowledge with inverted status,
        //to toggle button text in client
        if(data.status == 'ON'){
            console.log("ON->OFF");
            commonStatus = 'OFF';
            led.on();
        }else{
            console.log("OFF->ON");
            commonStatus = 'ON';
            led.off();
        }
        io.sockets.emit('ack button status',
            { status: commonStatus,
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
