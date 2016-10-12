var path = require('path');
var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);

var port = process.env.PORT || 3000;

var availableRooms = {};
var gamePairs = {};

function printRooms(){
  console.log(' _____________________________________');
  console.log('|| available rooms : ' + JSON.stringify(availableRooms));
  console.log('||      game pairs : ' + JSON.stringify(gamePairs));
  console.log(' -------------------------------------');
};

io.on('connection', function(socket){

  socket.on('get rooms', function() {
    socket.emit('available rooms', availableRooms);
  })

  socket.on('mario start', function(roomName, gameHeight, gameWidth) {
    if (!roomName) roomName = socket.id;
    console.log('Mario started a game, adding room ' + socket.id + " with name " + roomName);
    availableRooms[socket.id] = { name: roomName, height: gameHeight, width: gameWidth };
    printRooms();
  })

  socket.on('luigi join', function(roomID) {
  	console.log('Luigi joined mario in room ' + roomID);
    var luigiSocket = socket.id;
    gamePairs[roomID] = luigiSocket;
    gamePairs[luigiSocket] = roomID;
    delete availableRooms[roomID];
    printRooms();
    io.to(roomID).emit('luigi enter');
  })

  socket.on('disconnect', function(){
    console.log('disconnected: ' + socket.id);
    var roomID = socket.id;
    var availableRoom = availableRooms[roomID];
    if ( availableRoom ) {
          console.log('a mario disconnected, no game in progress: ' + roomID);
          delete availableRooms[roomID];
    } else {
        var disconnectedPlayersPartner = gamePairs[roomID];
        var disconnectedPlayer = gamePairs[disconnectedPlayersPartner];
        console.log('someone disconnected, ' + disconnectedPlayersPartner + ' will be notified!');
        io.to(disconnectedPlayersPartner).emit('partner exit')
        delete gamePairs[disconnectedPlayersPartner];
        delete gamePairs[disconnectedPlayer];
    }

    printRooms();
  });

  socket.on('player move', function(position) {
    var playerId = socket.id;
    var partner = gamePairs[playerId]
    io.to(partner).emit('partner move', position)
  })

  socket.on('player bullets', function(bullets) {
    var playerId = socket.id;
    var partner = gamePairs[playerId]
    io.to(partner).emit('partner bullets', bullets)
  })

  socket.on('kill', function(bullets) {
    var playerId = socket.id;
    var partner = gamePairs[playerId]
    io.to(partner).emit('die')
  })
});

http.listen(port, function(){
  console.log('listening on port ' + port);
});