'use strict';

var MAX_SAFE_INTEGER = Math.pow(2, 53) - 1;

function intCodec(size, method) {
  var readMethod = 'read' + method;
  var writeMethod = 'write' + method;
  return {
    serialize: function (value) {
      this.buffer[writeMethod](value, this.offset);
      this.offset += size;
    },
    parse: function () {
      var value = this.buffer[readMethod](this.offset);
      this.offset += size;
      return value;
    },
    size: function () {
      return size;
    }
  };
}

function int64Codec(signed, be) {
  var hiOffset = be ? 0 : 4;
  var loOffset = be ? 4 : 0;
  if (signed) {
    return {
      serialize: function (value) {
        if (Math.abs(value) > MAX_SAFE_INTEGER) {
          throw new Error('Unsafe integer');
        }
        this.buffer['writeInt32' + (be ? 'BE' : 'LE')](Math.floor(value / Math.pow(2, 32)), this.offset + hiOffset);
        this.buffer['writeUInt32' + (be ? 'BE' : 'LE')](value >>> 0, this.offset + loOffset);
        this.offset += 8;
      },
      parse: function () {
        var high = this.buffer['readInt32' + (be ? 'BE' : 'LE')](this.offset + hiOffset) * Math.pow(2, 32);
        var low = this.buffer['readUInt32' + (be ? 'BE' : 'LE')](this.offset + loOffset);
        this.offset += 8;
        return high + low;
      },
      size: function () {
        return 8;
      }
    };
  } else {
    return {
      serialize: function (value) {
        if (Math.abs(value) > MAX_SAFE_INTEGER) {
          throw new Error('Unsafe integer');
        }
        this.buffer['writeUInt32' + (be ? 'BE' : 'LE')]((value / Math.pow(2, 32)) >> 0, this.offset + hiOffset);
        this.buffer['writeUInt32' + (be ? 'BE' : 'LE')](value >>> 0, this.offset + loOffset);
        this.offset += 8;
      },
      parse: function () {
        var high = this.buffer['readUInt32' + (be ? 'BE' : 'LE')](this.offset + hiOffset) * Math.pow(2, 32);
        var low = this.buffer['readUInt32' + (be ? 'BE' : 'LE')](this.offset + loOffset);
        this.offset += 8;
        return high + low;
      },
      size: function () {
        return 8;
      }
    };
  }
}

module.exports = function (Struct) {
  Struct.addCodec('b8', intCodec(1, 'UInt8'));
  Struct.addCodec('l8', intCodec(1, 'UInt8'));
  Struct.addCodec('b8s', intCodec(1, 'Int8'));
  Struct.addCodec('l8s', intCodec(1, 'Int8'));

  Struct.addCodec('b16', intCodec(2, 'UInt16BE'));
  Struct.addCodec('l16', intCodec(2, 'UInt16LE'));
  Struct.addCodec('b16s', intCodec(2, 'Int16BE'));
  Struct.addCodec('l16s', intCodec(2, 'Int16LE'));

  Struct.addCodec('b32', intCodec(4, 'UInt32BE'));
  Struct.addCodec('l32', intCodec(4, 'UInt32LE'));
  Struct.addCodec('b32s', intCodec(4, 'Int32BE'));
  Struct.addCodec('l32s', intCodec(4, 'Int32LE'));

  Struct.addCodec('b64', int64Codec(false, true));
  Struct.addCodec('l64', int64Codec(false, false));
  Struct.addCodec('b64s', int64Codec(true, true));
  Struct.addCodec('l64s', int64Codec(true, false));
};
