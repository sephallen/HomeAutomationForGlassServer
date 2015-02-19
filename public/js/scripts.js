var socket = io.connect(document.location.href);
var myId;

socket.on('on connection', function (data) {
    console.log("on connection: " + data.client);
    console.log("Number of client connected: " + data.clientCount);
});

socket.on('on disconnect',function(data) {
    console.log("on disconnect: " + data.client);
    console.log("Number of client connected: " + data.clientCount);
});

socket.on('your id',function(data) {
    console.log("your id: " + data.id);
    myId = data.id;
});

socket.on('ack button status', function (data) {
    console.log("status: " + data.status);

    if(myId==data.by){
        console.log("by YOU");
    }else{
        console.log("by: " + data.by);
    }

    if(data.status =='ON'){
        document.getElementById("lightSwitch").firstChild.data="Turn on the light";
        document.getElementById("lightSwitch").className="waves-effect waves-light btn green white-text";
    }else{
        document.getElementById("lightSwitch").firstChild.data="Turn off the light";
        document.getElementById("lightSwitch").className="waves-effect waves-light btn red white-text";
    }
});

function toggle(button)
{
 if(document.getElementById("lightSwitch").firstChild.data=="Turn off the light"){
  socket.emit('button update event', { status: 'OFF' });
 }
 else if(document.getElementById("lightSwitch").firstChild.data=="Turn on the light"){
  socket.emit('button update event', { status: 'ON' });
 }
}
