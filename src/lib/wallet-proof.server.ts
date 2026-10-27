import { Address } from "@ton/core";
import { signVerify } from "@ton/crypto";
import { Buffer } from "node:buffer";
export async function verifyWalletProof(address: string, proof: { timestamp: number; domain: { lengthBytes: number; value: string }; payload: string; signature: string }, nonce: string, hosts: string[]) {
  if (proof.payload !== nonce || !hosts.includes(proof.domain.value) || Math.abs(Date.now() / 1000 - proof.timestamp) > 300) throw new Error("Wallet proof expired or invalid");
  const domain = Buffer.from(proof.domain.value);
  if (domain.length !== proof.domain.lengthBytes) throw new Error("Invalid wallet domain");
  const parsed = Address.parse(address);
  const response = await fetch("https://toncenter.com/api/v2/runGetMethod", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ address, method: "get_public_key", stack: [] }) });
  if (!response.ok) throw new Error("Wallet ownership check unavailable");
  const result = await response.json() as any;
  const key = result.result?.stack?.[0]?.[1];
  if (!key || result.result?.exit_code !== 0) throw new Error("This wallet cannot be verified yet");
  const wc = Buffer.alloc(4); wc.writeInt32BE(parsed.workChain);
  const length = Buffer.alloc(4); length.writeUInt32LE(domain.length);
  const timestamp = Buffer.alloc(8); timestamp.writeBigUInt64LE(BigInt(proof.timestamp));
  const hash = async (bytes: Buffer) => Buffer.from(await crypto.subtle.digest("SHA-256", new Uint8Array(bytes)));
  const message = Buffer.concat([Buffer.from("ton-proof-item-v2/"), wc, parsed.hash, length, domain, timestamp, Buffer.from(proof.payload)]);
  const digest = await hash(Buffer.concat([Buffer.from([255, 255]), Buffer.from("ton-connect"), await hash(message)]));
  if (!signVerify(digest, Buffer.from(proof.signature, "base64"), Buffer.from(BigInt(key).toString(16).padStart(64, "0"), "hex"))) throw new Error("Invalid wallet signature");
  return parsed.toString();
}