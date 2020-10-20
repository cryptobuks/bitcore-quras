import { BaseModule } from '..';
import { XQCStateProvider } from './api/csp';
import { XqcP2pWorker } from './p2p/p2p';

export default class XQCModule extends BaseModule {
  constructor(services: BaseModule['bitcoreServices']) {
    super(services);
    services.P2P.register('XQCN', XqcP2pWorker);
    services.CSP.registerService('XQCN', new XQCStateProvider());
  }
}
