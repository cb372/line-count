var express = require('express')
  , app = express()
  , server = require('http').createServer(app)
  , git = require('./git')
  , sseSocket = require('./ssesocket')
  , linecount = require('./linecount');

server.listen(process.env.PORT || 8080);

app.use(express.static(__dirname + '/public'));
app.use(express.static(__dirname + '/bower_components'));

app.get('/:user/:repo', function(req, res) {
  res.sendfile(__dirname + '/linecount.html');
});

app.get('/:user/:repo/*', function(req, res) {
  var socket = new sseSocket(req, res);
  git.cloneRepo(req.params.user, req.params.repo, socket, linecount.countLinesBuilder);
});
