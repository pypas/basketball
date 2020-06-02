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

document.querySelector('body').style.cursor = 'crosshair'

var game = new Phaser.Game(config);

function preload() {
  this.load.image('otherPlayer', 'assets/player.png');
  this.load.image('player', 'assets/player.png');
  this.load.image('bola', 'assets/basketball.png');
  this.load.image('quadra', 'assets/court.png');
}

function create() {
  var self = this;
  this.socket = io();
  this.players = this.add.group();

  this.add.image(337, 326, 'quadra');
  
  this.greenScoreText = this.add.text(16, 25, '', { fontSize: '32px', fill: '#00FF00' });
  this.redScoreText = this.add.text(16, 600, '', { fontSize: '32px', fill: '#E06666' });

  // TODO remove
  /*
  var sprite0 = self.add.sprite(0, 0, 'bola');
  var sprite1 = self.add.sprite(-100, -100, 'bola');

  var container = self.add.container(400, 300);
  container.add(sprite0);
  container.add(sprite1);
  // END TODO*/

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
        }
      });
    });
  });

  this.socket.on('updateScore', function (scores) {
    self.greenScoreText.setText('green: ' + scores.green);
    self.redScoreText.setText('red: ' + scores.red);
  });

  this.socket.on('bolaLocation', function (bolaLocation) {
    if (!self.bola) {
      self.bola = self.add.image(bolaLocation.x, bolaLocation.y, 'bola');
    } else {
      self.bola.setPosition(bolaLocation.x, bolaLocation.y);
    }
  });

  this.cursors = this.input.keyboard.createCursorKeys();
  this.leftKeyPressed = false;
  this.rightKeyPressed = false;
  this.upKeyPressed = false;
  this.downKeyPressed = false;
  this.clicked = false
}

function update() {
  const left = this.leftKeyPressed;
  const right = this.rightKeyPressed;
  const up = this.upKeyPressed;
  const down = this.downKeyPressed;
  const clicked = this.clicked

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

  if(this.input.activePointer.isDown) {
    this.clicked = true
  } else {
    this.clicked = false
  }

  if (left !== this.leftKeyPressed || right !== this.rightKeyPressed || up !== this.upKeyPressed || down !== this.downKeyPressed || clicked !== this.clicked) {
    this.socket.emit('playerInput', { left: this.leftKeyPressed , right: this.rightKeyPressed, up: this.upKeyPressed, down: this.downKeyPressed, clicked: this.clicked });
  }
}

function displayPlayers(self, playerInfo, sprite) {
  const player = self.add.sprite(playerInfo.x, playerInfo.y, sprite).setOrigin(0.5, 0.5).setDisplaySize(56, 76);
  if (playerInfo.team === 'green') player.setTint(0x00ff00);
  else player.setTint(0xE06666);
  player.playerId = playerInfo.playerId;
  self.players.add(player);
}
