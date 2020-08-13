import { EventEmitter } from 'events';

import { timestamp } from '../../../logger';
import logger from '../../../logger';
import { StateStorage } from '../../../models/state';
import { ChainStateProvider } from '../../../providers/chain-state';
import { BaseP2PWorker } from '../../../services/p2p';
import { valueOrDefault } from '../../../utils/check';
import { wait } from '../../../utils/wait';
import { XQCStateProvider } from '../api/csp';
import { XqcBlockStorage } from '../models/block';
import { IEthBlock, IXqcTransaction, XqcBlock, XqcTransaction } from '../types';

export class XqcP2pWorker extends BaseP2PWorker<IEthBlock> {
  protected chainConfig: any;
  protected syncing: boolean;
  protected initialSyncComplete: boolean;
  protected blockModel: any;
  protected txSubscription: any;
  protected blockSubscription: any;
  protected rpc?: any;
  protected provider: XQCStateProvider;
  protected invCache: any;
  protected invCacheLimits: any;
  public events: EventEmitter;
  public disconnecting: boolean;

  constructor({ chain, network, chainConfig, blockModel = XqcBlockStorage}) {
    super({ chain, network, chainConfig, blockModel });
    this.chain = chain || 'XQCN';
    this.network = network;
    this.chainConfig = chainConfig;
    this.syncing = false;
    this.initialSyncComplete = false;
    this.blockModel = blockModel;
    this.provider = new XQCStateProvider();
    this.events = new EventEmitter();
    this.invCache = {};
    this.invCacheLimits = {
      TX: 100000
    };
    this.disconnecting = false;
  }


  async setupListeners() {
    const { host, port } = this.chainConfig.provider;
    this.events.on('disconnected', async () => {
      logger.warn(
        `${timestamp()} | Not connected to peer: ${host}:${port} | Chain: ${this.chain} | Network: ${this.network}`
      );
    });
    this.events.on('connected', async () => {
      if (!this.syncing) {
        this.sync();
      }
    });
  }

  async disconnect() {
    this.disconnecting = true;
    try {
      if (this.txSubscription) {
        this.txSubscription.unsubscribe();
      }
      if (this.blockSubscription) {
        this.blockSubscription.unsubscribe();
      }
    } catch (e) {
      console.error(e);
    }
  }

  async getRPCClient() {
    return this.provider.getRPCClient(this.network);
  }

  async handleReconnects() {
    this.disconnecting = false;
    let firstConnect = true;
    let connected = false;
    let disconnected = false;
    const { host, port } = this.chainConfig.provider;
    while (!this.disconnecting && !this.stopping) {
      try {
        if (!this.rpc) {
          this.rpc = await this.getRPCClient();
        }
        try {
          connected = !isNaN(await this.rpc.getBlockCount());
        } catch (e) {
          connected = false;
        }


        if (connected) {
          if (disconnected || firstConnect) {
            this.events.emit('connected');
          }
        } else {
          this.rpc = await this.getRPCClient();
          this.events.emit('disconnected');
        }
        if (disconnected && connected && !firstConnect) {
          logger.warn(
            `${timestamp()} | Reconnected to peer: ${host}:${port} | Chain: ${this.chain} | Network: ${this.network}`
          );
        }
        if (connected && firstConnect) {
          firstConnect = false;
          logger.info(
            `${timestamp()} | Connected to peer: ${host}:${port} | Chain: ${this.chain} | Network: ${this.network}`
          );
        }
        disconnected = !connected;
      } catch (e) {}
      await wait(2000);
    }
  }

  async connect() {
    this.handleReconnects();
  }

  public async getBlock(height: number) {
    return (this.rpc!.getBlock(height) as unknown) as XqcBlock;
  }

  async processBlock(block: IEthBlock, transactions): Promise<any> {
    await this.blockModel.addBlock({
      chain: this.chain,
      network: this.network,
      forkHeight: this.chainConfig.forkHeight,
      parentChain: this.chainConfig.parentChain,
      initialSyncComplete: this.initialSyncComplete,
      block,
      transactions
    });
    if (!this.syncing) {
      logger.info(`Added block ${block.hash}`, {
        chain: this.chain,
        network: this.network
      });
    }
  }


