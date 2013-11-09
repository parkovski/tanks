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
    root: ''
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

function getPage(pageName) {
  var pageText = fs.readFileSync(__dirname + pageName) + '';
  // Replace {{text}} with config values
  pageText = pageText.replace(/\{\{([a-zA-Z0-9]+)\}\}/g, function(match, p) {
    return config[p] || '';
  });
  return pageText;
};

var indexPage, singlePlayerPage, multiPlayerPage;

indexPage = getPage('/html/index.html');
singlePlayerPage = getPage('/html/singleplayer.html');
multiPlayerPage = getPage('/html/multiplayer.html');

var pages = {
  'index': function(req, res) {
    res.end(indexPage);
  },
  'singleplayer': function(req, res) {
    res.end(singlePlayerPage);
  },
  'game': function(req, res) {
    res.end(multiPlayerPage);
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
    res.writeHeader(302, {'Location': '/game/' + req.args[0]});
    res.end();
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

var io = socketio.listen(app);
gameserver.use(io);
