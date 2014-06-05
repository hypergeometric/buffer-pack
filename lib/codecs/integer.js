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
  Struct.addCodec('uint8', intCodec(1, 'UInt8'));
  Struct.addCodec('int8', intCodec(1, 'Int8'));

  Struct.addCodec('uint16be', intCodec(2, 'UInt16BE'));
  Struct.addCodec('uint16le', intCodec(2, 'UInt16LE'));
  Struct.addCodec('int16be', intCodec(2, 'Int16BE'));
  Struct.addCodec('int16le', intCodec(2, 'Int16LE'));

  Struct.addCodec('uint32be', intCodec(4, 'UInt32BE'));
  Struct.addCodec('uint32le', intCodec(4, 'UInt32LE'));
  Struct.addCodec('int32be', intCodec(4, 'Int32BE'));
  Struct.addCodec('int32le', intCodec(4, 'Int32LE'));

  Struct.addCodec('uint64be', int64Codec(false, true));
  Struct.addCodec('uint64le', int64Codec(false, false));
  Struct.addCodec('int64be', int64Codec(true, true));
  Struct.addCodec('int64le', int64Codec(true, false));
};
