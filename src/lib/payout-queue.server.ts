import { Address, toNano } from "@ton/core";
import { TSLA_JETTON, PAYOUT_WALLET } from "./config";
import { broadcastTsla, payoutPreflight, prepareTsla } from "./payout.server";

export async function reconcilePayouts(db: any, userId?: number) {
  let query = db.from("tsla_withdrawals").select("*").in("status", ["pending", "submitted"]).order("created_at").limit(100);
  if (userId !== undefined) query = query.eq("user_id", userId);
  const { data: rows, error } = await query;
  if (error) throw new Error(error.message);
  if (!rows?.length) return;
  const response = await fetch(`https://toncenter.com/api/v3/jetton/transfers?owner_address=${PAYOUT_WALLET}&jetton_master=${TSLA_JETTON}&limit=1000`);
  if (!response.ok) throw new Error(`Payout reconciliation unavailable [${response.status}]`);
  const json = await response.json() as any;
  for (const row of rows) {
    if (!row.tx_hash) continue;
    const transfer = (json.jetton_transfers ?? []).find((t: any) => {
      try {
        return String(t.query_id) === row.tx_hash && BigInt(t.amount) === toNano(Number(row.amount).toFixed(9)) &&
          Address.parse(t.destination).equals(Address.parse(row.to_address)) &&
          Address.parse(t.source).equals(Address.parse(PAYOUT_WALLET)) &&
          Address.parse(t.jetton_master).equals(Address.parse(TSLA_JETTON));
      } catch { return false; }
    });
    // Unknown or aborted transfers require manual trace review, never an automatic refund/resend.
    if (!transfer || transfer.transaction_aborted !== false || !transfer.transaction_hash) continue;
    const { error: updateError } = await db.from("tsla_withdrawals").update({ status: "sent", broadcast_error: null }).eq("id", row.id).in("status", ["pending", "submitted"]);
    if (updateError) throw new Error(updateError.message);
  }
}

export async function processPayouts(db: any) {
  const token = crypto.randomUUID();
  const { data: acquired, error } = await db.rpc("tesla_payout_lock", { p_token: token });
  if (error) throw new Error(error.message);
  if (!acquired) return { busy: true };
  try {
    await reconcilePayouts(db);
    // One signed message at a time across the shared wallet. Existing ambiguous legacy
    // requests are deliberately not re-signed without on-chain evidence.
    const { data: active } = await db.from("tsla_withdrawals").select("id").eq("status", "submitted").limit(1);
    if (active?.length) return { waiting: true };
    const { data: rows } = await db.from("tsla_withdrawals").select("*").eq("status", "pending").is("tx_hash", null).order("created_at").limit(1);
    const row = rows?.[0];
    if (!row) return { idle: true };
    try {
      await payoutPreflight(Number(row.amount), true);
      const queryId = BigInt(`0x${row.id.replaceAll("-", "").slice(0, 15)}`).toString();
      const prepared = await prepareTsla(row.to_address, Number(row.amount), queryId);
      const { error: savedError } = await db.from("tsla_withdrawals").update({ tx_hash: queryId, broadcast_boc: prepared.boc, broadcast_seqno: prepared.seqno, status: "submitted" }).eq("id", row.id).is("tx_hash", null);
      if (savedError) throw new Error(savedError.message);
      await broadcastTsla(prepared.boc);
      return { submitted: row.id };
    } catch (e) {
      const reason = e instanceof Error ? e.message : "Payout unavailable";
      await db.from("tsla_withdrawals").update({ broadcast_error: reason }).eq("id", row.id);
      throw e;
    }
  } finally {
    await db.from("tsla_payout_lock").update({ expires_at: null }).eq("id", 1).eq("token", token);
  }
}