-- Avakhyl bazası. Supabase → SQL Editor → New query: bu faylın hamısını yapışdırıb "Run" basın.
-- Təkrar işə salmaq olar: cədvəllər silinmir, funksiyalar və qaydalar yenilənir.

create extension if not exists btree_gist;

/* ---------- adminlər ---------- */
-- admin paneldə yalnız bu siyahıdakı e-poçtla daxil olan istifadəçi dəyişiklik edə bilər
create table if not exists public.admins (
  email text primary key
);

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from admins where lower(email) = lower(coalesce(auth.jwt() ->> 'email', '')));
$$;

/* ---------- sayt ayarları ---------- */
-- qiymətlər, saatlar, beh, istilik, xüsusi günlər (settings.js-dəki DEFAULT_SETTINGS formatında; promokodlar burada saxlanmır)
create table if not exists public.site_settings (
  id int primary key default 1 check (id = 1),
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);
insert into public.site_settings (id) values (1) on conflict do nothing;

/* ---------- admin kalendarında əllə bağlanan gecələr ---------- */
-- telefonla və ya başqa yolla gələn rezervlər; tarix həmin günün gecəsidir
create table if not exists public.blocked_nights (
  home text not null,
  night date not null,
  primary key (home, night)
);

/* ---------- promokodlar ---------- */
-- data: type, value, note, homes, from, to, minNights, stack, active; used: istifadə məlumatı (null = aktiv)
create table if not exists public.promo_codes (
  code text primary key check (code ~ '^[A-Z0-9_-]{3,20}$'),
  data jsonb not null default '{}'::jsonb,
  used jsonb,
  reservation_id uuid,
  created_at timestamptz not null default now()
);

/* ---------- rezervasiyalar ---------- */
-- pending: sorğu gəlib, tarixlər hold_until-ə qədər saxlanılır; confirmed: beh alınıb;
-- cancelled: qonaq və ya admin ləğv edib; rejected: admin rədd edib; expired: gözləmə müddəti bitib
create table if not exists public.reservations (
  id uuid primary key default gen_random_uuid(),
  number bigint generated always as identity,
  home text not null,
  checkin date not null,
  checkout date not null,
  adults int not null default 1,
  children int not null default 0,
  pets int not null default 0,
  first_name text not null,
  last_name text not null,
  phone text not null,
  email text not null default '',
  promo_code text,
  total numeric not null default 0,
  prepay numeric not null default 0,
  lang text not null default 'az',
  status text not null default 'pending' check (status in ('pending', 'confirmed', 'cancelled', 'rejected', 'expired')),
  hold_until timestamptz,
  cancel_token uuid not null default gen_random_uuid(),
  admin_note text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (checkout > checkin),
  -- eyni evə gözləyən və təsdiqlənmiş rezervlər üst-üstə düşə bilməz (çıxış günü növbəti girişə açıqdır)
  constraint reservations_no_overlap exclude using gist (home with =, daterange(checkin, checkout) with &&)
    where (status in ('pending', 'confirmed'))
);
create index if not exists reservations_status_idx on public.reservations (status, checkin);
-- sorğu göndərənin IP ünvanı: bir yerdən çoxlu saxta sorğu ilə tarixləri tutmağın qarşısını almaq üçün
alter table public.reservations add column if not exists ip text not null default '';

-- rezerv ləğv, rədd və ya vaxtı bitəndə onun promokodu yenidən aktiv olur
create or replace function public.reservation_status_changed()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  new.updated_at := now();
  if new.status in ('cancelled', 'rejected', 'expired') and old.status in ('pending', 'confirmed') then
    update promo_codes set used = null, reservation_id = null where reservation_id = new.id;
  end if;
  return new;
end;
$$;

drop trigger if exists reservations_status_changed on public.reservations;
create trigger reservations_status_changed
  before update on public.reservations
  for each row execute function public.reservation_status_changed();

/* ---------- giriş qaydaları (RLS) ---------- */
alter table public.admins enable row level security;
alter table public.site_settings enable row level security;
alter table public.blocked_nights enable row level security;
alter table public.promo_codes enable row level security;
alter table public.reservations enable row level security;

drop policy if exists "admin oxuyur" on public.admins;
create policy "admin oxuyur" on public.admins for select using (public.is_admin());

