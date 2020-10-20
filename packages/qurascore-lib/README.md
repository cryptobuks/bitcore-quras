# qurascore Lib

[![NPM Package](https://img.shields.io/npm/v/qurascore-lib.svg?style=flat-square)](https://www.npmjs.org/package/qurascore-lib)
[![Build Status](https://img.shields.io/travis/bitpay/qurascore-lib.svg?branch=master&style=flat-square)](https://travis-ci.org/bitpay/qurascore-lib)
[![Coverage Status](https://img.shields.io/coveralls/bitpay/qurascore-lib.svg?style=flat-square)](https://coveralls.io/r/bitpay/qurascore-lib)

**A pure and powerful JavaScript Bitcoin library.**

## Principles

Bitcoin is a powerful new peer-to-peer platform for the next generation of financial technology. The decentralized nature of the Bitcoin network allows for highly resilient bitcoin infrastructure, and the developer community needs reliable, open-source tools to implement bitcoin apps and services.

## Get Started

```sh
npm install qurascore-lib
```

```sh
bower install qurascore-lib
```

## Documentation

The complete docs are hosted here: [qurascore documentation](https://github.com/bitpay/qurascore). There's also a [qurascore API reference](https://github.com/bitpay/qurascore/blob/master/packages/qurascore-node/docs/api-documentation.md) available generated from the JSDocs of the project, where you'll find low-level details on each qurascore utility.

## Examples

- [Generate a random address](docs/examples.md#generate-a-random-address)
- [Generate a address from a SHA256 hash](docs/examples.md#generate-a-address-from-a-sha256-hash)
- [Import an address via WIF](docs/examples.md#import-an-address-via-wif)
- [Create a Transaction](docs/examples.md#create-a-transaction)
- [Sign a Bitcoin message](docs/examples.md#sign-a-bitcoin-message)
- [Verify a Bitcoin message](docs/examples.md#verify-a-bitcoin-message)
- [Create an OP RETURN transaction](docs/examples.md#create-an-op-return-transaction)
- [Create a 2-of-3 multisig P2SH address](docs/examples.md#create-a-2-of-3-multisig-p2sh-address)
- [Spend from a 2-of-2 multisig P2SH address](docs/examples.md#spend-from-a-2-of-2-multisig-p2sh-address)

## Building the Browser Bundle

To build a qurascore-lib full bundle for the browser:

```sh
gulp browser
```

This will generate files named `qurascore-lib.js` and `qurascore-lib.min.js`.

You can also use our pre-generated files, provided for each release along with a PGP signature by one of the project's maintainers. To get them, checkout the [releases](https://github.com/bitpay/qurascore/blob/master/packages/qurascore-lib/CHANGELOG.md).

## Development & Tests

```sh
git clone https://github.com/bitpay/qurascore-lib
cd qurascore-lib
npm install
```

Run all the tests:

```sh
gulp test
```

You can also run just the Node.js tests with `gulp test:node`, just the browser tests with `gulp test:browser` or create a test coverage report (you can open `coverage/lcov-report/index.html` to visualize it) with `gulp coverage`.

## Security

We're using qurascore in production, as are many others, but please use common sense when doing anything related to finances! We take no responsibility for your implementation decisions.

If you find a security issue, please email security@bitpay.com.

## Contributing

See [CONTRIBUTING.md](https://github.com/bitpay/qurascore/blob/master/Contributing.md) on the main qurascore repo for information about how to contribute.

## License

Code released under [the MIT license](https://github.com/bitpay/qurascore/blob/master/LICENSE).

Copyright 2013-2019 BitPay, Inc. qurascore is a trademark maintained by BitPay, Inc.
