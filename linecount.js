var os = require('os')
  , fs = require('fs')
  , parser = require('./parser');

function walkRepo(path, onFile) {
  if(fs.existsSync(path))  {
    fs.readdirSync(path).forEach(function(file,index){
      if (file.indexOf(".git") != 0) { // skip git-related files and dirs
        var curPath = path + "/" + file;
        if (fs.statSync(curPath).isDirectory()) { // recurse
          walkRepo(curPath, onFile);
        } else { // process file and update accumulated result
          onFile(curPath);
        }
      }
    });
  }
}

function addResult(acc, newResult) {
  if (newResult) {
    if (acc.hasOwnProperty(newResult.filetype)) {
      acc[newResult.filetype].files += 1;
      acc[newResult.filetype].lines += newResult.lines;
      acc[newResult.filetype].codeLines += newResult.codeLines;
    } else {
      acc[newResult.filetype] = {
        files: 1,
        lines: newResult.lines,
        codeLines: newResult.codeLines
      };
    }
  }
}

function getFilename(path) {
  var lastSlash = path.lastIndexOf('/');
  if (lastSlash > -1) {
    return path.substring(lastSlash + 1);
  } else {
    return path;
  }
}

function countLines(rootDir, socket, onComplete) {
    socket.emit("console-output", "Counting lines...");
 
    var filesRemaining = 0; 
    var results = {};
    var walkComplete = false;

    var onFileParseResult = function(fileResult) {
        addResult(results, fileResult);
        filesRemaining -= 1;
        if (walkComplete && filesRemaining == 0) {
          // all files have been parsed, so we're done
          socket.emit("results", results);
          onComplete();
        }
    };

    var onFile = function(path) {
      filesRemaining += 1;
      socket.emit("console-output", "Parsing file: " + getFilename(path));
      parser.parse(path, onFileParseResult);
    };

    walkRepo(rootDir, onFile);
    walkComplete = true;

}

var LineCount = {

  countLinesBuilder: function(onComplete) {
    return function(rootDir, socket) {
      countLines(rootDir, socket, onComplete);
    }
  }

};

module.exports = LineCount;