drop policy if exists "hamı oxuyur" on public.site_settings;
create policy "hamı oxuyur" on public.site_settings for select using (true);
drop policy if exists "admin dəyişir" on public.site_settings;
create policy "admin dəyişir" on public.site_settings for update using (public.is_admin()) with check (public.is_admin());

drop policy if exists "hamı oxuyur" on public.blocked_nights;
create policy "hamı oxuyur" on public.blocked_nights for select using (true);
drop policy if exists "admin dəyişir" on public.blocked_nights;
create policy "admin dəyişir" on public.blocked_nights for all using (public.is_admin()) with check (public.is_admin());

-- promokodlar və rezervlər ziyarətçilərə görünmür; onlar yalnız aşağıdakı funksiyalarla işləyir
drop policy if exists "admin idarə edir" on public.promo_codes;
create policy "admin idarə edir" on public.promo_codes for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "admin idarə edir" on public.reservations;
create policy "admin idarə edir" on public.reservations for all using (public.is_admin()) with check (public.is_admin());

/* ---------- ziyarətçi funksiyaları ---------- */
-- vaxtı bitmiş gözləmələri bağlayır (yeni sorğudan və admin siyahısından əvvəl çağırılır)
create or replace function public.expire_holds()
returns void
language sql
security definer
set search_path = public
as $$
  update reservations set status = 'expired' where status = 'pending' and hold_until < now();
$$;

-- dolu gecələr: admin bağladıqları + gözləyən və təsdiqlənmiş rezervlər; şəxsi məlumat qaytarılmır
create or replace function public.get_busy_nights()
returns table (home text, night date)
language sql
stable
security definer
set search_path = public
as $$
  select b.home, b.night
  from blocked_nights b
  where b.night >= (now() at time zone 'Asia/Baku')::date
  union
  select r.home, d::date
  from reservations r, generate_series(r.checkin, r.checkout - 1, interval '1 day') d
  where r.checkout > (now() at time zone 'Asia/Baku')::date
    and (r.status = 'confirmed' or (r.status = 'pending' and r.hold_until > now()));
$$;

-- qonaq daxil etdiyi promokodun şərtlərini görür (yalnız həmin kod; adminin qeydi göstərilmir)
create or replace function public.check_promo(p_code text)
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  -- gözləmə vaxtı bitmiş sorğunun promokodu (expire_holds hələ işləməyibsə) artıq istifadə olunmuş sayılmır
  select (p.data - 'note') || jsonb_build_object('code', p.code, 'used',
    case
      when p.used is null then null
      when exists (select 1 from reservations r where r.id = p.reservation_id and r.status = 'pending' and r.hold_until < now()) then null
      else '{}'::jsonb
    end)
  from promo_codes p
  where p.code = upper(trim(p_code));
$$;

