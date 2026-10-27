import { createServerFn } from "@tanstack/react-start";
import {
  MINING_HOURS, POWER_LEVELS, REFERRAL_BONUS, MIN_WITHDRAW, TSLA_JETTON, GRAM_ADDRESS,
  RECEIVE_WALLET, PAYOUT_WALLET, WITHDRAW_FEE_GRAM, ADMIN_USERNAMES, NFT_COLLECTION_ADDRESS, NFT_PRICE_GRAM, NFT_TIERS, nftBenefits,
  sessionReward, levelForHoldings, dailyTsla, MARKET_MAX_AGE, withdrawalDebit, adsPermitWithdrawal,
} from "./config";

type Auth = { initData: string };
const auth = (i: Auth) => {
  if (typeof i?.initData !== "string" || !i.initData) throw new Error("Unauthorized");
  return i;
};

async function ctx(initData: string) {
  const { verifyInitData } = await import("./tg-auth.server");
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const v = await verifyInitData(initData);
  return { ...v, db: supabaseAdmin };
}

async function loadUser(db: any, id: number) {
  const { data, error } = await db.from("tsla_tg_users").select("*").eq("id", id).single();
  if (error) throw new Error(error.message);
  return data;
}

export const bootstrap = createServerFn({ method: "POST" })
  .inputValidator(auth)
  .handler(async ({ data }) => {
    const { user, startParam, db } = await ctx(data.initData);
    const { data: existing } = await db.from("tsla_tg_users").select("id").eq("id", user.id).maybeSingle();
    const profile = {
      id: user.id, username: user.username ?? null, first_name: user.first_name ?? null,
      photo_url: user.photo_url ?? null, language_code: user.language_code ?? null,
    };
    if (!existing) {
      const ref = startParam?.startsWith("ref_") ? Number(startParam.slice(4)) : null;
      const referred_by = ref && ref !== user.id ? ref : null;
      await db.from("tsla_tg_users").insert({ ...profile, referred_by });

    } else {
      await db.from("tsla_tg_users").update(profile).eq("id", user.id);
    }
    const { reconcilePayouts } = await import("./payout-queue.server");
    await reconcilePayouts(db, user.id);
    await syncPower(db, user.id);
    const taskQuery = db.from("tsla_tasks").select("*").order("sort");
    if (process.env["VERCEL_ENV"] === "preview") taskQuery.or("active.eq.true,kind.eq.tiger_case_free");
    else taskQuery.eq("active", true);
    const [me, tasks, done, refs, wd, refCount, goals] = await Promise.all([
      loadUser(db, user.id),
      taskQuery,
      db.from("tsla_task_completions").select("task_id").eq("user_id", user.id),
      db.from("tsla_tg_users").select("id, first_name, username, referral_signup_paid, referral_wallet_paid, referral_mining_paid, mining_claim_count").eq("referred_by", user.id).limit(100),
      db.from("tsla_withdrawals").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(20),
      db.from("tsla_tg_users").select("id", { count: "exact", head: true }).eq("referred_by", user.id).neq("id", user.id),
      db.from("tsla_referral_goals").select("goal").eq("user_id", user.id),
    ]);
    return {
      me,
      isAdmin: ADMIN_USERNAMES.includes((user.username ?? "").toLowerCase()),
      tasks: tasks.data ?? [],
      done: (done.data ?? []).map((d: any) => d.task_id as string),
      referrals: refs.data ?? [],
      withdrawals: wd.data ?? [],
      referralCount: refCount.count ?? 0,
      claimedGoals: (goals.data ?? []).map((g: any) => Number(g.goal)),
    };
  });

export const startMining = createServerFn({ method: "POST" })
  .inputValidator(auth)
  .handler(async ({ data }) => {
    const { user, db } = await ctx(data.initData);
    const me = await loadUser(db, user.id);
    if (me.mining_started_at) throw new Error("Already mining");
    const synced = await syncPower(db, user.id);
    const now = new Date().toISOString();
    await db.from("tsla_tg_users").update({ mining_started_at: now, mining_settled_at: now, mining_pending: 0 }).eq("id", user.id);
    return { mining_started_at: now, mining_settled_at: now, mining_pending: 0, mining_rate_daily: synced.mining_rate_daily };
  });

