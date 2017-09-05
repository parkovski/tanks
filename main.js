var http = require('http'),
    connect = require('connect'),
    socketio = require('socket.io'),
    fs = require('fs'),
    gameserver = require('./server/gameserver');

var config;
try {
  config = require('./config.json');
}
catch (e) {
  console.log('couldn\'t find config.json - using defaults');
  config = {};
}

var defaults = {
  port: 80,
  root: '/',
  exitAfterGamesFinished: false,
  maxGames: 2,
  defaultLevel: 'SPARTA!',
  debug: false
};

// Allow command line config in the form -v[option]=[value].
// This overrides config.json.
// You can also specify a file to use instead of config.json
// with the -c [config file] option.
process.argv.forEach(function(val, index, array) {
  var ex = /-v([a-zA-Z0-9]+)=(.+)/.exec(val);
  if (ex) {
    config[ex[1]] = ex[2];
  } else if (val === '-c') {
    if (array[index + 1]) {
      try {
        var nextItem = array[index + 1];
        var overrideConfig = require(nextItem);
        config = overrideConfig;
      } catch (e) {
        console.log('warning: couldn\'t load config', nextItem);
      }
    }
  } else if (val === '-h' || val === '--help' || val === '-?') {
    console.log('usage: node main.js [options]');
    console.log('then open a browser to localhost:[config.port]');
    console.log('configure using a config.json file or -v[name]=[value]');
    console.log('available options and defaults:');
    for (var configOption in defaults) {
      if (defaults.hasOwnProperty(configOption)) {
        console.log(' ', configOption, '=', defaults[configOption]);
      }
    }
    process.exit();
  }
});

if (!config.port && process.env.PORT) {
  config.port = process.env.PORT;
}

// Set config defaults
(function() {
  for (var def in defaults) {
    if (defaults.hasOwnProperty(def)) {
      if (typeof config[def] === 'undefined') {
        config[def] = defaults[def];
      }
    }
  }
})();

// Port set by:
// - Command line: -vport=number
// - config.json: {"port":number}
// - Env: PORT=number node main.js
// - Default: 80
var port = +config.port;

var levels = [];
var levelOptions = '';
var levelIndex = 0;
require('fs').readdirSync(__dirname + '/levels/').forEach(function(level) {
  if (level.substring(level.length - 5) === '.json') {
    var text = '<option value="' + levelIndex + '"';
    if (level === config.defaultLevel + '.json') {
      text += ' selected';
    }
    text += '>';
    text += level.substring(0, level.length - 5);
    text += '</option>';
    levelOptions += text + '\n';
    levels.push(level);
    ++levelIndex;
  }
});

// mode may be an array
function getPage(pageName, mode) {
  config.mode = mode;
  config.levelOptions = levelOptions;
  var pageText = fs.readFileSync(__dirname + pageName) + '';
  // Replace {{text}} with config values
  pageText = pageText.replace(/\{\{([a-zA-Z0-9]+)\}\}/g, function(match, p) {
    return config[p] || '';
  });

  // Replace {{mode:[mode] ... }} with stuff conditional on the mode.
  // Also valid is {{mode:![mode] ... }}, opposite of above.
  // Regexes are the worst. There has to be a special condition to not
  // match an additional {{ or it won't work :(
  pageText = pageText.replace(
    /\{\{mode:(!?)([a-zA-Z0-9]+)((?:(?:.|\n)(?!\{\{))*)\}\}/gm,
    function(match, notOpt, mode, text) {
      var cond = config.mode === mode;
      if (Array.isArray(config.mode)) {
        cond = !!~config.mode.indexOf(mode);
      }
      if (notOpt === '!') {
        cond = !cond;
      }
      if (cond) {
        return text;
      } else {
        return '';
      }
    }
  );
  return pageText;
};

var indexPage, singlePlayerPage, newGamePage, joinGamePage, todoPage;

indexPage = getPage('/html/index.html', 'index');
singlePlayerPage = getPage('/html/game.html', 'singleplayer');
newGamePage = getPage('/html/game.html', 'newgame');
joinGamePage = getPage('/html/game.html', 'joingame');
todoPage = getPage('/html/todo.html', 'todo');

var pages = {
  'index': function(req, res) {
    res.write(indexPage);
  },
  'singleplayer': function(req, res) {
    if (gameserver.server.canStartGame()) {
      res.write(singlePlayerPage);
    } else {
      res.writeHead(302, {'Location': '/toomanygames'});
    }
  },
  'game': function(req, res) {
    res.write(joinGamePage);
  },
  'hasgame': function(req, res) {
    // ajax call
    if (~req.args[0].indexOf('?')) {
      req.args[0] = req.args[0].substring(0, req.args[0].indexOf('?'));
    }
    if (gameserver.server.hasGame(req.args[0])) {
      res.write('true');
    } else {
      res.write('false');
    }
  },
  'new': function(req, res) {
    if (gameserver.server.canStartGame()) {
      res.write(newGamePage);
    } else {
      res.writeHead(302, {'Location': '/toomanygames'});
    }
  },
  'error': function(req, res) {
    res.write('an error occurred :(. press back.');
  },
  'toomanygames': function(req, res) {
    res.write('This server is running too many games. Please try again later.');
  },
  'cantjoin': function(req, res) {
    res.write('Couldn\'t join the specified game. Please try again later.');
  },
  'todo': function(req, res) {
    res.write(todoPage);
  }
};

var app = connect()
  .use(connect.static(__dirname + '/client'))
  .use('/media', connect.static(__dirname + '/media'))
  .use(function(req, res) {
    var args = req.url.split('/');
    var pageName = args[1] || 'index';
    req.args = args.slice(2);
    (pages[pageName] || pages.error)(req, res);
    res.end();
  })
  .listen(port);

console.log('Listening on port ' + port);

gameserver.server.setMaxGames(config.maxGames);
if (config.exitAfterGamesFinished) {
  gameserver.server.setExitAfterGamesFinished(true);
}

var io = socketio.listen(app);
gameserver.use(config, io, levels);
