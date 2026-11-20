-- Saytın kalendarında gözləmədə olan tarixləri ayrıca göstərmək üçün (2026-11-20). SQL Editor-da Run edin.
-- dolu gecələr: admin bağladıqları + gözləyən və təsdiqlənmiş rezervlər; şəxsi məlumat qaytarılmır.
-- pending: tarix hələ təsdiqlənməmiş sorğu ilə saxlanılır (saytda "Gözləmədə" kimi göstərilir)
drop function if exists public.get_busy_nights();
create function public.get_busy_nights()
returns table (home text, night date, pending boolean)
language sql
stable
security definer
set search_path = public
as $$
  select b.home, b.night, false
  from blocked_nights b
  where b.night >= (now() at time zone 'Asia/Baku')::date
  union
  select r.home, d::date, r.status = 'pending'
  from reservations r, generate_series(r.checkin, r.checkout - 1, interval '1 day') d
  where r.checkout > (now() at time zone 'Asia/Baku')::date
    and (r.status = 'confirmed' or (r.status = 'pending' and r.hold_until > now()));
$$;

grant execute on function public.get_busy_nights() to anon, authenticated;