-- rezerv sorğusu: tarixləri yoxlayır, promokodu bağlayır, tarixləri holdHours saat saxlayır
create or replace function public.create_reservation(p jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_home text := p ->> 'home';
  v_checkin date := (p ->> 'checkin')::date;
  v_checkout date := (p ->> 'checkout')::date;
  v_phone text := left(trim(coalesce(p ->> 'phone', '')), 30);
  v_code text := nullif(upper(trim(coalesce(p ->> 'promo', ''))), '');
  v_today date := (now() at time zone 'Asia/Baku')::date;
  v_headers json := coalesce(nullif(current_setting('request.headers', true), ''), '{}')::json;
  v_ip text := left(trim(split_part(coalesce(v_headers ->> 'cf-connecting-ip', v_headers ->> 'x-forwarded-for', v_headers ->> 'x-real-ip', ''), ',', 1)), 64);
  v_hours int;
  v_promo promo_codes;
  v_row reservations;
begin
  if v_home not in ('qaya', 'ardic', 'palid', 'glamp4', 'glamp2') then
    raise exception 'invalid';
  end if;
  if v_checkin is null or v_checkout is null or v_checkin < v_today or v_checkout <= v_checkin or v_checkout - v_checkin > 60 then
    raise exception 'invalid';
  end if;
  if length(trim(coalesce(p ->> 'firstName', ''))) = 0 or length(v_phone) < 5 then
    raise exception 'invalid';
  end if;

  perform expire_holds();

  -- eyni nömrədən çoxlu gözləyən sorğu ilə tarixləri tutmağın qarşısını alır
  if (select count(*) from reservations where phone = v_phone and status = 'pending') >= 3 then
    raise exception 'limit';
  end if;
  if v_ip <> '' and (select count(*) from reservations where ip = v_ip and status = 'pending') >= 3 then
    raise exception 'limit';
  end if;

  if exists (select 1 from blocked_nights where home = v_home and night >= v_checkin and night < v_checkout) then
    raise exception 'taken';
  end if;

  if v_code is not null then
    select * into v_promo from promo_codes where code = v_code for update;
    if not found
      or v_promo.used is not null
      or coalesce((v_promo.data ->> 'active')::boolean, true) = false
      or not (v_promo.data -> 'homes') ? v_home
      or (coalesce(v_promo.data ->> 'from', '') <> '' and v_today < (v_promo.data ->> 'from')::date)
      or (coalesce(v_promo.data ->> 'to', '') <> '' and v_today > (v_promo.data ->> 'to')::date)
      or v_checkout - v_checkin < coalesce((v_promo.data ->> 'minNights')::int, 1) then
      raise exception 'promo';
    end if;
  end if;

  select coalesce((data ->> 'holdHours')::int, 2) into v_hours from site_settings where id = 1;

  begin
    insert into reservations (home, checkin, checkout, adults, children, pets, first_name, last_name, phone, email, promo_code, total, prepay, lang, hold_until, ip)
    values (
      v_home, v_checkin, v_checkout,
      greatest(1, coalesce((p ->> 'adults')::int, 1)),
      greatest(0, coalesce((p ->> 'children')::int, 0)),
      greatest(0, coalesce((p ->> 'pets')::int, 0)),
      left(trim(p ->> 'firstName'), 80),
      left(trim(coalesce(p ->> 'lastName', '')), 80),
      v_phone,
      left(trim(coalesce(p ->> 'email', '')), 120),
      v_code,
      greatest(0, coalesce((p ->> 'total')::numeric, 0)),
      greatest(0, coalesce((p ->> 'prepay')::numeric, 0)),
      coalesce(nullif(p ->> 'lang', ''), 'az'),
      now() + make_interval(hours => coalesce(v_hours, 2)),
      v_ip
    )
    returning * into v_row;
  exception when exclusion_violation then
    raise exception 'taken';
  end;

  if v_code is not null then
    update promo_codes
    set reservation_id = v_row.id,
        used = jsonb_build_object(
          'guest', trim(v_row.first_name || ' ' || v_row.last_name),
          'phone', v_row.phone,
          'home', v_row.home,
          'checkin', v_row.checkin,
          'checkout', v_row.checkout,
          'amount', greatest(0, coalesce((p ->> 'promoAmount')::numeric, 0)),
          'at', v_today
        )
    where code = v_code;
  end if;

  return jsonb_build_object('number', v_row.number, 'token', v_row.cancel_token, 'holdUntil', v_row.hold_until);
end;
$$;

-- qonaq ləğv linkindən rezervini görür
create or replace function public.get_reservation(p_token uuid)
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select jsonb_build_object(
    'number', number, 'home', home, 'checkin', checkin, 'checkout', checkout,
    'status', case when status = 'pending' and hold_until < now() then 'expired' else status end
  )
  from reservations
  where cancel_token = p_token;
$$;

-- qonaq öz rezervini ləğv edir (giriş günü keçməyibsə); beh geri qaytarılmır
create or replace function public.cancel_reservation(p_token uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_row reservations;
begin
  update reservations
  set status = 'cancelled', admin_note = trim(admin_note || ' Qonaq saytdan ləğv edib.')
  where cancel_token = p_token
    and status in ('pending', 'confirmed')
    and checkin >= (now() at time zone 'Asia/Baku')::date
  returning * into v_row;
  if not found then
    raise exception 'not_cancellable';
  end if;
  return jsonb_build_object('number', v_row.number, 'status', v_row.status);
end;
$$;

revoke all on function public.expire_holds() from public, anon;
grant execute on function public.expire_holds() to authenticated;
grant execute on function public.get_busy_nights() to anon, authenticated;
grant execute on function public.check_promo(text) to anon, authenticated;
grant execute on function public.create_reservation(jsonb) to anon, authenticated;
grant execute on function public.get_reservation(uuid) to anon, authenticated;
grant execute on function public.cancel_reservation(uuid) to anon, authenticated;

/* ---------- cədvəl icazələri ---------- */
-- bu layihədə cədvəllərə standart icazə verilmir; kimin nəyi görəcəyini yuxarıdakı RLS qaydaları müəyyən edir
grant usage on schema public to anon, authenticated;
grant select on public.site_settings, public.blocked_nights to anon;
grant select, update on public.site_settings to authenticated;
grant select, insert, update, delete on public.blocked_nights, public.promo_codes, public.reservations to authenticated;
grant select on public.admins to authenticated;
grant execute on function public.is_admin() to anon, authenticated;

/* ---------- analitika ---------- */
-- ziyarətçi anonimdir: brauzerdə təsadüfi id saxlanılır, ad, telefon və IP yazılmır
create table if not exists public.analytics_sessions (
  id uuid primary key,
  visitor_id uuid not null,
  host text not null default '',
  started_at timestamptz not null default now(),
  last_seen timestamptz not null default now(),
  landing_page text not null default '',
  last_page text not null default '',
  referrer text not null default '',
  source text not null default '',
  medium text not null default '',
  campaign text not null default '',
  device text not null default '',
  browser text not null default '',
  os text not null default '',
  lang text not null default '',
  country text not null default '',
  is_new boolean not null default false,
  pageviews int not null default 0,
  events int not null default 0
);
create index if not exists analytics_sessions_started_idx on public.analytics_sessions (started_at);
create index if not exists analytics_sessions_seen_idx on public.analytics_sessions (last_seen);

-- type: page_view, click, scroll (dərinlik %), engagement (səhifədə aktiv saniyə), booking_submit, booking_error
create table if not exists public.analytics_events (
  id bigint generated always as identity primary key,
  session_id uuid not null references public.analytics_sessions (id) on delete cascade,
  visitor_id uuid not null,
  at timestamptz not null default now(),
  type text not null,
  page text not null default '',
  label text not null default '',
  target text not null default '',
  value numeric
);
create index if not exists analytics_events_at_idx on public.analytics_events (at);
create index if not exists analytics_events_session_idx on public.analytics_events (session_id);

-- cədvəllərə birbaşa giriş yoxdur: yazmaq track(), oxumaq yalnız admin funksiyaları ilə
alter table public.analytics_sessions enable row level security;
alter table public.analytics_events enable row level security;

-- saytın izləmə skripti hadisələri paketlə göndərir (bir dəfəyə ən çox 30 hadisə)
create or replace function public.track(p jsonb)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_session uuid;
  v_visitor uuid;
  s jsonb := coalesce(p -> 'session', '{}'::jsonb);
  e jsonb;
  v_headers json := coalesce(nullif(current_setting('request.headers', true), ''), '{}')::json;
  v_views int := 0;
  v_count int := 0;
begin
  begin
    v_session := (p ->> 'sessionId')::uuid;
    v_visitor := (p ->> 'visitorId')::uuid;
  exception when others then
    return;
  end;
  if v_session is null or v_visitor is null then
    return;
  end if;

  insert into analytics_sessions (id, visitor_id, host, landing_page, last_page, referrer, source, medium, campaign, device, browser, os, lang, country, is_new)
  values (
    v_session, v_visitor,
    left(coalesce(s ->> 'host', ''), 100),
    left(coalesce(s ->> 'landing', ''), 200),
    left(coalesce(s ->> 'landing', ''), 200),
    left(coalesce(s ->> 'referrer', ''), 300),
    left(coalesce(s ->> 'source', ''), 100),
    left(coalesce(s ->> 'medium', ''), 100),
    left(coalesce(s ->> 'campaign', ''), 100),
    left(coalesce(s ->> 'device', ''), 20),
    left(coalesce(s ->> 'browser', ''), 40),
    left(coalesce(s ->> 'os', ''), 40),
    left(coalesce(s ->> 'lang', ''), 10),
    left(upper(coalesce(v_headers ->> 'cf-ipcountry', '')), 2),
    coalesce((s ->> 'isNew')::boolean, false)
  )
  on conflict (id) do nothing;

  for e in select value from jsonb_array_elements(case when jsonb_typeof(p -> 'events') = 'array' then p -> 'events' else '[]'::jsonb end) limit 30 loop
    if coalesce(e ->> 'type', '') not in ('page_view', 'click', 'scroll', 'engagement', 'booking_submit', 'booking_error') then
      continue;
    end if;
    insert into analytics_events (session_id, visitor_id, type, page, label, target, value)
    values (
      v_session, v_visitor, e ->> 'type',
      left(coalesce(e ->> 'page', ''), 200),
      left(coalesce(e ->> 'label', ''), 120),
      left(coalesce(e ->> 'target', ''), 200),
      case when jsonb_typeof(e -> 'value') = 'number' then least(greatest((e ->> 'value')::numeric, 0), 100000) end
    );
    v_count := v_count + 1;
    if e ->> 'type' = 'page_view' then
      v_views := v_views + 1;
    end if;
  end loop;

  update analytics_sessions
  set last_seen = now(),
      last_page = coalesce(nullif(left(coalesce(p ->> 'page', ''), 200), ''), last_page),
      pageviews = pageviews + v_views,
      events = events + v_count
  where id = v_session;
end;
$$;

-- admin paneli üçün hesabat: p_test = localhost-dan sınaq ziyarətləri də daxil olsun
create or replace function public.analytics_summary(p_from timestamptz, p_to timestamptz, p_test boolean default false)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_result jsonb;
begin
  if not is_admin() then
    raise exception 'forbidden';
  end if;

  with s as (
    select * from analytics_sessions
    where started_at >= p_from and started_at < p_to
      and (p_test or host not in ('localhost', '127.0.0.1', ''))
  ),
  ev as (
    select e.* from analytics_events e join s on s.id = e.session_id
  ),
  -- sessiya "bounce" sayılır: bir səhifə, 10 saniyədən az və sorğu yoxdur (GA4 məntiqi)
  engaged as (
    select s.id,
      (s.pageviews > 1 or s.last_seen - s.started_at >= interval '10 seconds'
        or exists (select 1 from ev where ev.session_id = s.id and ev.type = 'booking_submit')) as is_engaged
    from s
  )
  select jsonb_build_object(
    'totals', (
      select jsonb_build_object(
        'visitors', count(distinct visitor_id),
        'newVisitors', count(distinct visitor_id) filter (where is_new),
        'sessions', count(*),
        'pageviews', coalesce(sum(pageviews), 0),
        'avgDuration', coalesce(round(avg(extract(epoch from last_seen - started_at))), 0),
        'bounceRate', coalesce(round(100.0 * (select count(*) from engaged where not is_engaged) / nullif(count(*), 0), 1), 0),
        'bookings', (select count(*) from ev where type = 'booking_submit'),
        'bookingSessions', (select count(distinct session_id) from ev where type = 'booking_submit')
      )
      from s
    ),
    'daily', (
      select coalesce(jsonb_agg(jsonb_build_object('day', day, 'visitors', visitors, 'sessions', sessions, 'pageviews', pageviews) order by day), '[]'::jsonb)
      from (
        select (started_at at time zone 'Asia/Baku')::date as day, count(distinct visitor_id) as visitors, count(*) as sessions, sum(pageviews) as pageviews
        from s group by 1
      ) x
    ),
    'hours', (
      select coalesce(jsonb_agg(jsonb_build_object('hour', hour, 'sessions', sessions) order by hour), '[]'::jsonb)
      from (select extract(hour from started_at at time zone 'Asia/Baku')::int as hour, count(*) as sessions from s group by 1) x
    ),
    'pages', (
      select coalesce(jsonb_agg(row_to_json(x) order by x.views desc), '[]'::jsonb)
      from (
        select v.page, count(*) as views, count(distinct v.visitor_id) as visitors,
          round(coalesce((select sum(g.value) from ev g where g.type = 'engagement' and g.page = v.page), 0) / count(*)) as "avgSeconds",
          (select round(avg(m)) from (select max(g.value) as m from ev g where g.type = 'scroll' and g.page = v.page group by g.session_id) d) as "avgScroll"
        from ev v where v.type = 'page_view'
        group by v.page order by views desc limit 20
      ) x
    ),
    'clicks', (
      select coalesce(jsonb_agg(row_to_json(x) order by x.clicks desc), '[]'::jsonb)
      from (
        select label, count(*) as clicks, count(distinct visitor_id) as visitors, mode() within group (order by page) as page, max(target) as target
        from ev where type = 'click' and label <> ''
        group by label order by clicks desc limit 25
      ) x
    ),
    'sources', (
      select coalesce(jsonb_agg(row_to_json(x) order by x.sessions desc), '[]'::jsonb)
      from (select coalesce(nullif(source, ''), '(birbaşa)') as name, count(*) as sessions, count(distinct visitor_id) as visitors from s group by 1 order by sessions desc limit 15) x
    ),
    'campaigns', (
      select coalesce(jsonb_agg(row_to_json(x) order by x.sessions desc), '[]'::jsonb)
      from (select campaign as name, max(source) as source, max(medium) as medium, count(*) as sessions from s where campaign <> '' group by campaign order by sessions desc limit 15) x
    ),
    'devices', (
      select coalesce(jsonb_agg(row_to_json(x) order by x.sessions desc), '[]'::jsonb)
      from (select coalesce(nullif(device, ''), 'naməlum') as name, count(*) as sessions from s group by 1) x
    ),
    'browsers', (
      select coalesce(jsonb_agg(row_to_json(x) order by x.sessions desc), '[]'::jsonb)
      from (select coalesce(nullif(browser, ''), 'naməlum') as name, count(*) as sessions from s group by 1 order by sessions desc limit 10) x
    ),
    'os', (
      select coalesce(jsonb_agg(row_to_json(x) order by x.sessions desc), '[]'::jsonb)
      from (select coalesce(nullif(os, ''), 'naməlum') as name, count(*) as sessions from s group by 1 order by sessions desc limit 10) x
    ),
    'countries', (
      select coalesce(jsonb_agg(row_to_json(x) order by x.sessions desc), '[]'::jsonb)
      from (select coalesce(nullif(country, ''), '??') as name, count(*) as sessions from s group by 1 order by sessions desc limit 15) x
    ),
    'langs', (
      select coalesce(jsonb_agg(row_to_json(x) order by x.sessions desc), '[]'::jsonb)
      from (select coalesce(nullif(lang, ''), 'naməlum') as name, count(*) as sessions from s group by 1 order by sessions desc limit 10) x
    ),
    'funnel', (
      select jsonb_build_object(
        'sessions', (select count(*) from s),
        'house', (select count(distinct session_id) from ev where type = 'page_view' and page like 'house.html%'),
        'reservation', (select count(distinct session_id) from ev where type = 'page_view' and page like 'reservation.html%'),
        'submitted', (select count(distinct session_id) from ev where type = 'booking_submit')
      )
    )
  ) into v_result;
  return v_result;
end;
$$;

-- son 2 dəqiqədə aktiv olan sessiyalar: "indi saytda"
create or replace function public.analytics_live(p_test boolean default false)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if not is_admin() then
    raise exception 'forbidden';
  end if;
  return (
    select jsonb_build_object(
      'active', count(*),
      'pages', coalesce((
        select jsonb_agg(row_to_json(x) order by x.visitors desc)
        from (
          select last_page as page, count(*) as visitors
          from analytics_sessions
          where last_seen > now() - interval '2 minutes' and (p_test or host not in ('localhost', '127.0.0.1', ''))
          group by last_page
        ) x
      ), '[]'::jsonb)
    )
    from analytics_sessions
    where last_seen > now() - interval '2 minutes' and (p_test or host not in ('localhost', '127.0.0.1', ''))
  );
end;
$$;

revoke all on function public.track(jsonb) from public;
grant execute on function public.track(jsonb) to anon, authenticated;
revoke all on function public.analytics_summary(timestamptz, timestamptz, boolean) from public, anon;
grant execute on function public.analytics_summary(timestamptz, timestamptz, boolean) to authenticated;
revoke all on function public.analytics_live(boolean) from public, anon;
grant execute on function public.analytics_live(boolean) to authenticated;
