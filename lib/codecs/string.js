'use strict';

module.exports = function (Struct) {
  Struct.addCodec('str', function (options) {
    var size = options.length;
    var encoding = options.encoding || 'utf8';
    return {
      encode: function (value) {
        var length = Buffer.byteLength(value, encoding);
        var written = this.buffer.write(value, this.offset || 0, size, encoding);
        if (typeof options.pad !== 'undefined' && written < size) {
          this.buffer.fill(options.pad, this.offset + written, this.offset + size);
        }
        this.offset += size;
      },
      decode: function () {
        var value = this.buffer.toString(encoding, this.offset, this.offset + size);
        if (typeof options.pad !== 'undefined') {
          var pad = typeof options.pad === 'number' ? String.fromCharCode(options.pad) : options.pad;
          value = value.replace(new RegExp(pad + '*$'), '');
        }
        this.offset += size;
        return value;
      },
      size: function () {
        return size;
      }
    };
  });
};
