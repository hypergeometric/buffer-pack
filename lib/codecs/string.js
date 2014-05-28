'use strict';

module.exports = function (Struct) {
  Struct.addCodec('str', function (options) {
    var size = options.length;
    var encoding = options.encoding || 'utf8';
    return {
      encode: function (value) {
        this.buffer.write(value, this.offset || 0, size, encoding);
        this.offset += size;
      },
      decode: function () {
        var value = this.buffer.toString(encoding, this.offset, this.offset + size);
        this.offset += size;
        return value;
      },
      size: function () {
        return size;
      }
    };
  });
};
