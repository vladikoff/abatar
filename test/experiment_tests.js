var test = require('tape')
var AB = require('../')

test(
  'a subject is eligible when eligibilityFunction returns true',
  function (t) {
    var e = new AB.Experiment(
      {
        startDate: (new Date()).toISOString(),
        eligibilityFunction: function () { return true }
      }
    )
    t.equal(e.isEligible({}), true, 'eligibilityFunction returns true')
    t.end()
  }
)

test(
  'a subject is ineligible when eligibilityFunction returns false',
  function (t) {
    var e = new AB.Experiment(
      {
        startDate: (new Date()).toISOString(),
        eligibilityFunction: function () { return false }
      }
    )
    t.equal(e.isEligible({}), false, 'eligibilityFunction returns false')
    t.end()
  }
)

test(
  'experiments default to an eligibilityFunction that returns false',
  function (t) {
    var e = new AB.Experiment({
      startDate: (new Date()).toISOString()
    })
    t.equal(e.isEligible({}), false, 'default eligibilityFunction returns false')
    t.end()
  }
)

test(
  'subjects are ineligible before the startDate',
  function (t) {
    var e = new AB.Experiment({
      startDate: '2014-12-17',
      eligibilityFunction: function () { return true }
    })
    t.equal(e.isEligible({}, Date.parse('2014-12-16')), false, 'pre-startDate')
    t.end()
  }
)

test(
  'subjects are ineligible after the endDate',
  function (t) {
    var e = new AB.Experiment({
      endDate: '2014-12-17',
      eligibilityFunction: function () { return true }
    })
    t.equal(e.isEligible({}, Date.parse('2014-12-18')), false, 'post-endDate')
    t.end()
  }
)

test(
  'experiments default to an groupingFunction that returns {}',
  function (t) {
    var e = new AB.Experiment({
      eligibilityFunction: function () { return true }
    })
    var choice = e.choose({})
    t.equal(typeof(choice), 'object', 'default groupingFunction returns an object')
    t.equal(Object.keys(choice).length, 0, 'that is empty')
    t.end()
  }
)

test(
  'subjects with missing attributes are ineligible',
  function (t) {
    var e = new AB.Experiment({
      subjectAttributes: {
        anything: 'required'
      },
      eligibilityFunction: function () { return true }
    })
    t.equal(e.isEligible({}), false, 'subject is ineligible')
    t.end()
  }
)

test(
  'eligible subjects get the results of groupingFunction from choose',
  function (t) {
    var e = new AB.Experiment({
      eligibilityFunction: function () { return true },
      groupingFunction: function () { return { y: 2 } }
    })
    t.equal(e.choose({}).y, 2, 'eligible subject got grouping value')
    t.end()
  }
)

test(
  'eligible subjects set the experiment active on choose',
  function (t) {
    var e = new AB.Experiment({
      eligibilityFunction: function () { return true }
    })
    t.equal(e.active, false, 'experiment starts inactive')
    e.choose({})
    t.equal(e.active, true, 'experiment became active')
    t.end()
  }
)

test(
  'key is unique for each subject',
  function (t) {
    var e = new AB.Experiment({
      subjectAttributes: {
        x: 'required'
      }
    })
    t.ok(e.key({ x: 1 }) !== e.key({ x: 2 }), 'eligible subject got grouping value')
    t.end()
  }
)

test(
  'active experiments mark their choice',
  function (t) {
    var e = new AB.Experiment({
      eligibilityFunction: function () { return true },
      groupingFunction: function () { return { y: 2 } }
    })
    t.equal(e.choose({}).y, 2, 'eligible subject got grouping value')
    t.equal(e.log[0].choice.y, 2, 'experiment marks the choice')
    t.end()
  }
)

test(
  'experiments mark choices for multiple subjects',
  function (t) {
    var e = new AB.Experiment({
      subjectAttributes: {
        x: 'required'
      },
      eligibilityFunction: function () { return true },
      groupingFunction: function () { return { y: 2 } }
    })
    t.equal(e.choose({ x: 1 }).y, 2, 'eligible subject got grouping value')
    t.equal(e.log[0].subjectId, e.key({ x: 1 }), 'experiment marks the subjectId')
    t.equal(e.log[0].choice.y, 2, 'experiment marks the choice')
    t.equal(e.choose({ x: 4 }).y, 2, 'eligible subject got grouping value')
    t.equal(e.log[1].subjectId, e.key({ x: 4 }), 'experiment marks the subjectId')
    t.equal(e.log[1].choice.y, 2, 'experiment marks the choice')
    t.end()
  }
)

test(
  'choose throws if the groupingFunction does not return all independentVariables',
  function (t) {
    var e = new AB.Experiment({
      independentVariables: {
        x: 0,
        y: 1
      },
      eligibilityFunction: function () { return true },
      groupingFunction: function () { return { y: 2 } }
    })
    t.throws(e.choose.bind(e, {}), /groupingFunction must return : x/)
    t.end()
  }
)

test(
  'setConflict links both ways',
  function (t) {
    var e1 = new AB.Experiment({ name: 'one' })
    var e2 = new AB.Experiment({ name: 'two' })
    e1.setConflict([e2])
    t.equal(e1.conflictsWith['two'], true, 'one conflicts with two')
    t.equal(e2.conflictsWith['one'], true, 'two conflicts with one')
    t.end()
  }
)

test(
  'experiment has access to the defaults via this.defaults',
  function (t) {
    t.plan(1)
    var e = new AB.Experiment({
      independentVariables: ['x'],
      eligibilityFunction: function () { return true },
      groupingFunction: function () {
        t.equal(this.defaults.x, 1, 'default is accessible')
        return { x: 2 }
      },
      defaults: { x: 1 }
    })
    e.choose({})
    t.end()
  }
)

test(
  'a mark gets appended to the log',
  function (t) {
    var x = new AB.Experiment({ name: 'one' })
    x.mark('test', { foo: 1 })
    t.equal(x.log[0].event, 'test', 'event set')
    t.equal(x.log[0].data.foo, 1, 'data set')
    t.end()
  }
)

test(
  'isWatching is true when a watch is set',
  function (t) {
    var x = new AB.Experiment({ name: 'one', watch: ['test'] })
    t.equal(x.isWatching('test'), true)
    t.equal(x.isWatching('other'), false)
    t.end()
  }
)

test(
  'when a release is set choose ... TODO',
  function (t) {
    var x = new AB.Experiment(
      {
        name: 'one',
        release: {
          startDate: (new Date()).toISOString(),
          endDate: (new Date()).toISOString()
        }
      }
    )
    x.choose({})
    t.end()
  }
)
