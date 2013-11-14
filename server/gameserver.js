var box2d = require('box2dweb-commonjs');

var actorData = require('../client/actors');

var setActorBehavior = require('./actorbehavior')(actorData);

function getLevel(list, number) {
  var name = list[number];
  var level;
  if (name) {
    try {
      level = require('../levels/' + name);
    } catch (e) {
    }
  }
  if (level) {
    return level;
  }
  return {
    background: 'map3',
    music: 'elevatorMusic',
    players: [
      {x: 30, y: 30},
      {x: 500, y: 350}
    ],
    pieces: []
  };
}

// ---------------

function Game(server, name, socket, sockets) {
  this._server = server;
  this._name = name;
  this.socket = socket;
  this.sockets = sockets;
  this.connectedPlayers = 1;
  this.playerCount = 0;
  this.invScale = 10;
  this.scale = 1 / this.invScale;
  this._nextPlayerId = 0;
  this.tankTypes = [];
}

Game.prototype.nextPlayerId = function() {
  return this._nextPlayerId++;
};

Game.prototype.addPlayer = function() {
  ++this.connectedPlayers;
};

Game.prototype.isPlaying = function() {
  return typeof this.interval !== 'undefined';
};

Game.prototype.endGame = function(winner) {
  this.connectedPlayers = 0;
  console.log('destroying game', this._name);
  if (typeof this.interval !== 'undefined') {
    clearInterval(this.interval);
  }
  if (typeof winner === 'undefined') {
    winner = -1;
  }
  this.sendNow('game over', winner);
  this._server.removeGame(this._name);
};

