import { useEffect, useMemo, useRef, useState } from 'react';
import { kolcashDb } from './lib/kolcash-db';
import { KOLSCAN_SEED } from './kolscan-seed';

const PLATFORM_X = 'https://x.com/kol_cash';
const KOLCASH_CA = 'eZzHF8KESNNCvhqM7bEwX9q6fR5K7856v2n914H9ko1';
const GOLD_BADGE = 'https://thumb.wikimedia.org/wikipedia/commons/thumb/8/81/Twitter_Verified_Badge_Gold.svg/960px-Twitter_Verified_Badge_Gold.svg.png?utm_source=commons.wikimedia.org&utm_campaign=index&utm_content=thumbnail&_=20230122072942';

type Kol = { rank: number; wallet: string; display_name?: string; name?: string; username?: string | null; avatar_url?: string | null; token_ca?: string | null; buys?: number; sells?: number; pnl_sol?: number; pnl_usd?: number; source?: string };
type Launch = { id: string; token_name: string; ticker: string; kol_wallet: string; kol_fee_bps: number; status: string; created_at: string; mint?: string | null; signature?: string | null };
type WalletState = { pk: string; provider: any } | null;
type DexPair = { marketCap?: number; fdv?: number; volume?: { h24?: number }; txns?: { h24?: { buys?: number; sells?: number } }; pairAddress?: string };
type Page = 'home' | 'launch' | 'add-kol';

const FALLBACK_KOLS: Kol[] = KOLSCAN_SEED.map((kol) => ({ ...kol, display_name: kol.name, token_ca: '' }));

