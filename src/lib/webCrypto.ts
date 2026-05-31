import * as ExpoCrypto from "expo-crypto";

type DigestAlgorithm =
  | typeof ExpoCrypto.CryptoDigestAlgorithm.SHA1
  | typeof ExpoCrypto.CryptoDigestAlgorithm.SHA256
  | typeof ExpoCrypto.CryptoDigestAlgorithm.SHA384
  | typeof ExpoCrypto.CryptoDigestAlgorithm.SHA512;

type CryptoShim = {
  getRandomValues?: <T extends ArrayBufferView>(array: T) => T;
  randomUUID?: () => string;
  subtle?: Pick<SubtleCrypto, "digest">;
};

const DIGEST_ALGORITHMS: Record<string, DigestAlgorithm> = {
  "SHA-1": ExpoCrypto.CryptoDigestAlgorithm.SHA1,
  "SHA-256": ExpoCrypto.CryptoDigestAlgorithm.SHA256,
  "SHA-384": ExpoCrypto.CryptoDigestAlgorithm.SHA384,
  "SHA-512": ExpoCrypto.CryptoDigestAlgorithm.SHA512,
};

function normalizeBufferSource(data: BufferSource): Uint8Array {
  if (data instanceof Uint8Array) {
    return data;
  }

  if (data instanceof ArrayBuffer) {
    return new Uint8Array(data);
  }

  if (ArrayBuffer.isView(data)) {
    return new Uint8Array(data.buffer, data.byteOffset, data.byteLength);
  }

  throw new TypeError("Expected a BufferSource for crypto digest.");
}

function resolveDigestAlgorithm(
  algorithm: AlgorithmIdentifier
): DigestAlgorithm {
  const algorithmName = typeof algorithm === "string" ? algorithm : algorithm.name;
  const digestAlgorithm = DIGEST_ALGORITHMS[algorithmName];

  if (!digestAlgorithm) {
    throw new Error(`Unsupported digest algorithm: ${algorithmName}`);
  }

  return digestAlgorithm;
}

const cryptoObject = (globalThis.crypto ?? {}) as unknown as CryptoShim;

if (!cryptoObject.getRandomValues) {
  cryptoObject.getRandomValues = ((array) =>
    ExpoCrypto.getRandomValues(array as never)) as CryptoShim["getRandomValues"];
}

if (!cryptoObject.randomUUID) {
  cryptoObject.randomUUID = () => ExpoCrypto.randomUUID();
}

if (!cryptoObject.subtle) {
  cryptoObject.subtle = {
    digest: (algorithm, data) =>
      ExpoCrypto.digest(
        resolveDigestAlgorithm(algorithm),
        normalizeBufferSource(data) as unknown as BufferSource
      ),
  };
}

if (!globalThis.crypto) {
  Object.defineProperty(globalThis, "crypto", {
    configurable: true,
    value: cryptoObject,
    writable: true,
  });
}