const players = {};
var bola;
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
  this.load.image('bola', 'assets/basketball.png');
  
}

function create() {
  const self = this;
  this.players = this.physics.add.group();
  this.bola = this.physics.add.image(randomPosition(700), randomPosition(500), 'bola');
  this.scores = {
    green: 0,
    red: 0
  };
  //container.setSize(128, 64);
    //  A Container has a default size of 0x0, so we need to give it a size before enabling a physics
    //  body or it'll be given the default body size of 64x64.
    /*self.container.setSize(128, 64)

    this.physics.world.enable(self.container);

    self.container.body.setVelocity(100, 200).setBounce(1, 1).setCollideWorldBounds(true);;*/

  this.physics.add.overlap(this.players, this.bola, function (bola, player) {
    //self.bola.setPosition(randomPosition(700), randomPosition(500));
    //io.emit('bolaLocation', { x: self.bola.x, y: self.bola.y });
    io.emit('bolaAttached', player.playerId)
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
      team: (Math.floor(Math.random() * 2) == 0) ? 'red' : 'green',
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
    // send the bola object to the new player
    socket.emit('bolaLocation', { x: self.bola.x, y: self.bola.y });

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

    // when a player moves, update the player data
    socket.on('attachedBall', function (inputData) {
      handleAttachedBall(self, socket.id, inputData);
    });
  });
}

function update() {
  this.players.getChildren().forEach((player) => {
    const input = players[player.playerId].input;
    if (input.left) {
      player.setAngularVelocity(-300);
    } else if (input.right) {
      player.setAngularVelocity(300);
    } else {
      player.setAngularVelocity(0);
    }

    if (input.up) {
      this.physics.velocityFromRotation(player.rotation, 200, player.body.velocity);
    } else if (input.down) {
      this.physics.velocityFromRotation(player.rotation, -200, player.body.velocity);
    } else {
      player.body.velocity.set(0);
    }

    if(input.clicked) {
      console.log("Clicked")
      /*self.physics.arcade.moveToPointer(this.bola, 200)
      if(this.bolas.countDead() > 0) {
        var bola = this.bolas.getFirstDead()
        bola.reset(player.x, player.y)
        this.physics.arcade.moveToPointer(bola, 200)
        nextFire = this.time.now + 100
      }*/
    }

    players[player.playerId].x = player.x;
    players[player.playerId].y = player.y;
    players[player.playerId].rotation = player.rotation;
  });
  this.physics.world.wrap(this.players, 5);
  io.emit('playerUpdates', players);
  if(this.attached) io.emit('bolaLocation', {x : players[this.attached].x, y: players[this.attached].y + 20})
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

function handleAttachedBall(self, playerId, input) {
  self.attached = input
}

function addPlayer(self, playerInfo) {
  const player = self.physics.add.image(playerInfo.x, playerInfo.y, 'player').setOrigin(0.5, 0.5).setDisplaySize(56, 76);
  player.setDrag(100);
  player.setAngularDrag(100);
  player.setMaxVelocity(200);
  player.playerId = playerInfo.playerId;
  self.players.add(player);
}

function removePlayer(self, playerId) {
  self.players.getChildren().forEach((player) => {
    if (playerId === player.playerId) {
      player.destroy();
    }
  });
}

const game = new Phaser.Game(config);
window.gameLoaded();
