create extension if not exists pgcrypto;

create table if not exists public.kolcash_kols (
  wallet text primary key,
  rank integer not null,
  display_name text not null,
  username text,
  avatar_url text,
  buys integer not null default 0,
  sells integer not null default 0,
  pnl_sol numeric not null default 0,
  pnl_usd numeric not null default 0,
  source text not null default 'kolscan',
  updated_at timestamptz not null default now()
);

create table if not exists public.kolcash_launches (
  id uuid primary key default gen_random_uuid(),
  token_name text not null,
  ticker text not null,
  description text not null default '',
  image_url text,
  launcher_wallet text,
  kol_wallet text not null references public.kolcash_kols(wallet) on delete restrict,
  kol_fee_bps integer not null default 10000 check (kol_fee_bps between 0 and 10000),
  status text not null default 'draft' check (status in ('draft','submitted','queued','launched','failed')),
  mint text,
  signature text,
  error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists kolcash_kols_rank_idx on public.kolcash_kols(rank);
create index if not exists kolcash_kols_pnl_idx on public.kolcash_kols(pnl_sol desc);
create index if not exists kolcash_launches_created_idx on public.kolcash_launches(created_at desc);
create index if not exists kolcash_launches_kol_idx on public.kolcash_launches(kol_wallet, created_at desc);

alter table public.kolcash_kols enable row level security;
alter table public.kolcash_launches enable row level security;

drop policy if exists "public reads kolcash kols" on public.kolcash_kols;
create policy "public reads kolcash kols" on public.kolcash_kols for select to anon, authenticated using (true);

drop policy if exists "public reads kolcash launches" on public.kolcash_launches;
create policy "public reads kolcash launches" on public.kolcash_launches for select to anon, authenticated using (true);

drop policy if exists "public creates kolcash launches" on public.kolcash_launches;
create policy "public creates kolcash launches" on public.kolcash_launches for insert to anon, authenticated with check (
  length(trim(token_name)) > 0 and length(trim(ticker)) > 0 and length(trim(kol_wallet)) > 0
);

grant select on public.kolcash_kols to anon, authenticated;
grant select, insert on public.kolcash_launches to anon, authenticated;

insert into public.kolcash_kols (rank, wallet, display_name, username, avatar_url, buys, sells, pnl_sol, pnl_usd, source)
values
(1, 'AstaWuJuQiAS3AfqmM3xZxrJhkkZNXtW4VyaGQfqV6JL', 'asta', 'AstaWu', 'https://kolscan-images.pump.fun/profiles/AstaWuJuQiAS3AfqmM3xZxrJhkkZNXtW4VyaGQfqV6JL/1788143303171.jpg', 0, 0, 759.37, 81331.8, 'kolscan'),
(2, 'CxgPWvH2GoEDENELne2XKAR2z2Fr4shG2uaeyqZceGve', 'narc', 'CxgPWv', 'https://kolscan-images.pump.fun/profiles/CxgPWvH2GoEDENELne2XKAR2z2Fr4shG2uaeyqZceGve/1788143687601.jpg', 13, 2, 305.92, 32765.3, 'kolscan'),
(3, '215nhcAHjQQGgwpQSJQ7zR26etbjjtVdW74NLzwEgQjP', 'OGAntD', '215nhc', 'https://kolscan-images.pump.fun/profiles/215nhcAHjQQGgwpQSJQ7zR26etbjjtVdW74NLzwEgQjP/1788141623720.jpg', 0, 1, 194.83, 20867.0, 'kolscan'),
(4, '6HJetMbdHBuk3mLUainxAPpBpWzDgYbHGTS2TqDAUSX2', 'LJC', '6HJetM', 'https://kolscan-images.pump.fun/profiles/6HJetMbdHBuk3mLUainxAPpBpWzDgYbHGTS2TqDAUSX2/1788142601320.jpg', 0, 0, 131.67, 14102.1, 'kolscan'),
(5, 'CUHBzSPSaNS3tArEtM3maSV6pNdJhHJFYZpurPPK9P7H', 'samsrep', 'CUHBzS', 'https://kolscan-images.pump.fun/profiles/CUHBzSPSaNS3tArEtM3maSV6pNdJhHJFYZpurPPK9P7H/1788143635498.jpg', 2, 6, 90.36, 9678.1, 'kolscan'),
(6, '5B79fMkcFeRTiwm7ehsZsFiKsC7m7n1Bgv9yLxPp9q2X', 'bandit', '5B79fM', 'https://kolscan-images.pump.fun/profiles/5B79fMkcFeRTiwm7ehsZsFiKsC7m7n1Bgv9yLxPp9q2X/1788142440398.jpg', 35, 56, 89.39, 9574.2, 'kolscan'),
(7, '99xnE2zEFi8YhmKDaikc1EvH6ELTQJppnqUwMzmpLXrs', 'Coler', '99xnE2', 'https://kolscan-images.pump.fun/profiles/99xnE2zEFi8YhmKDaikc1EvH6ELTQJppnqUwMzmpLXrs/1788143044534.jpg', 4, 11, 84.21, 9019.7, 'kolscan'),
(8, '4vw54BmAogeRV3vPKWyFet5yf8DTLcREzdSzx4rw9Ud9', 'decu', '4vw54B', 'https://kolscan-images.pump.fun/profiles/4vw54BmAogeRV3vPKWyFet5yf8DTLcREzdSzx4rw9Ud9/1788142438185.jpg', 41, 49, 75.98, 8138.1, 'kolscan'),
(9, 'zhYnXqK3MNSmwS3yxSvPmY5kUa1n2WUaCJgYUDrAHkL', 'zhynx', 'zhYnXq', 'https://kolscan-images.pump.fun/profiles/zhYnXqK3MNSmwS3yxSvPmY5kUa1n2WUaCJgYUDrAHkL/1788144653962.jpg', 1, 1, 66.37, 7108.2, 'kolscan'),
(10, '3j5c4aD1aznxQXJ3DWw1b7UD8kKuaqXVbpaVeWPR83TG', 'Kaaox', '3j5c4a', 'https://kolscan-images.pump.fun/profiles/3j5c4aD1aznxQXJ3DWw1b7UD8kKuaqXVbpaVeWPR83TG/1788141993201.jpg', 0, 1, 58.32, 6246.1, 'kolscan'),
(11, 'ardinRsN1mNYVeoJWTBsWeYeXvuR9UUDGMsCDKpb6AT', 'trunoest', 'ardinR', 'https://kolscan-images.pump.fun/profiles/ardinRsN1mNYVeoJWTBsWeYeXvuR9UUDGMsCDKpb6AT/1788144567863.jpg', 68, 57, 55.65, 5960.2, 'kolscan'),
(12, '2X4H5Y9C4Fy6Pf3wpq8Q4gMvLcWvfrrwDv2bdR8AAwQv', 'Orange', '2X4H5Y', 'https://kolscan-images.pump.fun/profiles/2X4H5Y9C4Fy6Pf3wpq8Q4gMvLcWvfrrwDv2bdR8AAwQv/1788141694051.jpg', 5, 3, 47.69, 5108.2, 'kolscan'),
(13, 'DjM7Tu7whh6P3pGVBfDzwXAx2zaw51GJWrJE3PwtuN7s', 'LUKEY ✣', 'DjM7Tu', 'https://kolscan-images.pump.fun/profiles/DjM7Tu7whh6P3pGVBfDzwXAx2zaw51GJWrJE3PwtuN7s/1788143894778.jpg', 2, 2, 42.32, 4533.1, 'kolscan'),
(14, 'EeXvxkcGqMDZeTaVeawzxm9mbzZwqDUMmfG3bF7uzumH', 'milito', 'EeXvxk', 'https://kolscan-images.pump.fun/profiles/EeXvxkcGqMDZeTaVeawzxm9mbzZwqDUMmfG3bF7uzumH/1788144055936.jpg', 68, 119, 37.36, 4001.9, 'kolscan'),
(15, 'sAdNbe1cKNMDqDsa4npB3TfL62T14uAo2MsUQfLvzLT', 'Ethan Prosper', 'sAdNbe', 'https://kolscan-images.pump.fun/profiles/sAdNbe1cKNMDqDsa4npB3TfL62T14uAo2MsUQfLvzLT/1788144638712.jpg', 14, 33, 32.6, 3492.0, 'kolscan'),
(16, '862TYSvRYoiHAK3F3WwTRYAfuGiQaGdxedN9AGvRGWo2', 'Wugi', '862TYS', 'https://kolscan-images.pump.fun/profiles/862TYSvRYoiHAK3F3WwTRYAfuGiQaGdxedN9AGvRGWo2/1788142850677.jpg', 3, 0, 31.54, 3378.6, 'kolscan'),
(17, 'FAicXNV5FVqtfbpn4Zccs71XcfGeyxBSGbqLDyDJZjke', 'radiance', 'FAicXN', 'https://kolscan-images.pump.fun/profiles/FAicXNV5FVqtfbpn4Zccs71XcfGeyxBSGbqLDyDJZjke/1788144152769.jpg', 9, 21, 31.41, 3363.6, 'kolscan'),
(18, '4fZFcK8ms3bFMpo1ACzEUz8bH741fQW4zhAMGd5yZMHu', 'Rilsio', '4fZFcK', 'https://kolscan-images.pump.fun/profiles/4fZFcK8ms3bFMpo1ACzEUz8bH741fQW4zhAMGd5yZMHu/1788142225351.jpg', 2, 2, 28.16, 3016.2, 'kolscan'),
(19, 'JDd3hy3gQn2V982mi1zqhNqUw1GfV2UL6g76STojCJPN', 'West', 'JDd3hy', 'https://kolscan-images.pump.fun/profiles/JDd3hy3gQn2V982mi1zqhNqUw1GfV2UL6g76STojCJPN/1788144519525.jpg', 24, 32, 27.38, 2932.5, 'kolscan'),
(20, 'EqiFgyNw6kgrmYstWyrP8VjKhka7XEmKTZzHSmwpr1Zb', 'ban', 'EqiFgy', 'https://kolscan-images.pump.fun/profiles/EqiFgyNw6kgrmYstWyrP8VjKhka7XEmKTZzHSmwpr1Zb/1788144086357.jpg', 77, 144, 26.79, 2869.2, 'kolscan'),
(21, 'AEeJUPCiGR3yCoukTh1G58o4LYsUEyzrXtfmfMc2kJMX', 'Damian Prosalendis', 'AEeJUP', 'https://kolscan-images.pump.fun/profiles/AEeJUPCiGR3yCoukTh1G58o4LYsUEyzrXtfmfMc2kJMX/1788143209191.jpg', 2, 4, 25.41, 2721.5, 'kolscan'),
(22, '6KR7SorsUQtNH6CB6JpAnWCAKeTysa95iyXeWihdNeGT', 'KOREAN', '6KR7So', 'https://kolscan-images.pump.fun/profiles/6KR7SorsUQtNH6CB6JpAnWCAKeTysa95iyXeWihdNeGT/1788142667926.jpg', 35, 99, 23.06, 2469.5, 'kolscan'),
(23, '4uCT4g7YHH4xxfmfNfKUDenwGrRNGoZ9Ay1XFxfUGhQG', 'Esee06257', '4uCT4g', 'https://kolscan-images.pump.fun/profiles/4uCT4g7YHH4xxfmfNfKUDenwGrRNGoZ9Ay1XFxfUGhQG/1788142273897.jpg', 44, 131, 22.08, 2365.0, 'kolscan'),
(24, 'GJA1HEbxGnqBhBifH9uQauzXSB53to5rhDrzmKxhSU65', 'Latuche', 'GJA1HE', 'https://kolscan-images.pump.fun/profiles/GJA1HEbxGnqBhBifH9uQauzXSB53to5rhDrzmKxhSU65/1788144324720.jpg', 26, 30, 21.79, 2333.4, 'kolscan'),
(25, '69z4qTgQ5DBRTJvnQzx2h8jZhNsv5UgADotEwwKUm2JS', 'King', '69z4qT', 'https://kolscan-images.pump.fun/profiles/69z4qTgQ5DBRTJvnQzx2h8jZhNsv5UgADotEwwKUm2JS/1788142576353.jpg', 1, 3, 20.94, 2242.5, 'kolscan'),
(26, '2e1w3Xo441Ytvwn54wCn8itAXwCKbiizc9ynGEv14Vis', 'prettyover', '2e1w3X', 'https://kolscan-images.pump.fun/profiles/2e1w3Xo441Ytvwn54wCn8itAXwCKbiizc9ynGEv14Vis/1788141705097.jpg', 11, 20, 20.63, 2209.5, 'kolscan'),
(27, 'GEKZWL474tFAyYDUoTgKEgYuMxT3Se7HzKDDptrnXnvS', 'Advyth', 'GEKZWL', 'https://kolscan-images.pump.fun/profiles/GEKZWL474tFAyYDUoTgKEgYuMxT3Se7HzKDDptrnXnvS/1788144311770.jpg', 51, 34, 20.5, 2195.2, 'kolscan'),
(28, '9iaawVBEsFG35PSwd4PahwT8fYNQe9XYuRdWm872dUqY', 'Meechie', '9iaawV', 'https://kolscan-images.pump.fun/profiles/9iaawVBEsFG35PSwd4PahwT8fYNQe9XYuRdWm872dUqY/1788143127444.jpg', 23, 102, 20.3, 2173.9, 'kolscan'),
(29, 'Dvbv5TdAyPpJk16X9mUxWFVicYtCUxTLhuof8TGuUaRv', 'CookDoc', 'Dvbv5T', 'https://kolscan-images.pump.fun/profiles/Dvbv5TdAyPpJk16X9mUxWFVicYtCUxTLhuof8TGuUaRv/1788143934136.jpg', 1, 0, 19.77, 2116.9, 'kolscan'),
(30, 'A3W8psibkTUvjxs4LRscbnjux6TFDXdvD4m4GsGpQ2KJ', 'Numer0 (trench/arc)', 'A3W8ps', 'https://kolscan-images.pump.fun/profiles/A3W8psibkTUvjxs4LRscbnjux6TFDXdvD4m4GsGpQ2KJ/1788143169356.jpg', 0, 0, 19.72, 2111.8, 'kolscan'),
(31, 'EtyHwLDfAi9E24Qw41xFUW8WtQ3NxajxJA2yaaUASR5a', 'Dame', 'EtyHwL', 'https://cdn.kolscan.io/profiles/EtyHwLDfAi9E24Qw41xFUW8WtQ3NxajxJA2yaaUASR5a.png', 19, 20, 19.4, 2077.5, 'kolscan'),
(32, '67Nwfi9hgwqhxGoovT2JGLU67uxfomLwQAWncjXXzU6U', 'Silver', '67Nwfi', 'https://kolscan-images.pump.fun/profiles/67Nwfi9hgwqhxGoovT2JGLU67uxfomLwQAWncjXXzU6U/1788142575825.jpg', 14, 19, 19.12, 2047.9, 'kolscan'),
(33, 'HbCxe8yWQJWnK3f3FX4oohgm87FZuPYD4Ydszqxgkwft', 'Stacker ✝️', 'HbCxe8', 'https://kolscan-images.pump.fun/profiles/HbCxe8yWQJWnK3f3FX4oohgm87FZuPYD4Ydszqxgkwft/1788144406984.jpg', 1, 3, 18.98, 2033.1, 'kolscan'),
(34, '4DdrfiDHpmx55i4SPssxVzS9ZaKLb8qr45NKY9Er9nNh', 'Mr. Frog', '4Ddrfi', 'https://kolscan-images.pump.fun/profiles/4DdrfiDHpmx55i4SPssxVzS9ZaKLb8qr45NKY9Er9nNh/1788142112106.jpg', 31, 5, 18.61, 1993.7, 'kolscan'),
(35, '23Ltopfensg1rSsCdoc1M8rcp5cB5bkqbmogMGmH63yW', 'Snatcher', '23Ltop', 'https://kolscan-images.pump.fun/profiles/23Ltopfensg1rSsCdoc1M8rcp5cB5bkqbmogMGmH63yW/1788141624072.jpg', 0, 0, 17.54, 1879.1, 'kolscan'),
(36, '8fsKLLtvKNanL4ginCaiRS6UfeemY11rSf8U8fN1dJw4', 'Stigman', '8fsKLL', 'https://kolscan-images.pump.fun/profiles/8fsKLLtvKNanL4ginCaiRS6UfeemY11rSf8U8fN1dJw4/1788142948670.jpg', 17, 39, 17.23, 1845.2, 'kolscan'),
(37, '8rvAsDKeAcEjEkiZMug9k8v1y8mW6gQQiMobd89Uy7qR', 'Casino', '8rvAsD', 'https://kolscan-images.pump.fun/profiles/8rvAsDKeAcEjEkiZMug9k8v1y8mW6gQQiMobd89Uy7qR/1788142997937.jpg', 4, 9, 16.84, 1804.0, 'kolscan'),
(38, '8MaVa9kdt3NW4Q5HyNAm1X5LbR8PQRVDc1W8NMVK88D5', 'Daumen', '8MaVa9', 'https://kolscan-images.pump.fun/profiles/8MaVa9kdt3NW4Q5HyNAm1X5LbR8PQRVDc1W8NMVK88D5/1788142906243.jpg', 51, 42, 14.94, 1599.6, 'kolscan'),
(39, '3L8RAxLkvwkz4CgHivaVRtq19741FAdGLk5DgjRfc1fW', 'Inquixit', '3L8RAx', 'https://kolscan-images.pump.fun/profiles/3L8RAxLkvwkz4CgHivaVRtq19741FAdGLk5DgjRfc1fW/1788141911637.jpg', 44, 130, 14.3, 1531.5, 'kolscan'),
(40, 'EjtQrPTbcMevStBkpnjsH23NfUCMhGHusTYsHuGVQZp2', 'Zef', 'EjtQrP', 'https://kolscan-images.pump.fun/profiles/EjtQrPTbcMevStBkpnjsH23NfUCMhGHusTYsHuGVQZp2/1788144071315.jpg', 20, 33, 13.51, 1446.8, 'kolscan'),
(41, '9RrKUhRpbPDNxR7x88ZsCgdtqPHUfwYPjj4JdpV4FBj9', 'Pocket Hitlers', '9RrKUh', 'https://kolscan-images.pump.fun/profiles/9RrKUhRpbPDNxR7x88ZsCgdtqPHUfwYPjj4JdpV4FBj9/1788143081408.jpg', 15, 3, 13.25, 1419.5, 'kolscan'),
(42, '2hN82SXLUffhG3vxpezRmae1sGrCBMqHHBDxjmjpagqk', 'lyftical', '2hN82S', 'https://kolscan-images.pump.fun/profiles/2hN82SXLUffhG3vxpezRmae1sGrCBMqHHBDxjmjpagqk/1788141726300.jpg', 10, 11, 12.74, 1364.5, 'kolscan'),
(43, 'AVjEtg2ECYKXYeqdRQXvaaAZBjfTjYuSMTR4WLhKoeQN', 'Putrick', 'AVjEtg', 'https://kolscan-images.pump.fun/profiles/AVjEtg2ECYKXYeqdRQXvaaAZBjfTjYuSMTR4WLhKoeQN/1788143239656.jpg', 19, 19, 12.09, 1294.6, 'kolscan'),
(44, 'DuGezKLZp8UL2aQMHthoUibEC7WSbpNiKFJLTtK1QHjx', 'Eddy 💹🧲', 'DuGezK', 'https://kolscan-images.pump.fun/profiles/DuGezKLZp8UL2aQMHthoUibEC7WSbpNiKFJLTtK1QHjx/1788143910029.jpg', 1, 1, 11.41, 1222.2, 'kolscan'),
(45, '4yo9CUuTBbds9NFhZd4MzPiZZkUvveXdTnAH8qMsE8ku', 'Gfree', '4yo9CU', 'https://kolscan-images.pump.fun/profiles/4yo9CUuTBbds9NFhZd4MzPiZZkUvveXdTnAH8qMsE8ku/1788142323163.jpg', 17, 36, 11.17, 1196.0, 'kolscan'),
(46, '6hcX7fVMzeRpW3d7XhFsxYw2CuePfgSMmouZxSiNLj1U', 'Ataberk 🧙‍♂️', '6hcX7f', 'https://kolscan-images.pump.fun/profiles/6hcX7fVMzeRpW3d7XhFsxYw2CuePfgSMmouZxSiNLj1U/1788142698616.jpg', 0, 0, 10.28, 1101.3, 'kolscan'),
(47, '2ycU6vR2e7XfzuR7SRD5CLQJVMYq7gz4vMsefFJb6FMZ', 'Sugus', '2ycU6v', 'https://kolscan-images.pump.fun/profiles/2ycU6vR2e7XfzuR7SRD5CLQJVMYq7gz4vMsefFJb6FMZ/1790862185936.jpg', 5, 9, 9.87, 1056.6, 'kolscan'),
(48, 'An68XCxJvfXc9NRWjNXGSFY55dyFVKjfgtpt8AKGJ2dE', 'bihoz', 'An68XC', 'https://kolscan-images.pump.fun/profiles/An68XCxJvfXc9NRWjNXGSFY55dyFVKjfgtpt8AKGJ2dE/1788143290618.jpg', 1, 1, 9.67, 1036.0, 'kolscan'),
(49, 'G6fUXjMKPJzCY1rveAE6Qm7wy5U3vZgKDJmN1VPAdiZC', 'clukz', 'G6fUXj', 'https://kolscan-images.pump.fun/profiles/G6fUXjMKPJzCY1rveAE6Qm7wy5U3vZgKDJmN1VPAdiZC/1788144297120.jpg', 7, 1, 9.59, 1027.3, 'kolscan'),
(50, 'Dv32u9mvSXGVNshf7xM7afuMoPRifQxzuzEjfmfMysZY', 'deecayz ⌐◨-◨', 'Dv32u9', 'https://kolscan-images.pump.fun/profiles/Dv32u9mvSXGVNshf7xM7afuMoPRifQxzuzEjfmfMysZY/1788143921660.jpg', 1, 3, 9.42, 1009.2, 'kolscan')
on conflict (wallet) do update set
  rank = excluded.rank,
  display_name = excluded.display_name,
  username = excluded.username,
  avatar_url = excluded.avatar_url,
  buys = excluded.buys,
  sells = excluded.sells,
  pnl_sol = excluded.pnl_sol,
  pnl_usd = excluded.pnl_usd,
  source = excluded.source,
  updated_at = now();

alter publication supabase_realtime add table public.kolcash_kols, public.kolcash_launches;
