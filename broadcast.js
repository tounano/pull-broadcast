var _ = require("underscore");
var pull = require("pull-stream");
var spawn = require("pull-spawn");
var robin = require("pull-robin");

var broadcast = module.exports = pull.Through(function (read, streams) {
  var args = [].slice.call(arguments);
  read = args.shift();
  streams = _.isArray(args[0]) ? args[0] : args;

  if (streams.length <=1) return streams[0];

  // observe in reverse order so that the first stream would be the main thread
  streams = streams.reverse();
  for (var i = 0; i < streams.length-1; ++i)
    streams[i] = spawn.observe(streams[i]);

  // chain the through streams
  streams[0] = streams[0](read);
  for (var i = 1; i < streams.length; ++i)
    streams[i] = streams[i](streams[i-1]);

  // Restore to the original order for round-robin
  streams = streams.reverse()
  var sources = [];
  for (var i = 0; i<streams.length; ++i)
    sources.push(streams[i].observed ? streams[i].observed : streams[i]);

  return robin(true,sources);
})