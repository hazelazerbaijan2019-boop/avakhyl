// Avakhyl qiymət və qaydaları. Rəhbər paneli bu ayarları dəyişir; sayt bütün hesablamaları buradan oxuyur.
// Ayarlar Supabase-də (site_settings) saxlanılır; brauzer son yüklənən nüsxəni yadda saxlayır ki, səhifə dərhal açılsın.
const SETTINGS_CACHE_KEY = "avakhylSettingsCacheV2";
// Supabase-dən əvvəl admin ayarları yalnız öz brauzerində saxlayırdı; admin paneli onları bir dəfə bazaya köçürür
const LEGACY_SETTINGS_KEY = "avakhylSettingsV1";

const DEFAULT_SETTINGS = {
  homes: {
    // basePrice baseGuests nəfərə qədər keçərlidir; sonrakı hər böyük üçün extraGuestPrice əlavə olunur.
    // maxAdults evin tutumudur: böyük + uşaq birlikdə bu saydan çox ola bilməz. Qiymətdə yalnız böyüklər sayılır.
    qaya: { basePrice: 90, baseGuests: 3, extraGuestPrice: 20, minAdults: 1, maxAdults: 10, maxPets: 1, discountPercent: 10, discountMinNights: 3 },
    ardic: { basePrice: 60, baseGuests: 3, extraGuestPrice: 0, minAdults: 1, maxAdults: 3, maxPets: 1, discountPercent: 0, discountMinNights: 3 },
    palid: { basePrice: 60, baseGuests: 3, extraGuestPrice: 0, minAdults: 1, maxAdults: 3, maxPets: 1, discountPercent: 0, discountMinNights: 3 },
    glamp4: { basePrice: 130, baseGuests: 4, extraGuestPrice: 0, minAdults: 1, maxAdults: 4, maxPets: 1, discountPercent: 0, discountMinNights: 3 },
    glamp2: { basePrice: 60, baseGuests: 2, extraGuestPrice: 0, minAdults: 1, maxAdults: 2, maxPets: 1, discountPercent: 0, discountMinNights: 3 }
  },
  // istilik ödənişi: "AA-GG" formatında başlanğıc (daxil) və son (daxil deyil) tarixlər;
  // mode "night" — dövrə düşən hər gecə üçün, "stay" — dövrə düşən qalış üçün bir dəfə;
  // discounted — endirim istilik ödənişinə də tətbiq olunsun
  heating: { fee: 20, start: "10-20", end: "03-20", mode: "night", discounted: false },
  deposit: 50,
  // sorğu göndəriləndən sonra tarixlər bu qədər saat "gözləmədə" saxlanılır; ödəniş alınmasa avtomatik açılır (Supabase mərhələsində işə düşür)
  holdHours: 2,
  // giriş və çıxış saatları ("SS:DD"); çıxış girişdən tez olmalıdır ki, çıxış günü həmin evə yeni qonaq girə bilsin
  checkinTime: "14:00",
  checkoutTime: "12:00",
  // bayram və xüsusi günlər; siyahıda yuxarıdakı qayda üstündür
  specials: [],
  promoCodes: []
};

// promokod: kod böyük hərflə saxlanılır; note yalnız rəhbər üçündür, saytda göstərilmir.
// type: "percent" — value% endirim, "amount" — value AZN endirim; from/to — kodun istifadə oluna biləcəyi tarixlər (boş = limitsiz);
// stack: uzun qalış endirimi ilə birlikdə; olmasa ikisindən sərfəlisi tətbiq olunur
const normalizePromo = (promo) => {
  if (!promo || typeof promo !== "object") return null;
  const isDate = (value) => typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value);
  return {
    code: typeof promo.code === "string" ? promo.code.trim().toUpperCase().replace(/[^A-Z0-9_-]/g, "").slice(0, 20) : "",
    type: promo.type === "amount" ? "amount" : "percent",
    value: Number.isFinite(promo.value) ? Math.max(0, promo.value) : 0,
    note: typeof promo.note === "string" ? promo.note.slice(0, 200) : "",
    homes: Array.isArray(promo.homes) ? promo.homes.filter((home) => typeof home === "string") : [],
    from: isDate(promo.from) ? promo.from : "",
    to: isDate(promo.to) ? promo.to : "",
    minNights: Number.isInteger(promo.minNights) && promo.minNights > 0 ? promo.minNights : 1,
    stack: Boolean(promo.stack),
    active: promo.active !== false,
    // promokod bir dəfəlikdir: istifadə olunanda kim, hansı ev və tarixlər üçün istifadə etdiyi yazılır və kod arxivə düşür
    used: promo.used && typeof promo.used === "object" ? normalizePromoUse(promo.used) : null
  };
};

