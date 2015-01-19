var test = require('tape')
var AB = require('../')

test(
  'choose',
  function (t) {
    var ab = AB.create([
      {
        name: 'foo',
        startDate: (new Date()).toISOString(),
        independentVariables: {
          x: 1
        },
        eligibilityFunction: function () { return true },
        groupingFunction: function () { return { x: 2 } }
      }
    ])
    t.equal(ab.choose('x'), 2, 'choice came from groupingFunction')
    t.end()
  }
)

test(
  'choose returns the default when no experiment sets the variable',
  function (t) {
    var ab = AB.create(
      [{
        name: 'foo',
        startDate: (new Date()).toISOString(),
        independentVariables: {
          x: 1
        },
        eligibilityFunction: function () { return true },
        groupingFunction: function () { return { x: 2 } }
      }],
      [],
      {
        z: 1
      }
    )
    t.equal(ab.choose('z'), 1, 'choice came from defaults')
    t.end()
  }
)
