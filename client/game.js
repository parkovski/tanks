var game = game || {};
(function() {
  game.draw = function() {
    var context = this.context;
    var actors = this.actors;

    var drawHealth = function(actor) {
      var baseHealth = actor.data.baseHealth;
      var percentHealth = actor.health / baseHealth;
      var yoffset = actor.gfx.height / 2 + 20;
      var width = actor.gfx.width * 1.5;
      var height = 6;
      var xoffset = width / 2;
      var redwidth = (1 - percentHealth) * width;
      context.translate(-xoffset, -yoffset);
      context.fillStyle = '#00ff00';
      context.fillRect(0, 0, width, height);
      context.fillStyle = '#ff0000';
      context.fillRect(width - redwidth, 0, redwidth, height);
      context.strokeStyle = '#000';
      context.strokeRect(0, 0, width, height);
      context.translate(xoffset, yoffset);
    };

    context.drawImage(this.images[this.backgroundImg], 0, 0);
    for (var i = 0; i < actors.length; ++i) {
      var a = actors[i];
      if (!a || !a.gfx) continue;
      var x = a.x, y = a.y, r = a.r;
      var gfx = a.gfx;
      context.translate(x, y);
      if (a.data.playable) {
        drawHealth(a);
      }
      context.rotate(r);
      context.drawImage(gfx, -gfx.width / 2, -gfx.height / 2);
      if (a.gunR != void 0) {
        var gunGfx = this.images[a.gunGraphic];
        var gunR = a.gunR;
        context.rotate(gunR - r);
        context.drawImage(gunGfx, -gunGfx.width / 2, -gunGfx.height / 2);
        context.rotate(-gunR);
      } else {
        context.rotate(-r);
      }
      context.translate(-x, -y);
    }
  };

  game.drawFinishScreen = function(win) {
    var name;
    if (win) {
      name = 'youWin';
    } else {
      name = 'youLose';
    }
    context.drawImage(this.images[name], 0, 0);
  };

  game.initActor = function(actor) {
    actor.data = actorData[actor.type];
    actor.graphic = actor.data.graphic;
    if (typeof actor.showTo === 'undefined' || actor.showTo === game.playerId) {
      actor.gfx = game.images[actor.graphic];
    }
    if (actor.data.gunGraphic) {
      actor.gunGraphic = actor.data.gunGraphic;
    }
    if (actor.data.creationSound && game.playSounds) {
      var elem = game.sounds[actor.data.creationSound];
      elem.currentTime = 0;
      elem.play();
    }
    if (actor.data.baseHealth) {
      actor.health = actor.data.baseHealth;
    }
  };

  game.initGame = function(mode) {
    // Choose the type of game to start based on the URL.
    // singleplayer/tank/level
    // new/gamename/tank/level
    // join/gamename/tank
    var args = location.pathname.split('/');
    args = args.slice(game.config.root.split('/').length - 1);
    if (mode === 'singleplayer') {
      this.socket.emit('start singleplayer', args[1], args[2]);
    } else if (mode === 'newgame') {
      this.socket.emit('new multiplayer game', args[1], args[3] || 0, args[2]);
    } else if (mode === 'joingame') {
      this.socket.emit('join multiplayer game', args[1], args[2]);
    }

    $('#startGame').click(function() {
      game.socket.emit('start multiplayer game');
    });

    $('#endGame').click(function() {
      game.socket.emit('stop game');
    });
  };

  game.mainLoop = function() {
    game.mousestate.checkRotation();
    game.draw();
  };

  game.start = function(mode) {
    var socketPort = this.config.port;
    this.socket = io.connect(
      location.protocol + '//' + location.hostname + ':' + socketPort,
      {'sync disconnect on unload': true}
    );

    var canvas = document.getElementById('canvas');
    this.context = canvas.getContext('2d');

    this.images = {};
    this.sounds = {};
    [].forEach.call($('#images > img'), function(i) {
      game.images[i.id] = i;
    });
    [].forEach.call($('#sounds > audio'), function(s) {
      game.sounds[s.id] = s;
    });

    this.actors = [];
    this.backgroundImg = 'map3';
    this.music = 'elevatorMusic';
    $('#toggleMusic').change(function() {
      var elem = game.sounds[music];
      if ($(this).is(':checked')) {
        elem.loop = true;
        elem.play();
      } else {
        elem.pause();
      }
    });

    this.playSounds = true;
    $('#toggleSounds').change(function() {
      game.playSounds = $(this).is(':checked');
    });

    this.playerId = 0;

    this.initInput();
    this.initMessages();
    this.initGame(mode);
  };
})();
