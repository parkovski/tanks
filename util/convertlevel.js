var fs = require('fs');

var levelFileName;
var outputFileName;

var background = 'map3';
var music = 'elevatorMusic';

process.argv.slice(2).forEach(function(v) {
  if (v.substr(0, 3) === '-bg') {
    background = v.substr(3);
  } else if (v.substr(0, 2) === '-m') {
    music = v.substr(2);
  } else if (!levelFileName) {
    levelFileName = v;
  } else if (!outputFileName) {
    outputFileName = v;
  }
});

if (!levelFileName || !outputFileName) {
  console.log('usage: node convertlevel.js <input file> <output file>');
  console.log('optional arguments: (default notated by *)');
  console.log('  -bg<image name>: set background image {map1, map2, map3*}');
  console.log('  -m<music name>: set music {elevatorMusic*, lullaby}');
  process.exit();
}

var levelFile;

try {
  levelFile = '' + fs.readFileSync(levelFileName);
} catch (e) {
  console.log('error: couldn\'t open level file.');
  process.exit();
}

var lines = levelFile.split('\n').slice(1);
var level = {
  background: background,
  music: music,
  pieces: [],
  players: []
};

var conversion = {
  'p1.png': 0,
  'p2.png': 1,
  'p3.png': 2,
  'p4.png': 3,
  'healingbeacon.png': 'healingBeacon',
  'indestructible.png': 'indestructible',
  'treestump.png': 'tree',
  'wall2.png': 'wall',
  'tnt.png': 'tnt',
  'spikepit.png': 'spikePit',
  'speedpatch.png': 'speedPatch',
  'mud.png': 'mud'
};

function getType(part) {
  part = part.toLowerCase();
  return conversion[part];
}
lines.forEach(function(line) {
  if (!line) {
    return;
  }
  var parts = line.trim().split(' ');
  var type = getType(parts[0]);
  if (typeof type === 'number') {
    level.players[type] = {x: parts[1], y: parts[2]};
  } else {
    level.pieces.push({type: type, x: parts[1], y: parts[2]});
  }
});

try {
  fs.writeFileSync(outputFileName, JSON.stringify(level));
}
catch (e) {
  console.log('error writing output file.');
  process.exit();
}