const normalizePromoUse = (use) => {
  const text = (value, max) => (typeof value === "string" ? value.trim().slice(0, max) : "");
  return {
    guest: text(use.guest, 80),
    phone: text(use.phone, 30),
    home: text(use.home, 20),
    checkin: text(use.checkin, 10),
    checkout: text(use.checkout, 10),
    amount: Number.isFinite(use.amount) ? Math.max(0, use.amount) : 0,
    at: text(use.at, 10)
  };
};

// xüsusi gün qaydası: start–end gecələri daxil ("İİİİ-AA-GG"); yearly olsa yalnız ay-gün müqayisə olunur.
// type: "price" — əsas qiymət əvəzinə value AZN (əlavə nəfər ödənişi qalır), "discount" — value% endirim, "increase" — value% artım.
// stack: uzun qalış endirimi bu gecələrə də tətbiq olunsun
const normalizeSpecial = (rule) => {
  if (!rule || typeof rule !== "object") return null;
  const isDate = (value) => typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value);
  return {
    name: typeof rule.name === "string" ? rule.name.slice(0, 60) : "",
    start: isDate(rule.start) ? rule.start : "",
    end: isDate(rule.end) ? rule.end : "",
    yearly: Boolean(rule.yearly),
    homes: Array.isArray(rule.homes) ? rule.homes.filter((home) => typeof home === "string") : [],
    type: ["price", "discount", "increase"].includes(rule.type) ? rule.type : "discount",
    value: Number.isFinite(rule.value) ? Math.max(0, rule.value) : 0,
    stack: Boolean(rule.stack),
    active: rule.active !== false
  };
};

const mergeSettings = (base, saved) => {
  if (!saved || typeof saved !== "object") return base;
  const out = Array.isArray(base) ? [...base] : { ...base };
  Object.keys(base).forEach((key) => {
    const value = saved[key];
    if (key === "specials") out[key] = Array.isArray(value) ? value.map(normalizeSpecial).filter(Boolean) : [];
    else if (key === "promoCodes") out[key] = Array.isArray(value) ? value.map(normalizePromo).filter(Boolean) : [];
    else if (base[key] && typeof base[key] === "object") out[key] = mergeSettings(base[key], value);
    else if (typeof value === typeof base[key]) out[key] = value;
  });
  return out;
};

const isValidTime = (value) => typeof value === "string" && /^([01]\d|2[0-3]):[0-5]\d$/.test(value);

const loadSettings = () => {
  try {
    return mergeSettings(DEFAULT_SETTINGS, JSON.parse(localStorage.getItem(SETTINGS_CACHE_KEY) || "{}"));
  } catch {
    return mergeSettings(DEFAULT_SETTINGS, {});
  }
};

// köhnə və ya xarab saxlanmış saatlar standarta qaytarılır
const fixTimes = (settings) => {
  if (!isValidTime(settings.checkinTime) || !isValidTime(settings.checkoutTime) || settings.checkoutTime >= settings.checkinTime) {
    settings.checkinTime = DEFAULT_SETTINGS.checkinTime;
    settings.checkoutTime = DEFAULT_SETTINGS.checkoutTime;
  }
  return settings;
};

const SETTINGS = fixTimes(loadSettings());
let DEPOSIT = SETTINGS.deposit;

// bazadan gələn ayarları tətbiq edir; promokodlar ayrıca yüklənir (loadPromo), ona görə saxlanılır
const applySettings = (data) => {
  const next = fixTimes(mergeSettings(DEFAULT_SETTINGS, data));
  next.promoCodes = SETTINGS.promoCodes;
  Object.assign(SETTINGS, next);
  DEPOSIT = SETTINGS.deposit;
};

