// Fill in actors' behavior functions

var actions = {
  act: {
    tank: function() {
      if (this.turnDirection) {
        this.turn(this.turnDirection);
      }
      if (this.gunRotationDirection) {
        this.rotateGun(this.gunRotationDirection);
        if (this.gunRotationSingleStep) {
          this.gunRotationDirection = 0;
          this.gunRotationSingleStep = false;
        }
      }
      if (this.moveDirection) {
        this.move(this.moveDirection);
      }

      if (this.gunCdTimer-- > 0) {
        this.update.shoot = false;
      } else if (this.update.shoot) {
        this.gunCdTimer = this.data.gun.coolDown;
      }

      if (this.mineCdTimer-- > 0) {
        this.update.layMine = false;
      } else if (this.update.layMine) {
        this.mineCdTimer = this.data.mine.coolDown;
      }
    },
    missile: function(game) {
      if (this.lifetime % 5 === 0) {
        var dx = Math.random() * 6 - 3;
        var dy = Math.random() * 6 - 3;
        var dr = Math.random() * Math.PI / 4 - Math.PI / 8;
        game.createActor(
          'fireBall',
          this.x + dx,
          this.y + dy,
          this.r + Math.PI + dr
        );
      }
      actions.move.call(this, 1);
    },
    plasma: function() {
      actions.move.call(this, 1);
    },
    plasmaSmall: function() {
      actions.move.call(this, 1);
    },
    shotgun: function() {
      actions.move.call(this, 1);
    },
    fireBall: function() {
      actions.move.call(this, 1);
    },
    spider: function() {
      actions.move.call(this, 1);
    }
  },
  turnBehavior: {
    turn: function(direction) {
      this.applyTorque(direction);
    },
    strafe: function(direction) {
      this.applySidewaysForce(direction);
    }
  },
  gunRotationBehavior: {
    gunOnly: function(direction) {
      if (direction < 0) {
        this.gunR -= this.rotation;
      } else {
        this.gunR += this.rotation;
      }
      this.update.gunRotation = true;
    },
    both: function(direction) {
      this.applyTorque(direction);
      this.gunR = this.body.GetAngle();
      this.update.gunRotation = true;
    }
  },
  move: function(direction) {
    this.applyForce(direction);
  },
  collide: {
    tank: function(other) {
    },
    missile: function(other) {
      if (other === this.owner) {
        return;
      }
      if (other.health) {
        other.update.health -= this.data.damage;
        this.destroy();
      }
    },
    plasma: function(other) {
      if (other === this.owner) {
        return;
      }
      if (other.health) {
        other.update.health -= this.data.damage;
        this.destroy();
      }
    },
    shotgun: function(other) {
      if (other === this.owner) {
        return;
      }
      if (other.health) {
        other.update.health -= this.data.damage;
        this.destroy();
      }
    },
    explosionMine: function(other, game) {
      if (other === this.owner) {
        return;
      }
      if (other.health && other.data.playable) {
        other.update.health -= this.data.damage;
        game.createActor('mineExplosion', this.x, this.y);
        this.destroy();
      }
    },
    spiderMine: function(other, game) {
      if (other === this.owner || !other.data.playable) {
        return;
      }
      game.createActor('mineExplosion', this.x, this.y);
      game.createActorEx({
        type: 'spider',
        x: this.x,
        y: this.y,
        r: other.r,
        target: other,
        owner: this.owner,
        delay: true
      });
      this.destroy();
    },
    spider: function(other, game) {
      if (other === this.owner) {
        return;
      }
      if (other.health && other.data.playable) {
        other.update.health -= this.data.damage;
        game.createActor('mineExplosion', this.x, this.y);
        this.destroy();
      }
    }
  }
};

module.exports = function(actors) {
  return function setActorBehavior(actor, game) {
    actor.data = actors[actor.type];
    actor.destroy = function() {
      game.removeActorLater(this);
    }
    if (actor.data.baseSpeed) {
      actor.speed = actor.data.baseSpeed;
      actor.rotation = Math.PI / 40;
    }
    if (actor.data.baseHealth) {
      actor.health = actor.data.baseHealth;
    }
    if (actor.data.maxLifetime) {
      actor.lifetime = 0;
    }
    if (actor.data.playable) {
      actor.playable = true;
      actor.act = actions.act.tank;
      actor.collide = actions.collide.tank;
      actor.move = actions.move;
      actor.turn = actions.turnBehavior[actor.data.turnBehavior];
      actor.rotateGun =
        actions.gunRotationBehavior[actor.data.gunRotationBehavior];
      actor.gunRotationSingleStep = false;
      actor.turnDirection = 0;
      actor.gunRotationDirection = 0;
      actor.moveDirection = 0;
      actor.gunCdTimer = 0;
      actor.mineCdTimer = 0;
      actor.update = {
        gunRotation: false,
        shoot: false,
        layMine: false,
        health: 0,
        reset: function() {
          this.gunRotation = false;
          this.shoot = false;
          this.layMine = false;
          this.health = 0;
        }
      };
    } else {
      actor.act = actions.act[actor.type];
      actor.collide = actions.collide[actor.type];
      actor.update = {
        reset: function() {
        }
      };
    }
  };
}
