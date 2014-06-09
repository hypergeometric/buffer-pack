var Struct = require('../');

Struct.addCodec('lvaruint', {
  serialize: function (value) {
    if (value < 0xfd) {
      Struct.codecs.uint8().serialize.call(this, value);
    } else if (value <= 0xffff) {
      Struct.codecs.uint8().serialize.call(this, 0xfd);
      Struct.codecs.uint16le().serialize.call(this, value);
    } else if (value <= 0xffffffff) {
      Struct.codecs.uint8().serialize.call(this, 0xfe);
      Struct.codecs.uint32le().serialize.call(this, value);
    } else {
      Struct.codecs.uint8().serialize.call(this, 0xff);
      Struct.codecs.uint64le().serialize.call(this, value);
    }
  },
  parse: function () {
    var first = Struct.codecs.uint8().parse.call(this);
    if (first < 0xfd) {
      return first;
    } else if (first === 0xfd) {
      return Struct.codecs.uint16le().parse.call(this);
    } else if (first === 0xfe) {
      return Struct.codecs.uint32le().parse.call(this);
    } else {
      return Struct.codecs.uint64le().parse.call(this);
    }
  },
  size: function (value) {
    if (value < 0xfd) {
      return 1;
    } else if (value <= 0xffff) {
      return 3;
    } else if (value <= 0xffffffff) {
      return 5;
    } else {
      return 9;
    }
  }
});

Struct.addCodec('default', function (options) {
  var defaultValue = options.default || 0xff;
  return {
    serialize: function (value) {
      Struct.codecs.uint8().serialize.call(this, value || defaultValue);
    },
    parse: function () {
      return Struct.codecs.uint8().parse.call(this);
    },
    size: function () {
      return 1;
    }
  };
});

function assertCodec(codec, value, hex) {
  assertCodecEncode(codec, value, hex);
  assertCodecDecode(codec, value, hex);
}

function assertCodecEncode(codec, value, hex) {
  var serialized = new Buffer(codec.size(value));
  serialized.fill(0xff);
  codec.serialize.call({ buffer: serialized, offset: 0 }, value);
  expect(serialized).to.deep.equal(new Buffer(hex, 'hex'));
}

function assertCodecDecode(codec, value, hex) {
  var parsed = codec.parse.call({ buffer: new Buffer(hex, 'hex'), offset: 0 });
  expect(parsed).to.deep.equal(value);
}

function assertStruct(struct, value, hex) {
  expect(struct.serialize(value).toString('hex')).to.deep.equal(hex);
  expect(struct.parse(new Buffer(hex, 'hex'))).to.deep.equal(value);
}

