'use strict';

function Context(buffer) {
  this.buffer = buffer;
  this.offset = 0;
}

function Struct() {
  if (!(this instanceof Struct)) {
    return new Struct();
  }
  this.fields = [];
  return this;
}

Struct.prototype.encode = function (obj, context) {
  context = context || new Context(new Buffer(this.size(obj)));
  this.fields.forEach(function (field) {
    field.encode.call(context, obj);
  });
  return context.buffer;
};

Struct.prototype.decode = function (buffer, context) {
  context = context || new Context(buffer);
  var obj = {};
  this.fields.forEach(function (field) {
    field.decode.call(context, obj);
  });
  return obj;
};

Struct.prototype.size = function (obj) {
  var length = 0;
  this.fields.forEach(function (field) {
    length += field.size(obj);
  });
  return length;
};

function fieldify(_codec) {
  return function (name) {
    var codec = _codec;
    if (typeof codec === 'function') {
      codec = codec.apply(null, Array.prototype.slice.call(arguments, 1));
    }
    this.fields.push({
      encode: function(obj) {
        codec.encode.call(this, obj[name]);
      },
      decode: function (obj) {
        obj[name] = codec.decode.call(this);
      },
      size: function (obj) {
        return codec.size(obj[name]);
      }
    });
    return this;
  };
}

Struct.codecs = {};

Struct.addCodec = function (type, codec) {
  Struct.codecs[type] = codec;
  Struct.prototype[type] = fieldify(codec);
};

require('./codecs/integer')(Struct);
require('./codecs/buffer')(Struct);
require('./codecs/string')(Struct);
require('./codecs/array')(Struct);

module.exports = Struct;
