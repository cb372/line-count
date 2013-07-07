var express = require('express')
  , app = express()
  , server = require('http').createServer(app)
  , io = require('socket.io').listen(server)
  , git = require('./git')
  , linecount = require('./linecount');

server.listen(process.env.PORT || 8080);

app.use(express.static(__dirname + '/public'));
app.use(express.static(__dirname + '/bower_components'));

app.get('/:user/:repo', function(req, res) {
  res.sendfile(__dirname + '/linecount.html');
});

io.sockets.on('connection', function (socket) {
  socket.on('get-line-count', function (data) {
    git.cloneRepo(data.user, data.repo, socket, linecount.countLinesBuilder);
  });
});
