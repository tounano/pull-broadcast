var pull = require("pull-stream");
var broadcast = require("../");

var events = [
  {
    name: "SomeEvent",
    value: 0
  }
];

function plusSomethingMappper(num) {
  return function(d) {
    d.value += num;
    return d;
  }
}

pull(
  pull.values(events),
  broadcast(
    pull.map(plusSomethingMappper(2)),
    pull.map(plusSomethingMappper(4))
  ),
  pull.drain(console.log)
)