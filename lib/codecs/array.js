'use strict';

module.exports = function (Struct) {
  Struct.addCodec('array', function (options) {
    var size = options.length;
    var codec = options.type;
    return {
      serialize: function (value) {
        for (var i = 0; i < size; i++) {
          var item = value[i];
          if (codec instanceof Struct) {
            codec.serialize(item, this);
          } else {
            codec.serialize.call(this, item);
          }
        }
      },
      parse: function () {
        var items = [];
        for (var i = 0; i < size; i++) {
          if (codec instanceof Struct) {
            items.push(codec.parse(null, this));
          } else {
            items.push(codec.parse.call(this));
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
