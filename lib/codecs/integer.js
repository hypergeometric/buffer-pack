'use strict';

var MAX_SAFE_INTEGER = Math.pow(2, 53) - 1;

function intCodec(size, method) {
  var readMethod = 'read' + method;
  var writeMethod = 'write' + method;
  return function (options) {
    return {
      pack: function (value) {
        value = typeof value !== 'undefined' ? value : options.default;
        this.buffer[writeMethod](value, this.offset);
        this.offset += size;
      },
      unpack: function () {
        var value = this.buffer[readMethod](this.offset);
        this.offset += size;
        return value;
      },
      size: function () {
        return size;
      }
    };
  }
}

function int64Codec(signed, be) {
  var hiOffset = be ? 0 : 4;
  var loOffset = be ? 4 : 0;
  return function (options) {
    if (signed) {
      return {
        pack: function (value) {
          value = typeof value !== 'undefined' ? value : options.default;
          if (Math.abs(value) > MAX_SAFE_INTEGER) {
            throw new Error('Unsafe integer');
          }
          this.buffer['writeInt32' + (be ? 'BE' : 'LE')](Math.floor(value / Math.pow(2, 32)), this.offset + hiOffset);
          this.buffer['writeUInt32' + (be ? 'BE' : 'LE')](value >>> 0, this.offset + loOffset);
          this.offset += 8;
        },
        unpack: function () {
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
        pack: function (value) {
          value = typeof value !== 'undefined' ? value : options.default;
          if (Math.abs(value) > MAX_SAFE_INTEGER) {
            throw new Error('Unsafe integer');
          }
          this.buffer['writeUInt32' + (be ? 'BE' : 'LE')]((value / Math.pow(2, 32)) >> 0, this.offset + hiOffset);
          this.buffer['writeUInt32' + (be ? 'BE' : 'LE')](value >>> 0, this.offset + loOffset);
          this.offset += 8;
        },
        unpack: function () {
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
}

module.exports = function (Packer) {
  Packer.addCodec('uint8', intCodec(1, 'UInt8'));
  Packer.addCodec('int8', intCodec(1, 'Int8'));

  Packer.addCodec('uint16be', intCodec(2, 'UInt16BE'));
  Packer.addCodec('uint16le', intCodec(2, 'UInt16LE'));
  Packer.addCodec('int16be', intCodec(2, 'Int16BE'));
  Packer.addCodec('int16le', intCodec(2, 'Int16LE'));

  Packer.addCodec('uint32be', intCodec(4, 'UInt32BE'));
  Packer.addCodec('uint32le', intCodec(4, 'UInt32LE'));
  Packer.addCodec('int32be', intCodec(4, 'Int32BE'));
  Packer.addCodec('int32le', intCodec(4, 'Int32LE'));

  Packer.addCodec('uint64be', int64Codec(false, true));
  Packer.addCodec('uint64le', int64Codec(false, false));
  Packer.addCodec('int64be', int64Codec(true, true));
  Packer.addCodec('int64le', int64Codec(true, false));
};
