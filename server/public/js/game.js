var config = {
  type: Phaser.AUTO,
  parent: 'phaser-example',
  width: 674,
  height: 652,
  scene: {
    preload: preload,
    create: create,
    update: update
  }
};

//https://www.html5gamedevs.com/topic/17808-sprite-picking-up-another-sprite/

document.querySelector('body').style.cursor = 'crosshair'

var game = new Phaser.Game(config);

function preload() {
  this.load.image('otherPlayer', 'assets/player.png');
  this.load.image('player', 'assets/player.png');
  this.load.image('ball', 'assets/basketball.png');
  this.load.image('quadra', 'assets/court.png');
}

function create() {
  var self = this;
  this.socket = io();
  this.players = this.add.group();

  this.add.image(337, 326, 'quadra');

  this.blueScoreText = this.add.text(25, 25, '', { fontSize: '32px', fill: '#FFFFFF' });

  this.socket.on('currentPlayers', function (players) {
    Object.keys(players).forEach(function (id) {
      if (players[id].playerId === self.socket.id) {
        displayPlayers(self, players[id], 'player');
      } else {
        displayPlayers(self, players[id], 'otherPlayer');
      }
    });
  });

  this.socket.on('newPlayer', function (playerInfo) {
    displayPlayers(self, playerInfo, 'otherPlayer');
  });

  this.socket.on('disconnect', function (playerId) {
    self.players.getChildren().forEach(function (player) {
      if(playerId === self.ball.attachedId) self.ball.attachedId = null
      if (playerId === player.playerId) {
        player.destroy();
      }
    });
  });

  this.socket.on('playerUpdates', function (players) {
    Object.keys(players).forEach(function (id) {
      self.players.getChildren().forEach(function (player) {
        if (players[id].playerId === player.playerId) {
          player.setRotation(players[id].rotation);
          player.setPosition(players[id].x, players[id].y);
          if(self.ball.attachedId === player.playerId) {
            self.ball.setPosition(players[id].x, players[id].y);  
          }
        }
      });
    });
  });

  this.socket.on('ballLocation', function (ballLocation) {
    if (!self.ball) {
      self.ball = self.add.sprite(ballLocation.x, ballLocation.y, 'ball');
      self.ball.attachedId = null
    } else {
      self.ball.setPosition(ballLocation.x, ballLocation.y);
      self.ball.attachedId = null
    }
  });

  this.socket.on('updateCurrentPlayer', function (player) {
    console.log(player.id)
    self.ball.attachedId = player.id
    self.blueScoreText.setText(player.name);
  });

  this.cursors = this.input.keyboard.createCursorKeys();
  this.leftKeyPressed = false;
  this.rightKeyPressed = false;
  this.upKeyPressed = false;
  this.downKeyPressed = false;
}

function update() {
  const left = this.leftKeyPressed;
  const right = this.rightKeyPressed;
  const up = this.upKeyPressed;
  const down = this.downKeyPressed;

  if (this.cursors.left.isDown) {
    this.leftKeyPressed = true;
  } else if (this.cursors.right.isDown) {
    this.rightKeyPressed = true;
  } else {
    this.leftKeyPressed = false;
    this.rightKeyPressed = false;
  }

  if (this.cursors.up.isDown) {
    this.upKeyPressed = true;
  } else if (this.cursors.down.isDown) {
    this.downKeyPressed = true;
  } else {
    this.downKeyPressed = false;
    this.upKeyPressed = false;
  }

  this.input.on('pointerdown', function (pointer) {
        if (pointer.isDown) {
            this.socket.emit('clicked', {x: pointer.downX, y: pointer.downY});
        }
    }, this);

  if (left !== this.leftKeyPressed || right !== this.rightKeyPressed || up !== this.upKeyPressed || down !== this.downKeyPressed) {
    this.socket.emit('playerInput', { left: this.leftKeyPressed , right: this.rightKeyPressed, up: this.upKeyPressed, down: this.downKeyPressed });
  }
}

function displayPlayers(self, playerInfo, sprite) {
  const player = self.add.sprite(playerInfo.x, playerInfo.y, sprite).setOrigin(0.5, 0.5).setDisplaySize(56, 76);
  if (playerInfo.team === 'green') player.setTint(0x00ff00);
  else player.setTint(0xE06666);
  player.playerId = playerInfo.playerId;
  self.players.add(player);
}
