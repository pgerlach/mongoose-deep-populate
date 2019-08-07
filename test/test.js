const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const ObjectId = mongoose.Types.ObjectId;
const assert = require('assert');

const deepPopulate = require('..');

describe('mongoose-deep-populate', function() {

  before(async function() {
    // empty the test db and fill it with test objects. Subsequent tests do
    // only read, so the db is not modified between each one.
    await setup();
  });

  after(async function() {
    await teardown();
  });

  describe('deepPopulate', function() {

    it('one level', async function() {
      const A = mongoose.model('A');
      const res = await A.findOne().deepPopulate("b");
      assert.ok(!!(res.b.foo), "b.foo should be there");
      assert.ok(!!(res.b.bar), "b.bar should be there");
      assert.ok(!!(res.b.c), "b.c should be there");
      assert.ok(!!(res.b.c2), "b.c2 should be there");
      assert.ok(res.b.c instanceof ObjectId, "b.c should be ObjectId");
      assert.ok(res.b.c2 instanceof ObjectId, "b.c2 should be ObjectId");
    });

    it('two levels', async function() {
      const A = mongoose.model('A');
      const res = await A.findOne().deepPopulate("b.c");

      assert.ok(!!(res.b.foo), "b.foo should be there");
      assert.ok(!!(res.b.bar), "b.bar should be there");
      assert.ok(!!(res.b.c), "b.c should be there");
      assert.ok(!!(res.b.c2), "b.c2 should be there");

      assert.ok(!!(res.b.c.foo), "b.c.foo should be there");
      assert.ok(!!(res.b.c.bar), "b.c.bar should be there");
      assert.ok(!!(res.b.c.mystery), "b.c.mystery should be there");
      assert.ok(!!(res.b.c.mystery.foo), "b.c.mystery.foo should be there");
      assert.ok(!!(res.b.c.mystery.bar), "b.c.mystery.bar should be there");

      assert.ok(!!(res.b.c2), "b.c2 should be there");
      assert.ok((res.b.c2 instanceof ObjectId), "b.c2 should be an ObjectId");
    });

    it('two populated items', async function() {
      const A = mongoose.model('A');
      const res = await A.findOne().deepPopulate("b.c b.c2");
      assert.ok(!!(res.b.c.foo), "b.c.foo should be there");
      assert.ok(!!(res.b.c.bar), "b.c.bar should be there");
      assert.ok(!!(res.b.c.mystery), "b.c.mystery should be there");
      assert.ok(!!(res.b.c.mystery.foo), "b.c.mystery.foo should be there");
      assert.ok(!!(res.b.c.mystery.bar), "b.c.mystery.bar should be there");
      assert.ok(!!(res.b.c2.foo), "b.c2.foo should be there");
      assert.ok(!!(res.b.c2.bar), "b.c2.bar should be there");
      assert.ok(!!(res.b.c2.mystery), "b.c2.mystery should be there");
      assert.ok(!!(res.b.c2.mystery.foo), "b.c2.mystery.foo should be there");
      assert.ok(!!(res.b.c2.mystery.bar), "b.c2.mystery.bar should be there");
    });

    it('two levels with select', async function() {
      const A = mongoose.model('A');
      const res = await A.findOne().deepPopulate("b.c", {'b.c': {select: 'foo mystery.foo'}});
      assert.ok(!!(res.b.c.foo), "b.c.foo should be there");
      assert.ok(!!(res.b.c.mystery), "b.c.mystery should be there");
      assert.ok(!!(res.b.c.mystery.foo), "b.c.mystery.foo should be there");
      assert.ok(!(res.b.c.mystery.bar), "b.c.mystery.bar should not be there");
      assert.ok(!!(res.b.c2), "b.c2 should be there");
      assert.ok((res.b.c2 instanceof ObjectId), "b.c2 should be an ObjectId");
    });

    it('two levels with two select', async function() {
      const A = mongoose.model('A');
      const res = await A.findOne().deepPopulate("b.c b.c2", {'b.c': {select: 'foo mystery.foo'}, 'b.c2': {select: 'bar mystery.bar'}});

      assert.ok(!!(res.b.c.foo), "b.c.foo should be there");
      assert.ok(!(res.b.c.bar), "b.c.bar should not be there");
      assert.ok(!!(res.b.c.mystery), "b.c.mystery should be there");
      assert.ok(!!(res.b.c.mystery.foo), "b.c.mystery.foo should be there");
      assert.ok(!(res.b.c.mystery.bar), "b.c.mystery.bar should not be there");

      assert.ok(!(res.b.c2.foo), "b.c2.foo should not be there");
      assert.ok(!!(res.b.c2.bar), "b.c2.bar should be there");
      assert.ok(!!(res.b.c2.mystery), "b.c2.mystery should be there");
      assert.ok(!(res.b.c2.mystery.foo), "b.c2.mystery.foo should not be there");
      assert.ok(!!(res.b.c2.mystery.bar), "b.c2.mystery.bar should  be there");
    });

  });
});

async function setup() {
  mongoose.plugin(deepPopulate);
  await mongoose.connect("mongodb://localhost/TEST_mongoose-deep-populate", { useNewUrlParser: true});
  await mongoose.connection.dropDatabase();
  registerModels();
  await fillDbWithTestData();
}

async function teardown() {
  await mongoose.connection.dropDatabase();
  await mongoose.disconnect();
}

function registerModels() {

  const _registerModel = (name, schemaObj) => (mongoose.model(name, new Schema(schemaObj)));

  _registerModel('A', {
    foo: {
      type: String
    },
    bar: {
      type: String
    },
    b: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'B'
    }
  });

  _registerModel('B', {
    foo: {
      type: String
    },
    bar: {
      type: String
    },
    c: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'C'
    },
    c2: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'C'
    }
  });

  _registerModel('C', {
    foo: {
      type: String
    },
    bar: {
      type: String
    },
    mystery: {
      type: mongoose.Schema.Types.Mixed
    }
  });
}

async function fillDbWithTestData() {
  const [A, B, C] = ['A', 'B', 'C'].map((modelName) => (mongoose.model(modelName)));

  const c = new C({
    foo: "FOO i am C",
    bar: "BAR i am C",
    mystery: {
      foo: "mixedFoo",
      bar: "mixedBar"
    }
  });
  const b = new B({
    foo: "FOO i am B",
    bar: "BAR i am B",
    c,
    c2: c
  });
  const a = new A({
    foo: "FOO i am A",
    bar: "BAR i am A",
    b
  });

  await Promise.all([a.save(), b.save(), c.save()]);
}
