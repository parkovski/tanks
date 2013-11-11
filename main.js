var http = require('http'),
    connect = require('connect'),
    socketio = require('socket.io'),
    fs = require('fs'),
    gameserver = require('./server/gameserver');

var config;
try {
  config = require('./config.json');
  console.log('found config.json');
}
catch (e) {
  console.log('couldn\'t find config.json - using defaults');
  config = {};
}

// Allow command line config in the form -c[option]=[value].
// This overrides config.json.
process.argv.forEach(function(val, index, array) {
  var ex = /-c([a-zA-Z0-9]+)=(.+)/.exec(val);
  if (ex) {
    config[ex[1]] = ex[2];
  }
});

if (!config.port && process.env.PORT) {
  config.port = process.env.PORT;
}

// Set config defaults
(function() {
  var defaults = {
    port: 80,
    root: '/',
    exitAfterGamesFinished: false
  };
  for (var def in defaults) {
    if (defaults.hasOwnProperty(def)) {
      if (typeof config[def] === 'undefined') {
        console.log('using default', def, '=', defaults[def]);
        config[def] = defaults[def];
      }
    }
  }
})();

// Port set by:
// - Command line: -cport=number
// - config.json: {"port":number}
// - Env: PORT=number node main.js
// - Default: 80
var port = +config.port;

function getPage(pageName, mode) {
  config.mode = mode;
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
    function(match, p1, p2, p3) {
      var cond = config.mode === p2;
      if (p1 === '!') {
        cond = config.mode !== p2;
      }
      if (cond) {
        return p3;
      } else {
        return '';
      }
    }
  );
  return pageText;
};

var indexPage, singlePlayerPage, newGamePage, joinGamePage;

indexPage = getPage('/html/index.html', 'index');
singlePlayerPage = getPage('/html/game.html', 'singleplayer');
newGamePage = getPage('/html/game.html', 'newgame');
joinGamePage = getPage('/html/game.html', 'joingame');

var pages = {
  'index': function(req, res) {
    res.end(indexPage);
  },
  'singleplayer': function(req, res) {
    res.end(singlePlayerPage);
  },
  'game': function(req, res) {
    res.end(joinGamePage);
  },
  'hasgame': function(req, res) {
    // ajax call
    if (gameserver.server.hasGame(req.args[0])) {
      res.end('true');
    } else {
      res.end('false');
    }
  },
  'new': function(req, res) {
    res.end(newGamePage);
  },
  'error': function(req, res) {
    res.end('an error occurred :(. press back.');
  },
  'toomanygames': function(req, res) {
    res.end('This server is running too many games. Please try again later.');
  },
  'cantjoin': function(req, res) {
    res.end('Couldn\'t join the specified game. Please try again later.');
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
  })
  .listen(port);

if (config.exitAfterGamesFinished) {
  gameserver.server.setExitAfterGamesFinished(true);
}

var io = socketio.listen(app, {resource: config.root + 'socket.io'});
gameserver.use(config, io);
