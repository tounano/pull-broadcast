var pull = require("pull-stream");
var broadcast = require("../");

var events = [
  {
    name: "SomeEvent",
    value: 0
  },
  {
    name: "SomeEvent2",
    value: 0
  },
  {
    name: "SomeEvent3",
    value: 0
  }
];

function plusSomethingMappper(num) {
  return function(d) {
    d.value += num;
    return d;
  }
}

var delayedMap = function(d, done) {
  setTimeout( function () {
    done (null, d);
  }, 1000)
}

pull(
  pull.values(events),
  broadcast(
    pull.map(plusSomethingMappper(1)),
    pull.asyncMap(delayedMap),
    pull.map(plusSomethingMappper(3)),
    pull.map(plusSomethingMappper(6))
  ),
  pull.drain(console.log)
)

