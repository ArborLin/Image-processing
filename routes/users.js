var express = require('express');
var router = express.Router();
var fs = require('fs');
var path = require('path');
/* GET users listing. */
router.post('/', function(req, res, next) {
  //res.send('respond with a resource');
  var imgData = req.body.image,
      base64Data = imgData.replace(/^data:image\/\w+;base64,/, ""),
      dataBuffer = new Buffer(base64Data, 'base64');
  fs.writeFile("../out.png", dataBuffer, function(err) {
      if(err){
          res.send(err);
      }else{
      		var file = __dirname + '/out.png';
      		console.log(file);
          res.download(file,'out.png', function(err) {
          	if (err){
          		console.log(err);
          	} else {
          		console.log('ok');
          	}
          });
      }
  });
});

/*router.post('/saveImage',function (req, res) {
  var imgData = req.body.image,
      base64Data = imgData.replace(/^data:image\/\w+;base64,/, ""),
      dataBuffer = new Buffer(base64Data, 'base64');
  fs.writeFile("out.png", dataBuffer, function(err) {
      if(err){
          res.send(err);
      }else{
          res.send("ok");
      }
  });
	res.send('ok');
});*/

module.exports = router;