// səhifə keşdəki ayarlarla dərhal açılır; bazadakı ayarlar fərqlidirsə "avakhyl:settings" hadisəsi ilə yenidən çəkilir
const settingsReady =
  typeof fetchSiteSettings === "function"
    ? fetchSiteSettings()
        .then((data) => {
          const serialized = JSON.stringify(data);
          if (serialized === localStorage.getItem(SETTINGS_CACHE_KEY)) return;
          localStorage.setItem(SETTINGS_CACHE_KEY, serialized);
          applySettings(data);
          document.dispatchEvent(new CustomEvent("avakhyl:settings"));
        })
        .catch(() => {})
    : Promise.resolve();

// promokodlar ziyarətçiyə siyahı kimi verilmir: qonaq kodu yazanda yalnız həmin kodun şərtləri bazadan gəlir
const loadPromo = async (code) => {
  if (!code || typeof fetchPromo !== "function") return;
  try {
    const promo = normalizePromo(await fetchPromo(code));
    SETTINGS.promoCodes = promo ? [promo] : [];
  } catch {
    SETTINGS.promoCodes = [];
  }
};

const homeRules = (homeId) => SETTINGS.homes[homeId] ?? SETTINGS.homes.qaya;

// böyüklər və uşaqlar evin tutumunu birlikdə doldurur; ev heyvanlarının ayrıca limiti var
const guestLimitHit = (rules, guests, key) => (key === "pets" ? guests.pets >= rules.maxPets : guests.adults + guests.children >= rules.maxAdults);
const fitChildren = (rules, guests) => {
  guests.children = Math.max(0, Math.min(guests.children, rules.maxAdults - guests.adults));
};

const nightlyPrice = (homeId, adults) => {
  const rules = homeRules(homeId);
  const counted = Math.min(rules.maxAdults, Math.max(1, adults));
  return rules.basePrice + Math.max(0, counted - rules.baseGuests) * rules.extraGuestPrice;
};

const discountFor = (homeId, nights, amount) => {
  const rules = homeRules(homeId);
  return rules.discountPercent > 0 && nights >= rules.discountMinNights ? Math.round((amount * rules.discountPercent) / 100) : 0;
};

// istilik dövrü ilin sonundan keçə bilər (məs. 20 oktyabr – 20 mart)
const isHeatingNight = (iso) => {
  const { start, end } = SETTINGS.heating;
  const monthDay = iso.slice(5);
  return start <= end ? monthDay >= start && monthDay < end : monthDay >= start || monthDay < end;
};

// giriş tarixindən çıxışa qədər qalınan gecələr (çıxış günü daxil deyil)
const stayNights = (startIso, endIso) => {
  const nights = [];
  for (let cursor = startIso; cursor && endIso && cursor < endIso; ) {
    nights.push(cursor);
    const [y, m, d] = cursor.split("-").map(Number);
    cursor = new Date(Date.UTC(y, m - 1, d + 1)).toISOString().slice(0, 10);
  }
  return nights;
};

const countHeatingNights = (startIso, endIso) => stayNights(startIso, endIso).filter(isHeatingNight).length;

const specialMatches = (rule, homeId, iso) => {
  if (!rule.active || !rule.start || !rule.end || !rule.homes.includes(homeId)) return false;
  if (!rule.yearly) return iso >= rule.start && iso <= rule.end;
  const monthDay = iso.slice(5);
  const start = rule.start.slice(5);
  const end = rule.end.slice(5);
  return start <= end ? monthDay >= start && monthDay <= end : monthDay >= start || monthDay <= end;
};

const specialFor = (homeId, iso) => SETTINGS.specials.find((rule) => specialMatches(rule, homeId, iso)) ?? null;

// bir gecənin qiyməti: xüsusi gün qaydası varsa ona görə
const nightOn = (homeId, adults, iso) => {
  const normal = nightlyPrice(homeId, adults);
  const rule = specialFor(homeId, iso);
  if (!rule) return { price: normal, rule: null };
  const extraGuests = normal - homeRules(homeId).basePrice;
  const price =
    rule.type === "price" ? rule.value + extraGuests : Math.round((normal * (100 + (rule.type === "increase" ? rule.value : -rule.value))) / 100);
  return { price: Math.max(0, price), rule };
};

