var game = game || {};
game.getTouchEventNames = function() {
  if (navigator.pointerEnabled) {
    return ['pointerdown', 'pointerup'];
  } else if (navigator.msPointerEnabled) {
    return ['MSPointerDown', 'MSPointerUp'];
  } else if ('ontouchstart' in window) {
    return ['touchstart', 'touchend'];
  } else {
    return null;
  }
};

game.unbindInputEvents = function() {
  var jqDoc = $(document);
  var jqCanvas = $('#canvas');

  jqDoc.unbind('keydown');
  jqDoc.unbind('keyup');
  jqDoc.unbind('mousemove');
  jqCanvas.unbind('contextmenu');
  jqCanvas.unbind('mousedown');

  var names = game.getTouchEventNames();
  if (!names) return;
  jqCanvas.unbind(names[0]);
  jqCanvas.unbind(names[1]);
};

game.initInput = function() {
  var keymap = {
    // movement
    'w': 'up',
    'a': 'left',
    's': 'down',
    'd': 'right',

    // guns:
    'j': 'gunleft',
    'k': 'fire',
    ' ': 'fire',
    'l': 'gunright',
    'i': 'mine',
    'q': 'mine'
  };

  var keystates = {
    up: false,
    down: false,
    left: false,
    right: false,
    gunleft: false,
    fire: false,
    gunright: false,
    mine: false
  };

  var keymessages = {
    up: 'move',
    down: 'move',
    left: 'rotate',
    right: 'rotate',
    gunleft: 'rotategun',
    gunright: 'rotategun',
    fire: 'fire',
    mine: 'mine'
  };

  var keyupmessages = {
    up: 'stopmove',
    down: 'stopmove',
    left: 'stoprotate',
    right: 'stoprotate',
    gunleft: 'stoprotategun',
    gunright: 'stoprotategun'
  };

  var keymessageargs = {
    up: 1,
    down: -1,
    left: -1,
    right: 1,
    gunleft: -1,
    gunright: 1
  };

  var mousestate = {
    usingMouse: false,
    x: 0,
    y: 0,
    checkRotation: function() {
      if (this.usingMouse) {
        emitGunRotateCommand(this.x, this.y);
      }
    }
  };
  game.mousestate = mousestate;

  var socket = game.socket;

  var keyDown = function(mapkey) {
    if (keystates[mapkey]) {
      return;
    }
    keystates[mapkey] = true;

    socket.emit(keymessages[mapkey], keymessageargs[mapkey]);

    if (mapkey === 'gunleft' || mapkey === 'gunright') {
      mousestate.usingMouse = false;
    }
  };

  var keyUp = function(mapkey) {
    if (!keystates[mapkey]) {
      return;
    }
    keystates[mapkey] = false;

    var message = keyupmessages[mapkey];
    if (message) {
      socket.emit(message);
    }
  };

  // Key event listeners
  $(document).keydown(function(e) {
    var key = String.fromCharCode(e.which).toLowerCase();
    // this only works when debug is turned on on the server.
    if (key === '1' || key === '2' || key === '3' || key === '4') {
      socket.emit('change id', key - 1);
    }
    keyDown(keymap[key]);
    if (key === ' ') {
      e.preventDefault();
    }
  });

  $(document).keyup(function(e) {
    var key = String.fromCharCode(e.which).toLowerCase();
    keyUp(keymap[key]);
    if (key === ' ') {
      e.preventDefault();
    }
  });

  $(document).mousemove(function(e) {
    mousestate.x = e.pageX;
    mousestate.y = e.pageY;
    mousestate.usingMouse = true;
  });

  $(document).contextmenu(function(e) {
    e.preventDefault();
  });

  var jqCanvas = $('#canvas');

  jqCanvas.mousedown(function(e) {
    if (e.which == 1) {
      socket.emit('fire');
    } else if (e.which == 3) {
      socket.emit('mine');
    }
  });

  jqCanvas.bind('contextmenu', function(e) {
    socket.emit('mine');
    e.preventDefault();
  });

  function emitGunRotateCommand(x, y) {
    var cpos = jqCanvas.offset();
    var player = game.actors[game.playerId];
    var r = Math.atan2(y - cpos.top - player.y, x - cpos.left - player.x);
    var gunR = player.gunR;
    var rotation = Math.PI / 60;
    if (r - gunR > Math.PI) {
      gunR += 2 * Math.PI;
    } else if (r - gunR < -Math.PI) {
      gunR -= 2 * Math.PI;
    }
    if (r > gunR + rotation) {
      socket.emit('rotategunstep', 1);
    } else if (r < gunR - rotation) {
      socket.emit('rotategunstep', -1);
    }
  }

  // Touch events
  (function() {
    var names = game.getTouchEventNames();
    if (!names) return;

    $('#controls').show();

    var getTouchStartEvent = function(keyname) {
      return function(e) {
        e.preventDefault();
        keyDown(keyname);
      };
    };

    var getTouchEndEvent = function(keyname) {
      return function(e) {
        e.preventDefault();
        keyUp(keyname);
      };
    };

    var setupTouchEvents = function(evtname) {
      var elem = $('#' + evtname + 'Ctrl');
      elem.bind(names[0], getTouchStartEvent(evtname));
      elem.bind(names[1], getTouchEndEvent(evtname));
    };

    var touchControlNames = ['up', 'down', 'left', 'right',
      'gunleft', 'gunright', 'fire', 'mine'];

    for (var i = 0; i < touchControlNames.length; ++i) {
      setupTouchEvents(touchControlNames[i]);
    }
  })();
};
