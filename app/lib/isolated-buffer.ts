/**
 * Copie les octets dans un Buffer avec ArrayBuffer « classique ».
 * Sharp (surtout wasm sur Vercel) peut renvoyer un Buffer sur SharedArrayBuffer ;
 * undici / `@vercel/blob` rejettent alors le body :
 * « ArrayBuffer: SharedArrayBuffer is not allowed. »
 */
export function toIsolatedBuffer(data: Uint8Array | Buffer): Buffer {
  const out = Buffer.allocUnsafe(data.byteLength);
  out.set(data);
  return out;
}
