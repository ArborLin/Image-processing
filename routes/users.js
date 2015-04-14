var express = require('express');
var router = express.Router();
var fs = require('fs');
var path = require('path');
var url = require('url');
var gm = require('gm');
/* GET users listing. */
router.post('/', function(req, res, next) {
  //res.send('respond with a resource');
  var tmp = path.resolve('..', 'public/tmp');
  var imgData = req.body.image,
      base64Data = imgData.replace(/^data:image\/\w+;base64,/, ""),
      dataBuffer = new Buffer(base64Data, 'base64');
  var filename = Date.parse(new Date()) + Math.floor(Math.random() * 1000),
  		filePath = tmp + '/' + filename +'.png';

  fs.writeFile(tmp + '/' + filename +'.png', dataBuffer, function(err) {
      if (err) {
        res.send(err);
      } else {
      	var im = gm.subClass({ imageMagick: true });
      	im(filePath).setFormat('gif');
      	res.send(filename + '.gif'); //filename + .format  
      }
  });
});

router.get('/download', function(req, res, next){
	var query = url.parse(req.url, true).query;
	var filename = query.filename;
	var tmp = path.resolve('..', 'public/tmp');

	fs.exists(tmp+'/'+filename, function(exists){
		if(!exists) {
			res.writeHead(404, 'Not Found', {'Content-Type': 'text/plain'});
      res.write('This request URL was not found on this server.');
      res.end();
		}

		res.download(tmp+'/'+filename,function(err) {
			if(err){
				console.log(err);
			} else {
				console.log('ok');
			}
		});
	});
});

module.exports = router;
