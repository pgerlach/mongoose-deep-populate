# Mongoose deep populate

Quick and dirty replacement for [mongoose-deep-populate](https://github.com/buunguyen/mongoose-deep-populate) plugin that is not maintained anymore. Uses the multiple level population introduced in Mongoose > 4 (?).

## Usage

### setup
```
mongoose.plugin(require('mongoose-deep-populate'))
```

### usage
```
MySchema.find({}).deepPopulate("foo.bar baz")
```
```
const doc = await MySchema.findOne({});
await doc.deepPopulate("foo.bar baz").execPopulate();
```
