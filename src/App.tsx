import { useEffect, useMemo, useRef, useState } from 'react';
import { kolcashDb } from './lib/kolcash-db';
import { KOLSCAN_SEED } from './kolscan-seed';

const PLATFORM_X = 'https://x.com/kolcashfun';

type Kol = {
  rank: number;
  wallet: string;
  display_name?: string;
  name?: string;
  username?: string | null;
  avatar_url?: string | null;
  buys?: number;
  sells?: number;
  pnl_sol?: number;
  pnl_usd?: number;
};

type Launch = {
  id: string;
  token_name: string;
  ticker: string;
  kol_wallet: string;
  kol_fee_bps: number;
  status: string;
  created_at: string;
};

const FALLBACK_KOLS: Kol[] = KOLSCAN_SEED.map((kol) => ({ ...kol, display_name: kol.name }));

function shortCa(ca: string) { return `${ca.slice(0, 6)}...${ca.slice(-6)}`; }
function nameOf(kol: Kol) { return kol.display_name || kol.name || kol.username || shortCa(kol.wallet); }
function avatarFor(kol: Kol) { return kol.avatar_url || `https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(nameOf(kol))}`; }
function usd(value?: number) {
  const number = Number(value || 0);
  if (!number) return '$0';
  if (number >= 1_000_000) return `$${(number / 1_000_000).toFixed(2)}m`;
  if (number >= 1_000) return `$${(number / 1_000).toFixed(1)}k`;
  return `$${Math.round(number).toLocaleString()}`;
}

