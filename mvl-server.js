var path = require('path');
var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);

var port = process.env.PORT || 3000;

var availableRooms = [];
var gamePairs = {};
function printRooms(){
  console.log(' _____________________________________');
  console.log('|| available rooms : ' + availableRooms);
  console.log('||      game pairs : ' + JSON.stringify(gamePairs));
  console.log(' -------------------------------------');
};

io.on('connection', function(socket){

  socket.on('get rooms', function() {
    socket.emit('available rooms', availableRooms);
  })

  socket.on('mario start', function() {
    console.log('Mario started a game, adding room ' + socket.id);
    availableRooms.push(socket.id);
    printRooms();
  })

  socket.on('luigi join', function(room) {
  	console.log('Luigi joined mario in room ' + room);
    var index = availableRooms.indexOf(room);
    if (index > -1) {
      var marioRoom = availableRooms.splice(index, 1);
      var luigiSocket = socket.id;
      gamePairs[marioRoom] = luigiSocket;
      gamePairs[luigiSocket] = marioRoom;
    }
    printRooms();
    io.to(room).emit('luigi enter');
  })

  socket.on('disconnect', function(){
    console.log('disconnected: ' + socket.id);
    var room = socket.id;
    var index = availableRooms.indexOf(room);
    if ( index > -1 ) {
          console.log('a mario disconnected, no game in progress: ' + room);
          availableRooms.splice(index, 1);
    } else {
        var disconnectedPlayersPartner = gamePairs[room];
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
//    console.log(playerId + ': Player moved to position ' + JSON.stringify(position));
    var partner = gamePairs[playerId]
    io.to(partner).emit('partner move', position)
  })

  socket.on('player bullets', function(bullets) {
    var playerId = socket.id;
//    console.log(playerId + ': Player moved to position ' + JSON.stringify(position));
    var partner = gamePairs[playerId]
    io.to(partner).emit('partner bullets', bullets)
  })
});

http.listen(port, function(){
  console.log('listening on port ' + port);
});