export const claimMining = createServerFn({ method: "POST" })
  .inputValidator(auth)
  .handler(async ({ data }) => {
    const { user, db } = await ctx(data.initData);
    const me = await loadUser(db, user.id);
    if (!me.mining_started_at) throw new Error("Not mining");
    const { data: result, error } = await db.rpc("tesla_mining_claim", { p_user_id: user.id });
    if (error) throw new Error(error.message);
    await syncPower(db, user.id);
    return { ...await loadUser(db, user.id) };
  });

export const completeTask = createServerFn({ method: "POST" })
  .inputValidator((i: Auth & { taskId: string }) => ({ ...auth(i), taskId: String(i.taskId) }))
  .handler(async ({ data }) => {
    const { user, db } = await ctx(data.initData);
    const { data: task } = await db.from("tsla_tasks").select("*").eq("id", data.taskId).single();
    const tigerPreview = process.env["VERCEL_ENV"] === "preview" && task?.kind === "tiger_case_free";
    if (!task || (!task.active && !tigerPreview)) throw new Error("Task not found");
    // Real verification per task kind.
    if (task.kind === "tiger_case_free") {
      const { verifyTigerCaseFreeOpen } = await import("./tiger-case.server");
      const verified = await verifyTigerCaseFreeOpen(user.id, process.env["TIGER_CASE_API_KEY"]);
      if (!verified) throw new Error("TASK_NOT_VERIFIED");
      // Preview uses the live database, so verify the partner API but never persist completion or credit a real balance.
      if (tigerPreview) {
        const me = await loadUser(db, user.id);
        return { balance: Number(me.balance), power_level: Number(me.power_level), previewVerified: true };
      }
    }
    const match = String(task.link).match(/(?:^|\/\/)t\.me\/([A-Za-z0-9_]{5,})/);
    const chat = task.chat_id || (match && !String(task.link).includes("?") ? `@${match[1]}` : null);
    if (chat) {
      const { telegramApi } = await import("./telegram-api.server");
      const j = await telegramApi("getChatMember", { chat_id: chat, user_id: user.id });
      if (!j.ok || ["left", "kicked"].includes(j.result?.status)) throw new Error("TASK_NOT_VERIFIED");
    }
    if (task.kind === "ston") {
      const meNow = await loadUser(db, user.id);
      if (!meNow.wallet_address) throw new Error("TASK_NOT_VERIFIED");
      const held = await tslaHoldings(meNow.wallet_address).catch(() => 0);
      if (!(held > 0)) throw new Error("TASK_NOT_VERIFIED");
    }
    const { error } = await db.from("tsla_task_completions").insert({ user_id: user.id, task_id: task.id });
    if (error) throw new Error("Already completed");
    const me = await loadUser(db, user.id);
    const { data: owned } = await db.from("tsla_nfts").select("tier").eq("user_id", user.id);
    const balance = Number(me.balance) + Number(task.reward) * nftBenefits((owned ?? []).map((n: any) => n.tier)).tasks;
    await db.from("tsla_tg_users").update({ balance }).eq("id", user.id);
    const synced = await syncPower(db, user.id);
    return { balance, power_level: synced.power_level, previewVerified: false };
  });

export const upgradePower = createServerFn({ method: "POST" })
  .inputValidator((i: Auth & { level: number }) => ({ ...auth(i), level: Number(i.level) }))
  .handler(async ({ data }) => {
    const { user, db } = await ctx(data.initData);
    // Compatibility endpoint: holding coins grants power; never debit a balance.
    return syncPower(db, user.id);
  });

async function tslaHoldings(owner: string) {
  const url = `https://toncenter.com/api/v3/jetton/wallets?owner_address=${encodeURIComponent(owner)}&jetton_address=${TSLA_JETTON}&limit=1`;
  const r = await fetch(url);
  if (!r.ok) throw new Error(`Blockchain lookup failed [${r.status}]`);
  const j = (await r.json()) as { jetton_wallets?: { balance: string }[] };
  return Number(j.jetton_wallets?.[0]?.balance ?? 0) / 1e9;
}

