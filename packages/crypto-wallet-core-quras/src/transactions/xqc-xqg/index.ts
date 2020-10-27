import { XQCTxProvider } from '../xqc';
import { XQGTxProvider } from '../xqg';

const coins = {
  XQC: new XQCTxProvider(),
  XQG: new XQGTxProvider()
};

export class XQCXQGProxy {
  constructor() {}
  get({ coin }) {
    return coins[coin];
  }

  create(params) {
    return this.get(params).create(params);
  }

  sign(params): string {
    return this.get(params).sign(params);
  }

  getSignature(params): string {
    return this.get(params).getSignature(params);
  }

  applySignature(params) {
    return this.get(params).applySignature(params);
  }

  getHash(params) {
    return this.get(params).getHash(params);
  }
}

export default new XQCXQGProxy();
