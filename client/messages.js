var game = game || {};
(function() {
  game.initMessages = function() {
    var _messageTable = {};
    function messageDef(name, handler) {
      _messageTable[name] = handler;
      game.socket.on(name, handler);
    }
    this.socket.on('message group', function(data) {
      for (var i = 0; i < data.length; ++i) {
        var fn = _messageTable[data[i][0]];
        if (fn) fn.apply(this, data[i].slice(1));
      }
    });

    messageDef('moveto', function(data) {
      var a = game.actors[data.index];
      a.x = data.x;
      a.y = data.y;
    });

    messageDef('rotateto', function(data) {
      var a = game.actors[data.index];
      a.r = data.r;
    });

    messageDef('rotategunto', function(data) {
      var a = game.actors[data.index];
      a.gunR = data.r;
    });

    messageDef('sethealth', function(data) {
      var a = game.actors[data.index];
      a.health = data.health;
    });

    messageDef('set graphic', function(data) {
      var a = game.actors[data.index];
      a.graphic = data.graphic;
      a.gfx = game.images[a.graphic];
    });

    messageDef('update connected players', function(players) {
      $('#connectedPlayers').text(players);
      $('#connected').css({'background-color': '#ffeebb'});
      setTimeout(function() {
        $('#connected').css({'background-color': ''});
      }, 500);
    });

    messageDef('cant start', function(info) {
      alert('cant start game: ' + info);
      // do something
    });

    messageDef('set actors', function(data) {
      var actors = game.actors = [];
      for (var i = 0; i < data.length; ++i) {
        game.initActor(data[i]);
        actors.push(data[i]);
      }
    });

    messageDef('create actor', function(data) {
      game.actors[data.id] = data;
      game.initActor(data);
    });

    messageDef('remove actor', function(data) {
      delete game.actors[data];
      if (data === game.playerId) {
        game.unbindInputEvents();
      }
    });

    messageDef('set player id', function(data) {
      console.log('set player id', data);
      game.playerId = data;
      $('#chatName').val('Player ' + (data + 1));
    });

    messageDef('set background', function(data) {
      game.backgroundImg = data;
    });

    messageDef('set music', function(data) {
      game.music = data;
    });

    messageDef('disconnect', function() {
      if (typeof game.interval !== 'undefined') {
        clearInterval(game.interval);
      }
    });

    messageDef('game over', function(winnerId) {
      if (typeof game.interval !== 'undefined') {
        clearInterval(game.interval);
      }
      game.drawFinishScreen(winnerId === game.playerId);
      $('#endGame').prop('disabled', true);
    });

    messageDef('start game', function() {
      if ($('#toggleMusic').is(':checked')) {
        var elem = game.sounds[game.music];
        elem.loop = true;
        elem.play();
      }
      $('#startGame').prop('disabled', true);
      $('#endGame').prop('disabled', false);
      $('#canvas').focus();
      game.interval = setInterval(game.mainLoop, 25);
    });

    messageDef('get chat', function(text) {
      game.appendChat(text);
    });
  };
})();