export const setWallet = createServerFn({ method: "POST" })
  .inputValidator((i: Auth & { address: string | null }) => ({ ...auth(i), address: i.address ? String(i.address).slice(0, 80) : null }))
  .handler(async ({ data }) => {
    const { user, db } = await ctx(data.initData);
    await db.from("tsla_tg_users").update({ wallet_address: data.address, wallet_verified: false }).eq("id", user.id);
    return { ok: true };
  });

/** Grants the power level covered by TSLA the user actually holds in their connected wallet. */
export const verifyHoldings = createServerFn({ method: "POST" })
  .inputValidator(auth)
  .handler(async ({ data }) => {
    const { user, db } = await ctx(data.initData);
    return syncPower(db, user.id);
  });

/** Polls the receive wallet for an on-chain payment carrying a specific comment. */
async function findPayment(tag: string, minValue: number, attempts = 8, used = new Set<unknown>(), account: string = RECEIVE_WALLET) {
  for (let i = 0; i < attempts; i++) {
    try {
      const r = await fetch(`https://toncenter.com/api/v3/transactions?account=${account}&limit=100&sort=desc`);
      if (r.ok) {
        const j = (await r.json()) as any;
        const tx = (j.transactions ?? []).find((t: any) =>
          !used.has(t.hash) && !t.description?.aborted && t.in_msg?.message_content?.decoded?.comment === tag && Number(t.in_msg?.value ?? 0) >= minValue);
        if (tx) return tx;
      }
    } catch { /* retry */ }
    await new Promise((res) => setTimeout(res, 4000));
  }
  return null;
}

export const requestWithdraw = createServerFn({ method: "POST" })
  .inputValidator((i: Auth & { amount: number }) => ({ ...auth(i), amount: Number(i.amount) }))
  .handler(async ({ data }) => {
    const { user, db } = await ctx(data.initData);
    if (!Number.isFinite(data.amount) || data.amount < MIN_WITHDRAW || data.amount > 1e12) throw new Error(`Minimum is ${MIN_WITHDRAW} TSLA`);
    const me = await loadUser(db, user.id);
    if (!me.wallet_address || !me.wallet_verified) throw new Error("Verify wallet ownership first");
    if (Number(me.balance) < withdrawalDebit(data.amount)) throw new Error("Not enough TSLA including fee");
    const { data: pending } = await db.from("tsla_withdrawals").select("id").eq("user_id", user.id).in("status", ["pending", "submitted"]).limit(1);
    if (pending?.length) throw new Error("Your earlier withdrawal is still being confirmed");
    const { payoutPreflight } = await import("./payout.server");
    await payoutPreflight(data.amount, true);
    const { data: withdrawalId, error } = await db.rpc("tesla_paid_withdrawal", { p_user_id: user.id, p_amount: data.amount, p_address: me.wallet_address });
    if (error) throw new Error(error.message);
    const { processPayouts } = await import("./payout-queue.server");
    await processPayouts(db).catch((e: unknown) => console.error("Payout deferred", e));
    await syncPower(db, user.id).catch((e: unknown) => console.error("Power sync deferred", e));
    const { data: saved } = await db.from("tsla_withdrawals").select("status").eq("id", withdrawalId).single();
    return { id: withdrawalId, balance: (await loadUser(db, user.id)).balance, status: saved?.status ?? "pending" };

  });


async function gramBalance(address: string) {
  const r = await fetch(`https://toncenter.com/api/v3/account?address=${encodeURIComponent(address)}`);
  if (!r.ok) throw new Error(`Blockchain lookup failed [${r.status}]`);
  const j = (await r.json()) as any;
  return Number(j.balance ?? 0) / 1e9;
}