function shortCa(ca: string) { return ca?.length > 14 ? `${ca.slice(0, 6)}...${ca.slice(-6)}` : ca; }
function nameOf(kol?: Kol) { return kol ? (kol.display_name || kol.name || kol.username || shortCa(kol.wallet)) : 'KOL'; }
function avatarFor(kol: Kol) { return kol.avatar_url || `https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(nameOf(kol))}`; }
function usd(value?: number) { const n = Number(value || 0); if (!n) return '$0'; if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}m`; if (n >= 1_000) return `$${(n / 1_000).toFixed(1)}k`; return `$${Math.round(n).toLocaleString()}`; }
function bytesToBase64(bytes: Uint8Array) { let bin = ''; bytes.forEach((b) => { bin += String.fromCharCode(b); }); return btoa(bin); }

async function connectWallet(): Promise<WalletState> {
  const provider = (window as any).solana || (window as any).phantom?.solana;
  if (!provider) throw new Error('Install or open a Solana wallet first.');
  const res = await provider.connect();
  return { pk: res.publicKey.toBase58(), provider };
}
async function ensureWeb3() {
  if ((window as any).solanaWeb3) return (window as any).solanaWeb3;
  await new Promise<void>((resolve, reject) => { const s = document.createElement('script'); s.src = 'https://unpkg.com/@solana/web3.js@1.98.2/lib/index.iife.min.js'; s.onload = () => resolve(); s.onerror = () => reject(new Error('Could not load Solana transaction library.')); document.head.appendChild(s); });
  return (window as any).solanaWeb3;
}


function TrailerPreview({ marketCap, volume24h, selectedName }: { marketCap: number; volume24h: number; selectedName: string }) {
  return <section className="trailer-preview" aria-label="KOL Cash trailer preview">
    <div className="trailer-copy"><p>trailer preview</p><h1>attention should pay its source.</h1><span>KOL Cash turns KOL wallets into launch destinations. Pick the voice, route the fees, let the market prove who can move attention.</span><div><a href="#launch">launch with a KOL</a><a href="#add-kol">add a KOL</a></div></div>
    <div className="trailer-screen"><div className="trailer-top"><b>KOL_CASH.EXE</b><i>LIVE</i></div><div className="trailer-stage video-stage"><video autoPlay muted loop playsInline preload="auto" poster="/kol-trailer-poster.jpg"><source src="/kol-trailer.webm" type="video/webm"/><source src="/kol-trailer.mp4" type="video/mp4"/></video><div className="scanline one"/><div className="scanline two"/><div className="trailer-burst">fees → {selectedName}</div></div><div className="trailer-feed"><span>MC {usd(marketCap)}</span><span>VOL {usd(volume24h)}</span><span>CA {shortCa(KOLCASH_CA)}</span></div></div>
  </section>;
}

export default function App() {
  const [kols, setKols] = useState<Kol[]>(FALLBACK_KOLS);
  const [launches, setLaunches] = useState<Launch[]>([]);
  const [selectedWallet, setSelectedWallet] = useState(FALLBACK_KOLS[0]?.wallet || '');
  const [page, setPage] = useState<Page>(() => (location.hash === '#launch' ? 'launch' : location.hash === '#add-kol' ? 'add-kol' : 'home'));
  const [dexStats, setDexStats] = useState({ marketCap: 0, volume24h: 0 });
  const [query, setQuery] = useState('');
  const [tokenName, setTokenName] = useState('');
  const [ticker, setTicker] = useState('');
  const [description, setDescription] = useState('');
  const [feeSplit, setFeeSplit] = useState(100);
  const [tokenImage, setTokenImage] = useState<File | null>(null);
  const [wallet, setWallet] = useState<WalletState>(null);
  const [copied, setCopied] = useState(false);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState('');
  const [newKol, setNewKol] = useState({ name: '', username: '', wallet: '', avatar: '', ca: '' });
  const [addingKol, setAddingKol] = useState(false);
  const [cursor, setCursor] = useState({ x: -100, y: -100, active: false });
  const noticeTimer = useRef<number | null>(null);

  useEffect(() => {
    function move(event: MouseEvent) { setCursor((current) => ({ ...current, x: event.clientX, y: event.clientY })); }
    function hover(event: MouseEvent) { setCursor((current) => ({ ...current, active: Boolean((event.target as HTMLElement | null)?.closest('button,a,input,textarea,label')) })); }
    window.addEventListener('mousemove', move); window.addEventListener('mouseover', hover);
    return () => { window.removeEventListener('mousemove', move); window.removeEventListener('mouseover', hover); };
  }, []);

  useEffect(() => {
    function syncPage() { setPage(location.hash === '#launch' ? 'launch' : location.hash === '#add-kol' ? 'add-kol' : 'home'); }
    syncPage();
    window.addEventListener('hashchange', syncPage);
    return () => window.removeEventListener('hashchange', syncPage);
  }, []);

  useEffect(() => {
    let alive = true;
    async function loadDex() {
      try {
        const response = await fetch(`https://api.dexscreener.com/latest/dex/tokens/${KOLCASH_CA}`, { cache: 'no-store' });
        const body = await response.json();
        const pairs: DexPair[] = Array.isArray(body?.pairs) ? body.pairs : [];
        const pair = pairs.find((item) => item.pairAddress) || pairs[0];
        if (alive && pair) setDexStats({ marketCap: Number(pair.marketCap || pair.fdv || 0), volume24h: Number(pair.volume?.h24 || 0) });
      } catch { /* retain last market stats */ }
    }
    void loadDex();
    const id = window.setInterval(loadDex, 20_000);
    return () => { alive = false; window.clearInterval(id); };
  }, []);

  useEffect(() => {
    let alive = true;
    async function load() {
      try {
        const { data: kolRows } = await kolcashDb.from('kolcash_kols').select('rank,wallet,display_name,username,avatar_url,token_ca,buys,sells,pnl_sol,pnl_usd,source').order('rank', { ascending: true }).limit(150);
        if (alive && kolRows?.length) { setKols(kolRows as Kol[]); if (!selectedWallet) setSelectedWallet(kolRows[0].wallet); }
      } catch { /* fallback seed stays visible */ }
      try {
        const { data: launchRows } = await kolcashDb.from('kolcash_launches').select('id,token_name,ticker,kol_wallet,kol_fee_bps,status,created_at,mint,signature').order('created_at', { ascending: false }).limit(12);
        const localRows = JSON.parse(window.localStorage.getItem('kolcash-local-launches') || '[]') as Launch[];
        if (alive) setLaunches([...(launchRows as Launch[] || []), ...localRows].slice(0, 12));
      } catch { const localRows = JSON.parse(window.localStorage.getItem('kolcash-local-launches') || '[]') as Launch[]; if (alive) setLaunches(localRows); }
    }
    void load();
    const kchan = kolcashDb.channel('kolcash-kols-live').on('postgres_changes', { event: '*', schema: 'public', table: 'kolcash_kols' }, () => void load()).subscribe();
    const lchan = kolcashDb.channel('kolcash-launches-live').on('postgres_changes', { event: '*', schema: 'public', table: 'kolcash_launches' }, () => void load()).subscribe();
    return () => { alive = false; kolcashDb.removeChannel(kchan); kolcashDb.removeChannel(lchan); };
  }, []);

  const selectedKol = useMemo(() => kols.find((kol) => kol.wallet === selectedWallet) || kols[0], [kols, selectedWallet]);
  const filteredKols = query.trim() ? kols.filter((kol) => `${nameOf(kol)} ${kol.username || ''} ${kol.wallet} ${kol.token_ca || ''}`.toLowerCase().includes(query.trim().toLowerCase())) : kols;
  const featured = kols.slice(0, 9);
  const previewName = tokenName.trim() || `${nameOf(selectedKol)} Cash`;
  const previewTicker = ticker.trim().replace(/[^a-zA-Z0-9]/g, '').toUpperCase() || 'KOL';
  const totalPnl = kols.reduce((sum, kol) => sum + Number(kol.pnl_usd || 0), 0);
  const totalBuys = kols.reduce((sum, kol) => sum + Number(kol.buys || 0), 0);

  function flash(text: string) { setNotice(text); if (noticeTimer.current) window.clearTimeout(noticeTimer.current); noticeTimer.current = window.setTimeout(() => setNotice(''), 5000); }
  function selectKol(kol: Kol) { setSelectedWallet(kol.wallet); flash(`${nameOf(kol)} selected as fee recipient`); }
  function copyCa() { void navigator.clipboard.writeText(KOLCASH_CA); setCopied(true); window.setTimeout(() => setCopied(false), 1200); }

  async function addKol() {
    if (!newKol.name.trim() || !newKol.wallet.trim()) return flash('add a KOL name and wallet address');
    setAddingKol(true);
    const row = { rank: kols.length + 1, wallet: newKol.wallet.trim(), display_name: newKol.name.trim(), username: newKol.username.trim() || null, avatar_url: newKol.avatar.trim() || null, token_ca: newKol.ca.trim() || null, source: 'user', buys: 0, sells: 0, pnl_sol: 0, pnl_usd: 0 };
    try {
      const { error } = await kolcashDb.from('kolcash_kols').upsert(row, { onConflict: 'wallet' });
      if (error) throw error;
      setKols((current) => [row, ...current.filter((kol) => kol.wallet !== row.wallet)]);
      setSelectedWallet(row.wallet); setNewKol({ name: '', username: '', wallet: '', avatar: '', ca: '' }); flash('KOL added to live index');
    } catch (error) {
      setKols((current) => [row, ...current.filter((kol) => kol.wallet !== row.wallet)]);
      setSelectedWallet(row.wallet); flash(`added locally. DB failed: ${error instanceof Error ? error.message : 'unreachable'}`);
    } finally { setAddingKol(false); }
  }

  async function submitLaunch() {
    if (!selectedKol || !tokenName.trim() || !ticker.trim() || !tokenImage) return flash('add name, ticker, image, and KOL recipient first');
    setSaving(true);
    try {
      const w = wallet || await connectWallet(); setWallet(w);
      const form = new FormData();
      form.set('launch', JSON.stringify({ wallet: w.pk, name: tokenName.trim(), symbol: previewTicker, description: description.trim() || `${previewName} launched on KOL Cash. Creator fees route to ${nameOf(selectedKol)}.`, totalSupply: '1000000000', decimals: 9, kolWallet: selectedKol.wallet, kolName: nameOf(selectedKol), kolFeeBps: Math.round(feeSplit * 100) }));
      form.set('file', tokenImage, tokenImage.name || 'token.png');
      const preparedRes = await fetch('/api/deploy', { method: 'POST', body: form }); const prepared = await preparedRes.json(); if (!preparedRes.ok) throw new Error(prepared.error || 'launch prepare failed');
      const web3 = await ensureWeb3(); const tx = web3.VersionedTransaction.deserialize(Uint8Array.from(atob(prepared.transactions[0].transaction), (c: string) => c.charCodeAt(0)));
      if (!w.provider.signTransaction) throw new Error('This wallet cannot sign the launch transaction.');
      flash('approve launch transaction in your wallet');
      const signed = await w.provider.signTransaction(tx); const encoded = bytesToBase64(signed.serialize());
      const confirmRes = await fetch('/api/deploy-confirm', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ intentId: prepared.intentId, transaction: encoded, name: prepared.name, symbol: prepared.symbol, description: prepared.description, metadataUri: prepared.metadataUri, kolWallet: selectedKol.wallet, feeRecipient: selectedKol.wallet }) });
      const confirmed = await confirmRes.json(); if (!confirmRes.ok || confirmed.status !== 'confirmed') throw new Error(confirmed.error || 'launch confirmation failed');
      const dbRow = { token_name: tokenName.trim(), ticker: previewTicker, description: description.trim(), launcher_wallet: w.pk, kol_wallet: selectedKol.wallet, kol_fee_bps: Math.round(feeSplit * 100), status: 'launched', mint: confirmed.mint, signature: confirmed.signature };
      const { data } = await kolcashDb.from('kolcash_launches').insert(dbRow).select('id,token_name,ticker,kol_wallet,kol_fee_bps,status,created_at,mint,signature').single();
      const row = data as Launch || { id: crypto.randomUUID(), ...dbRow, created_at: new Date().toISOString() };
      setLaunches((current) => [row, ...current].slice(0, 12)); flash(`${previewTicker} launched. Fees route to ${nameOf(selectedKol)}.`);
    } catch (error) { flash(error instanceof Error ? error.message : 'launch failed'); }
    finally { setSaving(false); }
  }

  return <main className="nomo-page"><div className={cursor.active ? 'pump-cursor is-active' : 'pump-cursor'} style={{ left: cursor.x, top: cursor.y }} aria-hidden="true"><img src="/pump-cursor.svg" alt="" /></div>
    <header className="nomo-nav"><a className="nomo-brand wallet-title logo-only" href="#" aria-label="KOL Cash home"><img className="nomo-logo" src="/kol-logo.png" alt="KOL"/></a><div className="nomo-actions"><a className={page === 'home' ? 'active-nav' : ''} href="#">leaderboard</a><a className={page === 'launch' ? 'active-nav' : ''} href="#launch">launch</a><a className={page === 'add-kol' ? 'active-nav' : ''} href="#add-kol">add KOL</a><a href={PLATFORM_X} target="_blank" rel="noreferrer">X</a><button type="button" onClick={copyCa}>{copied ? 'copied' : 'copy CA'}</button></div></header>
    <section className="launch-notice"><span>CA: {shortCa(KOLCASH_CA)}</span><a href={`https://pump.fun/coin/${KOLCASH_CA}`} target="_blank" rel="noreferrer">pump.fun</a></section>
    <section className="nomo-strip market-strip"><Stat label="realtime market cap" value={usd(dexStats.marketCap)} sub="dexscreener live"/><Stat label="24h volume" value={usd(dexStats.volume24h)} sub="dexscreener live"/></section>{notice && <div className="buy-toast"><b>{notice}</b><span>KOL Cash launchpad</span><button type="button" onClick={() => setNotice('')}>×</button></div>}
    {page === 'launch' && <section className="wpm-activity" id="launch"><div><p>live launchpad</p><h2>{previewName}</h2></div><div className="launch-form-grid"><label>token name<input value={tokenName} onChange={(e) => setTokenName(e.target.value)} placeholder={`${nameOf(selectedKol)} Cash`} maxLength={32}/></label><label>ticker<input value={ticker} onChange={(e) => setTicker(e.target.value)} placeholder="KOL" maxLength={10}/></label><label>token image<input type="file" accept="image/png,image/jpeg,image/webp,image/gif" onChange={(e) => setTokenImage(e.target.files?.[0] || null)}/></label><label>connected wallet<button type="button" className="mini-action" onClick={async () => { try { setWallet(await connectWallet()); } catch (e) { flash(e instanceof Error ? e.message : 'wallet failed'); } }}>{wallet ? shortCa(wallet.pk) : 'connect wallet'}</button></label><label>description<textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="why this KOL deserves a fee market" maxLength={500}/></label><label>KOL fee route: {feeSplit}%<input type="range" min="25" max="100" step="5" value={feeSplit} onChange={(e) => setFeeSplit(Number(e.target.value))}/></label><button type="button" className="launch-submit" disabled={saving} onClick={() => void submitLaunch()}>{saving ? 'launching...' : `launch ${previewTicker} for ${nameOf(selectedKol)}`}</button></div></section>}
    {page === 'add-kol' && <section className="wpm-activity" id="add-kol"><div><p>live index</p><h2>add a KOL</h2></div><div className="launch-form-grid"><label>KOL name<input value={newKol.name} onChange={(e) => setNewKol({ ...newKol, name: e.target.value })} placeholder="name"/></label><label>@handle<input value={newKol.username} onChange={(e) => setNewKol({ ...newKol, username: e.target.value })} placeholder="optional"/></label><label>wallet address<input value={newKol.wallet} onChange={(e) => setNewKol({ ...newKol, wallet: e.target.value })} placeholder="Solana wallet"/></label><label>CA<input value={newKol.ca} onChange={(e) => setNewKol({ ...newKol, ca: e.target.value })} placeholder="optional token CA"/></label><label>pfp image URL<input value={newKol.avatar} onChange={(e) => setNewKol({ ...newKol, avatar: e.target.value })} placeholder="https://..."/></label><button type="button" className="launch-submit" disabled={addingKol} onClick={() => void addKol()}>{addingKol ? 'adding...' : 'add KOL to live index'}</button></div></section>}
    {page === 'home' && <><TrailerPreview marketCap={dexStats.marketCap} volume24h={dexStats.volume24h} selectedName={nameOf(selectedKol)} /><section className="kimchi-receipts" id="markets"><div className="kimchi-receipts-head"><p>{kols.length} KOL wallets indexed</p><h2>choose fee recipient</h2></div><div className="kol-search"><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="search KOL, handle, wallet, or CA"/></div><div className="premium-markets"><p>top Kolscan KOLs</p>{featured.map((kol) => <article className={selectedWallet === kol.wallet ? 'has-live-market selected-kol' : 'has-live-market'} key={kol.wallet} onClick={() => selectKol(kol)}><img src={avatarFor(kol)} alt=""/><div><b>{nameOf(kol)}<img className="premium-check" src={GOLD_BADGE} alt="gold verified" /></b><small>{shortCa(kol.wallet)}</small></div><span>#{kol.rank}</span><div className="kol-call"><span className="kol-chip yes-chip">{Number(kol.pnl_sol || 0).toFixed(1)} SOL</span><span className="kol-chip no-chip">{kol.buys || 0}/{kol.sells || 0}</span></div></article>)}</div><div className="kol-index"><div className="kol-index-head"><span>KOL</span><span>source</span><span>wallet</span><span>route fees</span></div>{filteredKols.map((kol, index) => <article className={selectedWallet === kol.wallet ? 'kol-row row-selected' : 'kol-row'} key={kol.wallet}><span className="kol-rank">{String(kol.rank || index + 1).padStart(2, '0')}</span><img src={avatarFor(kol)} alt="" onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = `https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(nameOf(kol))}`; }}/><div className="kol-name"><b>{nameOf(kol)}{(kol.rank || 999) <= 50 && <img className="inline-badge" src={GOLD_BADGE} alt="gold verified" />}</b><small>{kol.username || kol.source || 'kolscan KOL'}{kol.token_ca ? ` · ${shortCa(kol.token_ca)}` : ''}</small></div><a className="kol-social" href={`https://kolscan.io/account/${kol.wallet}?timeframe=1`} target="_blank" rel="noreferrer">Kolscan ↗</a><a className="kol-wallet" href={`https://solscan.io/account/${kol.wallet}`} target="_blank" rel="noreferrer">{shortCa(kol.wallet)}</a><div className="kol-call"><button className={selectedWallet === kol.wallet ? 'yes active' : 'yes'} type="button" onClick={() => selectKol(kol)}>select</button><button className="no" type="button" onClick={() => { selectKol(kol); location.hash = '#launch'; }}>launch</button></div></article>)}</div></section></>}
    {page === 'launch' && <section className="wpm-activity"><div><p>launch queue</p><h2>fee-routed launches</h2></div><div>{launches.length ? launches.map((l) => <article key={l.id}><b>${l.ticker} routes {l.kol_fee_bps / 100}% to {shortCa(l.kol_wallet)}</b><span>{l.status}{l.mint ? ` · ${shortCa(l.mint)}` : ''} · {new Date(l.created_at).toLocaleString()}</span></article>) : <p className="activity-empty">No KOL Cash launches submitted yet.</p>}</div></section>}
  </main>;
}
function Stat({ label, value, sub }: { label: string; value: string; sub: string }) { return <div><span>{label}</span><b>{value}</b><small>{sub}</small></div>; }
