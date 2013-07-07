var os = require('os')
  , fs = require('fs')
  , splitter = require('stream-splitter')
  , spawn = require('child_process').spawn;

function buildGitUrl(user, repo) {
  return 'https://github.com/' + user + '/' + repo + '.git';
}

function randomChars(length) {
  var a = 97;
  var result = "";
  for (var i=0; i<length; i++) {
    result += String.fromCharCode(a + Math.floor(Math.random() * 26));
  }
  return result;
}

function buildTmpDirPath() {
  return os.tmpdir() + '/line-count-clone-' + randomChars(8);
}

function deleteFolderRecursive(path) {
  if(fs.existsSync(path))  {
    fs.readdirSync(path).forEach(function(file,index){
      var curPath = path + "/" + file;
      if(fs.statSync(curPath).isDirectory()) { // recurse
        deleteFolderRecursive(curPath);
      } else { // delete file
        fs.unlinkSync(curPath);
      }
    });
    fs.rmdirSync(path);
  }
}

function execGitCloneCmd(gitUrl, clonePath, socket, onSuccess, onError) {
  var proc = spawn('git', ['clone', '-v', gitUrl, clonePath]); 
  var stdoutLines = proc.stdout.pipe(splitter("\n"));
  var stderrLines = proc.stderr.pipe(splitter("\n"));
  stdoutLines.encoding = "utf-8";
  stderrLines.encoding = "utf-8";
  stdoutLines.on("token", function(line) {
    socket.emit('console-output', line);
  });
  stderrLines.on("token", function(line) {
    socket.emit('console-output', line);
  });
  proc.on("close", function(code) {
    if (code != 0) {
      socket.emit('console-output', "ERROR: git clone failed. Exit code = " + code);
      onError();
    } else {
      onSuccess(clonePath, socket);
    } 
  });
}

function cleanup(clonePath, socket) {
    socket.emit("console-output", "Cleaning up...");
    deleteFolderRecursive(clonePath);
};
    
var Git = {

  cloneRepo: function(user, repo, socket, onSuccessBuilder) {
    var gitUrl = buildGitUrl(user, repo);
    var clonePath = buildTmpDirPath();

    var cleanupFn = function() {
      cleanup(clonePath, socket);
    };

    var onSuccess = onSuccessBuilder(cleanupFn);
    execGitCloneCmd(gitUrl, clonePath, socket, onSuccess, cleanupFn);
  }
    
};

module.exports = Git;