async function syncPower(db: any, id: number) {
  const me = await loadUser(db, id);
  const { marketSnapshot } = await import("./market.server");
  const market = await marketSnapshot(db);
  let external = 0, gramHeld = 0;
  try {
    if (me.wallet_verified && me.wallet_address) {
      external = await tslaHoldings(me.wallet_address);
      gramHeld = await gramBalance(me.wallet_address);
    }
  }
  catch { return { ...me, market, holdings: null, syncUnavailable: true }; }
  if (!market.tsla.priceUsd || market.stale) return { ...me, market, holdings: Number(me.balance) + external, syncUnavailable: true };
  // GRAM held in the verified wallet counts toward holdings at its USD value, expressed in TSLA.
  const gramAsTsla = market.gram?.priceUsd > 0 ? gramHeld * market.gram.priceUsd / market.tsla.priceUsd : 0;
  const holdings = Number(me.balance) + external + gramAsTsla;
  const level = levelForHoldings(holdings, market.tsla.priceUsd);
  const pro = me.subscribed_until && new Date(me.subscribed_until).getTime() > Date.now();
  const { data: owned } = await db.from("tsla_nfts").select("tier").eq("user_id", id);
  const perks = nftBenefits((owned ?? []).map((n: any) => n.tier));
  await db.from("tsla_tg_users").update({ referral_rate: perks.referralRate }).eq("id", id);
  const rate = dailyTsla(level, market.tsla.priceUsd) * (pro ? 2 : 1) * perks.mining;
  const { error } = await db.rpc("tesla_sync_power", { p_user_id: id, p_level: level, p_rate: rate });
  if (error) throw new Error(error.message);
  return { ...await loadUser(db, id), market, holdings, syncUnavailable: false };
}
export const getMarket = createServerFn({ method: "POST" }).inputValidator(auth).handler(async ({ data }) => {
  const { db } = await ctx(data.initData);
  const { marketSnapshot } = await import("./market.server");
  return marketSnapshot(db);
});
export const refreshMarket = createServerFn({ method: "POST" }).inputValidator(auth).handler(async ({ data }) => {
  const { db } = await adminCtx(data.initData);
  const { marketSnapshot } = await import("./market.server");
  return marketSnapshot(db, true);
});

export const walletBalances = createServerFn({ method: "POST" })
  .inputValidator((i: Auth & { address: string }) => ({ ...auth(i), address: String(i.address).slice(0, 80) }))
  .handler(async ({ data }) => {
    await ctx(data.initData);
    const [tsla, gram] = await Promise.all([
      tslaHoldings(data.address),
      gramBalance(data.address),
    ]);
    return { tsla, gram };
  });

export const SUB_PRICE_GRAM = 5;

/** Confirms a Pro payment on-chain (comment pro:<userId> to the receive wallet) and extends Pro by 30 days. */
export const verifySubscription = createServerFn({ method: "POST" })
  .inputValidator(auth)
  .handler(async ({ data }) => {
    const { RECEIVE_WALLET } = await import("./config");
    const { user, db } = await ctx(data.initData);
    const r = await fetch(`https://toncenter.com/api/v3/transactions?account=${RECEIVE_WALLET}&limit=100&sort=desc`);
    if (!r.ok) throw new Error(`Blockchain lookup failed [${r.status}]`);
    const j = (await r.json()) as any;
    const tag = `pro:${user.id}`;
    const tx = (j.transactions ?? []).find((t: any) =>
      t.in_msg?.message_content?.decoded?.comment === tag && Number(t.in_msg?.value ?? 0) >= SUB_PRICE_GRAM * 1e9);
    if (!tx) throw new Error("Payment not found yet, try again in a minute");
    const me = await loadUser(db, user.id);
    const txTime = Number(tx.now) * 1000;
    const base = Math.max(Date.now(), me.subscribed_until ? new Date(me.subscribed_until).getTime() : 0);
    // only credit a payment made after the current period was purchased
    if (me.subscribed_until && txTime < new Date(me.subscribed_until).getTime() - 30 * 86400_000) throw new Error("Payment already used");
    const until = new Date(base + 30 * 86400_000).toISOString();
    await db.from("tsla_tg_users").update({ subscribed_until: until }).eq("id", user.id);
    return { subscribed_until: until };
  });

// ============= Admin =============

async function adminCtx(initData: string) {
  const c = await ctx(initData);
  if (!ADMIN_USERNAMES.includes((c.user.username ?? "").toLowerCase())) throw new Error("Forbidden");
  return c;
}

