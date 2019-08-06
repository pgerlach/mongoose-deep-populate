const mongoose = require('mongoose');

const SchemaTypesObjectId = mongoose.Schema.Types.ObjectId;
const SchemaTypesArray = mongoose.Schema.Types.Array;

function deepPopulate(paths, opts) {
  const self = this;
  opts = {
    select: [],
    ...opts
  };

  if (typeof paths === "string") {
    paths = paths.split(" ");
  }

  for (const path of paths) {

    // check for arrays that we should not populate
    let schema = self.schema;
    const splits = [];
    let stack = [];

    for (let subPath of path.split('.')) {
      let skip = false;
      schema = schema.path(subPath);
      if (schema instanceof SchemaTypesObjectId) {
        if (schema.options.ref) {
          const modelName = schema.options.ref;
          schema = mongoose.model(modelName).schema;
        } else {
          console.log("WARNING: deepPopulate, there may be a problem here (1)");
        }
      } else if (schema instanceof SchemaTypesArray) {
        if (schema.caster && schema.caster.options.ref) {
          const modelName = schema.caster.options.ref;
          schema = mongoose.model(modelName).schema;
        } else {
          schema = schema.schema;
          skip = true;
        }
      } else {
        console.log("WARNING: deepPopulate, there may be a problem here (2)");
      }
      stack.push(subPath);
      if (skip) {
        continue;
      }
      splits.push(stack.join('.'));
      stack = [];
    };

    // now build the populate arg
    let res;
    while (splits.length) {
      const subPath = splits.pop();
      if (res) {
        res = {
          path: subPath,
          populate: res
        }
      } else {
        res = {
          path: subPath
        }
      }
    }

    // add select opts
    let tmp = res;
    let currPath = [];
    while (tmp) {
      currPath.push(tmp.path);
      const selectVal = opts.select[currPath.join(".")];
      if (selectVal) {
        tmp.select = selectVal;
      }
      tmp = tmp.populate;
    }

    self.populate(res);
  }

  return self;
};

// add deepPopulate to Query prototype
mongoose.Query.prototype.deepPopulate = deepPopulate;

module.exports = function deepPopulatePlugin(schema, options) {
  // add deepPopulate to each schema. Don't forget to call execPopulate() afterwards !
  schema.methods.deepPopulate = deepPopulate;
}
