var box2d = require('box2dweb-commonjs');

var actorData = require('../client/actors');

var setActorBehavior = require('./actorbehavior')(actorData);

//var level = require('../levels/Then we will fight in the shade');
var level = require('../levels/PlainMap');
//var level = require('../levels/FirstMap');

// ---------------

function Game() {
  this.socket = null;
  this.invScale = 10;
  this.scale = 1 / this.invScale;
  /*this.setLevel({
    background: 'map3',
    music: 'elevatorMusic',
    players: [
      {x: 30, y:30},
      {x: 600, y: 400},
      {x: 200, y: 200}
    ],
    pieces: []
  });*/
}

Game.prototype.createWalls = function() {
  var width = 800 * this.scale;
  var height = 600 * this.scale;
  var vs = [
    new box2d.b2Vec2(0, 0),
    new box2d.b2Vec2(width, 0),
    new box2d.b2Vec2(width, height),
    new box2d.b2Vec2(0, height)
  ];

  for (var i = 0; i < vs.length; ++i) {
    var v1 = vs[i];
    var v2 = vs[(i + 1) % 4];
    var bodyDef = new box2d.b2BodyDef;
    bodyDef.fixedRotation = true;
    bodyDef.type = box2d.b2Body.b2_staticBody;

    var fixDef = new box2d.b2FixtureDef;
    fixDef.restitution = 1;
    fixDef.shape = new box2d.b2PolygonShape;
    fixDef.shape.SetAsEdge(v1, v2);

    this.world.CreateBody(bodyDef).CreateFixture(fixDef);
  }
};

Game.prototype.setCollisionHandler = function() {
  var listener = new box2d.Box2D.Dynamics.b2ContactListener();

  listener.BeginContact = function(contact) {
    var actorA = contact.GetFixtureA().GetBody().GetUserData();
    var actorB = contact.GetFixtureB().GetBody().GetUserData();

    if (!actorA || !actorB) {
      return;
    }
    
    if (actorA.collide) {
      actorA.collide(actorB);
    }
    if (actorB.collide) {
      actorB.collide(actorA);
    }
  };

  this.world.SetContactListener(listener);
};

Game.prototype.addBody = function(actor) {
  if (!actor.data.collidable) {
    return;
  }

  var size = actor.data.size;
  if (!size) {
    console.log('warning: don\'t have size for:', actor.type);
    size = {width: 20, height: 20};
  }
  var width = size.width * this.scale;
  var height = size.height * this.scale;

  var bodyDef = new box2d.b2BodyDef();
  bodyDef.userData = actor;
  bodyDef.linearDamping = 3;
  bodyDef.angularDamping = 3;
  if (actor.data.baseSpeed) {
    bodyDef.fixedRotation = false;
    bodyDef.type = box2d.b2Body.b2_dynamicBody;
  } else {
    bodyDef.fixedRotation = true;
    bodyDef.type = box2d.b2Body.b2_staticBody;
  }
  bodyDef.position.x = actor.x * this.scale;
  bodyDef.position.y = actor.y * this.scale;
  bodyDef.angle = actor.r || 0;

  var fixDef = new box2d.b2FixtureDef();
  if (actor.data.obstacle) {
    fixDef.density = 1;
    fixDef.friction = 0;
    fixDef.restitution = 1;
  } else {
    fixDef.isSensor = true;
  }
  fixDef.shape = new box2d.b2PolygonShape();
  fixDef.shape.SetAsBox(width / 2, height / 2);

  actor.body = this.world.CreateBody(bodyDef);
  actor.body.CreateFixture(fixDef);
};

Game.prototype.stepAndGetUpdateList = function() {
  this.world.Step(1/30, 6, 2);
  this.world.ClearForces();
  var self = this;
  var movelist = [];
  var rotatelist = [];
  this.actors.forEach(function(actor) {
    if (!actor.body) return;
    var pos = actor.body.GetPosition();
    var x = pos.x * self.invScale;
    var y = pos.y * self.invScale;
    var r = actor.body.GetAngle();
    if (actor.r !== void 0 && r !== actor.r) {
      actor.r = r;
      rotatelist.push(actor.id);
    }
    if (x !== actor.x || y !== actor.y) {
      actor.x = x;
      actor.y = y;
      movelist.push(actor.id);
    }
  });

  return {move: movelist, rotate: rotatelist};
};