export const adminOverview = createServerFn({ method: "POST" })
  .inputValidator(auth)
  .handler(async ({ data }) => {
    const { db } = await adminCtx(data.initData);
    const [users, withdrawals, tasks, nfts, apps] = await Promise.all([
      db.from("tsla_tg_users").select("id", { count: "exact", head: true }),
      db.from("tsla_withdrawals").select("*").order("created_at", { ascending: false }).limit(50),
      db.from("tsla_tasks").select("*").order("sort"),
      db.from("tsla_nfts").select("id", { count: "exact", head: true }),
      db.from("tsla_task_apps").select("*").order("created_at"),
    ]);
    let totalBalance = 0;
    for (let from = 0; ; from += 1000) {
      const { data: page } = await db.from("tsla_tg_users").select("balance").order("id").range(from, from + 999);
      for (const u of page ?? []) totalBalance += Number(u.balance);
      if (!page || page.length < 1000) break;
    }
    return {
      users: users.count ?? 0,
      totalBalance,
      withdrawals: withdrawals.data ?? [],
      tasks: tasks.data ?? [],
      nfts: nfts.count ?? 0,
      apps: apps.data ?? [],
    };
  });

export const adminAddApp = createServerFn({ method: "POST" })
  .inputValidator((i: Auth & { name: string; image: string; category?: string }) => {
    const name = String(i.name ?? "").trim().slice(0, 60);
    const image = String(i.image ?? "");
    const category = ["ours", "partners", "others"].includes(String(i.category)) ? String(i.category) : "ours";
    if (!name || !/^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/.test(image) || image.length > 120000) throw new Error("Invalid application name or image");
    return { ...auth(i), name, image, category };
  }).handler(async ({ data }) => {
    const { db } = await adminCtx(data.initData);
    const { error } = await db.from("tsla_task_apps").insert({ name: data.name, image: data.image, category: data.category } as any);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const adminAddTask = createServerFn({ method: "POST" })
  .inputValidator((i: Auth & { title: string; link: string; appId: string; reward?: number }) => {
    const title = String(i.title ?? "").trim().slice(0, 120);
    const link = String(i.link ?? "").trim();
    if (!title || link.length > 300 || new URL(link).protocol !== "https:") throw new Error("Invalid task name or link");
    const reward = Math.max(0, Math.min(100000, Number(i.reward ?? 0) || 0));
    return { ...auth(i), title, link, appId: String(i.appId), reward };
  }).handler(async ({ data }) => {
    const { db } = await adminCtx(data.initData);
    const { data: app, error: appError } = await db.from("tsla_task_apps").select("*").eq("id", data.appId).single();
    if (appError || !app) throw new Error("Select an application first");
    const priv = data.link.match(/t\.me\/c\/(\d+)/);
    const kind = /ston\.fi/i.test(data.link) ? "ston" : priv ? "channel" : "link";
    const { translateTitle } = await import("./translate.server");
    const title_i18n = await translateTitle(data.title);
    const { error } = await db.from("tsla_tasks").insert({ title: data.title, link: data.link, reward: data.reward, kind, chat_id: priv ? `-100${priv[1]}` : null, title_i18n,
      app_id: app.id, app_name: app.name, app_image: app.image, image_url: app.image, app_category: (app as any).category ?? "ours" } as any);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const adminUpdateTask = createServerFn({ method: "POST" })
  .inputValidator((i: Auth & { taskId: string; title: string; link: string; reward: number }) => {
    const title = String(i.title ?? "").trim().slice(0, 120);
    const link = String(i.link ?? "").trim();
    const reward = Number(i.reward);
    if (!title || link.length > 300 || new URL(link).protocol !== "https:") throw new Error("Invalid task name or link");
    if (!Number.isFinite(reward) || reward < 0 || reward > 100000) throw new Error("Invalid reward");
    return { ...auth(i), taskId: String(i.taskId), title, link, reward };
  }).handler(async ({ data }) => {
    const { db } = await adminCtx(data.initData);
    const { data: old } = await db.from("tsla_tasks").select("title").eq("id", data.taskId).single();
    const patch: any = { link: data.link, reward: data.reward, title: data.title };
    if (old && old.title !== data.title) { const { translateTitle } = await import("./translate.server"); patch.title_i18n = await translateTitle(data.title); }
    const { error } = await db.from("tsla_tasks").update(patch).eq("id", data.taskId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const adminDeleteTask = createServerFn({ method: "POST" })
  .inputValidator((i: Auth & { taskId: string }) => ({ ...auth(i), taskId: String(i.taskId) }))
  .handler(async ({ data }) => {
    const { db } = await adminCtx(data.initData);
    const { data: t } = await db.from("tsla_tasks").select("kind").eq("id", data.taskId).single();
    if (t && ["story", "share"].includes(t.kind)) throw new Error("Built-in share tasks can be edited or hidden, not deleted");
    await db.from("tsla_task_completions").delete().eq("task_id", data.taskId);
    const { error } = await db.from("tsla_tasks").delete().eq("id", data.taskId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const adminToggleTask = createServerFn({ method: "POST" })
  .inputValidator((i: Auth & { taskId: string; active: boolean }) => ({ ...auth(i), taskId: String(i.taskId), active: !!i.active }))
  .handler(async ({ data }) => {
    const { db } = await adminCtx(data.initData);
    const { error } = await db.from("tsla_tasks").update({ active: data.active }).eq("id", data.taskId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// ============= NFT =============

/** Buys an NFT tier: verifies the GRAM payment to the receive wallet, records it, activates perks, then tries to mint. */
export const buyNft = createServerFn({ method: "POST" })
  .inputValidator((i: Auth & { tier: number }) => ({ ...auth(i), tier: Number(i.tier) }))
  .handler(async ({ data }) => {
    const tier = NFT_TIERS.find(t => t.tier === data.tier);
    if (!tier) throw new Error("Invalid NFT tier");
    const { user, db } = await ctx(data.initData);
    const me = await loadUser(db, user.id);
    if (!me.wallet_address) throw new Error("Connect your wallet first");
    const { data: usedRows } = await db.from("tsla_nfts").select("tx_hash");
    const usedSet = new Set((usedRows ?? []).map((r: any) => r.tx_hash).filter(Boolean));
    const tx = await findPayment(`nft:${user.id}:${tier.tier}`, Math.round(tier.price * 1e9), 8, usedSet);
    if (!tx) throw new Error("Payment not found yet, try again in a minute");
    const { count } = await db.from("tsla_nfts").select("id", { count: "exact", head: true });
    const itemIndex = count ?? 0;
    const { error } = await db.from("tsla_nfts").insert({ user_id: user.id, item_index: itemIndex, price_gram: tier.price, tx_hash: tx.hash, tier: tier.tier, mint_status: "pending" });
    if (error) throw new Error("This payment was already used");
    await syncPower(db, user.id);
    try {
      const { getgemsMint } = await import("./getgems.server");
      await getgemsMint(`nft-${tx.hash}`.slice(0, 100), me.wallet_address, tier.tier);
      await db.from("tsla_nfts").update({ mint_status: "submitted" }).eq("tx_hash", tx.hash);
    } catch (e) { console.error("NFT mint deferred:", e); }
    return { itemIndex, tier: tier.tier };
  });

export const myNfts = createServerFn({ method: "POST" })
  .inputValidator(auth)
  .handler(async ({ data }) => {
    const { user, db } = await ctx(data.initData);
    const { data: rows } = await db.from("tsla_nfts").select("*").eq("user_id", user.id).order("created_at", { ascending: false });
    return { nfts: rows ?? [], collection: NFT_COLLECTION_ADDRESS, price: NFT_PRICE_GRAM };
  });

export const walletChallenge = createServerFn({ method: "POST" }).inputValidator(auth).handler(async ({ data }) => {
  const { user, db } = await ctx(data.initData);
  const nonce = `${Date.now()}:${crypto.randomUUID()}`;
  const { error } = await db.from("tsla_tg_users").update({ wallet_nonce: nonce }).eq("id", user.id);
  if (error) throw new Error(error.message);
  return { nonce };
});
export const proveWallet = createServerFn({ method: "POST" }).inputValidator((i: Auth & { address: string; proof: { timestamp: number; domain: { lengthBytes: number; value: string }; payload: string; signature: string } }) => ({ ...auth(i), address: i.address, proof: i.proof })).handler(async ({ data }) => {
  const { user, db } = await ctx(data.initData);
  const me = await loadUser(db, user.id);
  if (!me.wallet_nonce || Date.now() - Number(me.wallet_nonce.split(":")[0]) > 300000) throw new Error("Request a new wallet verification");
  const { getRequest } = await import("@tanstack/react-start/server");
  const { verifyWalletProof } = await import("./wallet-proof.server");
  const address = await verifyWalletProof(data.address, data.proof, me.wallet_nonce, [new URL(getRequest().url).host, "tesla.vercel.app", "botkey-telegram-bridge.lovable.app"]);
  const { data: other } = await db.from("tsla_tg_users").select("id").eq("wallet_address", address).eq("wallet_verified", true).neq("id", user.id).limit(1);
  if (other?.length) throw new Error("Wallet already linked to another account");
  const { error } = await db.from("tsla_tg_users").update({ wallet_address: address, wallet_verified: true, wallet_nonce: null }).eq("id", user.id).eq("wallet_nonce", me.wallet_nonce).select("id").single();
  if (error) throw new Error(error.message);
  return syncPower(db, user.id);
});

export const checkWithdrawal = createServerFn({ method: "POST" }).inputValidator((i: Auth & { amount: number }) => ({ ...auth(i), amount: Number(i.amount) })).handler(async ({ data }) => {
  const { user, db } = await ctx(data.initData);
  const me = await loadUser(db, user.id);
  if (!Number.isFinite(data.amount) || data.amount < MIN_WITHDRAW || data.amount > 1e12 || withdrawalDebit(data.amount) > Number(me.balance)) throw new Error("Not enough TSLA including fee or below minimum withdrawal");
  const { payoutPreflight } = await import("./payout.server");
  if (!me.wallet_address || !me.wallet_verified) throw new Error("Verify wallet ownership first");
  const { count: confirmedAds, error: adsError } = await db.from("tsla_ad_views").select("id", { count: "exact", head: true }).eq("user_id", user.id).not("confirmed_at", "is", null).is("consumed_by", null);
  if (adsError || !adsPermitWithdrawal(confirmedAds ?? 0)) throw new Error("Watch 5 verified ads in Tasks before withdrawing");
  const { data: pending } = await db.from("tsla_withdrawals").select("id").eq("user_id", user.id).in("status", ["pending", "submitted"]).limit(1);
  if (pending?.length) throw new Error("Your earlier withdrawal is still being confirmed");
  await payoutPreflight(data.amount, true);
  return { ok: true };
});

/** Admin: retries minting every paid-but-unminted NFT. */
export const adminMintPending = createServerFn({ method: "POST" })
  .inputValidator((i: Auth) => auth(i))
  .handler(async ({ data }) => {
    const { db } = await adminCtx(data.initData);
    const { data: rows } = await db.from("tsla_nfts").select("id,item_index,user_id,tier,tx_hash").eq("mint_status", "pending").order("item_index");
    const { getgemsMint } = await import("./getgems.server");
    let minted = 0;
    for (const n of rows ?? []) {
      const { data: u } = await db.from("tsla_tg_users").select("wallet_address").eq("id", n.user_id).single();
      if (!u?.wallet_address) continue;
      await getgemsMint(`nft-${n.tx_hash ?? n.id}`.slice(0, 100), u.wallet_address, n.tier ?? 1);
      await db.from("tsla_nfts").update({ mint_status: "submitted" }).eq("id", n.id);
      minted++;
    }
    return { minted, pending: (rows?.length ?? 0) - minted };
  });

export const spinDaily = createServerFn({ method: "POST" }).inputValidator(auth).handler(async ({ data }) => {
  const { user, db } = await ctx(data.initData);
  const { data: result, error } = await db.rpc("tesla_spin_daily", { p_user_id: user.id });
  if (error) throw new Error(error.message);
  return result as { reward: number; balance: number; nextSpinAt: string };
});
export const gameStatus = createServerFn({ method: "POST" }).inputValidator(auth).handler(async ({ data }) => {
  const { user, db } = await ctx(data.initData);
  const { data: row, error } = await db.from("tsla_game_spins").select("last_spun_at").eq("user_id", user.id).maybeSingle();
  if (error) throw new Error(error.message);
  return { nextSpinAt: row?.last_spun_at ? new Date(new Date(row.last_spun_at).getTime() + 86400000).toISOString() : null };
});

export const claimReferralGoal = createServerFn({ method: "POST" })
  .inputValidator((i: Auth & { goal: number }) => ({ ...auth(i), goal: Number(i.goal) }))
  .handler(async ({ data }) => {
    const { user, db } = await ctx(data.initData);
    const { data: reward, error } = await (db as any).rpc("tsla_claim_referral_goal", { p_user_id: user.id, p_goal: data.goal });
    if (error) throw new Error(error.message);
    return { reward: Number(reward) };
  });
