var fs = require('fs')
  , mime = require('mime')
  , reader = require('buffered-reader');

function getExtension(path) {
  var lastDot = path.lastIndexOf('.');
  if (lastDot > -1) {
    return path.substring(lastDot + 1);
  } else {
    return "";
  }
}

var codeFileTypes = { 
  "java": "Java",
  "scala": "Scala",
  "rb": "Ruby",
  "c": "C",
  "c++": "C++",
  "php": "PHP",
  "pl": "Perl",
  "js": "JavaScript",
  "sh": "Shell"
};

function getCodeFileType(extension) {
  return codeFileTypes[extension];
}

function parseCodeFile(path, filetype, onSuccess) {
    var result = {
      filetype: filetype,
      lines: 0,
      codeLines: 0
    }
  new reader.DataReader(path, { "encoding": "utf-8" })
    .on("line", function(line) {
      result.lines += 1;   

      // TODO Better parsing to handle cases such as multi-line comments
      var trimmed = line.trim();
      if (trimmed.length > 0 
          && trimmed.indexOf("#") != 0
          && trimmed.indexOf("//") != 0
          && trimmed.indexOf("/*") != 0) {
        result.codeLines += 1;
      }
    })
    .on("end", function() {
      onSuccess(result);
    })
    .read();
}

function parseTextFile(path, onSuccess) {
  var result = {
    filetype: "Text",
    lines: 0,
    codeLines: 0
  };

  // Simply count all lines as non-code lines
  new reader.DataReader(path, { "encoding": "utf-8" })
    .on("line", function(line) {
      result.lines += 1;   
    })
    .on("end", function() {
      onSuccess(result);
    })
    .read();
}

var Parser = {

  parse: function(path, onSuccess) {
    var extension = getExtension(path);
    var codeFileType = getCodeFileType(extension);
    if (codeFileType) {
      parseCodeFile(path, codeFileType, onSuccess);
    } else if (mime.lookup(path).indexOf("text/") == 0) {
      parseTextFile(path, onSuccess);
    } else {
      // unsupported file type
      onSuccess(null);
    }
  }

};

module.exports = Parser;