const heatingFor = (startIso, endIso) => {
  const nights = countHeatingNights(startIso, endIso);
  if (!nights) return 0;
  return SETTINGS.heating.mode === "stay" ? SETTINGS.heating.fee : nights * SETTINGS.heating.fee;
};

// promokodu yoxlayır; reason boşdursa kod keçərlidir
const findPromo = (code, homeId, nights) => {
  const wanted = (code ?? "").trim().toUpperCase();
  if (!wanted) return { promo: null, reason: "" };
  const promo = SETTINGS.promoCodes.find((item) => item.code === wanted);
  if (!promo) return { promo: null, reason: "invalid" };
  if (!promo.active) return { promo: null, reason: "inactive" };
  if (promo.used) return { promo: null, reason: "used" };
  const today = new Date();
  const todayIso = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
  if ((promo.from && todayIso < promo.from) || (promo.to && todayIso > promo.to)) return { promo: null, reason: "expired" };
  if (!promo.homes.includes(homeId)) return { promo: null, reason: "home" };
  if (nights && nights < promo.minNights) return { promo, reason: "nights" };
  return { promo, reason: "" };
};

// bir qalışın tam hesabı: gecələr qiymətə görə qruplaşdırılır (lines), endirim, promokod, istilik ödənişi
const stayMath = (homeId, adults, startIso, endIso, nights, promoCode = "") => {
  const nightly = nightlyPrice(homeId, adults);
  const lines = [];
  let subtotal = 0;
  let discountBase = 0;
  (nights ? stayNights(startIso, endIso) : []).forEach((iso) => {
    const { price, rule } = nightOn(homeId, adults, iso);
    subtotal += price;
    if (!rule || rule.stack) discountBase += price;
    const label = rule?.name ?? "";
    const line = lines.find((item) => item.price === price && item.label === label);
    if (line) line.nights += 1;
    else lines.push({ price, label, nights: 1 });
  });
  if (!lines.length) lines.push({ price: nightly, label: "", nights: 0 });
  const heating = nights ? heatingFor(startIso, endIso) : 0;
  let discount = discountFor(homeId, nights, discountBase + (SETTINGS.heating.discounted ? heating : 0));

  const { promo, reason } = findPromo(promoCode, homeId, nights);
  const promoResult = { code: promo?.code ?? "", amount: 0, reason, percent: promo?.type === "percent" ? promo.value : 0, minNights: promo?.minNights ?? 1 };
  if (promo && !reason) {
    const base = subtotal + (SETTINGS.heating.discounted ? heating : 0) - (promo.stack ? discount : 0);
    const amount = promo.type === "percent" ? Math.round((base * promo.value) / 100) : Math.min(promo.value, base);
    if (promo.stack || amount >= discount) {
      if (!promo.stack) discount = 0;
      promoResult.amount = amount;
    } else if (nights) {
      promoResult.reason = "notBetter";
    }
  }
  return { nights, nightly, lines, subtotal, discount, promo: promoResult, heating, total: subtotal - discount - promoResult.amount + heating };
};

// kalendarda gecə qiyməti: istilik hər gecə üçün alınırsa həmin günün qiymətinə əlavə olunur
const calendarNightPrice = (homeId, adults, iso) =>
  nightOn(homeId, adults, iso).price + (SETTINGS.heating.mode === "night" && isHeatingNight(iso) ? SETTINGS.heating.fee : 0);

// qiymət təfərrüatlarında gecə sətirləri: birinci sətir mövcud elementlərə yazılır, qalanları onun altına əlavə olunur
const renderNightLines = (lines, formatLine, formatTotal) => {
  document.querySelectorAll("[data-extra-night-line]").forEach((row) => row.remove());
  document.querySelectorAll("[data-summary-night-line], [data-form-night-line]").forEach((label) => {
    const row = label.parentElement;
    const total = row.querySelector("[data-summary-night-total], [data-form-night-total]");
    label.textContent = formatLine(lines[0]);
    total.textContent = formatTotal(lines[0]);
    let anchor = row;
    lines.slice(1).forEach((line) => {
      const extra = document.createElement("div");
      extra.setAttribute("data-extra-night-line", "");
      extra.innerHTML = "<span></span><strong></strong>";
      extra.querySelector("span").textContent = formatLine(line);
      extra.querySelector("strong").textContent = formatTotal(line);
      anchor.after(extra);
      anchor = extra;
    });
  });
};

