import * as Quras from 'quras-js';

const Assets = {};
const xqgAssetId = Quras.CONST.ASSET_ID.XQG;
Assets[xqgAssetId] = {
  name: 'Quras XQG',
  symbol: 'XQG',
  decimal: 8,
  assetId: xqgAssetId
};

export const ASSET_OPTS = Assets;