  async sync() {
    if (this.syncing) {
      return false;
    }
    const { chain, chainConfig, network } = this;
    const { parentChain, forkHeight } = chainConfig;
    this.syncing = true;
    const state = await StateStorage.collection.findOne({});
    this.initialSyncComplete =
      state && state.initialSyncComplete && state.initialSyncComplete.includes(`${chain}:${network}`);
    let tip = await ChainStateProvider.getLocalTip({ chain, network });
    if (parentChain && (!tip || tip.height < forkHeight)) {
      let parentTip = await ChainStateProvider.getLocalTip({ chain: parentChain, network });
      while (!parentTip || parentTip.height < forkHeight) {
        logger.info(`Waiting until ${parentChain} syncs before ${chain} ${network}`);
        await new Promise(resolve => {
          setTimeout(resolve, 5000);
        });
        parentTip = await ChainStateProvider.getLocalTip({ chain: parentChain, network });
      }
    }

    const startHeight = tip ? tip.height : 0;
    const startTime = Date.now();
    try {
      let bestBlock = await this.rpc.getBlockCount() - 1;
      let lastLog = 0;
      let currentHeight = tip ? tip.height : 0;
      logger.info(`Syncing ${bestBlock - currentHeight} blocks for ${chain} ${network}`);
      while (currentHeight <= bestBlock) {
        const block = await this.getBlock(currentHeight);
        if (!block) {
          await wait(1000);
          continue;
        }
        try {
          const { convertedBlock, convertedTxs } = await this.convertBlock(block);
          await this.processBlock(convertedBlock, convertedTxs);
        } catch(err) {
          console.log(err);
        }
        if (currentHeight === bestBlock) {
          bestBlock = await this.rpc.getBlockCount() - 1;
        }
        tip = await ChainStateProvider.getLocalTip({ chain, network });
        currentHeight = tip ? tip.height + 1 : 0;

        const oneSecond = 1000;
        const now = Date.now();
        if (now - lastLog > oneSecond) {
          const blocksProcessed = currentHeight - startHeight;
          const elapsedMinutes = (now - startTime) / (60 * oneSecond);
          logger.info(
            `${timestamp()} | Syncing... | Chain: ${chain} | Network: ${network} |${(blocksProcessed / elapsedMinutes)
              .toFixed(2)
              .padStart(8)} blocks/min | Height: ${currentHeight.toString().padStart(7)}`
          );
          lastLog = Date.now();
        }
      }
    } catch (err) {
      logger.error(`Error syncing ${chain} ${network}`, err.message);
      await wait(2000);
      this.syncing = false;
      return this.sync();
    }
    logger.info(`${chain}:${network} up to date.`);
    this.syncing = false;
    StateStorage.collection.findOneAndUpdate(
      {},
      { $addToSet: { initialSyncComplete: `${chain}:${network}` } },
      { upsert: true }
    );
    this.events.emit('SYNCDONE');
    await wait(10000);
    this.sync();
    return true;
  }

  async syncDone() {
    return new Promise(resolve => this.events.once('SYNCDONE', resolve));
  }

  async convertBlock(block: any) {
    const blockTime = Number(block.time) * 1000;
    const hash = block.hash;
    const height = block.index;

    const convertedBlock: any = {
      chain: this.chain,
      network: this.network,
      height,
      hash,
      merkleRoot: Buffer.from(block.merkleroot),
      time: new Date(blockTime),
      timeNormalized: new Date(blockTime),
      nonce: Buffer.from(block.nonce),
      previousBlockHash: block.previousblockhash,
      currentconsensus: block.currentconsensus,
      nextconsensus: block.nextconsensus,
      nextBlockHash: block.nextblockhash,
      transactionCount: block.tx.length,
      size: block.size,
      processed: false
    };
    const transactions = block.tx as Array<XqcTransaction>;
    const promises = await transactions.map((t) => {
      return this.convertTx(t, convertedBlock)
    });
    const convertedTxs = await Promise.all(promises);
    return { convertedBlock, convertedTxs };
  }

  async convertTx(tx: XqcTransaction, block?: IEthBlock) {
    let fromAddress;
    if (tx.type !== 'MinerTransaction') {
      if (tx.vin.length) {
        const prevTx = await this.rpc.getRawTransaction(tx.vin[0].txid);
        if (prevTx.vout.length) {
          fromAddress = prevTx.vout[0].address;
        }
      }
    }
    if (!block) {
      const toTx = tx.vout[0];
      const from = fromAddress;
      const to = toTx ? toTx.address : '';
      const assetId = toTx ? toTx.asset : '';
      let asset;

      if (assetId) {
        const fullAsset = await this.provider.getAssetInfo(assetId.slice(2), this.network) as any;
        asset = {
          type: fullAsset.type,
          symbol: fullAsset.symbol,
          name: fullAsset.name,
        };
      }

      const value = Number(toTx ? toTx.value : 0);
      const fee = Number(tx.net_fee);
      const nonce = tx.nonce || 0;

      const convertedTx: IXqcTransaction = {
        chain: this.chain,
        network: this.network,
        blockHeight: valueOrDefault(tx.blockNumber, -1),
        blockHash: valueOrDefault(tx.blockHash, undefined),
        scripts: tx.scripts,
        type: tx.type || '',
        txid: tx.txid,
        blockTime: new Date(),
        blockTimeNormalized: new Date(),
        asset,
        fee,
        transactionIndex: tx.transactionIndex || 0,
        value,
        wallets: [],
        to,
        from,
        nonce,
        size: tx.size || 0
      };
      return convertedTx;
    } else {
      const { hash: blockHash, time: blockTime, timeNormalized: blockTimeNormalized, height } = block;
      const noBlockTx = await this.convertTx(tx);
      return {
        ...noBlockTx,
        blockHeight: height,
        blockHash,
        blockTime,
        blockTimeNormalized
      };
    }
  }

  async stop() {
    this.stopping = true;
    logger.debug(`Stopping worker for chain ${this.chain} ${this.network}`);
    await this.disconnect();
  }

  async start() {
    logger.debug(`Started worker for chain ${this.chain} ${this.network}`);
    this.connect();
    this.setupListeners();
    this.sync();
  }
}
