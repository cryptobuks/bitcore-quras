import { IDeriver } from '..';

import QurasLib from 'quras-js';

const BitcoreLib = require('qurascore-lib');

export class XqcDeriver implements IDeriver {
  deriveAddress(network, xpubkey, addressIndex, isChange) {
    const xpub = new BitcoreLib.HDPublicKey(xpubkey, network);
    const changeNum = isChange ? 1 : 0;
    const path = `m/${changeNum}/${addressIndex}`;

    const derived = xpub.derive(path).publicKey;

    let scriptHash = QurasLib.get.scriptHashFromPublicKey(derived.toString());
    return QurasLib.get.addressFromScriptHash(scriptHash);
  }

  derivePrivateKey(network, xPriv, addressIndex, isChange) {
    const xpriv = new BitcoreLib.HDPrivateKey(xPriv, network);
    const changeNum = isChange ? 1 : 0;
    const path = `m/${changeNum}/${addressIndex}`;

    const derivedPrivKey = xpriv.derive(path);

    const privKey = derivedPrivKey.privateKey.toString('hex');
    const pubKey = QurasLib.get.publicKeyFromPrivateKey(privKey);
    let scriptHash = QurasLib.get.scriptHashFromPublicKey(pubKey);
    const address = QurasLib.get.addressFromScriptHash(scriptHash);
    return { address, privKey, pubKey };
  }
}