// ev səhifəsində yaxınlaşan bayram və xüsusi təkliflər
const upcomingSpecials = (homeId, todayIso) =>
  SETTINGS.specials.filter((rule) => rule.active && rule.start && rule.end && rule.homes.includes(homeId) && (rule.yearly || rule.end >= todayIso));

/* ---------- mətnlər: rəqəmlər ayarlardan gəlir ---------- */
const MONTHS_LONG = {
  az: ["yanvar", "fevral", "mart", "aprel", "may", "iyun", "iyul", "avqust", "sentyabr", "oktyabr", "noyabr", "dekabr"],
  ru: ["января", "февраля", "марта", "апреля", "мая", "июня", "июля", "августа", "сентября", "октября", "ноября", "декабря"],
  en: ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"]
};
const formatMonthDay = (monthDay, lang, short = false) => {
  const [month, day] = monthDay.split("-").map(Number);
  const name = (MONTHS_LONG[lang] ?? MONTHS_LONG.az)[month - 1];
  const shown = short && name.length > 4 ? name.slice(0, 3) : name;
  return `${day} ${shown}`;
};

const HEATING_UNIT = {
  az: { night: "hər gecə üçün", stay: "qalış üçün bir dəfə" },
  ru: { night: "за каждую ночь", stay: "один раз за проживание" },
  en: { night: "per night", stay: "once per stay" }
};

const RULE_TEXT = {
  az: {
    base: (n) => `${n} nəfərə qədər`,
    extra: "Hər əlavə nəfər",
    max: (m) => `Maksimum ${m} nəfər (uşaqlar da daxil)`,
    discount: (n) => `${n} gecə və daha çox`,
    from: (p) => `${p} AZN-dən`
  },
  ru: {
    base: (n) => `До ${n} гостей`,
    extra: "Каждый следующий гость",
    max: (m) => `Максимум ${m} гостей (включая детей)`,
    discount: (n) => `От ${n} ночей`,
    from: (p) => `от ${p} AZN`
  },
  en: {
    base: (n) => `Up to ${n} guests`,
    extra: "Each additional guest",
    max: (m) => `Maximum ${m} guests (including children)`,
    discount: (n) => `${n} nights or more`,
    from: (p) => `from ${p} AZN`
  }
};

// ev səhifəsindəki qiymət cədvəlinin sətirləri
const priceRows = (homeId, lang) => {
  const rules = homeRules(homeId);
  const t = RULE_TEXT[lang] ?? RULE_TEXT.az;
  const rows = [{ label: t.base(rules.baseGuests), value: `${rules.basePrice} AZN` }];
  if (rules.extraGuestPrice > 0 && rules.maxAdults > rules.baseGuests) rows.push({ label: t.extra, value: `+${rules.extraGuestPrice} AZN` });
  rows.push({ label: t.max(rules.maxAdults), value: "" });
  if (rules.discountPercent > 0) rows.push({ label: t.discount(rules.discountMinNights), value: `−${rules.discountPercent}%` });
  return rows;
};

// ana səhifədəki ev kartında qısa qiymət
const priceSummary = (homeId, lang) => {
  const rules = homeRules(homeId);
  const t = RULE_TEXT[lang] ?? RULE_TEXT.az;
  // kartda evin tutumu (maksimum böyük sayı) göstərilir; əlavə nəfər ödənişi varsa qiymət "-dən" olur
  return rules.extraGuestPrice > 0 && rules.maxAdults > rules.baseGuests
    ? `${t.base(rules.maxAdults)}: ${t.from(rules.basePrice)}`
    : `${t.base(rules.maxAdults)}: ${rules.basePrice} AZN`;
};

