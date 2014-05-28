'use strict';

module.exports = function (Struct) {
  Struct.addCodec('buffer', function (size) {
    return {
      encode: function (value) {
        value.copy(this.buffer, this.offset || 0, 0, size);
        this.offset += size;
      },
      decode: function () {
        var value = this.buffer.slice(this.offset, this.offset + size);
        this.offset += size;
        return value;
      },
      size: function () {
        return size;
      }
    };
  });
};
