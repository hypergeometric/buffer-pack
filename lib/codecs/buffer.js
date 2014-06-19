'use strict';

module.exports = function (Packer) {
  Packer.addCodec('buffer', function (options) {
    var size = options.length;
    return {
      pack: function (value) {
        value = typeof value !== 'undefined' ? value : options.default;
        var length = size;
        if (typeof size === 'function') {
          length = size.call(value);
        }
        value.copy(this.buffer, this.offset || 0, 0, length);
        this.offset += length;
      },
      unpack: function (obj) {
        var length = size;
        if (typeof size === 'function') {
          length = size.call(obj);
        }
        var value = this.buffer.slice(this.offset, this.offset + length);
        this.offset += length;
        return value;
      },
      size: function (value) {
        if (typeof size === 'function') {
          return value.length;
        }
        return size;
      }
    };
  });
};
