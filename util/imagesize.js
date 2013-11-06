var gm = require('gm');

var json = process.argv[2] === '-json';

if (process.argv.length !== (json ? 4 : 3)) {
  console.log('usage: node imagesize.js [-json] <filename>');
  process.exit();
}

var file = process.argv[json ? 3 : 2];

gm(file)
  .size(function(err, size) {
    if (err) {
      console.log(err);
      console.log('this program requires graphicsmagick. did you install it?');
      console.log('(not the node module)');
    } else {
      if (json) {
        console.log(JSON.stringify({width:size.width, height:size.height}));
      } else {
        console.log('width:', size.width);
        console.log('height:', size.height);
      }
    }
  });
