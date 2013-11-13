var actorData = {
  standardTank: {
    playable: true,
    graphic: 'standardTank',
    gunGraphic: 'standardGun',
    collidable: true,
    obstacle: true,
    turnBehavior: 'turn',
    gunRotationBehavior: 'gunOnly',
    baseHealth: 16000,
    force: 600,
    mine: {
      type: 'explosionMine',
      coolDown: 300
    },
    gun: {
      type: 'missile',
      coolDown: 35
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
    baseHealth: 18000,
    force: 800,
    mine: {
      type: 'snareMine',
      coolDown: 500
    },
    gun: {
      type: 'plasma',
      coolDown: 85
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
    syncGunRotation: true,
    baseHealth: 14000,
    force: 500,
    mine: {
      type: 'spiderMine',
      coolDown: 50
    },
    gun: {
      type: 'shotgun',
      coolDown: 15,
      rounds: 3
    },
    size: {"width":30,"height":30}
  },

  explosionMine: {
    graphic: 'smallMine',
    collidable: true,
    obstacle: false,
    damage: 3500,
    size: {"width":35,"height":35}
  },
  snareMine: {
    graphic: 'smallMine',
    tiles: ['snare1', 'snare2', 'snare3', 'snare4', 'snare5'],
    maxLifetime: -1,
    collidable: true,
    obstacle: false,
    freezeTime: 100,
    damage: 35,
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
    damage: 1500,
    force: 600,
    maxLifetime: 200,
    creationSound: 'sndRocketLaunch',
    size: {"width":36,"height":18}
  },
  plasma: {
    graphic: 'plasma',
    collidable: true,
    obstacle: false,
    force: 50,
    maxLifetime: 200,
    creationSound: 'sndPlasmaShot',
    size: {"width":16,"height":16}
  },
  attachedPlasma: {
    graphic: 'plasma',
    collidable: false,
    obstacle: false,
    damage: 20,
    maxLifetime: 100,
    size: {"width":16,"height":16}
  },
  plasmaSmall: {
    graphic: 'plasmaSmall',
    collidable: true,
    obstacle: true,
    maxLifetime: 200,
    damage: 300
  },
  shotgun: {
    graphic: 'shotgunBullet',
    collidable: true,
    obstacle: false,
    damage: 800,
    force: 400,
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
    tiles: ['wall', 'wallDamaged1', 'wallDamaged2'],
    collidable: true,
    obstacle: true,
    baseHealth: 5000,
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
    obstacle: true,
    baseHealth: 5000
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
    maxLifetime: 8
  },
  mineExplosion: {
    graphic: 'mineExplosion',
    collidable: false,
    obstacle: false,
    maxLifetime: 5,
    creationSound: 'sndMineExplode'
  },

  spider: {
    graphic: 'spider1',
    collidable: true,
    obstacle: false,
    force: 50,
    damage: 1500,
    maxLifetime: 200
  }
};

if (typeof module !== 'undefined') {
  module.exports = actorData;
}
