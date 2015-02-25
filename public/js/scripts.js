var socket = io.connect(document.location.href);
var oldThermTemp = 0;

socket.on('on connection', function (data) {
});

socket.on('on disconnect',function(data) {
});

socket.on('your id',function(data) {
});

socket.on('ack button status', function (data) {
    // console.log("statusLight: " + data.statusLight);
    // console.log("statusDoor: " + data.statusDoor);
    // console.log(oldThermTemp);
    if (oldThermTemp != data.statusThermostat) {
      document.getElementById("thermSlider").value = data.statusThermostat;
      oldThermTemp = data.statusThermostat;
    }
    if (oldThermTemp != document.getElementById("thermSlider").value) {
      socket.emit('button update event', { statusThermostat: document.getElementById("thermSlider").value });
    }

    document.getElementById("tempDisplay").firstChild.data="The current house temperature is " + data.statusTemp +"°C";

    if(data.statusLight == 'OFF') {
        document.getElementById("lightSwitch").firstChild.data = "Turn on the light";
        document.getElementById("lightSwitch").className = "waves-effect waves-light btn green white-text";
    }else if(data.statusLight == 'ON') {
        document.getElementById("lightSwitch").firstChild.data = "Turn off the light";
        document.getElementById("lightSwitch").className = "waves-effect waves-light btn red white-text";
    }
    if(data.statusDoor == 'locked'){
        document.getElementById("doorLock").firstChild.data = "Unlock the door";
        document.getElementById("doorLock").className = "waves-effect waves-light btn green white-text";
    }else if (data.statusDoor == 'unlocked') {
        document.getElementById("doorLock").firstChild.data = "Lock the door";
        document.getElementById("doorLock").className = "waves-effect waves-light btn red white-text";
    }
});

function toggleLight(button)
{
 if(document.getElementById("lightSwitch").firstChild.data == "Turn off the light"){
  socket.emit('button update event', { statusLight: 'ON' });
 }
 else if(document.getElementById("lightSwitch").firstChild.data == "Turn on the light"){
  socket.emit('button update event', { statusLight: 'OFF' });
 }
}

function toggleLock(button)
{
 if(document.getElementById("doorLock").firstChild.data == "Lock the door"){
  socket.emit('button update event', { statusDoor: 'unlocked' });
 }
 else if(document.getElementById("doorLock").firstChild.data == "Unlock the door"){
  socket.emit('button update event', { statusDoor: 'locked' });
 }
}