Game.prototype.removePlayer = function() {
  --this.connectedPlayers;
  if (this.connectedPlayers === 0) {
    this.endGame();
  }
};

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

  var self = this;
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
  if (actor.data.force) {
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

var actor_applyBrakeForces = function() {
  throw 'fixme!';
  var body = this.body;
  if (!body) return;
  var velo = body.GetLinearVelocity();
  var angVelo = body.GetAngularVelocity();
  var force = body.m_force;
  var torque = body.m_torque;

  if (angVelo && !torque) {
    if (angVelo < 0) {
      body.ApplyTorque(Math.log(-angVelo + Math.E) * 50);
    } else {
      body.ApplyTorque(-Math.log(angVelo + Math.E) * 50);
    }
  }
};

var _applyForce = function(body, force, swap) {
  if (!body) return;
  var angle = body.GetAngle();
  if (swap) {
    angle += Math.PI / 2;
  }
  var fy = force * Math.sin(angle);
  var fx = force * Math.cos(angle);
  var vec = new box2d.b2Vec2(fx, fy);
  body.ApplyForce(vec, body.GetWorldCenter());
};

var actor_applyForce = function(force) {
  _applyForce(this.body, force * this.data.force, false);
};

var actor_applySidewaysForce = function(force) {
  _applyForce(this.body, force * this.data.force, true);
};

var actor_applyForceTowards = function(target) {
  var fx = target.x - this.x;
  var fy = target.y - this.y;

  var scale = Math.sqrt(fx * fx + fy * fy) / this.data.force;
  if (scale > 1) {
    fx /= scale;
    fy /= scale;
  } else {
    fx *= scale;
    fy *= scale;
  }
  this.body.ApplyForce(new box2d.b2Vec2(fx, fy), this.body.GetWorldCenter());
};

var actor_applyTorque = function(torque) {
  // FIXME
  if (!this.body) return;
  this.body.ApplyTorque(torque*200);
};

Game.prototype.setTankType = function(id, type) {
  if (!actorData[type] || !actorData[type].playable) {
    return;
  }
  this.tankTypes[id] = type;
};

Game.prototype.setLevel = function(level) {
  this.world = new box2d.b2World(new box2d.b2Vec2(0, 0), true);
  this.createWalls();
  this.setCollisionHandler();

  this.background = level.background;
  this.music = level.music;
  this.actors = [];
  var self = this;
  level.players.forEach(function(player, index) {
    var type = self.tankTypes[index] || 'standardTank';
    self.createServerActor(
      type, +player.x, +player.y, 0, 0
    );
    ++self.playerCount;
  });
  level.pieces.forEach(function(actor) {
    self.createServerActor(actor.type, +actor.x, +actor.y, +actor.r);
  });
};

Game.prototype.removeActor = function(actor) {
  if (typeof actor === 'number') {
    actor = this.actors[actor];
  }
  if (!actor) {
    return;
  }
  if (actor.body) {
    this.world.DestroyBody(actor.body);
  }
  if (actor.data.playable) {
    --this.playerCount;
    if (this.playerCount <= 1) {
      var winner = -1;
      this.actors.every(function(a) {
        if (a.data.playable && a !== actor) {
          winner = a.id;
          return false;
        }
        return true;
      });
      this.endGame(winner);
      return;
    }
  }
  delete this.actors[actor.id];
  this.send('remove actor', actor.id);
};

Game.prototype.removeActorLater = function(actor) {
  this._toRemove.push(actor.id);
};

Game.prototype.createServerActor = function(type, x, y, r, gunR, owner) {
  return this.createServerActorEx({
    type: type,
    x: x,
    y: y,
    r: r,
    gunR: gunR,
    owner: owner
  });
};

Game.prototype.createServerActorEx = function(args) {
  var actor = {
    id: this.actors.length,
    type: args.type,
    x: args.x,
    y: args.y,
    r: args.r,
    gunR: args.gunR,
    owner: args.owner,
    showTo: args.showTo,
    target: args.target,
    applyForce: actor_applyForce,
    applyForceTowards: actor_applyForceTowards,
    applySidewaysForce: actor_applySidewaysForce,
    applyTorque: actor_applyTorque,
    applyBrakeForces: actor_applyBrakeForces
  };
  if (args.delay) {
    this._toCreate.push(actor);
    return null;
  } else {
    this.actors.push(actor);
    setActorBehavior(actor, this);
    this.addBody(actor);
    return actor;
  }
};

Game.prototype.createActorEx = function(args) {
  var actor = this.createServerActorEx(args);
  if (actor) {
    this.send('create actor', this.getClientActor(actor));
  }
};

Game.prototype.createActor = function(type, x, y, r, owner) {
  var actor = this.createServerActor(type, x, y, r, void 0, owner);
  this.send('create actor', this.getClientActor(actor));
};

Game.prototype.getClientActor = function(actor) {
  return {
    id: actor.id,
    type: actor.type,
    x: actor.x,
    y: actor.y,
    r: actor.r,
    gunR: actor.gunR,
    showTo: actor.showTo
  };
};

Game.prototype.actorsForSyncing = function() {
  var syncList = [];
  var self = this;
  this.actors.forEach(function(actor) {
    syncList.push(self.getClientActor(actor));
  });
  return syncList;
};

Game.prototype.start = function() {
  var self = this;
  this.interval = setInterval(function() {
    self.startTurn();
    if (self.actors.every(function(actor) {
        return self.act(actor);
      })) {
      self.sync();
      self.endTurn();
    }
  }, 25);
};

Game.prototype.startTurn = function() {
  this.messages = [];
  this._toRemove = [];
  this._toCreate = [];
};

Game.prototype.send = function(name, args) {
  this.messages.push({name: name, args: args});
};

Game.prototype.sendNow = function() {
  var socket = this.socket;
  if (this._socketRoom) {
    socket = this.sockets.to(this._socketRoom);
  }
  socket.emit.apply(socket, arguments);
};

Game.prototype.endTurn = function() {
  var self = this;
  this._toRemove.forEach(function(id) {
    self.removeActor(id);
  });
  this._toCreate.forEach(function(actor) {
    self.createActorEx(actor);
  });
  if (this.messages.length === 1) {
    this.sendNow(this.messages[0].name, this.messages[0].args);
  } else if (this.messages.length > 1) {
    this.sendNow('message group', this.messages);
  }
};

Game.prototype.sync = function() {
  var lists = this.stepAndGetUpdateList();
  var self = this;
  lists.move.forEach(function(id) {
    var actor = self.actors[id];
    self.send('moveto', {
      index: id,
      x: actor.x,
      y: actor.y
    });
  });
  lists.rotate.forEach(function(id) {
    var actor = self.actors[id];
    self.send('rotateto', {
      index: id,
      r: actor.r
    });
    if (actor.data.syncGunRotation) {
      actor.gunR = actor.r;
      self.send('rotategunto', {
        index: id,
        r: actor.gunR
      });
    }
  });
};

Game.prototype.act = function(actor) {
  var socket = this.socket;
  if (actor.freezeTime) {
    --actor.freezeTime;
  } else {
    if (actor.act) actor.act();
  }
  //actor.applyBrakeForces();
  if (typeof actor.lifetime !== 'undefined') {
    ++actor.lifetime;
    if (actor.data.maxLifetime === -1) {
    } else if (actor.lifetime > actor.data.maxLifetime) {
      this.removeActor(actor);
    }
  }
  if (actor.update.health) {
    actor.health += actor.update.health;
    if (actor.health <= 0) {
      this.removeActor(actor);
    } else {
      this.send('sethealth', {
        index: actor.id,
        health: actor.health
      });
    }
  }
  // if the game ended, this.actors is null.
  if (!this.actors) {
    return false;
  }
  if (!this.actors[actor.id]) {
    return true;
  }
  if (actor.update.position) {
    this.send('moveto', {
      index: actor.id,
      x: actor.x,
      y: actor.y
    });
  }
  if (actor.update.gunRotation) {
    this.send('rotategunto', {
      index: actor.id,
      r: actor.gunR
    });
  }
  if (actor.update.shoot) {
    if (actor.data.gun.rounds) {
      (function(spread, actor, self) {
        var times = actor.data.gun.rounds;
        var deltaAngle = spread / (times + 1);
        var angle = actor.gunR - spread / 2 + deltaAngle;
        var xoffset = actor.data.size.width / 2;
        var yoffset = actor.data.size.height / 2;
        for (var i = 0; i < times; ++i) {
          self.createActor(
            actor.data.gun.type, 
            actor.x + xoffset * Math.cos(angle),
            actor.y + yoffset * Math.sin(angle),
            angle,
            actor
          );
          angle += deltaAngle;
        }
      })(Math.PI / 4, actor, this);
    } else {
      this.createActor(
        actor.data.gun.type, 
        actor.x + actor.data.size.width / 2 * Math.cos(actor.gunR),
        actor.y + actor.data.size.height / 2 * Math.sin(actor.gunR),
        actor.gunR,
        actor
      );
    }
  }
  if (actor.update.layMine) {
    this.createActorEx({
      type: actor.data.mine.type,
      x: actor.x,
      y: actor.y,
      owner: actor,
      showTo: actor.id
    });
  }
  actor.update.reset();

  return true;
};

function GameServer() {
  this._games = {};
  this._singlePlayerId = 0;
  this._gameCount = 0;
  this._exitAfterGamesFinished = false;
  this._maxGames = 0;
}

GameServer.prototype.setExitAfterGamesFinished = function(exit) {
  this._exitAfterGamesFinished = exit;
};

GameServer.prototype.setMaxGames = function(maxGames) {
  this._maxGames = maxGames;
};

GameServer.prototype.canStartGame = function() {
  return this._gameCount < this._maxGames;
};

GameServer.prototype.hasGame = function(name) {
  return !!this._games['g:' + name];
};

GameServer.prototype.getGame = function(name) {
  var game = this._games['g:' + name];
  return game;
};

/**
 * Creates a new game with the given name if it doesn't already exist.
 * If the new game was created, it is returned. If no name is specified,
 * a single player game with a unique id is created.
 */
GameServer.prototype.newGame = function(name, sockets) {
  if (!this.canStartGame()) {
    return null;
  }
  var socket = null;
  if (typeof name !== 'string') {
    socket = name;
    name = null;
  }
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
  game = new Game(this, name, socket, sockets);
  this._games[name] = game;
  ++this._gameCount;
  return game;
};

/**
 * Should only be called by Game.removePlayer when the player count
 * reaches zero.
 */
GameServer.prototype.removeGame = function(name) {
  delete this._games[name];
  --this._gameCount;
  if (this._gameCount === 0 && this._exitAfterGamesFinished) {
    process.exit();
  }
};

var server = new GameServer();

function setupSocketForGame(socket, game) {
  socket.game = game;
  socket.playerId = game.nextPlayerId();

  socket.emit('set player id', socket.playerId);

  // Not for production
  socket.on('change id', function(data) {
    socket.playerId = data;
  });

  socket.on('disconnect', function() {
    socket.game.removePlayer();
  });

  socket.on('move', function(data) {
    if (!this.game || !this.game.actors) return;
    var player = this.game.actors[this.playerId];
    if (!player || !player.playable) return;
    player.moveDirection = data;
  });

  socket.on('stopmove', function() {
    if (!this.game || !this.game.actors) return;
    var player = this.game.actors[this.playerId];
    if (!player || !player.playable) return;
    player.moveDirection = 0;
  });

  socket.on('rotate', function(data) {
    if (!this.game || !this.game.actors) return;
    var player = this.game.actors[this.playerId];
    if (!player || !player.playable) return;
    player.turnDirection = data;
  });

  socket.on('stoprotate', function() {
    if (!this.game || !this.game.actors) return;
    var player = this.game.actors[this.playerId];
    if (!player || !player.playable) return;
    player.turnDirection = 0;
  });

  socket.on('rotategun', function(data) {
    if (!this.game || !this.game.actors) return;
    var player = this.game.actors[this.playerId];
    if (!player || !player.playable) return;
    player.gunRotationDirection = data;
  });

  socket.on('stoprotategun', function() {
    if (!this.game || !this.game.actors) return;
    var player = this.game.actors[this.playerId];
    if (!player || !player.playable) return;
    player.gunRotationDirection = 0;
  });

  socket.on('rotategunstep', function(data) {
    if (!this.game || !this.game.actors) return;
    var player = this.game.actors[this.playerId];
    if (!player || !player.playable) return;
    player.gunRotationDirection = data;
    player.gunRotationSingleStep = true;
  });

  socket.on('fire', function() {
    if (!this.game || !this.game.actors) return;
    var player = this.game.actors[this.playerId];
    if (!player || !player.playable) return;
    player.update.shoot = true;
  });

  socket.on('mine', function() {
    if (!this.game || !this.game.actors) return;
    var player = this.game.actors[this.playerId];
    if (!player || !player.playable) return;
    player.update.layMine = true;
  });

  socket.on('send chat', function(text) {
    this.game.sendNow('get chat', this.playerId + 1, text);
  });
}

function sendGameSetup(game) {
  game.sendNow('set background', game.background);
  game.sendNow('set music', game.music);
  game.sendNow('set actors', game.actorsForSyncing());
}

module.exports = {
  use: function(config, io, levelList) {
    io.sockets.on('connection', function(socket) {
      socket.on('start singleplayer', function(tank, level) {
        var game = server.newGame(socket, io.sockets);
        if (!game) {
          socket.emit('cant start', 'failed to create game');
          socket.disconnect();
          return;
        }

        setupSocketForGame(socket, game);
        game.setTankType(socket.playerId, tank);
        game.setLevel(getLevel(levelList, level));
        sendGameSetup(game);
        game.start();
        game.sendNow('start game');
      });

      socket.on('new multiplayer game', function(name, level, tank) {
        if (server.hasGame(name)) {
          socket.emit('cant start', 'game already exists');
          socket.disconnect();
          return;
        }

        var game = server.newGame(name, io.sockets);
        if (!game) {
          socket.emit('cant start', 'failed to create game');
          socket.disconnect();
          return;
        }

        setupSocketForGame(socket, game);
        game.setTankType(socket.playerId, tank);
        game._level_ = getLevel(levelList, level);
        socket.join('g:' + name);
        game._socketRoom = 'g:' + name;
      });

      socket.on('join multiplayer game', function(name, tank) {
        var game = server.getGame(name);
        if (!game) {
          socket.emit('cant start', 'game does not exist');
          socket.disconnect();
          return;
        }
        if (typeof game.interval !== 'undefined') {
          socket.emit('cant start', 'game is already in progress');
          socket.disconnect();
          return;
        }

        game.addPlayer();
        setupSocketForGame(socket, game);
        game.setTankType(socket.playerId, tank);
        socket.join('g:' + name);
        game._socketRoom = 'g:' + name;
        game.sendNow('update connected players', game.connectedPlayers);
      });

      socket.on('start multiplayer game', function() {
        var game = socket.game;
        if (!game || typeof game.interval !== 'undefined') return;
        if (game.connectedPlayers < game._level_.players.length) {
          game._level_.players.length = game.connectedPlayers;
        }
        game.setLevel(game._level_);
        sendGameSetup(game);
        game.start();
        game.sendNow('start game');
      });
    });
  },
  server: server
};
