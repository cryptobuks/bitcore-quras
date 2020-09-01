import QurasLib from 'quras-js';
import { IValidation } from '..';

export class XqcValidation implements IValidation {
  validateAddress(_network: string, address: string): boolean {
    return QurasLib.is.address(address);
  }

  validateUri(addressUri: string): boolean {
    if (!addressUri) {
      return false;
    }
    const address = this.extractAddress(addressUri);
    const ethereumPrefix = /quras/i.exec(addressUri);
    return !!ethereumPrefix && QurasLib.is.address(address);
  }

  private extractAddress(data) {
    const prefix = /^[a-z]+:/i;
    const params = /([\?\&](value|gas|gasPrice|gasLimit)=(\d+([\,\.]\d+)?))+/i;
    return data.replace(prefix, '').replace(params, '');
  }
}
