import * as fs from 'fs';
import * as path from'path';
import * as vm from 'vm';
import * as nodeREPL from 'repl';
import * as nlng from './nlng';
import {merge, updateSyntaxError} from './helpers';

const replDefaults = {
  prompt: 'nlng> ',
  historyFile: process.env.HOME ? path.join(process.env.HOME, '.coffee_history') : void 0,
  historyMaxInputSize: 10240,
  eval: function (input, context, filename, cb) {
    // XXX: multiline hack.
    input = input.replace(/\uFF00/g, '\n');
    // Node's REPL sends the input ending with a newline and then wrapped in
    // parens. Unwrap all that.
    input = input.replace(/^\(([\s\S]*)\n\)$/m, '$1');
    // Node's REPL v6.9.1+ sends the input wrapped in a try/catch statement.
    // Unwrap that too.
    input = input.replace(/^\s*try\s*{([\s\S]*)}\s*catch.*$/m, '$1');

    // Require AST nodes to do some AST manipulation.
    const {Block, Assign, Value, Literal} = require('./nodes');

    try {
      // Tokenize the clean input.
      let tokens = nlng.tokens(input);
      // Collect referenced variable names just like in `nlng.compile`.
      let referencedVars = (function() {
        var i, len, results;
        results = [];
        for (i = 0, len = tokens.length; i < len; i++) {
          let token = tokens[i];
          if (token[0] === 'IDENTIFIER') {
            results.push(token[1]);
          }
        }
        return results;
      })();
      // Generate the AST of the tokens.
      let ast = nlng.nodes(tokens);
      // Add assignment to `_` variable to force the input to be an expression.
      ast = new Block([
        new Assign((new Value(new(Literal('_')))), ast, '=')
      ]);
      let js = ast.compile({bare: true, locals: Object.keys(context), referencedVars});
      cb(null, runInContext(js, context, filename));
    } catch (err) {
      // AST's `compile` does not add source code information to syntax errors.
      updateSyntaxError(err, input);
      cb(err);
    }
  }
}

function runInContext(js, context, filename) {
  if (context === global) {
    vm.runInThisContext(js, filename);
  } else {
    return vm.runInContext(js, context, filename);
  }
}

function addMultilineHandler(repl) {
  let {rli, inputStream, outputStream} = repl;
  // Node 0.11.12 changed API, prompt is now _prompt.
  let origPrompt = repl._prompt ? repl.prompt : void 0;

  let multiline = {
    enabled: false,
    initialPrompt: origPrompt.replace(/^[^> ]*/, (x) => x.replace(/./g, '-')),
    prompt: origPrompt.replace(/^[^> ]*>?/, (x) => x.replace(/./g, '.')),
    buffer: ''
  };

  // Proxy node's line listener
  let nodeLineListener = rli.listeners('line')[0];
  rli.removeListener('line', nodeLineListener);
  rli.on('line', (cmd) => {
    if (multiline.enabled) {
      multiline.buffer += `${cmd}\n`;
      rli.setPrompt(multiline.prompt);
      rli.prompt(true);
    } else {
      rli.setPrompt(origPrompt);
      nodeLineListener(cmd);
    }
  });

  // Handle Ctrl-v
  return inputStream.on('keypress', function(char, key) {
    if (!(key && key.ctrl && !key.meta && !key.shift && key.name === 'v')) {
      return;
    }
    if (multiline.enabled) {
      if (!multiline.buffer.match(/\n/)) {
        multiline.enabled = !multiline.enabled;
        rli.setPrompt(origPrompt);
        rli.prompt(true);
        return;
      }
      if ((rli.line != null) && !rli.line.match(/^\s*$/)) {
        return;
      }
      multiline.enabled = !multiline.enabled;
      rli.line = '';
      rli.cursor = 0;
      rli.output.cursorTo(0);
      rli.output.clearLine(1);
      multiline.buffer = multiline.buffer.replace(/\n/g, '\uFF00');
      rli.emit('line', multiline.buffer);
      multiline.buffer = '';
    } else {
      multiline.enabled = !multiline.enabled;
      rli.setPrompt(multiline.initialPrompt);
      rli.prompt(true);
    }
  });
}

// Store and load command history from a file
function addHistory(repl, filename, maxSize) {
  var buffer, fd, lastLine, readFd, size, stat;
  lastLine = null;
  try {
    stat = fs.statSync(filename);
    size = Math.min(maxSize, stat.size);
    readFd = fs.openSync(filename, 'r');
    buffer = new Buffer(size);
    fs.readSync(readFd, buffer, 0, size, stat.size - size);
    fs.closeSync(readFd);
    repl.rli.history = buffer.toString().split('\n').reverse();
    if (stat.size > maxSize) {
      repl.rli.history.pop();
    }
    if (repl.rli.history[0] === '') {
      repl.rli.history.shift();
    }
    repl.rli.historyIndex = -1;
    lastLine = repl.rli.history[0];
  } catch (error) {}
  fd = fs.openSync(filename, 'a');
  repl.rli.addListener('line', function(code) {
    if (code && code.length && code !== '.history' && code !== '.exit' && lastLine !== code) {
      fs.writeSync(fd, code + "\n");
      return lastLine = code;
    }
  });
  repl.on('exit', function() {
    return fs.closeSync(fd);
  });
  return repl.commands[getCommandId(repl, 'history')] = {
    help: 'Show command history',
    action: function() {
      repl.outputStream.write((repl.rli.history.slice(0).reverse().join('\n')) + "\n");
      return repl.displayPrompt();
    }
  };
};

function getCommandId(repl, commandName) {
  var commandsHaveLeadingDot;
  commandsHaveLeadingDot = repl.commands['.help'] != null;
  if (commandsHaveLeadingDot) {
    return "." + commandName;
  } else {
    return commandName;
  }
}

module.exports = {
  start: function(opts: any = {}) {
    let [major, minor, build] = process.versions.node.split('.').map((n) => parseInt(n));

    nlng.register();
    process.argv = ['nlng'].concat(process.argv.slice(2));
    opts = merge(replDefaults, opts);
    let repl = nodeREPL.start(opts)
    if (opts.prelude) runInContext(opts.prelude, repl.context, 'prelude');
    repl.on('exit', function() {
      if (!repl.rli.closed) {
        return repl.outputStream.write('\n');
      }
    })
    addMultilineHandler(repl);
    addMultilineHandler(repl);
    if (opts.historyFile) {
      addHistory(repl, opts.historyFile, opts.historyMaxInputSize);
    }
    repl.commands[getCommandId(repl, 'load')].help = 'Load code from a file into this REPL session';
    return repl;  
  }
}
