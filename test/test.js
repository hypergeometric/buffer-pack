var Packer = require('../');

Packer.addCodec('lvaruint', {
  pack: function (value) {
    if (value < 0xfd) {
      Packer.codecs.uint8().pack.call(this, value);
    } else if (value <= 0xffff) {
      Packer.codecs.uint8().pack.call(this, 0xfd);
      Packer.codecs.uint16le().pack.call(this, value);
    } else if (value <= 0xffffffff) {
      Packer.codecs.uint8().pack.call(this, 0xfe);
      Packer.codecs.uint32le().pack.call(this, value);
    } else {
      Packer.codecs.uint8().pack.call(this, 0xff);
      Packer.codecs.uint64le().pack.call(this, value);
    }
  },
  unpack: function () {
    var first = Packer.codecs.uint8().unpack.call(this);
    if (first < 0xfd) {
      return first;
    } else if (first === 0xfd) {
      return Packer.codecs.uint16le().unpack.call(this);
    } else if (first === 0xfe) {
      return Packer.codecs.uint32le().unpack.call(this);
    } else {
      return Packer.codecs.uint64le().unpack.call(this);
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

Packer.addCodec('default', function (options) {
  var defaultValue = options.default || 0xff;
  return {
    pack: function (value) {
      Packer.codecs.uint8().pack.call(this, value || defaultValue);
    },
    unpack: function () {
      return Packer.codecs.uint8().unpack.call(this);
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
  var packd = new Buffer(codec.size(value));
  packd.fill(0xff);
  codec.pack.call({ buffer: packd, offset: 0 }, value);
  expect(packd).to.deep.equal(new Buffer(hex, 'hex'));
}

function assertCodecDecode(codec, value, hex) {
  var unpackd = codec.unpack.call({ buffer: new Buffer(hex, 'hex'), offset: 0 });
  expect(unpackd).to.deep.equal(value);
}

function assertPacker(packer, value, hex) {
  expect(packer.pack(value).toString('hex')).to.deep.equal(hex);
  expect(packer.unpack(new Buffer(hex, 'hex'))).to.deep.equal(value);
}

describe('buffer-pack', function () {
  describe('codecs', function () {
    it('uint8 (8-bit number)', function () {
      assertCodec(Packer.codecs.uint8(), 1, '01');
    });

    it('int8 (signed 8-bit number)', function () {
      var codec = Packer.codecs.int8();
      assertCodec(codec, 15, '0f');
      assertCodec(codec, -1, 'ff');
      assertCodec(codec, -8, 'f8');
    });

    it('uint16be (big-endian 16-bit number)', function () {
      assertCodec(Packer.codecs.uint16be(), 500, '01f4');
    });

    it('uint16le (little-endian 16-bit number)', function () {
      var codec = Packer.codecs.uint16le();
      assertCodec(codec, 1, '0100');
      assertCodec(codec, 500, 'f401');
      assertCodec(codec, 596, '5402');
    });

    it('int16be (big-endian signed 16-bit number)', function () {
      var codec = Packer.codecs.int16be();
      assertCodec(codec, 500, '01f4');
      assertCodec(codec, -1, 'ffff');
      assertCodec(codec, -56, 'ffc8');
      assertCodec(codec, -4324, 'ef1c');
    });

    it('int16le (little-endian signed 16-bit number)', function () {
      var codec = Packer.codecs.int16le();
      assertCodec(codec, 500, 'f401');
      assertCodec(codec, -1, 'ffff');
      assertCodec(codec, -56, 'c8ff');
      assertCodec(codec, -4324, '1cef');
    });

    it('uint32be (big-endian 32-bit number)', function () {
      var codec = Packer.codecs.uint32be();
      assertCodec(codec, 500, '000001f4');
      assertCodec(codec, 3435978205, 'ccccdddd');
    });

    it('uint32le(little-endian 32-bit number)', function () {
      var codec = Packer.codecs.uint32le();
      assertCodec(codec, 500, 'f4010000');
      assertCodec(codec, 3435978205, 'ddddcccc');
    });

    it('int32be (big-endian signed 32-bit number)', function () {
      var codec = Packer.codecs.int32be();
      assertCodec(codec, 500, '000001f4');
      assertCodec(codec, -1, 'ffffffff');
      assertCodec(codec, -1232321, 'ffed323f');
    });

    it('int32le (little-endian signed 32-bit number)', function () {
      var codec = Packer.codecs.int32le();
      assertCodec(codec, 500, 'f4010000');
      assertCodec(codec, -1, 'ffffffff');
      assertCodec(codec, -1232321, '3f32edff');
    });

    it('uint64be (big-endian 64-bit number)', function () {
      var codec = Packer.codecs.uint64be();
      assertCodec(codec, 500, '00000000000001f4');
      assertCodec(codec, Math.pow(2, 53) - 1, '001fffffffffffff');
      expect(function () {
        codec.pack(Math.pow(2, 53));
      }).to.throw();
    });

    it('uint64le (little-endian 64-bit number)', function () {
      var codec = Packer.codecs.uint64le();
      assertCodec(codec, 500, 'f401000000000000');
      assertCodec(codec, Math.pow(2, 53) - 1, 'ffffffffffff1f00');
      expect(function () {
        codec.pack(Math.pow(2, 53));
      }).to.throw();
    });

    it('int64be (big-endian signed 64-bit number)', function () {
      var codec = Packer.codecs.int64be();
      assertCodec(codec, 500, '00000000000001f4');
      assertCodec(codec, -500, 'fffffffffffffe0c');
      assertCodec(codec, -(Math.pow(2, 53) - 1), 'ffe0000000000001');
      expect(function () {
        codec.pack(-Math.pow(2, 53));
      }).to.throw();
    });

    it('int64le (little-endian signed 64-bit number)', function () {
      var codec = Packer.codecs.int64le();
      assertCodec(codec, 500, 'f401000000000000');
      assertCodec(codec, -500, '0cfeffffffffffff');
      assertCodec(codec, -(Math.pow(2, 53) - 1), '010000000000e0ff');
      expect(function () {
        codec.pack(-Math.pow(2, 53));
      }).to.throw();
    });

    it('buffer', function () {
      var codec = Packer.codecs.buffer({ length: 4 });
      assertCodec(codec, new Buffer([1, 2, 3, 4]), '01020304');
    });

    it('str(ascii)', function () {
      var codec = Packer.codecs.str({ length: 2, encoding: 'ascii' });
      assertCodec(codec, 'ab', '6162');
    });

    it('str(utf8)', function () {
      var codec = Packer.codecs.str({ length: 3, encoding: 'utf8' });
      assertCodec(codec, '4\u00a3', '34c2a3');
    });

    it('str(utf8, pad)', function () {
      var codec = Packer.codecs.str({ length: 3, pad: 'a' });
      assertCodec(codec, '4', '346161');

      codec = Packer.codecs.str({ length: 3, pad: 0 });
      assertCodec(codec, '4', '340000');
    });

    it('array', function () {
      var codec = Packer.codecs.array({ length: 3, type: Packer.codecs.uint8() });
      assertCodec(codec, [1, 2, 3], '010203');
    });

    it('custom codec (lvaruint)', function () {
      var codec = Packer.codecs.lvaruint;
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
      var packer = Packer().uint8('foo');
      assertPacker(packer, { foo: 1 }, '01');
    });

    it('int8 (signed 8-bit number)', function () {
      var packer = Packer().int8('foo');
      assertPacker(packer, { foo: 15 }, '0f');
      assertPacker(packer, { foo: -1 }, 'ff');
      assertPacker(packer, { foo: -8 }, 'f8');
    });

    it('uint16be (big-endian 16-bit number)', function () {
      var packer = Packer().uint16be('foo');
      assertPacker(packer, { foo: 500 }, '01f4');
    });

    it('uint16le (little-endian 16-bit number)', function () {
      var foo = Packer().uint16le('foo');
      assertPacker(foo, { foo: 1 }, '0100');
      assertPacker(foo, { foo: 500 }, 'f401');
      assertPacker(foo, { foo: 596 }, '5402');
    });

    it('int16be (big-endian signed 16-bit number)', function () {
      var packer = Packer().int16be('foo');
      assertPacker(packer, { foo: 500 }, '01f4');
      assertPacker(packer, { foo: -1 }, 'ffff');
      assertPacker(packer, { foo: -56 }, 'ffc8');
      assertPacker(packer, { foo: -4324 }, 'ef1c');
    });

    it('int16le (little-endian signed 16-bit number)', function () {
      var packer = Packer().int16le('foo');
      assertPacker(packer, { foo: 500 }, 'f401');
      assertPacker(packer, { foo: -1 }, 'ffff');
      assertPacker(packer, { foo: -56 }, 'c8ff');
      assertPacker(packer, { foo: -4324 }, '1cef');
    });

    it('uint32be (big-endian 32-bit number)', function () {
      var packer = Packer().uint32be('foo');
      assertPacker(packer, { foo: 500 }, '000001f4');
      assertPacker(packer, { foo: 3435978205 }, 'ccccdddd');
    });

    it('uint32le (little-endian 32-bit number)', function () {
      var packer = Packer().uint32le('foo');
      assertPacker(packer, { foo: 500 }, 'f4010000');
      assertPacker(packer, { foo: 3435978205 }, 'ddddcccc');
    });

    it('int32be (big-endian signed 32-bit number)', function () {
      var packer = Packer().int32be('foo');
      assertPacker(packer, { foo: 500 }, '000001f4');
      assertPacker(packer, { foo: -1 }, 'ffffffff');
      assertPacker(packer, { foo: -1232321 }, 'ffed323f');
    });

    it('int32le (little-endian signed 32-bit number)', function () {
      var packer = Packer().int32le('foo');
      assertPacker(packer, { foo: 500 }, 'f4010000');
      assertPacker(packer, { foo: -1 }, 'ffffffff');
      assertPacker(packer, { foo: -1232321 }, '3f32edff');
    });

    it('uint64be (big-endian 64-bit number)', function () {
      var packer = Packer().uint64be('foo').uint64be('bar');
      assertPacker(packer, { foo: 500, bar: 501 }, '00000000000001f4' + '00000000000001f5');
      assertPacker(packer, { foo: Math.pow(2, 53) - 1, bar: Math.pow(2, 53) - 2 }, '001fffffffffffff' + '001ffffffffffffe');
      expect(function () {
        packer.pack({ foo: Math.pow(2, 53), bar: Math.pow(2, 53) });
      }).to.throw();
    });

    it('uint64le (little-endian 64-bit number)', function () {
      var packer = Packer().uint64le('foo').uint64le('bar');
      assertPacker(packer, { foo: 500, bar: 501 }, 'f401000000000000' + 'f501000000000000');
      assertPacker(packer, { foo: Math.pow(2, 53) - 1, bar: Math.pow(2, 53) - 2 }, 'ffffffffffff1f00' + 'feffffffffff1f00');
      expect(function () {
        packer.pack({ foo: Math.pow(2, 53), bar:Math.pow(2, 53) });
      }).to.throw();
    });

    it('int64be (big-endian signed 64-bit number)', function () {
      var packer = Packer().int64be('foo').int64be('bar');
      assertPacker(packer, { foo: 500, bar: 501 }, '00000000000001f4' + '00000000000001f5');
      assertPacker(packer, { foo: -500, bar: -501 }, 'fffffffffffffe0c' + 'fffffffffffffe0b');
      assertPacker(packer, { foo: -(Math.pow(2, 53) - 1), bar: -(Math.pow(2, 53) - 2) }, 'ffe0000000000001' + 'ffe0000000000002');
      expect(function () {
        packer.pack({ foo: -Math.pow(2, 53), bar: -Math.pow(2, 53) });
      }).to.throw();
    });

    it('int64le (little-endian signed 64-bit number)', function () {
      var packer = Packer().int64le('foo').int64le('bar');
      assertPacker(packer, { foo: 500, bar: 501 }, 'f401000000000000' + 'f501000000000000');
      assertPacker(packer, { foo: -500, bar: -501 }, '0cfeffffffffffff' + '0bfeffffffffffff');
      assertPacker(packer, { foo: -(Math.pow(2, 53) - 1), bar: -(Math.pow(2, 53) - 2) }, '010000000000e0ff' + '020000000000e0ff');
      expect(function () {
        packer.pack({ foo: -Math.pow(2, 53), bar: -Math.pow(2, 53) });
      }).to.throw();
    });

    it('buffer', function () {
      var packer = Packer()
        .buffer('foo', {
          length: 4
        })
        .buffer('bar', {
          length: 3
        });
      assertPacker(packer, { foo: new Buffer([1, 2, 3, 4]), bar: new Buffer([5, 6, 7]) }, '01020304050607');
    });

    it('str', function () {
      var packer = Packer()
        .str('foo', {
          length: 2,
          encoding: 'ascii'
        })
        .str('bar', {
          length: 3,
          encoding: 'utf8'
        });
      assertPacker(packer, { foo: 'ab', bar: '\u00a34' }, '6162c2a334');
    });

    it('array (codec)', function () {
      var packer = Packer()
        .array('foo', {
          length: 2,
          type: Packer.codecs.uint8()
        });
      assertPacker(packer, { foo: [8, 16] }, '0810');
    });

    it('array (packer)', function () {
      var packer = Packer()
        .array('foo', {
          length: 2,
          type: Packer().uint8('bar')
        });
      assertPacker(packer, { foo: [{ bar: 8 }, { bar: 16 }] }, '0810');
    });
  });

  it('default values', function () {
    var packer = Packer()
      .uint8('foo', { default: 0xcc })
      .uint8('bar', { default: 0xff });
    assertPacker(packer, { foo: 1, bar: 2 }, '0102');
    expect(packer.pack({}).toString('hex')).to.equal('ccff');
    expect(packer.unpack(new Buffer('abcd', 'hex'))).to.deep.equal({ foo: 0xab, bar: 0xcd });
  });

  it('variable length buffer', function () {
    var packer = Packer()
      .uint8('len')
      .buffer('buf', {
        length: function () { return this.len; }
      });
    assertPacker(packer, { len: 0, buf: new Buffer(0) }, '00');
    assertPacker(packer, { len: 1, buf: new Buffer([0]) }, '0100');
    assertPacker(packer, { len: 8, buf: new Buffer([0, 1, 2, 3, 4, 5, 6, 7]) }, '080001020304050607');
  });

  it('nested arrays', function () {
    var packer = Packer()
      .array('first', {
        length: 3,
        type: Packer()
          .array('second', {
            length: 2,
            type: Packer()
              .array('third', { length: 1, type: Packer.codecs.uint8() })
          })
      });
    assertPacker(packer, {
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
    var packer = Packer()
      .uint8('uint8')
      .int32le('int32le')
      .array('array', {
        length: 2,
        type: Packer()
          .str('str', { length: 10 })
          .uint16be('uint16be')
          .buffer('buffer', { length: 4 })
          .lvaruint('lvaruint')
      })
      .array('array2', {
        length: 3,
        type: Packer()
          .uint32be('uint32be')
      });
    assertPacker(packer, {
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

