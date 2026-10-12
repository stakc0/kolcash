import { useMemo, useState } from 'react';

const PLATFORM_X = 'https://x.com/kolcashfun';
const DEFAULT_KOL_WALLET = 'KOLWallet11111111111111111111111111111111111';

type KolPreset = {
  name: string;
  handle: string;
  wallet: string;
  split: number;
};

const KOL_PRESETS: KolPreset[] = [
  { name: 'Wugi', handle: '@xWugi_wara', wallet: '862TYSvRYoiHAK3F3WwTRYAfuGiQaGdxedN9AGvRGWo2', split: 100 },
  { name: 'Pain', handle: '@PainCrypt0', wallet: 'J6TDXvarvpBdPXTaTU8eJbtso1PUCYKGkVtMKUUY8iEa', split: 100 },
  { name: 'dov 7', handle: '@dovvvv7', wallet: '8nqtxpFpuXwfXG4pBLsDkkuMMPK9FjSkBMCn542HiM3v', split: 100 },
  { name: 'Doji', handle: '@Humanevolvd', wallet: '5ZuV8eqkvzYFVEKbLvGBdexL2tFv7E5BCd2HZpjqbdg', split: 100 },
];

function short(value: string) {
  return value.length > 14 ? `${value.slice(0, 6)}...${value.slice(-6)}` : value;
}

export default function App() {
  const [selectedKol, setSelectedKol] = useState<KolPreset>(KOL_PRESETS[0]);
  const [customWallet, setCustomWallet] = useState('');
  const [tokenName, setTokenName] = useState('');
  const [ticker, setTicker] = useState('');
  const [feeSplit, setFeeSplit] = useState(100);
  const [copied, setCopied] = useState(false);

  const feeRecipient = customWallet.trim() || selectedKol.wallet || DEFAULT_KOL_WALLET;
  const launchPreview = useMemo(() => {
    const name = tokenName.trim() || `${selectedKol.name} Cash`;
    const symbol = ticker.trim().replace(/[^a-zA-Z0-9]/g, '').toUpperCase() || 'KOL';
    return { name, symbol };
  }, [tokenName, ticker, selectedKol.name]);

  function copyRecipient() {
    void navigator.clipboard.writeText(feeRecipient);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1000);
  }

  return <main className="kolcash-page">
    <header className="kolcash-nav">
      <a className="kolcash-brand" href="/" aria-label="KOL Cash home"><span>$</span>kolcash</a>
      <nav>
        <a href="#launch">launch</a>
        <a href="#how">how it works</a>
        <a href={PLATFORM_X} target="_blank" rel="noreferrer">x.com/kolcashfun</a>
      </nav>
    </header>

    <section className="kolcash-hero">
      <div className="kolcash-prompt">&gt; launch tokens that pay the timeline</div>
      <h1>launch with fees routed to a KOL</h1>
      <p>KOL Cash is a pump.fun-style launchpad where the creator fee recipient is the KOL. Pick the wallet, launch the coin, and every fee routes to the person driving attention.</p>
      <div className="kolcash-actions"><a href="#launch">start launch</a><a href="#kol-board">pick a KOL</a></div>
    </section>

    <section className="kolcash-stats" aria-label="KOL Cash mechanics">
      <div><span>fee recipient</span><b>KOL wallet</b><small>set at launch</small></div>
      <div><span>launch style</span><b>pump native</b><small>fast meme creation</small></div>
      <div><span>incentive</span><b>attention pays</b><small>KOLs earn when coins trade</small></div>
    </section>

    <section className="kolcash-grid" id="launch">
      <div className="kolcash-card launch-card">
        <div className="card-head"><p>01</p><h2>Launch coin</h2></div>
        <label>token name<input value={tokenName} onChange={(event) => setTokenName(event.target.value)} placeholder={`${selectedKol.name} Cash`} maxLength={32}/></label>
        <label>ticker<input value={ticker} onChange={(event) => setTicker(event.target.value)} placeholder="KOL" maxLength={10}/></label>
        <label>KOL fee recipient<input value={customWallet} onChange={(event) => setCustomWallet(event.target.value)} placeholder={selectedKol.wallet}/></label>
        <label>fee split to KOL <span>{feeSplit}%</span><input type="range" min="25" max="100" step="5" value={feeSplit} onChange={(event) => setFeeSplit(Number(event.target.value))}/></label>
        <button type="button" className="launch-button">connect wallet to launch</button>
      </div>

      <div className="kolcash-card preview-card">
        <div className="card-head"><p>02</p><h2>Fee route</h2></div>
        <div className="coin-preview"><span>{launchPreview.symbol}</span><h3>{launchPreview.name}</h3><p>{feeSplit}% of creator fees route to</p><button type="button" onClick={copyRecipient}>{copied ? 'copied' : short(feeRecipient)}</button></div>
        <div className="route-lines"><div>trader fees</div><i /> <div>launch contract</div><i /> <div>{selectedKol.handle}</div></div>
      </div>
    </section>

    <section className="kolcash-board" id="kol-board">
      <div className="board-head"><p>indexed KOLs</p><h2>pick who gets paid</h2></div>
      <div className="kol-list">
        {KOL_PRESETS.map((kol) => <button key={kol.wallet} type="button" className={selectedKol.wallet === kol.wallet ? 'active' : ''} onClick={() => { setSelectedKol(kol); setCustomWallet(''); setFeeSplit(kol.split); }}>
          <span>{kol.name}</span><small>{kol.handle}</small><b>{short(kol.wallet)}</b>
        </button>)}
      </div>
    </section>

    <section className="kolcash-how" id="how">
      <article><b>1</b><h3>choose the KOL</h3><p>Use a known wallet or paste any Solana wallet as the fee destination.</p></article>
      <article><b>2</b><h3>launch the token</h3><p>Create the coin with pump-style speed and a public KOL fee route.</p></article>
      <article><b>3</b><h3>attention becomes yield</h3><p>If the KOL pushes flow, they get paid directly by the market they helped create.</p></article>
    </section>
  </main>;
}
