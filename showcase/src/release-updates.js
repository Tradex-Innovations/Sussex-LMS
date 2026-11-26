import { parseMindMapHash } from './mind-map-data.js';

export function shouldReloadForRelease(data, hash) {
  return data?.type === 'SUSSEX_SHOWCASE_UPDATED' && Boolean(parseMindMapHash(hash));
}