var _applyForce = function(body, force, swap) {
  if (!body) return;
  var angle = body.GetAngle();
  var fy = force * Math.sin(angle);
  var fx = force * Math.cos(angle);
  var vec;
  if (swap) {
    vec = new box2d.b2Vec2(fy, fx);
  } else {
    vec = new box2d.b2Vec2(fx, fy);
  }
  body.ApplyForce(vec, body.GetWorldCenter());
};

var actor_applyForce = function(force) {
  _applyForce(this.body, force * this.data.force, false);
};

var actor_applySidewaysForce = function(force) {
  _applyForce(this.body, force * this.data.force, true);
};

var actor_applyTorque = function(torque) {
  // FIXME
  if (!this.body) return;
  this.body.ApplyTorque(torque*200);
};

Game.prototype.setLevel = function(level) {
  this.world = new box2d.b2World(new box2d.b2Vec2(0, 0), true);
  this.createWalls();
  this.setCollisionHandler();

  this.background = level.background;
  this.music = level.music;
  this.actors = [];
  level.players[0].type = 'standardTank';
  level.players[1].type = 'heavyTank';
  level.players[2].type = 'hoverTank';
  level.players[3].type = 'hoverTank';
  var self = this;
  level.players.forEach(function(player) {
    self.createServerActor(
      player.type, +player.x, +player.y, 0, 0
    );
  });
  level.pieces.forEach(function(actor) {
    self.createServerActor(actor.type, +actor.x, +actor.y, +actor.r);
  });
};

Game.prototype.removeActor = function(actor) {
  if (typeof actor !== 'number') {
    actor = actor.id;
  }
  if (this.actors[actor] && this.actors[actor].body) {
    this.world.DestroyBody(this.actors[actor].body);
  }
  delete this.actors[actor];
  this.send('remove actor', actor);
};

Game.prototype.removeActorLater = function(actor) {
  this._toRemove.push(actor.id);
};

Game.prototype.createServerActor = function(type, x, y, r, gunR, owner) {
  var actor = {
    id: this.actors.length,
    type: type,
    x: x,
    y: y,
    applyForce: actor_applyForce,
    applySidewaysForce: actor_applySidewaysForce,
    applyTorque: actor_applyTorque
  };
  if (r !== void 0) actor.r = r;
  if (gunR !== void 0) actor.gunR = gunR;
  if (owner) actor.owner = owner;
  this.actors.push(actor);
  setActorBehavior(actor, this);
  this.addBody(actor);
  return actor;
};

Game.prototype.createActor = function(type, x, y, r, owner) {
  var actor = this.createServerActor(type, x, y, r, void 0, owner);
  this.send('create actor', this.getClientActor(actor));
};

Game.prototype.getClientActor = function(actor) {
  var a = {
    id: actor.id,
    type: actor.type,
    x: actor.x,
    y: actor.y
  };
  if (actor.r != void 0) {
    a.r = actor.r;
    if (actor.gunR != void 0) {
      a.gunR = actor.gunR;
    }
  }
  return a;
};

Game.prototype.actorsForSyncing = function() {
  var syncList = [];
  var self = this;
  this.actors.forEach(function(actor) {
    syncList.push(self.getClientActor(actor));
  });
  return syncList;
};

Game.prototype.start = function(socket) {
  this.socket = socket;
  var self = this;
  setInterval(function() {
    self.startTurn();
    self.actors.forEach(function(actor) {
      if (actor.act) self.act(actor);
    });
    self.sync();
    self.endTurn();
  }, 25);
};

Game.prototype.startTurn = function() {
  this.messages = [];
  this._toRemove = [];
};

Game.prototype.send = function(name, args) {
  this.messages.push({name: name, args: args});
};

Game.prototype.endTurn = function() {
  if (this.messages.length === 1) {
    this.socket.emit(this.messages[0].name, this.messages[0].args);
  } else if (this.messages.length > 1) {
    this.socket.emit('message group', this.messages);
  }
  var self = this;
  this._toRemove.forEach(function(id) {
    self.removeActor(id);
  });
};