// FAQ-da bütün evlərin qiymət izahı
const HOME_NAMES = { qaya: "Qaya", ardic: "Ardıc", palid: "Palıd", glamp4: "Glamphouse böyük (4 nəfərlik)", glamp2: "Glamphouse kiçik (2 nəfərlik)" };
const priceFaq = (lang) =>
  Object.keys(SETTINGS.homes)
    .map((homeId) => {
      const parts = priceRows(homeId, lang).map((row) => (row.value ? `${row.label}: ${row.value}` : row.label));
      return `<p><strong>${HOME_NAMES[homeId] ?? homeId}:</strong> ${parts.join(", ")}.</p>`;
    })
    .join("");

// mətnlərdəki {deposit}, {heatingFee} kimi yerləri ayarlarla doldurur; homeId olmasa evlər üzrə ən böyük dəyər götürülür
const fillSettings = (value, lang, homeId) => {
  if (typeof value !== "string" || !value.includes("{")) return value;
  const homes = Object.values(SETTINGS.homes);
  const rules = homeId ? homeRules(homeId) : null;
  const vars = {
    deposit: SETTINGS.deposit,
    checkin: SETTINGS.checkinTime,
    checkout: SETTINGS.checkoutTime,
    heatingFee: SETTINGS.heating.fee,
    heatingUnit: (HEATING_UNIT[lang] ?? HEATING_UNIT.az)[SETTINGS.heating.mode] ?? "",
    heatingFrom: formatMonthDay(SETTINGS.heating.start, lang),
    heatingTo: formatMonthDay(SETTINGS.heating.end, lang),
    heatingFromShort: formatMonthDay(SETTINGS.heating.start, lang, true),
    heatingToShort: formatMonthDay(SETTINGS.heating.end, lang, true),
    maxPets: rules ? rules.maxPets : Math.max(...homes.map((home) => home.maxPets)),
    discount: rules ? rules.discountPercent : 0,
    discountNights: rules ? rules.discountMinNights : 0,
    priceFaq: priceFaq(lang)
  };
  return value.replace(/\{(\w+)\}/g, (match, key) => (key in vars ? String(vars[key]) : match));
};

// promokod sahəsi və qiymət sətri (ev səhifəsi və rezervasiya səhifəsi üçün ortaq)
const PROMO_STATUS = { "": "promo.ok", used: "promo.used", inactive: "promo.inactive", invalid: "promo.invalid", expired: "promo.expired", home: "promo.home", nights: "promo.nights", notBetter: "promo.notBetter" };
const renderPromoUi = (promo, code, getText, formatCurrency) => {
  document.querySelectorAll("[data-promo-row]").forEach((row) => {
    row.hidden = !promo.amount;
  });
  document.querySelectorAll("[data-promo-label]").forEach((label) => {
    label.textContent = `${getText("promo.row")} ${promo.code}${promo.percent ? ` (${promo.percent}%)` : ""}`;
  });
  document.querySelectorAll("[data-promo-amount]").forEach((amount) => {
    amount.textContent = `−${formatCurrency(promo.amount)}`;
  });
  document.querySelectorAll("[data-promo-status]").forEach((status) => {
    status.textContent = code ? getText(PROMO_STATUS[promo.reason] ?? "promo.invalid").replace("{n}", promo.minNights) : "";
    status.classList.toggle("is-error", Boolean(code && promo.reason));
  });
  document.querySelectorAll("[data-promo-input]").forEach((input) => {
    if (document.activeElement !== input) input.value = code;
  });
};

// "Tətbiq et" düyməsi və Enter; onApply yeni kodu vəziyyətə yazıb səhifəni yenidən çəkir
const bindPromoInputs = (onApply) => {
  document.querySelectorAll("[data-promo-box]").forEach((box) => {
    const input = box.querySelector("[data-promo-input]");
    const apply = async () => {
      const code = input.value.trim().toUpperCase();
      await loadPromo(code);
      onApply(code);
    };
    box.querySelector("[data-promo-apply]").addEventListener("click", apply);
    input.addEventListener("keydown", (event) => {
      if (event.key === "Enter") {
        event.preventDefault();
        apply();
      }
    });
  });
};

