var _ = require("underscore");
var pull = require("pull-stream");

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