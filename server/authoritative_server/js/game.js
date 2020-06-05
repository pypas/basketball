const players = {};
var ball;
var attachedId;
const config = {
  type: Phaser.HEADLESS,
  parent: 'phaser-example',
  width: 674,
  height: 652,
  physics: {
    default: 'arcade',
    arcade: {
      debug: false,
      gravity: { y: 0 }
    }
  },
  scene: {
    preload: preload,
    create: create,
    update: update
  },
  autoFocus: false
};
//https://www.html5gamedevs.com/topic/2813-attach-sprite-to-sprite/
function preload() {
  this.load.image('player', 'assets/player.png');
  this.load.image('ball', 'assets/basketball.png');
  
}

function create() {
  const self = this;
  this.players = this.physics.add.group();
  this.ball = this.physics.add.image(randomPosition(700), randomPosition(500), 'ball');
  this.scores = {
    green: 0,
    red: 0
  };

  this.physics.add.overlap(this.players, this.ball, function (ball, player) {
    if(!attachedId) {
      io.emit('updateCurrentPlayer', {id: player.playerId, name: players[player.playerId].name})
      attachedId = player.playerId
    }
  });

  this.physics.add.collider(this.players);

  io.on('connection', function (socket) {
    console.log('a user connected');
    // create a new player and add it to our players object
    players[socket.id] = {
      rotation: 0,
      x: Math.floor(Math.random() * 500) + 50,
      y: Math.floor(Math.random() * 500) + 50,
      playerId: socket.id,
      name: "player " + Object.keys(players).length,
      team: (Object.keys(players).length % 2 == 0) ? 'red' : 'green',
      input: {
        left: false,
        right: false,
        up: false,
        down: false
      }
    };
    // add player to server
    addPlayer(self, players[socket.id]);
    // send the players object to the new player
    socket.emit('currentPlayers', players);
    // update all other players of the new player
    socket.broadcast.emit('newPlayer', players[socket.id]);
    // send the ball object to the new player
    socket.emit('ballLocation', { x: self.ball.x, y: self.ball.y });

    socket.on('disconnect', function () {
      console.log('user disconnected');
      // remove player from server
      removePlayer(self, socket.id);
      // remove this player from our players object
      delete players[socket.id];
      // emit a message to all players to remove this player
      io.emit('disconnect', socket.id);
    });

    // when a player moves, update the player data
    socket.on('playerInput', function (inputData) {
      handlePlayerInput(self, socket.id, inputData);
    });
    /*
    socket.on('clicked', function (inputData) {
      if(attachedId == socket.id) handleClick(self, socket.id, inputData)
    });
  */
  });
}

function update() {
  this.players.getChildren().forEach((player) => {
    const input = players[player.playerId].input;
    if (input.left) {
      player.setAngularVelocity(-200);
    } else if (input.right) {
      player.setAngularVelocity(200);
    } else {
      player.setAngularVelocity(0);
    }

    if (input.up) {
      this.physics.velocityFromRotation(player.rotation, 300, player.body.velocity);
    } else if (input.down) {
      this.physics.velocityFromRotation(player.rotation, -300, player.body.velocity);
    } else {
      player.body.velocity.set(0);
    }

    players[player.playerId].x = player.x;
    players[player.playerId].y = player.y;
    players[player.playerId].rotation = player.rotation;
  });
  this.physics.world.wrap(this.players, 5);
  io.emit('playerUpdates', players);
  if(attachedId) {
    this.ball.x = players[attachedId].x
    this.ball.y = players[attachedId].y +20
    //io.emit('ballLocation', {x : players[attachedId].x, y: players[attachedId].y + 20})
  }
}

function randomPosition(max) {
  return Math.floor(Math.random() * max) + 50;
}

function handlePlayerInput(self, playerId, input) {
  self.players.getChildren().forEach((player) => {
    if (playerId === player.playerId) {
      players[player.playerId].input = input;
    }
  });
}
/*
function handleClick(self, playerId, input) {
  self.ball.x = input.x
  self.ball.y = input.y
  io.emit('ballLocation', {x : input.x, y: input.y})
  io.emit('updateCurrentPlayer', '')
  attachedId = null
} */

function addPlayer(self, playerInfo) {
  const player = self.physics.add.image(playerInfo.x, playerInfo.y, 'player').setOrigin(0.5, 0.5).setDisplaySize(56, 76);
  player.setDrag(100);
  player.setAngularDrag(100);
  player.setMaxVelocity(200);
  player.playerId = playerInfo.playerId;
  self.players.add(player);
}

function removePlayer(self, playerId) {
  if(attachedId == playerId) attachedId = null
  self.players.getChildren().forEach((player) => {
    if (playerId === player.playerId) {
      player.destroy();
    }
  });
}

const game = new Phaser.Game(config);
window.gameLoaded();
