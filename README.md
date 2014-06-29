# pull-broadcast

Create a broadcast pull-stream

Useful for creating several parallel processing streams for a single event.

Visualization of the process:

```
            |-->-->|
            |-->-->|
EVENT -->-->|      |-->-->SEVERAL EVENTS
            |-->-->|
            |-->-->|
```

`pull-broadcast` will pull data from upstream as fast as the fastest substream. Each event will be buffered until it
was consumed by all the substreams.

Before reaching a substream, each event would be cloned, so that a change in one substream, won't affect the objects in
other substreams.

## Example

```js
var pull = require("pull-stream");
var broadcast = require("pull-broadcast");

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
```

## install

With [npm](https://npmjs.org) do:

```
npm install pull-substream
```

## license

MIT