'use strict';

var qurascore = module.exports;

// module information
qurascore.version = 'v' + require('./package.json').version;
qurascore.versionGuard = function(version) {
  if (version !== undefined) {
    var message = 'More than one instance of qurascore-lib found. ' +
      'Please make sure to require qurascore-lib and check that submodules do' +
      ' not also include their own qurascore-lib dependency.';
    throw new Error(message);
  }
};
qurascore.versionGuard(global._qurascore);
global._qurascore = qurascore.version;

// crypto
qurascore.crypto = {};
qurascore.crypto.BN = require('./lib/crypto/bn');
qurascore.crypto.ECDSA = require('./lib/crypto/ecdsa');
qurascore.crypto.Hash = require('./lib/crypto/hash');
qurascore.crypto.Random = require('./lib/crypto/random');
qurascore.crypto.Point = require('./lib/crypto/point');
qurascore.crypto.Signature = require('./lib/crypto/signature');

// encoding
qurascore.encoding = {};
qurascore.encoding.Base58 = require('./lib/encoding/base58');
qurascore.encoding.Base58Check = require('./lib/encoding/base58check');
qurascore.encoding.BufferReader = require('./lib/encoding/bufferreader');
qurascore.encoding.BufferWriter = require('./lib/encoding/bufferwriter');
qurascore.encoding.Varint = require('./lib/encoding/varint');

// utilities
qurascore.util = {};
qurascore.util.buffer = require('./lib/util/buffer');
qurascore.util.js = require('./lib/util/js');
qurascore.util.preconditions = require('./lib/util/preconditions');

// errors thrown by the library
qurascore.errors = require('./lib/errors');

// main bitcoin library
qurascore.Address = require('./lib/address');
qurascore.Block = require('./lib/block');
qurascore.MerkleBlock = require('./lib/block/merkleblock');
qurascore.BlockHeader = require('./lib/block/blockheader');
qurascore.HDPrivateKey = require('./lib/hdprivatekey.js');
qurascore.HDPublicKey = require('./lib/hdpublickey.js');
qurascore.Message = require('./lib/message');
qurascore.Networks = require('./lib/networks');
qurascore.Opcode = require('./lib/opcode');
qurascore.PrivateKey = require('./lib/privatekey');
qurascore.PublicKey = require('./lib/publickey');
qurascore.Script = require('./lib/script');
qurascore.Transaction = require('./lib/transaction');
qurascore.URI = require('./lib/uri');
qurascore.Unit = require('./lib/unit');

// dependencies, subject to change
qurascore.deps = {};
qurascore.deps.bnjs = require('bn.js');
qurascore.deps.bs58 = require('bs58');
qurascore.deps.Buffer = Buffer;
qurascore.deps.elliptic = require('elliptic');
qurascore.deps._ = require('lodash');

// Internal usage, exposed for testing/advanced tweaking
qurascore.Transaction.sighash = require('./lib/transaction/sighash');
