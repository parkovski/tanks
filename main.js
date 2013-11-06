var http = require('http'),
    connect = require('connect'),
    socketio = require('socket.io'),
    fs = require('fs'),
    gameserver = require('./server/gameserver');

// Default port: 3000, unless PORT env is set, or -port arg is given.
var port = 3000;

if (process.env.PORT) {
  port = process.env.PORT;
}
process.argv.forEach(function(val, index, array) {
  if (val === '-port' && array[index + 1]) {
    port = +array[index + 1];
  }
});

var indexPage, singlePlayerPage, multiPlayerPage;

indexPage = fs.readFileSync(__dirname + '/html/index.html');
singlePlayerPage = fs.readFileSync(__dirname + '/html/singleplayer.html');
multiPlayerPage = fs.readFileSync(__dirname + '/html/multiplayer.html');

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
