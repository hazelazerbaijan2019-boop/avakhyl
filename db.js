// Supabase bağlantısı. Publishable açar saytda açıq ola bilər: bazanı RLS qaydaları qoruyur (supabase/schema.sql).
const SUPABASE_URL = "https://lntsbcrxggikolxosiaj.supabase.co";
const SUPABASE_KEY = "sb_publishable_wZgDfDEk3PR8Uo0xPoKw-g_DmDE3Pae";
const WHATSAPP_NUMBER = "994519992522";

// xəta mesajı bazadakı "raise exception" mətnidir: taken, promo, limit, invalid, not_cancellable
const dbRequest = async (path, { method = "GET", body } = {}) => {
  const response = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    method,
    headers: { apikey: SUPABASE_KEY, "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body)
  });
  const text = await response.text();
  const data = text ? JSON.parse(text) : null;
  if (!response.ok) {
    throw new Error(data?.message || `HTTP ${response.status}`);
  }
  return data;
};

const dbRpc = (name, args = {}) => dbRequest(`rpc/${name}`, { method: "POST", body: args });

const fetchSiteSettings = async () => (await dbRequest("site_settings?id=eq.1&select=data"))?.[0]?.data ?? {};

// dolu gecələr evlər üzrə: { qaya: ["2026-12-10", ...], ... }
const fetchBusyNights = async () => {
  const rows = await dbRpc("get_busy_nights");
  const busy = { qaya: [], ardic: [], palid: [], glamp4: [], glamp2: [] };
  (rows ?? []).forEach(({ home, night }) => busy[home]?.push(night));
  return busy;
};

const fetchPromo = (code) => dbRpc("check_promo", { p_code: code });

const createReservation = (payload) => dbRpc("create_reservation", { p: payload });

const getReservationByToken = (token) => dbRpc("get_reservation", { p_token: token });

const cancelReservationByToken = (token) => dbRpc("cancel_reservation", { p_token: token });

const BOOKING_ERRORS = ["taken", "promo", "limit", "invalid"];
const bookingErrorKey = (error) => `booking.${BOOKING_ERRORS.includes(error?.message) ? error.message : "failed"}`;

// qonaq WhatsApp-dan geri qayıdıb yenidən "Göndər" bassa, eyni sorğu təkrar yaradılmır (öz sorğusu ilə "tutulub" xətası almasın):
// gözləmə vaxtı bitməyibsə əvvəlki sorğunun nömrəsi ilə WhatsApp yenidən açılır
const LAST_BOOKING_KEY = "avakhylLastBooking";
const bookingKey = (payload) => [payload.home, payload.checkin, payload.checkout, payload.phone.replace(/\D/g, "")].join("|");

const readLastBooking = (payload) => {
  try {
    const saved = JSON.parse(localStorage.getItem(LAST_BOOKING_KEY) || "null");
    return saved?.key === bookingKey(payload) && new Date(saved.result.holdUntil) > new Date() ? saved.result : null;
  } catch {
    return null;
  }
};

const saveLastBooking = (payload, result) => {
  try {
    localStorage.setItem(LAST_BOOKING_KEY, JSON.stringify({ key: bookingKey(payload), result }));
  } catch {
    // yaddaş bağlıdırsa təkrar göndərmə sadəcə yeni sorğu kimi yoxlanılır
  }
};

// sorğunu bazaya yazır (tarixlər holdHours saat tutulur), sonra qonağı hazır mesajla WhatsApp-a göndərir
const sendReservation = async ({ payload, buildMessage, getText, button, statusBox }) => {
  const label = button.textContent;
  button.disabled = true;
  button.textContent = getText("booking.sending");
  statusBox.hidden = true;
  statusBox.classList.remove("is-error");
  try {
    const previous = readLastBooking(payload);
    const stillPending = previous && (await getReservationByToken(previous.token))?.status === "pending";
    const result = stillPending ? previous : await createReservation(payload);
    saveLastBooking(payload, result);
    if (!stillPending) {
      window.trackEvent?.("booking_submit", { label: payload.home, value: payload.total });
    }
    statusBox.textContent = getText("booking.sent").replace("{n}", result.number);
    statusBox.hidden = false;
    button.textContent = label;
    window.location.href = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(buildMessage(result))}`;
  } catch (error) {
    window.trackEvent?.("booking_error", { label: bookingErrorKey(error) });
    statusBox.textContent = getText(bookingErrorKey(error));
    statusBox.classList.add("is-error");
    statusBox.hidden = false;
    button.disabled = false;
    button.textContent = label;
  }
};

// WhatsApp mesajının başlığı: əməkdaş rezervi admin paneldə nömrə ilə tapır; ləğv yalnız admin paneldən edilir
const reservationMessageHead = (result) => [
  "Avakhyl rezervasiya sorğusu",
  `Rezerv nömrəsi: #${result.number}`,
  `Tarixlər ${SETTINGS.holdHours} saat saxlanılır`,
  ""
];

// sorğu formundan bazaya gedən məlumat; promokod yalnız həqiqətən tətbiq olunubsa göndərilir
const reservationPayload = ({ home, checkin, checkout, guests, form, math, lang }) => {
  const data = new FormData(form);
  return {
    home,
    checkin,
    checkout,
    adults: guests.adults,
    children: guests.children,
    pets: guests.pets,
    firstName: String(data.get("firstName") ?? ""),
    lastName: String(data.get("lastName") ?? ""),
    phone: String(data.get("phone") ?? ""),
    email: String(data.get("email") ?? ""),
    promo: math.promo.amount ? math.promo.code : "",
    promoAmount: math.promo.amount,
    total: math.total,
    lang
  };
};
