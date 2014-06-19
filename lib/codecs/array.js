'use strict';

module.exports = function (Packer) {
  Packer.addCodec('array', function (options) {
    var size = options.length;
    var codec = options.type;
    return {
      pack: function (value) {
        value = typeof value !== 'undefined' ? value : options.default;
        for (var i = 0; i < size; i++) {
          var item = value[i];
          if (codec instanceof Packer) {
            codec.pack(item, this);
          } else {
            codec.pack.call(this, item);
          }
        }
      },
      unpack: function () {
        var items = [];
        for (var i = 0; i < size; i++) {
          if (codec instanceof Packer) {
            items.push(codec.unpack(null, this));
          } else {
            items.push(codec.unpack.call(this));
          }
        }
        return items;
      },
      size: function (value) {
        var length = 0;
        for (var i = 0; i < size; i++) {
          length += codec.size(value[i]);
        }
        return length;
      }
    };
  });
};
