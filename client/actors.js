var actorData = {
  standardTank: {
    playable: true,
    graphic: 'standardTank',
    gunGraphic: 'standardGun',
    collidable: true,
    obstacle: true,
    turnBehavior: 'turn',
    gunRotationBehavior: 'gunOnly',
    baseHealth: 25000,
    baseSpeed: 3,
    reverseFactor: 0.85,
    mine: {
      type: 'explosionMine',
      coolDown: 300,
      damage: 850,
    },
    gun: {
      type: 'missile',
      coolDown: 35,
      damage: 500
    },
    size: {"width":32,"height":32}
  },
  heavyTank: {
    playable: true,
    graphic: 'heavyTank',
    gunGraphic: 'heavyGun',
    collidable: true,
    obstacle: true,
    turnBehavior: 'turn',
    gunRotationBehavior: 'gunOnly',
    baseHealth: 36000,
    baseSpeed: 2.2,
    reverseFactor: 0.70,
    mine: {
      type: 'snareMine',
      coolDown: 500,
      damage: 3,
      turns: 125
      // Traps a tank and does 3 damage each turn for 125 turns (timer ticks).
    },
    gun: {
      type: 'plasma',
      coolDown: 85,
      damage: 300
    },
    size: {"width":44,"height":36}
  },
  hoverTank: {
    playable: true,
    graphic: 'hoverTank',
    gunGraphic: 'hoverGun',
    collidable: true,
    obstacle: true,
    turnBehavior: 'strafe',
    gunRotationBehavior: 'both',
    baseHealth: 20000,
    baseSpeed: 4.5,
    reverseFactor: 1,
    mine: {
      type: 'spiderMine',
      coolDown: 50,
      damage: 50,
      turns: 200 // Spider mines die automatically after this many turns.
    },
    gun: {
      type: 'shotgun',
      coolDown: 15,
      damage: 200,
      rounds: 3
    },
    size: {"width":30,"height":30}
  },

  explosionMine: {
    graphic: 'smallMine',
    collidable: true,
    obstacle: false,
    size: {"width":35,"height":35}
  },
  snareMine: {
    graphic: 'smallMine',
    collidable: true,
    obstacle: false,
    size: {"width":35,"height":35}
  },
  spiderMine: {
    graphic: 'largeMine',
    collidable: true,
    obstacle: false,
    size: {"width":105,"height":105}
  },

  missile: {
    graphic: 'missile',
    collidable: true,
    obstacle: true,
    damage: 800,
    baseSpeed: 8,
    maxLifetime: 200,
    creationSound: 'sndRocketLaunch',
    size: {"width":36,"height":18}
  },
  plasma: {
    graphic: 'plasma',
    collidable: true,
    obstacle: true,
    damage: 800,
    baseSpeed: 4.5,
    maxLifetime: 200,
    creationSound: 'sndPlasmaShot',
    size: {"width":16,"height":16}
  },
  plasmaSmall: {
    graphic: 'plasmaSmall',
    collidable: true,
    obstacle: true,
    baseSpeed: 8,
    maxLifetime: 200,
  },
  shotgun: {
    graphic: 'shotgunBullet',
    collidable: true,
    obstacle: true,
    damage: 400,
    baseSpeed: 10,
    maxLifetime: 200,
    creationSound: 'sndShotgun',
    size: {"width":50,"height":12}
  },

  indestructible: {
    graphic: 'indestructible',
    collidable: true,
    obstacle: true,
    size: {"width":40,"height":40}
  },
  wall: {
    graphic: 'wall',
    collidable: true,
    obstacle: true,
    size: {"width":40,"height":40}
  },
  tree: {
    graphic: 'treeStump',
    collidable: true,
    obstacle: true,
    size: {"width":20,"height":20}
  },
  treeLeaves: {
    graphic: 'treeLeaves',
    collidable: false,
    obstacle: false,
    size: {"width":200,"height":200}
  },
  healingBeacon: {
    graphic: 'healingBeacon',
    collidable: true,
    obstacle: true
  },
  healingPatch: {
    graphic: 'healingPatch',
    collidable: false,
    obstacle: false
  },
  tnt: {
    graphic: 'tnt',
    collidable: true,
    obstacle: false,
  },

  speedPatch: {
    graphic: 'speedPatch',
    collidable: true,
    obstacle: false
  },
  mud: {
    graphic: 'mud',
    collidable: true,
    obstacle: false
  },
  spikePit: {
    graphic: 'spikePit',
    collidable: true,
    obstacle: false
  },

  fireBall: {
    graphic: 'fireBall',
    collidable: false,
    obstacle: false,
    baseSpeed: 5,
    maxLifetime: 8
  }
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = actorData;
}