Game.prototype.sync = function() {
  var lists = this.stepAndGetUpdateList();
  var self = this;
  lists.move.forEach(function(id) {
    self.send('moveto', {
      index: id,
      x: self.actors[id].x,
      y: self.actors[id].y
    });
  });
  lists.rotate.forEach(function(id) {
    self.send('rotateto', {
      index: id,
      r: self.actors[id].r
    });
  });
};

Game.prototype.act = function(actor) {
  var socket = this.socket;
  actor.act(this);
  if (actor.data.maxLifetime) {
    if (++actor.lifetime > actor.data.maxLifetime) {
      this.removeActor(actor);
    }
  }
  if (!this.actors[actor.id]) {
    return;
  }
  if (actor.update.gunRotation) {
    this.send('rotategunto', {
      index: actor.id,
      r: actor.gunR
    });
  }
  if (actor.update.shoot) {
    this.createActor(actor.data.gun.type, actor.x, actor.y, actor.gunR, actor);
  }
  if (actor.update.layMine) {
    this.createActor(actor.data.mine.type, actor.x, actor.y, 0, actor);
  }
  if (actor.update.health) {
    actor.health += actor.update.health;
    this.send('sethealth', {
      index: actor.id,
      health: actor.health
    });
  }
  actor.update.reset();
};

function GameServer() {
  this._games = {};
  this._singlePlayerId = 0;
}

GameServer.prototype.hasGame = function(name) {
  return !!this._games['g:' + name];
};

GameServer.prototype.getGame = function(name, password) {
  var game = this._games['g:' + name];
  if (!game || game.password !== password) {
    return null;
  }
  return game;
};

/**
 * Creates a new game with the given name if it doesn't already exist.
 * If the new game was created, it is returned. If no name is specified,
 * a single player game with a unique id is created.
 */
GameServer.prototype.newGame = function(name) {
  if (name) {
    name = 'g:' + name;
  } else {
    name = 's:' + this._singlePlayerId;
    ++this._singlePlayerId;
  }
  var game = this._games[name];
  if (game) {
    return null;
  }
  return this._games[name] = new Game();
};

var server = new GameServer();

function setupSocketForGame(socket) {
  // Not for production
  socket.on('change id', function(data) {
    socket.playerId = data;
  });

  socket.on('move', function(data) {
    var player = this.game.actors[this.playerId];
    if (!player || !player.playable) return;
    player.moveDirection = data;
  });

  socket.on('stopmove', function() {
    var player = this.game.actors[this.playerId];
    if (!player || !player.playable) return;
    player.moveDirection = 0;
  });

  socket.on('rotate', function(data) {
    var player = this.game.actors[this.playerId];
    if (!player || !player.playable) return;
    player.turnDirection = data;
  });

  socket.on('stoprotate', function() {
    var player = this.game.actors[this.playerId];
    if (!player || !player.playable) return;
    player.turnDirection = 0;
  });

  socket.on('rotategun', function(data) {
    var player = this.game.actors[this.playerId];
    if (!player || !player.playable) return;
    player.gunRotationDirection = data;
  });

  socket.on('stoprotategun', function() {
    var player = this.game.actors[this.playerId];
    if (!player || !player.playable) return;
    player.gunRotationDirection = 0;
  });

  socket.on('rotategunstep', function(data) {
    var player = this.game.actors[this.playerId];
    if (!player || !player.playable) return;
    player.gunRotationDirection = data;
    player.gunRotationSingleStep = true;
  });

  socket.on('fire', function() {
    var player = this.game.actors[this.playerId];
    if (!player || !player.playable) return;
    player.update.shoot = true;
  });

  socket.on('mine', function() {
    var player = this.game.actors[this.playerId];
    if (!player || !player.playable) return;
    player.update.layMine = true;
  });
}

module.exports = {
  use: function(io) {
    io.sockets.on('connection', function(socket) {
      socket.on('start singleplayer', function(data) {
        var game = server.newGame();
        socket.game = game;
        game.setLevel(level);
        socket.playerId = 0;
        if (!socket.game) {
          socket.emit('cant start');
          socket.disconnect();
          return;
        }

        socket.emit('set background', socket.game.background);
        socket.emit('set music', socket.game.music);
        socket.emit('set actors', socket.game.actorsForSyncing());
        socket.emit('set player id', socket.playerId);

        setupSocketForGame(socket);
        game.start(socket);
        socket.emit('start game');
      });
    });
  },
  server: server
};