alter table public.kolcash_kols add column if not exists token_ca text;
alter table public.kolcash_launches add column if not exists mint text;
alter table public.kolcash_launches add column if not exists signature text;

drop policy if exists "public creates kolcash kols" on public.kolcash_kols;
create policy "public creates kolcash kols" on public.kolcash_kols for insert to anon, authenticated with check (
  length(trim(wallet)) > 0 and length(trim(display_name)) > 0
);

drop policy if exists "public updates kolcash kols" on public.kolcash_kols;
create policy "public updates kolcash kols" on public.kolcash_kols for update to anon, authenticated using (true) with check (
  length(trim(wallet)) > 0 and length(trim(display_name)) > 0
);

grant insert, update on public.kolcash_kols to anon, authenticated;