/* ---------- bütün səhifələrdə ortaq mətnlər: menyu, footer, WhatsApp ---------- */
const SHARED_TEXT = {
  az: {
    "nav.avaxil": "Avaxıl haqqında",
    "brand.by": "by Epoxy Azerbaijan Co.",
    "footer.address": "Ünvan",
    "footer.village": "Şamaxı rayonu, Avaxıl kəndi",
    "footer.contact": "Əlaqə",
    "footer.pages": "Səhifələr",
    "footer.homes": "Evlər",
    "footer.rights": "© 2026 Avakhyl. Bütün hüquqlar qorunur.",
    "action.top": "Yuxarı",
    "wa.label": "WhatsApp ilə yazın",
    "booking.sending": "Göndərilir...",
    "booking.sent": "Sorğu #{n} qəbul olundu. WhatsApp açılır — mesajı göndərməyi unutmayın.",
    "booking.taken": "Bu tarixlər artıq tutulub. Zəhmət olmasa başqa tarix seçin.",
    "booking.promo": "Promokod artıq keçərli deyil. Onu silib yenidən göndərin.",
    "booking.limit": "Sizin artıq bir neçə gözləyən sorğunuz var. Əməkdaşımız sizinlə əlaqə saxlayacaq.",
    "booking.invalid": "Məlumatları yoxlayın: tarixlər, ad və əlaqə nömrəsi düzgün olmalıdır.",
    "booking.failed": "Sorğu göndərilmədi. İnterneti yoxlayıb yenidən cəhd edin."
  },
  ru: {
    "nav.avaxil": "Об Авахыле",
    "brand.by": "by Epoxy Azerbaijan Co.",
    "footer.address": "Адрес",
    "footer.village": "Шамахинский район, село Авахыл",
    "footer.contact": "Контакты",
    "footer.pages": "Страницы",
    "footer.homes": "Дома",
    "footer.rights": "© 2026 Avakhyl. Все права защищены.",
    "action.top": "Наверх",
    "wa.label": "Написать в WhatsApp",
    "booking.sending": "Отправка...",
    "booking.sent": "Запрос #{n} принят. Открывается WhatsApp — не забудьте отправить сообщение.",
    "booking.taken": "Эти даты уже заняты. Пожалуйста, выберите другие.",
    "booking.promo": "Промокод больше не действует. Удалите его и отправьте снова.",
    "booking.limit": "У вас уже есть несколько ожидающих запросов. Наш сотрудник свяжется с вами.",
    "booking.invalid": "Проверьте данные: даты, имя и номер телефона.",
    "booking.failed": "Запрос не отправлен. Проверьте интернет и попробуйте снова."
  },
  en: {
    "nav.avaxil": "About Avaxıl",
    "brand.by": "by Epoxy Azerbaijan Co.",
    "footer.address": "Address",
    "footer.village": "Avaxıl village, Shamakhi district",
    "footer.contact": "Contact",
    "footer.pages": "Pages",
    "footer.homes": "Homes",
    "footer.rights": "© 2026 Avakhyl. All rights reserved.",
    "action.top": "Back to top",
    "wa.label": "Message us on WhatsApp",
    "booking.sending": "Sending...",
    "booking.sent": "Request #{n} received. WhatsApp is opening — don't forget to send the message.",
    "booking.taken": "These dates have just been taken. Please choose other dates.",
    "booking.promo": "The promo code is no longer valid. Remove it and send again.",
    "booking.limit": "You already have several pending requests. Our team will contact you.",
    "booking.invalid": "Please check the dates, your name and phone number.",
    "booking.failed": "The request was not sent. Check your connection and try again."
  }
};
const sharedText = (lang, key) => SHARED_TEXT[lang]?.[key] ?? SHARED_TEXT.az[key];

// səhifələr arası linklər seçilmiş dili və fonu özü ilə aparır: <a data-carry-params="avaxil.html#yol">
const carryParams = (lang, theme) => {
  document.querySelectorAll("[data-carry-params]").forEach((link) => {
    const [path, hash] = link.dataset.carryParams.split("#");
    link.href = `${path}?${new URLSearchParams({ lang, theme })}${hash ? `#${hash}` : ""}`;
  });
};
