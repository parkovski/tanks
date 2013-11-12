var connect = require('connect'),
  fs = require('fs');

var str = '<!DOCTYPE html>\n<html><head></head><body>';

var files = fs.readdirSync('../media');

files.forEach(function(file) {
  if (file.substring(file.length - 4) === '.png') {
    str += file + ': <img src="/media/' + file + '"><br>\n';
  }
});

str += '</body></html>';

var app = connect()
  .use('/media', connect.static(__dirname + '/../media'))
  .use(function(req, res) {
    res.end(str);
  })
  .listen(3000);