export default function App() {
  const [kols, setKols] = useState<Kol[]>(FALLBACK_KOLS);
  const [launches, setLaunches] = useState<Launch[]>([]);
  const [selectedWallet, setSelectedWallet] = useState(FALLBACK_KOLS[0]?.wallet || '');
  const [query, setQuery] = useState('');
  const [tokenName, setTokenName] = useState('');
  const [ticker, setTicker] = useState('');
  const [description, setDescription] = useState('');
  const [launcherWallet, setLauncherWallet] = useState('');
  const [feeSplit, setFeeSplit] = useState(100);
  const [copied, setCopied] = useState(false);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState('');
  const [cursor, setCursor] = useState({ x: -100, y: -100, active: false });
  const noticeTimer = useRef<number | null>(null);

  useEffect(() => {
    function move(event: MouseEvent) { setCursor((current) => ({ ...current, x: event.clientX, y: event.clientY })); }
    function hover(event: MouseEvent) { setCursor((current) => ({ ...current, active: Boolean((event.target as HTMLElement | null)?.closest('button,a,input,textarea')) })); }
    window.addEventListener('mousemove', move);
    window.addEventListener('mouseover', hover);
    return () => { window.removeEventListener('mousemove', move); window.removeEventListener('mouseover', hover); };
  }, []);

  useEffect(() => {
    let alive = true;
    async function load() {
      const { data: kolRows } = await kolcashDb.from('kolcash_kols').select('rank,wallet,display_name,username,avatar_url,buys,sells,pnl_sol,pnl_usd').order('rank', { ascending: true }).limit(100);
      if (alive && kolRows?.length) {
        setKols(kolRows as Kol[]);
        if (!selectedWallet) setSelectedWallet(kolRows[0].wallet);
      }
      const { data: launchRows } = await kolcashDb.from('kolcash_launches').select('id,token_name,ticker,kol_wallet,kol_fee_bps,status,created_at').order('created_at', { ascending: false }).limit(12);
      const localRows = JSON.parse(window.localStorage.getItem('kolcash-local-launches') || '[]') as Launch[];
      if (alive) setLaunches([...(launchRows as Launch[] || []), ...localRows].slice(0, 12));
    }
    void load();
    return () => { alive = false; };
  }, []);

  const selectedKol = useMemo(() => kols.find((kol) => kol.wallet === selectedWallet) || kols[0], [kols, selectedWallet]);
  const normalizedQuery = query.trim().toLowerCase();
  const filteredKols = normalizedQuery ? kols.filter((kol) => `${nameOf(kol)} ${kol.username || ''} ${kol.wallet}`.toLowerCase().includes(normalizedQuery)) : kols;
  const featured = kols.slice(0, 6);
  const previewName = tokenName.trim() || `${nameOf(selectedKol)} Cash`;
  const previewTicker = ticker.trim().replace(/[^a-zA-Z0-9]/g, '').toUpperCase() || 'KOL';
  const totalPnl = kols.reduce((sum, kol) => sum + Number(kol.pnl_usd || 0), 0);
  const totalBuys = kols.reduce((sum, kol) => sum + Number(kol.buys || 0), 0);

  function flash(text: string) {
    setNotice(text);
    if (noticeTimer.current) window.clearTimeout(noticeTimer.current);
    noticeTimer.current = window.setTimeout(() => setNotice(''), 4500);
  }

  function copyRecipient() {
    if (!selectedKol) return;
    void navigator.clipboard.writeText(selectedKol.wallet);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1200);
  }

  async function submitLaunch() {
    if (!selectedKol || !tokenName.trim() || !ticker.trim()) {
      flash('add token name, ticker, and KOL recipient first');
      return;
    }
    const row = {
      token_name: tokenName.trim(),
      ticker: previewTicker,
      description: description.trim(),
      launcher_wallet: launcherWallet.trim() || null,
      kol_wallet: selectedKol.wallet,
      kol_fee_bps: Math.round(feeSplit * 100),
      status: 'submitted',
    };
    setSaving(true);
    try {
      const { data, error } = await kolcashDb.from('kolcash_launches').insert(row).select('id,token_name,ticker,kol_wallet,kol_fee_bps,status,created_at').single();
      if (error) throw error;
      setLaunches((current) => data ? [data as Launch, ...current].slice(0, 12) : current);
      flash('launch saved. backend queue now has the KOL fee route.');
    } catch (error) {
      const localLaunch: Launch = {
        id: crypto.randomUUID(),
        token_name: row.token_name,
        ticker: row.ticker,
        kol_wallet: row.kol_wallet,
        kol_fee_bps: row.kol_fee_bps,
        status: 'local-queued',
        created_at: new Date().toISOString(),
      };
      setLaunches((current) => [localLaunch, ...current].slice(0, 12));
      const existing = JSON.parse(window.localStorage.getItem('kolcash-local-launches') || '[]') as Launch[];
      window.localStorage.setItem('kolcash-local-launches', JSON.stringify([localLaunch, ...existing].slice(0, 50)));
      flash(`saved locally. DB write failed: ${error instanceof Error ? error.message : 'unreachable'}`);
    } finally {
      setSaving(false);
    }
  }

  return <main className="nomo-page"><div className={cursor.active ? 'pump-cursor is-active' : 'pump-cursor'} style={{ left: cursor.x, top: cursor.y }} aria-hidden="true"><img src="/pump-cursor.svg" alt="" /></div>
    <header className="nomo-nav">
      <a className="nomo-brand wallet-title" href="#launch" aria-label="KOL Cash home"><img className="nomo-logo" src="/kol-logo.png" alt="KOL"/>kol cash</a>
      <div className="nomo-actions"><a href="#launch">launch</a><a href="#markets">KOLs</a><a href={PLATFORM_X} target="_blank" rel="noreferrer">X</a><button type="button" onClick={copyRecipient}>{copied ? 'copied' : 'copy KOL wallet'}</button></div>
    </header>

    <section className="nomo-strip" aria-label="KOL Cash index"><Stat label="indexed KOLs" value={kols.length.toLocaleString()} sub="from kolscan leaderboard"/><Stat label="combined pnl" value={usd(totalPnl)} sub="leaderboard profile data"/><Stat label="daily buys" value={totalBuys.toLocaleString()} sub="kolscan indexed flow"/></section>{notice && <div className="buy-toast"><b>{notice}</b><span>KOL Cash launchpad</span><button type="button" onClick={() => setNotice('')}>×</button></div>}

    <section className="market-explainer"><p>what this is</p><h2>Launch a coin where the fees pay the KOL.</h2><div>KOL Cash keeps the Wallet Prediction Markets look, but flips the mechanic into a launchpad. Pick any indexed KOL wallet from Kolscan, create the token, and the fee recipient is the KOL. Attention finally has a clean on-chain payout route.</div></section>

    <section className="wpm-activity" id="launch"><div><p>launchpad</p><h2>{previewName}</h2></div><div className="launch-form-grid"><label>token name<input value={tokenName} onChange={(event) => setTokenName(event.target.value)} placeholder={`${nameOf(selectedKol)} Cash`} maxLength={32}/></label><label>ticker<input value={ticker} onChange={(event) => setTicker(event.target.value)} placeholder="KOL" maxLength={10}/></label><label>your wallet<input value={launcherWallet} onChange={(event) => setLauncherWallet(event.target.value)} placeholder="optional launcher wallet"/></label><label>description<textarea value={description} onChange={(event) => setDescription(event.target.value)} placeholder="why this KOL deserves a fee market" maxLength={500}/></label><label>KOL fee split: {feeSplit}%<input type="range" min="25" max="100" step="5" value={feeSplit} onChange={(event) => setFeeSplit(Number(event.target.value))}/></label><button type="button" className="launch-submit" disabled={saving} onClick={() => void submitLaunch()}>{saving ? 'saving launch...' : `queue ${previewTicker} launch`}</button></div></section>

    <section className="kimchi-receipts" id="markets"><div className="kimchi-receipts-head"><p>{kols.length} KOL wallets indexed</p><h2>choose fee recipient</h2></div><div className="kol-search"><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="search KOL, handle, or wallet" aria-label="Search KOLs"/></div><div className="premium-markets"><p>top Kolscan KOLs</p>{featured.map((kol) => <article className={selectedWallet === kol.wallet ? 'has-live-market selected-kol' : 'has-live-market'} key={kol.wallet} onClick={() => setSelectedWallet(kol.wallet)}><img src={avatarFor(kol)} alt=""/><div><b>{nameOf(kol)}</b><small>{shortCa(kol.wallet)}</small></div><span>#{kol.rank}</span><div className="kol-call"><button className="yes active" type="button">{Number(kol.pnl_sol || 0).toFixed(1)} SOL</button><button className="no" type="button">{kol.buys || 0}/{kol.sells || 0}</button></div></article>)}</div><div className="kol-index"><div className="kol-index-head"><span>KOL</span><span>source</span><span>wallet</span><span>route fees</span></div>{filteredKols.map((kol, index) => <article className="kol-row" key={kol.wallet}><span className="kol-rank">{String(kol.rank || index + 1).padStart(2, '0')}</span><img src={avatarFor(kol)} alt="" onError={(event) => { event.currentTarget.onerror = null; event.currentTarget.src = `https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(nameOf(kol))}`; }}/><div className="kol-name"><b>{nameOf(kol)}</b><small>{kol.username || 'kolscan KOL'}</small></div><a className="kol-social" href={`https://kolscan.io/account/${kol.wallet}?timeframe=1`} target="_blank" rel="noreferrer">Kolscan ↗</a><a className="kol-wallet" href={`https://solscan.io/account/${kol.wallet}`} target="_blank" rel="noreferrer">{shortCa(kol.wallet)}</a><div className="kol-call"><button className={selectedWallet === kol.wallet ? 'yes active' : 'yes'} type="button" onClick={() => setSelectedWallet(kol.wallet)}>select</button><button className="no" type="button" onClick={() => { setSelectedWallet(kol.wallet); document.getElementById('launch')?.scrollIntoView({ behavior: 'smooth' }); }}>launch</button></div></article>)}</div></section>

    <section className="wpm-activity"><div><p>launch queue</p><h2>fee-routed launches</h2></div><div>{launches.length ? launches.map((launch) => <article key={launch.id}><b>${launch.ticker} routes {launch.kol_fee_bps / 100}% to {shortCa(launch.kol_wallet)}</b><span>{launch.status} · {new Date(launch.created_at).toLocaleString()}</span></article>) : <p className="activity-empty">No KOL Cash launches submitted yet.</p>}</div></section>
  </main>;
}
function Stat({ label, value, sub }: { label: string; value: string; sub: string }) { return <div><span>{label}</span><b>{value}</b><small>{sub}</small></div>; }
