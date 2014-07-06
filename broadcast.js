var _ = require("underscore");
var pull = require("pull-stream");
var spawn = require("pull-spawn");
var robin = require("pull-robin");

module.exports = pull.Through(function (read, streams) {
  var args = [].slice.call(arguments);
  read = args.shift();
  streams = _.isArray(args[0]) ? args[0] : args;

  var readables = [], queues = [], reading = false, waitingForData = [], ended = false, cbs = [];

  // Init readables and queues
  for (var i = 0; i < streams.length; ++i) {
    queues[i] = [];
    readables[i] =  function (id) {
      return pull.Source(function (end, cb) {
        if (queues[id].length) return cb(queues[id][0][0], queues[id].shift()[1]);
        if (ended) return cb(ended);
        readFromUpstream(function () {
          return cb(queues[id][0][0], queues[id].shift()[1]);
        });
      });
    }(i);

    streams[i] = pull(readables[i], streams[i]);
  }

  function readFromUpstream(done) {
    waitingForData.push(done);
    if (reading) return;
    reading = true;
    read(null,  function (end, data) {
      reading = false;
      if (end === true) ended = true;

      _.each(queues, function (q) {
        q.push([end, _.clone(data)]);
      });

      while (waitingForData.length)
        waitingForData.shift()();
    });
  }

  var streamcount = streams.length;

  return function (end, cb) {
    if (end) return cb(end);
    cbs.push(cb);

    ;(function drain () {
      while (ended && !streamcount && cbs.length)
        cbs.shift()(ended);

      if (streams.length && streamcount && cbs.length) {
        var stream = streams.shift();
        var cb = cbs.shift();

        return stream(null,  function (end, data) {
          --streamcount;
          if (end === true) {cbs.unshift(cb); return drain();};
          ++streamcount;
          streams.push(stream);
          cb(end, data);
          drain();
        });
      }
    })();
  }
});

var broadcast = module.exports = pull.Through(function (read, streams) {
  var args = [].slice.call(arguments);
  read = args.shift();
  streams = _.isArray(args[0]) ? args[0] : args;

  if (streams.length <=1) return streams[0];

  streams = streams.reverse();
  streams[0] = spawn.observe(streams[0])(read)
  for (var i=1; i < streams.length-1; ++i)
    streams[i] = spawn.observe(streams[i])(streams[i-1]);
  streams[streams.length-1] = streams[streams.length-1](streams[streams.length-2]);

  streams = streams.reverse();

  var sources = [streams[0]];
  for (var i = 1; i<streams.length; ++i)
    sources.push(streams[i].observed);

  return robin(sources);
})
