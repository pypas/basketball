/*
TODO
- Erro da bola (posicao errada quando entra outro jogador)
- Trava quando passa a bola (sera que tem a ver com o evento de clicked?)
- Atualizar imagens
*/

var config = {
  type: Phaser.AUTO,
  parent: 'phaser-example',
  width: 652,
  height: 674,
  scene: {
    preload: preload,
    create: create,
    update: update
  }
};

var playerName = ""

document.querySelector('body').style.cursor = 'crosshair'

var game = new Phaser.Game(config);

function preload() {
  this.load.image('otherPlayer', 'assets/player.png');
  this.load.image('player', 'assets/player.png');
  this.load.image('ball', 'assets/basketball.png');
  this.load.image('quadra', 'assets/court.png');
}

var names = {};
var canClick = true;

function create() {
  var self = this;
  this.socket = io();
  this.players = this.add.group();

  this.add.image(326,337, 'quadra');

  this.topText= this.add.text(10, 5,'',{ font: "12px Arial", fill: "#FFFFFF" });

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
        names[playerId].destroy()
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

          if(Object.keys(names).length > 0) {
            let pid = players[id].playerId
            let name = names[pid]
            if(name) {
              name.setText(players[id].name)
              name.setPosition(players[id].x - 40, players[id].y + 40)
            }
          }
        }
        if(players[id].playerId === self.socket.id) {
          self.topText.setText("Your Name: " + players[id].name);
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
    }
  });

  this.socket.on('updateCurrentPlayer', function (id) {
    self.ball.attachedId = id
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

  if(playerName !== ""){
    this.socket.emit('nameChanged', playerName)
    playerName = ""
  }

  this.input.on('pointerdown', function (pointer) {
        if (pointer.isDown && canClick) {
            this.socket.emit('clicked', {x: pointer.downX, y: pointer.downY});
            canClick = false
        }
    }, this);

  this.input.on('pointerup', function (pointer) {
        canClick = true
    }, this);

  if (left !== this.leftKeyPressed || right !== this.rightKeyPressed || up !== this.upKeyPressed || down !== this.downKeyPressed) {
    this.socket.emit('playerInput', { left: this.leftKeyPressed , right: this.rightKeyPressed, up: this.upKeyPressed, down: this.downKeyPressed });
  }
}

function displayPlayers(self, playerInfo, sprite) {
  const player = self.add.sprite(playerInfo.x, playerInfo.y, sprite).setOrigin(0.5, 0.5).setDisplaySize(56, 76);
  if (playerInfo.team === 'green') player.setTint(0x00ff00);
  else player.setTint(0xE06666);
  names[playerInfo.playerId] = self.add.text(0, 0,'',{ font: "20px Arial", fill: "#FFFFFF" });
  names[playerInfo.playerId].setText(playerInfo.name)
  names[playerInfo.playerId].setPosition(playerInfo.x - 40, playerInfo.y + 40)
  player.playerId = playerInfo.playerId;
  self.players.add(player);
}

function disp_prompt() {
  playerName = prompt("Please enter your name","")
}