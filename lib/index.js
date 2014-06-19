'use strict';

function Context(buffer) {
  this.buffer = buffer;
  this.offset = 0;
}

function Packer() {
  if (!(this instanceof Packer)) {
    return new Packer();
  }
  this.fields = [];
  return this;
}

Packer.prototype.pack = function (obj, context) {
  context = context || new Context(new Buffer(this.size(obj)));
  this.fields.forEach(function (field) {
    field.pack.call(context, obj);
  });
  return context.buffer;
};

Packer.prototype.unpack = function (buffer, context) {
  context = context || new Context(buffer);
  var obj = {};
  this.fields.forEach(function (field) {
    field.unpack.call(context, obj);
  });
  return obj;
};

Packer.prototype.size = function (obj) {
  var length = 0;
  this.fields.forEach(function (field) {
    length += field.size(obj);
  });
  return length;
};

function fieldify(_codec) {
  return function (name, options) {
    var codec = _codec;
    if (typeof codec === 'function') {
      codec = codec(options || {});
    }
    this.fields.push({
      pack: function(obj) {
        codec.pack.call(this, obj[name]);
      },
      unpack: function (obj) {
        obj[name] = codec.unpack.call(this, obj);
      },
      size: function (obj) {
        return codec.size(obj[name]);
      }
    });
    return this;
  };
}

Packer.codecs = {};

Packer.addCodec = function (type, codec) {
  Packer.codecs[type] = codec;
  Packer.prototype[type] = fieldify(codec);
};

require('./codecs/integer')(Packer);
require('./codecs/buffer')(Packer);
require('./codecs/string')(Packer);
require('./codecs/array')(Packer);

module.exports = Packer;
