-- Sınaq məlumatlarını sıfırlayır (sayt canlıya çıxmazdan əvvəl bir dəfə işə salınır).
-- Silinir: bütün rezerv sorğuları (nömrələmə yenidən #1-dən başlayır), analitika, əllə bağlanmış tarixlər.
-- Promokodlar qalır, amma istifadə qeydləri təmizlənir. Qiymət ayarları və admin hesabı toxunulmur.
truncate table public.reservations, public.analytics_events, public.analytics_sessions restart identity cascade;
truncate table public.blocked_nights;
update public.promo_codes set used = null, reservation_id = null;
