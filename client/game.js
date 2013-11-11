var game = game || {};
game.start = function(mode) {
  var canvas = document.getElementById('canvas');
  var context = canvas.getContext('2d');
  var socketPort = game.config.port;
  var socket = game.socket = io.connect(
    location.protocol + '//' + location.hostname + ':' + socketPort
  );

  var img = {}, snd = {};
  [].forEach.call($('#images > img'), function(i) {
    img[i.id] = i;
  });
  [].forEach.call($('#sounds > audio'), function(s) {
    snd[s.id] = s;
  });

  var actors = game.actors = [];
  var backgroundImg = 'map3';
  var music = 'elevatorMusic';

  game.playerId = 0;

  game.initInput();

  function drawBackground() {
    context.drawImage(img[backgroundImg], 0, 0);
  }
  function drawActors() {
    for (var i = 0; i < actors.length; ++i) {
      var a = actors[i];
      if (!a || !a.gfx) continue;
      var x = a.x, y = a.y, r = a.r;
      var gfx = a.gfx;
      context.translate(x, y);
      if (a.data.baseHealth) {
        drawHealth(a);
      }
      context.rotate(r);
      context.drawImage(gfx, -gfx.width / 2, -gfx.height / 2);
      if (a.gunR != void 0) {
        var gunGfx = img[a.gunGraphic];
        var gunR = a.gunR;
        context.rotate(gunR - r);
        context.drawImage(gunGfx, -gunGfx.width / 2, -gunGfx.height / 2);
        context.rotate(-gunR);
      } else {
        context.rotate(-r);
      }
      context.translate(-x, -y);
    }
  }
  function drawHealth(actor) {
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
  }

  var _messageTable = {};
  function messageDef(name, handler) {
    _messageTable[name] = handler;
    socket.on(name, handler);
  }
  socket.on('message group', function(data) {
    for (var i = 0; i < data.length; ++i) {
      var fn = _messageTable[data[i].name];
      if (fn) fn(data[i].args);
    }
  });

  messageDef('moveto', function(data) {
    var a = actors[data.index];
    a.x = data.x;
    a.y = data.y;
  });

  messageDef('rotateto', function(data) {
    var a = actors[data.index];
    a.r = data.r;
  });

  messageDef('rotategunto', function(data) {
    var a = actors[data.index];
    a.gunR = data.r;
  });

  messageDef('sethealth', function(data) {
    var a = actors[data.index];
    a.health = data.health;
  });

  if (mode === 'singleplayer') {
    socket.emit('start singleplayer');
  } else if (mode === 'newgame') {
    socket.emit('new multiplayer game', 'game');
  } else if (mode === 'joingame') {
    socket.emit('join multiplayer game', 'game');
    socket.emit('start multiplayer game');
  }
  messageDef('cant start', function() {
    alert('cant start game!');
    // do something
  });

  function initActor(actor) {
    actor.data = actorData[actor.type];
    actor.graphic = actor.data.graphic;
    if (typeof actor.showTo === 'undefined' || actor.showTo === game.playerId) {
      actor.gfx = img[actor.graphic];
    }
    if (actor.data.gunGraphic) {
      actor.gunGraphic = actor.data.gunGraphic;
    }
    if (actor.data.creationSound) {
      var elem = document.getElementById(actor.data.creationSound);
      elem.currentTime = 0;
      elem.play();
    }
    if (actor.data.baseHealth) {
      actor.health = actor.data.baseHealth;
    }
  }

  messageDef('set actors', function(data) {
    actors = game.actors = [];
    for (var i = 0; i < data.length; ++i) {
      initActor(data[i]);
      actors.push(data[i]);
    }
  });

  messageDef('create actor', function(data) {
    actors[data.id] = data;
    initActor(data);
  });

  messageDef('remove actor', function(data) {
    delete actors[data];
  });

  messageDef('set player id', function(data) {
    game.playerId = data;
  });

  messageDef('set background', function(data) {
    backgroundImg = data;
  });

  messageDef('set music', function(data) {
    music = data;
  });

  messageDef('start game', function() {
    //document.getElementById(music).play();
    setInterval(gameLoop, 25);
  });

  var gameLoop = function() {
    game.mousestate.checkRotation();
    drawBackground();
    drawActors();
  };
};