describe('struct', function () {
  describe('codecs', function () {
    it('uint8 (8-bit number)', function () {
      assertCodec(Struct.codecs.uint8(), 1, '01');
    });

    it('int8 (signed 8-bit number)', function () {
      var codec = Struct.codecs.int8();
      assertCodec(codec, 15, '0f');
      assertCodec(codec, -1, 'ff');
      assertCodec(codec, -8, 'f8');
    });

    it('uint16be (big-endian 16-bit number)', function () {
      assertCodec(Struct.codecs.uint16be(), 500, '01f4');
    });

    it('uint16le (little-endian 16-bit number)', function () {
      var codec = Struct.codecs.uint16le();
      assertCodec(codec, 1, '0100');
      assertCodec(codec, 500, 'f401');
      assertCodec(codec, 596, '5402');
    });

    it('int16be (big-endian signed 16-bit number)', function () {
      var codec = Struct.codecs.int16be();
      assertCodec(codec, 500, '01f4');
      assertCodec(codec, -1, 'ffff');
      assertCodec(codec, -56, 'ffc8');
      assertCodec(codec, -4324, 'ef1c');
    });

    it('int16le (little-endian signed 16-bit number)', function () {
      var codec = Struct.codecs.int16le();
      assertCodec(codec, 500, 'f401');
      assertCodec(codec, -1, 'ffff');
      assertCodec(codec, -56, 'c8ff');
      assertCodec(codec, -4324, '1cef');
    });

    it('uint32be (big-endian 32-bit number)', function () {
      var codec = Struct.codecs.uint32be();
      assertCodec(codec, 500, '000001f4');
      assertCodec(codec, 3435978205, 'ccccdddd');
    });

    it('uint32le(little-endian 32-bit number)', function () {
      var codec = Struct.codecs.uint32le();
      assertCodec(codec, 500, 'f4010000');
      assertCodec(codec, 3435978205, 'ddddcccc');
    });

    it('int32be (big-endian signed 32-bit number)', function () {
      var codec = Struct.codecs.int32be();
      assertCodec(codec, 500, '000001f4');
      assertCodec(codec, -1, 'ffffffff');
      assertCodec(codec, -1232321, 'ffed323f');
    });

    it('int32le (little-endian signed 32-bit number)', function () {
      var codec = Struct.codecs.int32le();
      assertCodec(codec, 500, 'f4010000');
      assertCodec(codec, -1, 'ffffffff');
      assertCodec(codec, -1232321, '3f32edff');
    });

    it('uint64be (big-endian 64-bit number)', function () {
      var codec = Struct.codecs.uint64be();
      assertCodec(codec, 500, '00000000000001f4');
      assertCodec(codec, Math.pow(2, 53) - 1, '001fffffffffffff');
      expect(function () {
        codec.serialize(Math.pow(2, 53));
      }).to.throw();
    });

    it('uint64le (little-endian 64-bit number)', function () {
      var codec = Struct.codecs.uint64le();
      assertCodec(codec, 500, 'f401000000000000');
      assertCodec(codec, Math.pow(2, 53) - 1, 'ffffffffffff1f00');
      expect(function () {
        codec.serialize(Math.pow(2, 53));
      }).to.throw();
    });

    it('int64be (big-endian signed 64-bit number)', function () {
      var codec = Struct.codecs.int64be();
      assertCodec(codec, 500, '00000000000001f4');
      assertCodec(codec, -500, 'fffffffffffffe0c');
      assertCodec(codec, -(Math.pow(2, 53) - 1), 'ffe0000000000001');
      expect(function () {
        codec.serialize(-Math.pow(2, 53));
      }).to.throw();
    });

    it('int64le (little-endian signed 64-bit number)', function () {
      var codec = Struct.codecs.int64le();
      assertCodec(codec, 500, 'f401000000000000');
      assertCodec(codec, -500, '0cfeffffffffffff');
      assertCodec(codec, -(Math.pow(2, 53) - 1), '010000000000e0ff');
      expect(function () {
        codec.serialize(-Math.pow(2, 53));
      }).to.throw();
    });

    it('buffer', function () {
      var codec = Struct.codecs.buffer({ length: 4 });
      assertCodec(codec, new Buffer([1, 2, 3, 4]), '01020304');
    });

    it('str(ascii)', function () {
      var codec = Struct.codecs.str({ length: 2, encoding: 'ascii' });
      assertCodec(codec, 'ab', '6162');
    });

    it('str(utf8)', function () {
      var codec = Struct.codecs.str({ length: 3, encoding: 'utf8' });
      assertCodec(codec, '4\u00a3', '34c2a3');
    });

    it('str(utf8, pad)', function () {
      var codec = Struct.codecs.str({ length: 3, pad: 'a' });
      assertCodec(codec, '4', '346161');

      codec = Struct.codecs.str({ length: 3, pad: 0 });
      assertCodec(codec, '4', '340000');
    });

    it('array', function () {
      var codec = Struct.codecs.array({ length: 3, type: Struct.codecs.uint8() });
      assertCodec(codec, [1, 2, 3], '010203');
    });

    it('custom codec (lvaruint)', function () {
      var codec = Struct.codecs.lvaruint;
      assertCodec(codec, 0x00, '00');
      assertCodec(codec, 0xfc, 'fc');
      assertCodec(codec, 0x00fd, 'fdfd00');
      assertCodec(codec, 0x0100, 'fd0001');
      assertCodec(codec, 0xffff, 'fdffff');
      assertCodec(codec, 0x00010000, 'fe00000100');
      assertCodec(codec, 0xffffffff, 'feffffffff');
      assertCodec(codec, 0x0000000100000000, 'ff0000000001000000');
      assertCodec(codec, 0x001fffffffffffff, 'ffffffffffffff1f00');
    });
  });

  describe('core types', function () {
    it('uint8 (8-bit number)', function () {
      var struct = Struct().uint8('foo');
      assertStruct(struct, { foo: 1 }, '01');
    });

    it('int8 (signed 8-bit number)', function () {
      var struct = Struct().int8('foo');
      assertStruct(struct, { foo: 15 }, '0f');
      assertStruct(struct, { foo: -1 }, 'ff');
      assertStruct(struct, { foo: -8 }, 'f8');
    });

    it('uint16be (big-endian 16-bit number)', function () {
      var struct = Struct().uint16be('foo');
      assertStruct(struct, { foo: 500 }, '01f4');
    });

    it('uint16le (little-endian 16-bit number)', function () {
      var foo = Struct().uint16le('foo');
      assertStruct(foo, { foo: 1 }, '0100');
      assertStruct(foo, { foo: 500 }, 'f401');
      assertStruct(foo, { foo: 596 }, '5402');
    });

    it('int16be (big-endian signed 16-bit number)', function () {
      var struct = Struct().int16be('foo');
      assertStruct(struct, { foo: 500 }, '01f4');
      assertStruct(struct, { foo: -1 }, 'ffff');
      assertStruct(struct, { foo: -56 }, 'ffc8');
      assertStruct(struct, { foo: -4324 }, 'ef1c');
    });

    it('int16le (little-endian signed 16-bit number)', function () {
      var struct = Struct().int16le('foo');
      assertStruct(struct, { foo: 500 }, 'f401');
      assertStruct(struct, { foo: -1 }, 'ffff');
      assertStruct(struct, { foo: -56 }, 'c8ff');
      assertStruct(struct, { foo: -4324 }, '1cef');
    });

    it('uint32be (big-endian 32-bit number)', function () {
      var struct = Struct().uint32be('foo');
      assertStruct(struct, { foo: 500 }, '000001f4');
      assertStruct(struct, { foo: 3435978205 }, 'ccccdddd');
    });

    it('uint32le (little-endian 32-bit number)', function () {
      var struct = Struct().uint32le('foo');
      assertStruct(struct, { foo: 500 }, 'f4010000');
      assertStruct(struct, { foo: 3435978205 }, 'ddddcccc');
    });

    it('int32be (big-endian signed 32-bit number)', function () {
      var struct = Struct().int32be('foo');
      assertStruct(struct, { foo: 500 }, '000001f4');
      assertStruct(struct, { foo: -1 }, 'ffffffff');
      assertStruct(struct, { foo: -1232321 }, 'ffed323f');
    });

    it('int32le (little-endian signed 32-bit number)', function () {
      var struct = Struct().int32le('foo');
      assertStruct(struct, { foo: 500 }, 'f4010000');
      assertStruct(struct, { foo: -1 }, 'ffffffff');
      assertStruct(struct, { foo: -1232321 }, '3f32edff');
    });

    it('uint64be (big-endian 64-bit number)', function () {
      var struct = Struct().uint64be('foo').uint64be('bar');
      assertStruct(struct, { foo: 500, bar: 501 }, '00000000000001f4' + '00000000000001f5');
      assertStruct(struct, { foo: Math.pow(2, 53) - 1, bar: Math.pow(2, 53) - 2 }, '001fffffffffffff' + '001ffffffffffffe');
      expect(function () {
        struct.serialize({ foo: Math.pow(2, 53), bar: Math.pow(2, 53) });
      }).to.throw();
    });

    it('uint64le (little-endian 64-bit number)', function () {
      var struct = Struct().uint64le('foo').uint64le('bar');
      assertStruct(struct, { foo: 500, bar: 501 }, 'f401000000000000' + 'f501000000000000');
      assertStruct(struct, { foo: Math.pow(2, 53) - 1, bar: Math.pow(2, 53) - 2 }, 'ffffffffffff1f00' + 'feffffffffff1f00');
      expect(function () {
        struct.serialize({ foo: Math.pow(2, 53), bar:Math.pow(2, 53) });
      }).to.throw();
    });

    it('int64be (big-endian signed 64-bit number)', function () {
      var struct = Struct().int64be('foo').int64be('bar');
      assertStruct(struct, { foo: 500, bar: 501 }, '00000000000001f4' + '00000000000001f5');
      assertStruct(struct, { foo: -500, bar: -501 }, 'fffffffffffffe0c' + 'fffffffffffffe0b');
      assertStruct(struct, { foo: -(Math.pow(2, 53) - 1), bar: -(Math.pow(2, 53) - 2) }, 'ffe0000000000001' + 'ffe0000000000002');
      expect(function () {
        struct.serialize({ foo: -Math.pow(2, 53), bar: -Math.pow(2, 53) });
      }).to.throw();
    });

    it('int64le (little-endian signed 64-bit number)', function () {
      var struct = Struct().int64le('foo').int64le('bar');
      assertStruct(struct, { foo: 500, bar: 501 }, 'f401000000000000' + 'f501000000000000');
      assertStruct(struct, { foo: -500, bar: -501 }, '0cfeffffffffffff' + '0bfeffffffffffff');
      assertStruct(struct, { foo: -(Math.pow(2, 53) - 1), bar: -(Math.pow(2, 53) - 2) }, '010000000000e0ff' + '020000000000e0ff');
      expect(function () {
        struct.serialize({ foo: -Math.pow(2, 53), bar: -Math.pow(2, 53) });
      }).to.throw();
    });

    it('buffer', function () {
      var struct = Struct()
        .buffer('foo', {
          length: 4
        })
        .buffer('bar', {
          length: 3
        });
      assertStruct(struct, { foo: new Buffer([1, 2, 3, 4]), bar: new Buffer([5, 6, 7]) }, '01020304050607');
    });

    it('str', function () {
      var struct = Struct()
        .str('foo', {
          length: 2,
          encoding: 'ascii'
        })
        .str('bar', {
          length: 3,
          encoding: 'utf8'
        });
      assertStruct(struct, { foo: 'ab', bar: '\u00a34' }, '6162c2a334');
    });

    it('array (codec)', function () {
      var struct = Struct()
        .array('foo', {
          length: 2,
          type: Struct.codecs.uint8()
        });
      assertStruct(struct, { foo: [8, 16] }, '0810');
    });

    it('array (struct)', function () {
      var struct = Struct()
        .array('foo', {
          length: 2,
          type: Struct().uint8('bar')
        });
      assertStruct(struct, { foo: [{ bar: 8 }, { bar: 16 }] }, '0810');
    });
  });

  it('default values', function () {
    var struct = Struct()
      .uint8('foo', { default: 0xcc })
      .uint8('bar', { default: 0xff });
    assertStruct(struct, { foo: 1, bar: 2 }, '0102');
    expect(struct.serialize({}).toString('hex')).to.equal('ccff');
    expect(struct.parse(new Buffer('abcd', 'hex'))).to.deep.equal({ foo: 0xab, bar: 0xcd });
  });

  it('variable length buffer', function () {
    var struct = Struct()
      .uint8('len')
      .buffer('buf', {
        length: function () { return this.len; }
      });
    assertStruct(struct, { len: 0, buf: new Buffer(0) }, '00');
    assertStruct(struct, { len: 1, buf: new Buffer([0]) }, '0100');
    assertStruct(struct, { len: 8, buf: new Buffer([0, 1, 2, 3, 4, 5, 6, 7]) }, '080001020304050607');
  });

  it('nested arrays', function () {
    var struct = Struct()
      .array('first', {
        length: 3,
        type: Struct()
          .array('second', {
            length: 2,
            type: Struct()
              .array('third', { length: 1, type: Struct.codecs.uint8() })
          })
      });
    assertStruct(struct, {
      first: [
        {
          second: [
            { third: [1] },
            { third: [2] }
          ]
        },
        {
          second: [
            { third: [3] },
            { third: [4] }
          ]
        },
        {
          second: [
            { third: [5] },
            { third: [6] }
          ]
        }
      ]
    }, '010203040506');
  });

  it('complex example (including custom codec)', function () {
    var struct = Struct()
      .uint8('uint8')
      .int32le('int32le')
      .array('array', {
        length: 2,
        type: Struct()
          .str('str', { length: 10 })
          .uint16be('uint16be')
          .buffer('buffer', { length: 4 })
          .lvaruint('lvaruint')
      })
      .array('array2', {
        length: 3,
        type: Struct()
          .uint32be('uint32be')
      });
    assertStruct(struct, {
      uint8: 32,
      int32le: -432213214,
      array: [
        {
          str: 'hellothere',
          uint16be: 256,
          buffer: new Buffer([0x10, 0x12, 0x14, 0x16]),
          lvaruint: 0x01
        },
        {
          str: 'goodbyenow',
          uint16be: 65535,
          buffer: new Buffer([0x0f, 0x0d, 0x0b, 0x09]),
          lvaruint: 0x2345
        }
      ],
      array2: [
        { uint32be: 0 },
        { uint32be: Math.pow(2, 32) - 1 },
        { uint32be: 12345678 }
      ]
    }, '20' + '22f33ce6' +
      '68656c6c6f7468657265' + '0100' + '10121416' + '01' +
      '676f6f646279656e6f77' + 'ffff' + '0f0d0b09' + 'fd4523' +
      '00000000' + 'ffffffff' + '00bc614e'
    );
  });
});

