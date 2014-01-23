var game = game || {};
(function() {
  $('#chatInput').keydown(function(e) {
    var jqInput = $('#chatInput');
    if (e.which === 13) {
      var text = $('#chatName').val().trim();
      if (text !== '') {
        text += ': ' + jqInput.val();
        game.socket.emit('send chat', text);
        jqInput.val('');
      }
      e.preventDefault();
    }
  });

  $('input[type="text"]').keydown(function(e) {
    e.stopPropagation();
  });

  $('input[type="text"]').keyup(function(e) {
    e.stopPropagation();
  });

  game.appendChat = function(text) {
    var newElem = $('<div></div>');
    newElem.text(text);
    $('#chat').append(newElem);
    $('#chat').scrollTop($('#chat')[0].scrollHeight);
    newElem.css({'background-color': '#ffeebb'})
      .delay(500).queue(function() {
        newElem.css({'background-color': ''});
      });
    $('#chatBox').css({'background-color': '#fffaee'});
    setTimeout(function() {
      $('#chatBox').css({'background-color': ''});
    }, 250);
  };
})();
