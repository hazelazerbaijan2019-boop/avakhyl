// Supabase-dən əvvəl əllə bağlanan tarixlər brauzerdə saxlanılırdı; ilk girişdə bazaya köçürülür
const LEGACY_BOOKED_KEY = "avakhylBookedDatesV2";
const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
const adminThemeKey = "avakhylAdminTheme";
const html = document.documentElement;
const homeButtons = document.querySelectorAll("[data-admin-home]");
const adminPanel = document.querySelector("[data-admin-panel]");
const adminTitle = document.querySelector("[data-admin-title]");
const adminSummary = document.querySelector("[data-admin-summary]");
const adminCalendar = document.querySelector("[data-admin-calendar]");
const adminPrev = document.querySelector("[data-admin-prev]");
const adminNext = document.querySelector("[data-admin-next]");
const adminSave = document.querySelector("[data-admin-save]");
const adminClear = document.querySelector("[data-admin-clear]");
const adminStatus = document.querySelector("[data-admin-status]");
const themeToggles = document.querySelectorAll("[data-theme-toggle]");
const themeLabels = document.querySelectorAll("[data-theme-label]");
const themeIcons = document.querySelectorAll("[data-theme-icon] use");
const brandLogos = document.querySelectorAll("[data-brand-logo]");

const homes = {
  qaya: "Qaya 🏔️",
  ardic: "Ardıc 🌳",
  palid: "Palıd 🌲",
  glamp4: "Glamphouse böyük (4 nəfərlik)",
  glamp2: "Glamphouse kiçik (2 nəfərlik)"
};
const homeKeys = Object.keys(homes);

const monthNames = ["yanvar", "fevral", "mart", "aprel", "may", "iyun", "iyul", "avqust", "sentyabr", "oktyabr", "noyabr", "dekabr"];
const weekdayNames = ["BE", "ÇA", "Çə", "CA", "Cü", "Şə", "Bz"];

const emptyData = () => ({ qaya: [], ardic: [], palid: [], glamp4: [], glamp2: [] });

const isIsoDate = (value) => typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value);
const normalizeDateList = (dates) => [...new Set(Array.isArray(dates) ? dates.filter(isIsoDate) : [])].sort();

const normalizeData = (value) => ({
  qaya: normalizeDateList(value?.qaya),
  ardic: normalizeDateList(value?.ardic),
  glamp4: normalizeDateList(value?.glamp4),
  glamp2: normalizeDateList(value?.glamp2),
  palid: normalizeDateList(value?.palid)
});

const cloneData = (value) => normalizeData(value);

let selectedHome = null;
let calendarStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
// savedData: bazadakı əllə bağlanmış gecələr; siteNights: saytdan gələn gözləyən və təsdiqlənmiş rezervlərin gecələri
let savedData = emptyData();
let siteNights = emptyData();
let draftData = cloneData(savedData);
let currentTheme = localStorage.getItem(adminThemeKey) === "dark" ? "dark" : "light";

const pad = (value) => String(value).padStart(2, "0");
const toIsoDate = (date) => `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
const addMonths = (date, amount) => new Date(date.getFullYear(), date.getMonth() + amount, 1);
const todayIso = toIsoDate(new Date());

const getHomeDates = (source = draftData) => {
  if (!selectedHome) {
    return [];
  }
  return source[selectedHome] || [];
};

const setStatus = (message) => {
  if (!adminStatus) {
    return;
  }
  adminStatus.textContent = message;
  if (message) {
    window.clearTimeout(setStatus.timeoutId);
    setStatus.timeoutId = window.setTimeout(() => {
      adminStatus.textContent = "";
    }, 2600);
  }
};

const updateThemeLabels = () => {
  const label = currentTheme === "dark" ? "Ağ fon" : "Qara fon";
  const icon = currentTheme === "dark" ? "#icon-sun" : "#icon-moon";
  themeToggles.forEach((button) => {
    button.setAttribute("aria-label", label);
  });
  themeLabels.forEach((element) => {
    element.textContent = label;
  });
  themeIcons.forEach((use) => {
    use.setAttribute("href", icon);
  });
  brandLogos.forEach((image) => {
    const logo = currentTheme === "dark" ? image.dataset.logoDark : image.dataset.logoLight;
    if (logo) {
      image.src = logo;
    }
  });
};

const setTheme = (theme) => {
  currentTheme = theme;
  html.dataset.theme = theme;
  localStorage.setItem(adminThemeKey, theme);
  updateThemeLabels();
};

const renderCounts = () => {
  homeKeys.forEach((key) => {
    const count = savedData[key]?.length || 0;
    const label = document.querySelector(`[data-admin-count="${key}"]`);
    if (label) {
      label.textContent = `${count} tarix`;
    }
  });
};

const loadBlockedNights = async () => {
  const { data, error } = await supabaseClient.from("blocked_nights").select("home, night");
  if (error) {
    throw error;
  }
  const next = emptyData();
  data.forEach(({ home, night }) => next[home]?.push(night));
  savedData = normalizeData(next);
  draftData = cloneData(savedData);
};

// yalnız dəyişən gecələri bazaya yazır: əlavə olunanlar və silinənlər
const persistBookedDates = async (homeKey, nextDates) => {
  const before = new Set(savedData[homeKey]);
  const after = new Set(nextDates);
  const added = [...after].filter((night) => !before.has(night));
  const removed = [...before].filter((night) => !after.has(night));
  if (added.length) {
    const { error } = await supabaseClient.from("blocked_nights").upsert(added.map((night) => ({ home: homeKey, night })));
    if (error) {
      throw error;
    }
  }
  if (removed.length) {
    const { error } = await supabaseClient.from("blocked_nights").delete().eq("home", homeKey).in("night", removed);
    if (error) {
      throw error;
    }
  }
  savedData[homeKey] = [...after].sort();
};

const refreshCalendar = () => {
  renderCounts();
  if (selectedHome) {
    renderCalendar();
    renderSummary();
  }
};

const renderHomeButtons = () => {
  homeButtons.forEach((button) => {
    button.classList.toggle("is-active", button.dataset.adminHome === selectedHome);
  });
};

const renderSummary = () => {
  if (!selectedHome) {
    return;
  }
  const selectedCount = getHomeDates().length;
  adminTitle.textContent = homes[selectedHome];
  adminSummary.textContent = `${selectedCount} tarix seçilib. Tarixi yenidən basmaq rezervi ləğv edir.`;
};

const buildMonthCalendar = (monthDate) => {
  const year = monthDate.getFullYear();
  const month = monthDate.getMonth();
  const first = new Date(year, month, 1);
  const totalDays = new Date(year, month + 1, 0).getDate();
  const leadBlanks = (first.getDay() + 6) % 7;
  const selectedDates = new Set(getHomeDates());
  const savedDates = new Set(getHomeDates(savedData));
  const siteDates = new Set(selectedHome ? siteNights[selectedHome] : []);
  const blanks = Array.from({ length: leadBlanks }, () => `<span class="admin-calendar-day is-empty"></span>`).join("");
  const days = Array.from({ length: totalDays }, (_, index) => {
    const day = index + 1;
    const iso = `${year}-${pad(month + 1)}-${pad(day)}`;
    const isPast = iso < todayIso;
    const isSelected = selectedDates.has(iso);
    const isSaved = savedDates.has(iso);
    // saytdan gələn rezervlər burada dəyişdirilmir: onları "Rezerv sorğuları" bölməsində idarə edin
    const isSite = siteDates.has(iso) && !isSelected;

    return `
      <button
        class="admin-calendar-day ${isSelected ? "is-booked" : ""} ${isSaved ? "is-saved" : ""} ${isSite ? "is-site" : ""} ${isPast ? "is-past" : ""}"
        type="button"
        data-admin-date="${iso}"
        ${isPast || isSite ? "disabled" : ""}
        ${isSite ? 'title="Saytdan gələn rezerv — yuxarıdakı Rezerv sorğuları bölməsində idarə edin"' : ""}
      >
        <span>${day}</span>
        <em>${isSelected ? "Rezerv" : isSite ? "Sayt" : "Boş"}</em>
      </button>
    `;
  }).join("");

  return `
    <article class="admin-calendar-month">
      <h3>${monthNames[month]} ${year}</h3>
      <div class="calendar-weekdays">
        ${weekdayNames.map((day) => `<span>${day}</span>`).join("")}
      </div>
      <div class="admin-calendar-days">${blanks}${days}</div>
    </article>
  `;
};

const renderCalendar = () => {
  if (!selectedHome || !adminCalendar) {
    return;
  }
  adminCalendar.innerHTML = [calendarStart, addMonths(calendarStart, 1)]
    .map((monthDate) => buildMonthCalendar(monthDate))
    .join("");

  adminCalendar.querySelectorAll("[data-admin-date]").forEach((button) => {
    button.addEventListener("click", () => {
      const iso = button.dataset.adminDate;
      const dates = new Set(getHomeDates());
      if (dates.has(iso)) {
        dates.delete(iso);
      } else {
        dates.add(iso);
      }
      draftData[selectedHome] = [...dates].sort();
      renderCalendar();
      renderSummary();
      setStatus("Dəyişiklik hazırdır. Təsdiqlə düyməsinə basın.");
    });
  });
};

const openHome = (homeKey) => {
  selectedHome = homeKey;
  draftData = cloneData(savedData);
  adminPanel.hidden = false;
  renderHomeButtons();
  renderSummary();
  renderCalendar();
  setStatus("");
  adminPanel.scrollIntoView({ behavior: "smooth", block: "start" });
};

homeButtons.forEach((button) => {
  button.addEventListener("click", () => openHome(button.dataset.adminHome));
});

themeToggles.forEach((button) => {
  button.addEventListener("click", () => {
    setTheme(currentTheme === "dark" ? "light" : "dark");
  });
});

if (adminPrev) {
  adminPrev.addEventListener("click", () => {
    calendarStart = addMonths(calendarStart, -1);
    renderCalendar();
  });
}

if (adminNext) {
  adminNext.addEventListener("click", () => {
    calendarStart = addMonths(calendarStart, 1);
    renderCalendar();
  });
}

if (adminSave) {
  adminSave.addEventListener("click", async () => {
    if (!selectedHome) {
      return;
    }
    adminSave.disabled = true;
    try {
      await persistBookedDates(selectedHome, draftData[selectedHome]);
      draftData = cloneData(savedData);
      refreshCalendar();
      setStatus("Rezerv tarixləri təsdiqləndi və sayta tətbiq olundu.");
    } catch {
      setStatus("Yadda saxlanmadı. İnterneti yoxlayıb yenidən cəhd edin.");
    } finally {
      adminSave.disabled = false;
    }
  });
}

if (adminClear) {
  adminClear.addEventListener("click", () => {
    if (!selectedHome) {
      return;
    }
    draftData[selectedHome] = [];
    renderCalendar();
    renderSummary();
    setStatus("Bu ev üçün tarixlər silinməyə hazırdır. Təsdiqlə düyməsinə basın.");
  });
}

setTheme(currentTheme);
renderCounts();

/* ---------- qiymət ayarları ---------- */
const settingsForm = document.querySelector("[data-settings-form]");
const settingsSave = document.querySelector("[data-settings-save]");
const settingsReset = document.querySelector("[data-settings-reset]");
const settingsStatus = document.querySelector("[data-settings-status]");

const HOME_FIELDS = [
  { key: "basePrice", label: "Əsas qiymət (AZN / gecə)", min: 0 },
  { key: "baseGuests", label: "Əsas qiymət neçə nəfərə qədərdir", min: 1 },
  { key: "extraGuestPrice", label: "Hər əlavə nəfər üçün (AZN)", hint: "0 olsa əlavə ödəniş yoxdur", min: 0 },
  { key: "minAdults", label: "Minimum böyük sayı", min: 1 },
  { key: "maxAdults", label: "Maksimum böyük sayı", hint: "Uşaqlar sayılmır", min: 1 },
  { key: "maxPets", label: "Maksimum ev heyvanı", hint: "0 olsa ev heyvanı qəbul edilmir", min: 0 },
  { key: "discountPercent", label: "Endirim (%)", hint: "0 olsa endirim yoxdur", min: 0, max: 100 },
  { key: "discountMinNights", label: "Endirim neçə gecədən başlayır", min: 1 }
];
const MONTH_OPTIONS = ["yanvar", "fevral", "mart", "aprel", "may", "iyun", "iyul", "avqust", "sentyabr", "oktyabr", "noyabr", "dekabr"];

const numberField = (name, { label, hint, min = 0, max }, value) => `
  <label class="admin-field" data-field="${name}">
    <span>${label}</span>
    <input type="number" inputmode="numeric" name="${name}" value="${value}" min="${min}" ${max !== undefined ? `max="${max}"` : ""} step="1" required />
    ${hint ? `<small>${hint}</small>` : ""}
  </label>
`;

const monthDayField = (name, label, hint, monthDay) => {
  const [month, day] = monthDay.split("-").map(Number);
  return `
    <div class="admin-field" data-field="${name}">
      <span>${label}</span>
      <div class="admin-field-pair">
        <input type="number" inputmode="numeric" name="${name}.day" value="${day}" min="1" max="31" aria-label="${label}: gün" />
        <select name="${name}.month" aria-label="${label}: ay">
          ${MONTH_OPTIONS.map((option, index) => `<option value="${index + 1}" ${index + 1 === month ? "selected" : ""}>${option}</option>`).join("")}
        </select>
      </div>
      ${hint ? `<small>${hint}</small>` : ""}
    </div>
  `;
};

// giriş-çıxış arasındakı fasilə: qonaq çıxandan sonra evi növbəti qonağa hazırlamaq üçün qalan vaxt
const timeGapText = (checkin, checkout) => {
  if (!checkin || !checkout) {
    return "Hər iki saatı seçin.";
  }
  const toMinutes = (time) => Number(time.slice(0, 2)) * 60 + Number(time.slice(3, 5));
  const gap = toMinutes(checkin) - toMinutes(checkout);
  if (gap <= 0) {
    return "⚠️ Çıxış saatı girişdən tez olmalıdır, əks halda çıxış günü həmin evə yeni qonaq girə bilməz.";
  }
  const hours = Math.floor(gap / 60);
  const minutes = gap % 60;
  const gapLabel = [hours ? `${hours} saat` : "", minutes ? `${minutes} dəqiqə` : ""].filter(Boolean).join(" ");
  return `Nümunə: qonaq 10 dekabr, saat ${checkin} — girir; 12 dekabr, saat ${checkout} — çıxır (2 gecə). Həmin gün, 12 dekabr saat ${checkin} — növbəti qonaq girə bilər. Aradakı ${gapLabel} evi təmizləmək üçündür.`;
};

// rezerv kalendarının üstündəki izahda saatları yeniləyir
const showAdminTimes = (checkin, checkout) => {
  document.querySelectorAll("[data-admin-checkin]").forEach((element) => {
    element.textContent = checkin;
  });
  document.querySelectorAll("[data-admin-checkout]").forEach((element) => {
    element.textContent = checkout;
  });
};

const renderSettingsForm = (settings) => {
  if (!settingsForm) {
    return;
  }
  const homeCards = Object.keys(homes)
    .map(
      (homeKey) => `
        <fieldset class="admin-settings-card">
          <legend>${homes[homeKey]}</legend>
          ${HOME_FIELDS.map((field) => numberField(`${homeKey}.${field.key}`, field, settings.homes[homeKey][field.key])).join("")}
        </fieldset>
      `
    )
    .join("");
  settingsForm.innerHTML = `
    <fieldset class="admin-settings-card">
      <legend>Giriş və çıxış saatları</legend>
      <p class="admin-hint">Bu saatlar saytda, rezerv səhifəsində və qonağa göndərilən sorğu mesajında göstərilir. Bütün evlərə aiddir.</p>
      <label class="admin-field" data-field="checkinTime">
        <span>Giriş saatı (check-in)</span>
        <input type="time" name="checkinTime" value="${settings.checkinTime}" step="900" required />
        <small>Qonaq bu saatdan etibarən evə girə bilər</small>
      </label>
      <label class="admin-field" data-field="checkoutTime">
        <span>Çıxış saatı (check-out)</span>
        <input type="time" name="checkoutTime" value="${settings.checkoutTime}" step="900" required />
        <small>Qonaq son gün bu saata qədər evi boşaltmalıdır</small>
      </label>
      <p class="admin-hint" data-time-gap>${timeGapText(settings.checkinTime, settings.checkoutTime)}</p>
    </fieldset>
    ${homeCards}
    <fieldset class="admin-settings-card">
      <legend>Bütün evlər</legend>
      ${numberField("deposit", { label: "Depozit (AZN)", hint: "Girişdə ödənilir, çıxışda qaytarılır", min: 0 }, settings.deposit)}
      ${numberField("holdHours", { label: "Gözləmə müddəti (saat)", hint: "Sorğudan sonra tarixlər bu müddət saxlanılır; ödəniş alınmasa avtomatik açılır", min: 1, max: 72 }, settings.holdHours)}
      ${numberField("heating.fee", { label: "İstilik ödənişi (AZN)", hint: "0 olsa istilik ödənişi yoxdur", min: 0 }, settings.heating.fee)}
      <label class="admin-field">
        <span>İstilik ödənişi necə alınır</span>
        <select name="heating.mode">
          <option value="night" ${settings.heating.mode === "night" ? "selected" : ""}>Dövrə düşən hər gecə üçün</option>
          <option value="stay" ${settings.heating.mode === "stay" ? "selected" : ""}>Qalış üçün bir dəfə</option>
        </select>
      </label>
      <label class="admin-field admin-check">
        <input type="checkbox" name="heating.discounted" ${settings.heating.discounted ? "checked" : ""} />
        <span>Endirim istilik ödənişinə də tətbiq olunsun</span>
      </label>
      ${monthDayField("heating.start", "İstilik dövrü başlayır", "Bu günün gecəsi daxildir", settings.heating.start)}
      ${monthDayField("heating.end", "İstilik dövrü bitir", "Bu tarixə qədər (bu günün gecəsi daxil deyil)", settings.heating.end)}
    </fieldset>
  `;
};

const setSettingsStatus = (message, isError = false) => {
  if (!settingsStatus) {
    return;
  }
  settingsStatus.textContent = message;
  settingsStatus.classList.toggle("is-error", isError);
};

// formdan ayarları oxuyur; səhv varsa sahəni qırmızı edib səbəbi qaytarır
const readSettingsForm = () => {
  const data = new FormData(settingsForm);
  const errors = [];
  settingsForm.querySelectorAll(".is-invalid").forEach((field) => field.classList.remove("is-invalid"));
  const flag = (name, message) => {
    settingsForm.querySelector(`[data-field="${name}"]`)?.classList.add("is-invalid");
    errors.push(message);
  };
  const readNumber = (name, { min = 0, max = Infinity } = {}) => {
    const raw = String(data.get(name) ?? "").trim();
    const value = Number(raw);
    if (raw === "" || !Number.isInteger(value) || value < min || value > max) {
      flag(name, "Rəqəmləri yoxlayın: boş və ya mənfi dəyər ola bilməz.");
      return min;
    }
    return value;
  };
  const readMonthDay = (name) => {
    const month = Number(data.get(`${name}.month`));
    const day = Number(data.get(`${name}.day`));
    const daysInMonth = new Date(2024, month, 0).getDate();
    if (!Number.isInteger(day) || day < 1 || day > daysInMonth) {
      flag(name, "İstilik dövrünün tarixini yoxlayın.");
      return "01-01";
    }
    return `${pad(month)}-${pad(day)}`;
  };

  const next = { homes: {}, heating: {}, deposit: readNumber("deposit"), holdHours: readNumber("holdHours", { min: 1, max: 72 }) };
  Object.keys(homes).forEach((homeKey) => {
    const rules = {};
    HOME_FIELDS.forEach((field) => {
      rules[field.key] = readNumber(`${homeKey}.${field.key}`, field);
    });
    if (rules.maxAdults < rules.minAdults) {
      flag(`${homeKey}.maxAdults`, `${homes[homeKey]}: maksimum böyük sayı minimumdan az ola bilməz.`);
    }
    next.homes[homeKey] = rules;
  });
  const isTime = (value) => /^([01]\d|2[0-3]):[0-5]\d$/.test(value);
  next.checkinTime = String(data.get("checkinTime") ?? "");
  next.checkoutTime = String(data.get("checkoutTime") ?? "");
  if (!isTime(next.checkinTime)) {
    flag("checkinTime", "Giriş saatını seçin.");
  }
  if (!isTime(next.checkoutTime)) {
    flag("checkoutTime", "Çıxış saatını seçin.");
  } else if (isTime(next.checkinTime) && next.checkoutTime >= next.checkinTime) {
    flag("checkoutTime", "Çıxış saatı giriş saatından tez olmalıdır ki, çıxış günü evə yeni qonaq girə bilsin.");
  }
  next.heating = {
    fee: readNumber("heating.fee"),
    start: readMonthDay("heating.start"),
    end: readMonthDay("heating.end"),
    mode: data.get("heating.mode") === "stay" ? "stay" : "night",
    discounted: data.get("heating.discounted") === "on"
  };
  if (next.heating.start === next.heating.end) {
    flag("heating.end", "İstilik dövrünün başlanğıc və son tarixi eyni ola bilməz.");
  }
  return { settings: next, errors: [...new Set(errors)] };
};

renderSettingsForm(SETTINGS);
showAdminTimes(SETTINGS.checkinTime, SETTINGS.checkoutTime);

settingsForm?.addEventListener("input", (event) => {
  if (!["checkinTime", "checkoutTime"].includes(event.target.name)) {
    return;
  }
  const gap = settingsForm.querySelector("[data-time-gap]");
  if (gap) {
    gap.textContent = timeGapText(settingsForm.elements.checkinTime.value, settingsForm.elements.checkoutTime.value);
  }
});

// bazadakı promokodlar: kod → yazılan sətir (yalnız dəyişənləri yazmaq üçün) və onu istifadə edən rezerv
let promosSaved = new Map();
let promoReservationIds = new Map();

const promoRow = (promo) => {
  const { code, used, ...data } = normalizePromo(promo);
  return { code, data, used, reservation_id: used ? promoReservationIds.get(code) ?? null : null };
};

const savePromos = async () => {
  const rows = promosDraft.map(promoRow);
  const changed = rows.filter((row) => promosSaved.get(row.code) !== JSON.stringify(row));
  const removed = [...promosSaved.keys()].filter((code) => !rows.some((row) => row.code === code));
  if (changed.length) {
    const { error } = await supabaseClient.from("promo_codes").upsert(changed);
    if (error) {
      throw error;
    }
  }
  if (removed.length) {
    const { error } = await supabaseClient.from("promo_codes").delete().in("code", removed);
    if (error) {
      throw error;
    }
  }
  promosSaved = new Map(rows.map((row) => [row.code, JSON.stringify(row)]));
};

const saveSiteSettings = async (settings) => {
  const { promoCodes, ...data } = settings;
  const { error } = await supabaseClient.from("site_settings").update({ data, updated_at: new Date().toISOString() }).eq("id", 1);
  if (error) {
    throw error;
  }
  localStorage.setItem(SETTINGS_CACHE_KEY, JSON.stringify(data));
  applySettings(data);
};

settingsSave?.addEventListener("click", async () => {
  const { settings, errors } = readSettingsForm();
  syncSpecialsFromForm();
  specialsList?.querySelectorAll(".is-invalid").forEach((field) => field.classList.remove("is-invalid"));
  errors.push(...validateSpecials());
  syncPromosFromForm();
  promosList?.querySelectorAll(".is-invalid").forEach((field) => field.classList.remove("is-invalid"));
  errors.push(...validatePromos());
  if (errors.length) {
    setSettingsStatus(errors.join(" "), true);
    return;
  }
  settings.specials = specialsDraft.map(normalizeSpecial);
  settingsSave.disabled = true;
  setSettingsStatus("Yadda saxlanılır...");
  try {
    await saveSiteSettings(settings);
    await savePromos();
    showAdminTimes(settings.checkinTime, settings.checkoutTime);
    setSettingsStatus("Yadda saxlanıldı. Sayt bütün ziyarətçilər üçün yeni qiymət və qaydalarla işləyir.");
  } catch {
    setSettingsStatus("Yadda saxlanmadı. İnterneti yoxlayın; problem qalsa səhifəni yeniləyib yenidən daxil olun.", true);
  } finally {
    settingsSave.disabled = false;
  }
});

// yalnız formadakı qiymət və qaydalar standarta qaytarılır; xüsusi günlər və promokodlar toxunulmur
settingsReset?.addEventListener("click", () => {
  if (!window.confirm("Formadakı qiymət və qaydalar standart dəyərlərlə əvəz olunsun? Bazaya yazmaq üçün sonra \"Yadda saxla\" basmalısınız.")) {
    return;
  }
  renderSettingsForm(DEFAULT_SETTINGS);
  setSettingsStatus("Standart dəyərlər formaya yazıldı. Yoxlayıb \"Yadda saxla\" düyməsinə basın.");
});

/* ---------- bayram və xüsusi günlər ---------- */
const specialsList = document.querySelector("[data-specials-list]");
const specialAdd = document.querySelector("[data-special-add]");


let specialsDraft = SETTINGS.specials.map((rule) => ({ ...rule, homes: [...rule.homes] }));

const specialCard = (rule, index) => `
  <fieldset class="admin-settings-card admin-special-card" data-special-index="${index}">
    <legend>${rule.name || "Yeni qayda"}</legend>
    <label class="admin-field" data-field="special.${index}.name">
      <span>Ad</span>
      <input type="text" name="name" value="${rule.name.replace(/"/g, "&quot;")}" maxlength="60" placeholder="Məs. Novruz bayramı" />
    </label>
    <div class="admin-special-row is-dates">
      <label class="admin-field" data-field="special.${index}.start">
        <span>Başlanğıc</span>
        <input type="date" name="start" value="${rule.start}" />
      </label>
      <label class="admin-field" data-field="special.${index}.end">
        <span>Son</span>
        <input type="date" name="end" value="${rule.end}" />
      </label>
    </div>
    <small class="admin-hint">Bu tarixlərdə başlayan gecələrə tətbiq olunur, hər iki gün daxil.</small>
    <label class="admin-field admin-check">
      <input type="checkbox" name="yearly" ${rule.yearly ? "checked" : ""} />
      <span>Hər il təkrarlansın</span>
    </label>
    <div class="admin-field" data-field="special.${index}.homes">
      <span>Evlər</span>
      <div class="admin-special-homes">
        ${Object.keys(homes)
          .map((homeKey) => `<label class="admin-check"><input type="checkbox" name="homes" value="${homeKey}" ${rule.homes.includes(homeKey) ? "checked" : ""} /><span>${homes[homeKey]}</span></label>`)
          .join("")}
      </div>
    </div>
    <div class="admin-special-row">
      <label class="admin-field">
        <span>Növ</span>
        <select name="type">
          <option value="price" ${rule.type === "price" ? "selected" : ""}>Sabit qiymət (AZN / gecə)</option>
          <option value="discount" ${rule.type === "discount" ? "selected" : ""}>Endirim (%)</option>
          <option value="increase" ${rule.type === "increase" ? "selected" : ""}>Qiymət artımı (%)</option>
        </select>
      </label>
      <label class="admin-field" data-field="special.${index}.value">
        <span>Dəyər</span>
        <input type="number" inputmode="numeric" name="value" value="${rule.value}" min="0" step="1" />
      </label>
    </div>
    <small class="admin-hint">Sabit qiymət evin əsas qiymətini əvəz edir; əlavə nəfər ödənişi qalır.</small>
    <label class="admin-field admin-check">
      <input type="checkbox" name="stack" ${rule.stack ? "checked" : ""} />
      <span>Uzun qalış endirimi bu günlərə də tətbiq olunsun</span>
    </label>
    <small class="admin-hint">Uzun qalış endirimi evin öz endirimidir (yuxarıda hər evdə "Endirim (%)" və "Endirim neçə gecədən başlayır"). İşarəsiz olsa, bu günlərin gecələrinə yalnız bu qayda tətbiq olunur və iki endirim toplanmır.</small>
    <label class="admin-field admin-check">
      <input type="checkbox" name="active" ${rule.active ? "checked" : ""} />
      <span>Aktivdir (saytda görünür və hesablanır)</span>
    </label>
    <div class="admin-special-actions">
      <button class="admin-clear-button" type="button" data-special-move="-1" ${index === 0 ? "disabled" : ""} aria-label="Yuxarı">↑</button>
      <button class="admin-clear-button" type="button" data-special-move="1" ${index === specialsDraft.length - 1 ? "disabled" : ""} aria-label="Aşağı">↓</button>
      <button class="admin-clear-button admin-danger" type="button" data-special-remove>Sil</button>
    </div>
  </fieldset>
`;

const renderSpecialsList = () => {
  if (!specialsList) {
    return;
  }
  specialsList.innerHTML = specialsDraft.length
    ? specialsDraft.map(specialCard).join("")
    : `<p class="admin-hint">Hələ xüsusi gün yoxdur. "+ Əlavə et" düyməsinə basıb adı, tarixləri və qiyməti özünüz yazın.</p>`;
};

// kartlardakı dəyərləri draft-a köçürür ki, əlavə/silmə zamanı yazılanlar itməsin
const syncSpecialsFromForm = () => {
  specialsList?.querySelectorAll("[data-special-index]").forEach((card) => {
    const rule = specialsDraft[Number(card.dataset.specialIndex)];
    const field = (name) => card.querySelector(`[name="${name}"]`);
    rule.name = field("name").value.trim();
    rule.start = field("start").value;
    rule.end = field("end").value;
    rule.yearly = field("yearly").checked;
    rule.homes = [...card.querySelectorAll('[name="homes"]:checked')].map((input) => input.value);
    rule.type = field("type").value;
    rule.value = Number(field("value").value);
    rule.stack = field("stack").checked;
    rule.active = field("active").checked;
  });
};

const validateSpecials = () => {
  const errors = [];
  const flag = (index, name, message) => {
    specialsList.querySelector(`[data-field="special.${index}.${name}"]`)?.classList.add("is-invalid");
    errors.push(message);
  };
  specialsDraft.forEach((rule, index) => {
    const title = rule.name || `${index + 1}-ci qayda`;
    if (!rule.name) flag(index, "name", `${index + 1}-ci qaydanın adını yazın.`);
    if (!rule.start) flag(index, "start", `${title}: başlanğıc tarixini seçin.`);
    if (!rule.end) flag(index, "end", `${title}: son tarixi seçin.`);
    if (rule.start && rule.end && !rule.yearly && rule.end < rule.start) flag(index, "end", `${title}: son tarix başlanğıcdan əvvəl ola bilməz.`);
    if (!rule.homes.length) flag(index, "homes", `${title}: ən azı bir ev seçin.`);
    if (!Number.isInteger(rule.value) || rule.value <= 0 || (rule.type === "discount" && rule.value > 100)) {
      flag(index, "value", `${title}: dəyəri yoxlayın (endirim 1–100% arası).`);
    }
  });
  return errors;
};

specialAdd?.addEventListener("click", () => {
  syncSpecialsFromForm();
  // bayram və xüsusi günləri admin özü yaradır: ad və tarixləri özü yazır
  specialsDraft.push({
    name: "",
    start: "",
    end: "",
    yearly: false,
    homes: Object.keys(homes),
    type: "discount",
    value: 10,
    stack: false,
    active: true
  });
  renderSpecialsList();
  setSettingsStatus("Yeni qayda əlavə olundu. Dəyərləri yoxlayıb \"Yadda saxla\" düyməsinə basın.");
});

specialsList?.addEventListener("click", (event) => {
  const card = event.target.closest("[data-special-index]");
  if (!card) {
    return;
  }
  const index = Number(card.dataset.specialIndex);
  if (event.target.closest("[data-special-remove]")) {
    syncSpecialsFromForm();
    specialsDraft.splice(index, 1);
    renderSpecialsList();
    setSettingsStatus("Qayda silindi. Təsdiq üçün \"Yadda saxla\" düyməsinə basın.");
  }
  const move = event.target.closest("[data-special-move]");
  if (move) {
    syncSpecialsFromForm();
    const target = index + Number(move.dataset.specialMove);
    [specialsDraft[index], specialsDraft[target]] = [specialsDraft[target], specialsDraft[index]];
    renderSpecialsList();
  }
});

renderSpecialsList();

/* ---------- promokodlar ---------- */
const promosList = document.querySelector("[data-promos-list]");
const promoAdd = document.querySelector("[data-promo-add]");

let promosDraft = SETTINGS.promoCodes.map((promo) => ({ ...promo, homes: [...promo.homes] }));

const escapeAttr = (value) => String(value).replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");

const promoCard = (promo, index) => `
  <fieldset class="admin-settings-card admin-special-card" data-promo-index="${index}">
    <legend>${promo.code ? escapeAttr(promo.code) : "Yeni promokod"}</legend>
    <label class="promo-switch ${promo.active ? "is-on" : ""}">
      <input type="checkbox" name="active" data-promo-toggle ${promo.active ? "checked" : ""} />
      <span class="promo-switch-track" aria-hidden="true"></span>
      <span class="promo-switch-label">${promo.active ? "Aktiv — saytda işləyir" : "Deaktiv — saytda qəbul olunmur"}</span>
    </label>
    <div class="admin-special-row">
      <label class="admin-field" data-field="promo.${index}.code">
        <span>Kod</span>
        <input type="text" name="code" value="${escapeAttr(promo.code)}" maxlength="20" autocapitalize="characters" placeholder="Məs. NOVRUZ10" />
      </label>
      <div class="admin-field">
        <span>&nbsp;</span>
        <button class="admin-clear-button admin-generate" type="button" data-promo-generate>Kod yarat</button>
      </div>
    </div>
    <small class="admin-hint">Yalnız hərf, rəqəm, "-" və "_"; 3–20 simvol.</small>
    <label class="admin-field">
      <span>Nə üçün yaradılıb (qeyd)</span>
      <input type="text" name="note" value="${escapeAttr(promo.note)}" maxlength="200" placeholder="Məs. Instagram kampaniyası, daimi qonaq" />
    </label>
    <div class="admin-special-row">
      <label class="admin-field">
        <span>Endirim növü</span>
        <select name="type">
          <option value="percent" ${promo.type === "percent" ? "selected" : ""}>Faiz (%)</option>
          <option value="amount" ${promo.type === "amount" ? "selected" : ""}>Məbləğ (AZN)</option>
        </select>
      </label>
      <label class="admin-field" data-field="promo.${index}.value">
        <span>Dəyər</span>
        <input type="number" inputmode="numeric" name="value" value="${promo.value}" min="1" step="1" />
      </label>
    </div>
    <div class="admin-field" data-field="promo.${index}.homes">
      <span>Evlər</span>
      <div class="admin-special-homes">
        ${Object.keys(homes)
          .map((homeKey) => `<label class="admin-check"><input type="checkbox" name="homes" value="${homeKey}" ${promo.homes.includes(homeKey) ? "checked" : ""} /><span>${homes[homeKey]}</span></label>`)
          .join("")}
      </div>
    </div>
    <div class="admin-special-row is-dates">
      <label class="admin-field">
        <span>Keçərlidir: başlanğıc</span>
        <input type="date" name="from" value="${promo.from}" />
      </label>
      <label class="admin-field" data-field="promo.${index}.to">
        <span>Son</span>
        <input type="date" name="to" value="${promo.to}" />
      </label>
    </div>
    <small class="admin-hint">Kodun istifadə oluna biləcəyi tarixlər. Boş qalsa müddətsizdir.</small>
    <label class="admin-field" data-field="promo.${index}.minNights">
      <span>Minimum gecə sayı</span>
      <input type="number" inputmode="numeric" name="minNights" value="${promo.minNights}" min="1" step="1" />
    </label>
    <label class="admin-field admin-check">
      <input type="checkbox" name="stack" ${promo.stack ? "checked" : ""} />
      <span>Uzun qalış endirimi ilə birlikdə tətbiq olunsun</span>
    </label>
    <small class="admin-hint">İşarəsiz olsa qonağa iki endirimdən sərfəli olanı tətbiq olunur.</small>
    <details class="promo-use" data-promo-use-form>
      <summary class="admin-clear-button">İstifadə olundu</summary>
      <div class="promo-use-grid">
        <label class="admin-field"><span>Qonağın adı, soyadı</span><input type="text" name="useGuest" maxlength="80" /></label>
        <label class="admin-field"><span>Əlaqə nömrəsi</span><input type="tel" name="usePhone" maxlength="30" /></label>
        <label class="admin-field"><span>Ev</span><select name="useHome">${Object.keys(homes).map((homeKey) => `<option value="${homeKey}">${homes[homeKey]}</option>`).join("")}</select></label>
        <label class="admin-field"><span>Endirim məbləği (AZN)</span><input type="number" name="useAmount" min="0" step="1" /></label>
        <label class="admin-field"><span>Giriş</span><input type="date" name="useCheckin" /></label>
        <label class="admin-field"><span>Çıxış</span><input type="date" name="useCheckout" /></label>
      </div>
      <button class="reservation-submit" type="button" data-promo-archive-save>Arxivə göndər</button>
    </details>
    <div class="admin-special-actions">
      <button class="admin-clear-button admin-danger" type="button" data-promo-remove>Sil</button>
    </div>
  </fieldset>
`;

const promoArchive = document.querySelector("[data-promo-archive]");
const formatAdminDate = (iso) => (iso ? iso.split("-").reverse().join(".") : "—");

const renderPromoArchive = () => {
  if (!promoArchive) {
    return;
  }
  const used = promosDraft.map((promo, index) => ({ promo, index })).filter(({ promo }) => promo.used);
  promoArchive.innerHTML = used.length
    ? `<div class="admin-table-wrap"><table class="admin-table">
        <thead><tr><th>Kod</th><th>Endirim</th><th>Qonaq</th><th>Ev</th><th>Tarixlər</th><th>Arxivə düşüb</th><th>Qeyd</th><th></th></tr></thead>
        <tbody>${used
          .map(
            ({ promo, index }) => `<tr>
              <td><strong>${escapeAttr(promo.code)}</strong></td>
              <td>${promo.type === "percent" ? `${promo.value}%` : `${promo.value} AZN`}${promo.used.amount ? `<br><small>−${promo.used.amount} AZN</small>` : ""}</td>
              <td>${escapeAttr(promo.used.guest || "—")}${promo.used.phone ? `<br><small>${escapeAttr(promo.used.phone)}</small>` : ""}</td>
              <td>${homes[promo.used.home] ?? "—"}</td>
              <td>${formatAdminDate(promo.used.checkin)} – ${formatAdminDate(promo.used.checkout)}</td>
              <td>${formatAdminDate(promo.used.at)}</td>
              <td>${escapeAttr(promo.note || "")}</td>
              <td><button class="admin-clear-button" type="button" data-promo-restore="${index}">Bərpa et</button></td>
            </tr>`
          )
          .join("")}</tbody></table></div>`
    : `<p class="admin-hint">Hələ istifadə olunmuş promokod yoxdur.</p>`;
};

const renderPromosList = () => {
  if (!promosList) {
    return;
  }
  const active = promosDraft.map((promo, index) => ({ promo, index })).filter(({ promo }) => !promo.used);
  promosList.innerHTML = active.length
    ? active.map(({ promo, index }) => promoCard(promo, index)).join("")
    : `<p class="admin-hint">Aktiv promokod yoxdur. "+ Promokod yarat" düyməsinə basın.</p>`;
  renderPromoArchive();
};

// arxiv dəyişiklikləri dərhal yadda saxlanır (formdakı digər yazılmamış dəyişikliklər də yoxlanılıb saxlanır)
const saveSettingsNow = () => settingsSave?.click();

const syncPromosFromForm = () => {
  promosList?.querySelectorAll("[data-promo-index]").forEach((card) => {
    const promo = promosDraft[Number(card.dataset.promoIndex)];
    const field = (name) => card.querySelector(`[name="${name}"]`);
    promo.code = field("code").value.trim().toUpperCase();
    promo.note = field("note").value.trim();
    promo.type = field("type").value;
    promo.value = Number(field("value").value);
    promo.homes = [...card.querySelectorAll('[name="homes"]:checked')].map((input) => input.value);
    promo.from = field("from").value;
    promo.to = field("to").value;
    promo.minNights = Number(field("minNights").value);
    promo.stack = field("stack").checked;
    promo.active = field("active").checked;
  });
};

const validatePromos = () => {
  const errors = [];
  const flag = (index, name, message) => {
    promosList.querySelector(`[data-field="promo.${index}.${name}"]`)?.classList.add("is-invalid");
    errors.push(message);
  };
  const seen = new Set();
  promosDraft.forEach((promo, index) => {
    const title = promo.code || `${index + 1}-ci promokod`;
    if (!/^[A-Z0-9_-]{3,20}$/.test(promo.code)) flag(index, "code", `${title}: kod 3–20 simvol olmalıdır (hərf, rəqəm, - və _).`);
    else if (seen.has(promo.code)) flag(index, "code", `${title}: bu kod artıq var.`);
    seen.add(promo.code);
    if (!Number.isInteger(promo.value) || promo.value <= 0 || (promo.type === "percent" && promo.value > 100)) {
      flag(index, "value", `${title}: endirim dəyərini yoxlayın (faiz 1–100 arası).`);
    }
    if (!promo.homes.length) flag(index, "homes", `${title}: ən azı bir ev seçin.`);
    if (promo.from && promo.to && promo.to < promo.from) flag(index, "to", `${title}: son tarix başlanğıcdan əvvəl ola bilməz.`);
    if (!Number.isInteger(promo.minNights) || promo.minNights < 1) flag(index, "minNights", `${title}: minimum gecə sayı ən azı 1 olmalıdır.`);
  });
  return errors;
};

// oxunaqlı təsadüfi kod: oxşar simvollar (0/O, 1/I) çıxarılıb
const generatePromoCode = () => {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const random = crypto.getRandomValues(new Uint32Array(6));
  return `AVK-${[...random].map((value) => alphabet[value % alphabet.length]).join("")}`;
};

promoAdd?.addEventListener("click", () => {
  syncPromosFromForm();
  promosDraft.push({
    code: generatePromoCode(),
    note: "",
    type: "percent",
    value: 10,
    homes: Object.keys(homes),
    from: "",
    to: "",
    minNights: 1,
    stack: false,
    active: true,
    used: null
  });
  renderPromosList();
  setSettingsStatus("Yeni promokod əlavə olundu. Dəyərləri yoxlayıb \"Yadda saxla\" düyməsinə basın.");
});

// aktiv/deaktiv açarı dərhal yadda saxlanır
promosList?.addEventListener("change", (event) => {
  if (!event.target.closest("[data-promo-toggle]")) {
    return;
  }
  syncPromosFromForm();
  renderPromosList();
  saveSettingsNow();
});

promosList?.addEventListener("click", (event) => {
  const card = event.target.closest("[data-promo-index]");
  if (!card) {
    return;
  }
  if (event.target.closest("[data-promo-generate]")) {
    card.querySelector('[name="code"]').value = generatePromoCode();
  }
  if (event.target.closest("[data-promo-archive-save]")) {
    syncPromosFromForm();
    const field = (name) => card.querySelector(`[name="${name}"]`);
    const promo = promosDraft[Number(card.dataset.promoIndex)];
    if (!field("useGuest").value.trim()) {
      field("useGuest").closest(".admin-field").classList.add("is-invalid");
      setSettingsStatus("Arxiv üçün qonağın adını yazın.", true);
      return;
    }
    const today = new Date();
    promo.used = {
      guest: field("useGuest").value.trim(),
      phone: field("usePhone").value.trim(),
      home: field("useHome").value,
      checkin: field("useCheckin").value,
      checkout: field("useCheckout").value,
      amount: Number(field("useAmount").value) || 0,
      at: `${today.getFullYear()}-${pad(today.getMonth() + 1)}-${pad(today.getDate())}`
    };
    renderPromosList();
    saveSettingsNow();
    return;
  }
  if (event.target.closest("[data-promo-remove]")) {
    syncPromosFromForm();
    promosDraft.splice(Number(card.dataset.promoIndex), 1);
    renderPromosList();
    setSettingsStatus("Promokod silindi. Təsdiq üçün \"Yadda saxla\" düyməsinə basın.");
  }
});

promoArchive?.addEventListener("click", (event) => {
  const button = event.target.closest("[data-promo-restore]");
  if (!button || !window.confirm("Bu promokod yenidən aktiv olsun?")) {
    return;
  }
  syncPromosFromForm();
  promosDraft[Number(button.dataset.promoRestore)].used = null;
  renderPromosList();
  saveSettingsNow();
});

renderPromosList();

/* ---------- saytdan gələn rezerv sorğuları ---------- */
const reservationsList = document.querySelector("[data-reservations-list]");
const reservationsStatus = document.querySelector("[data-reservations-status]");
const reservationsTabs = document.querySelectorAll("[data-reservations-tab]");
const RESERVATION_STATUS = { pending: "Gözləyir", confirmed: "Təsdiqlənib", cancelled: "Ləğv olunub", rejected: "Rədd edilib", expired: "Vaxtı bitib" };
const TAB_STATUSES = { pending: ["pending"], confirmed: ["confirmed"], closed: ["cancelled", "rejected", "expired"] };

let reservations = [];
let reservationsTab = "pending";

const addDay = (iso) => {
  const [year, month, day] = iso.split("-").map(Number);
  return toIsoDate(new Date(year, month - 1, day + 1));
};

const nightsBetween = (checkin, checkout) => {
  let count = 0;
  for (let night = checkin; night < checkout; night = addDay(night)) {
    count += 1;
  }
  return count;
};

const setReservationsStatus = (message) => {
  if (reservationsStatus) {
    reservationsStatus.textContent = message;
  }
};

// qonağın nömrəsi WhatsApp linki üçün: 055... → 99455...
const whatsappNumber = (phone) => {
  const digits = phone.replace(/\D/g, "");
  if (digits.startsWith("994")) return digits;
  if (digits.startsWith("0")) return `994${digits.slice(1)}`;
  return digits.length === 9 ? `994${digits}` : digits;
};

const formatDateTime = (value) => {
  const date = new Date(value);
  return `${pad(date.getDate())}.${pad(date.getMonth() + 1)}.${date.getFullYear()}, ${pad(date.getHours())}:${pad(date.getMinutes())}`;
};

const holdLeftText = (holdUntil) => {
  const minutes = Math.round((new Date(holdUntil) - Date.now()) / 60000);
  if (minutes <= 0) return "vaxt bitib";
  const hours = Math.floor(minutes / 60);
  return `${hours ? `${hours} saat ` : ""}${minutes % 60} dəq qalıb`;
};

const reservationGuests = (item) =>
  [`${item.adults} böyük`, item.children ? `${item.children} uşaq` : "", item.pets ? `${item.pets} ev heyvanı` : ""].filter(Boolean).join(", ");

const RESERVATION_ACTIONS = {
  pending: [
    { action: "confirm", label: "Təsdiqlə — ödəniş alındı", className: "reservation-submit" },
    { action: "extend", label: () => `Vaxtı uzat (+${SETTINGS.holdHours} saat)`, className: "admin-clear-button" },
    { action: "reject", label: "Rədd et", className: "admin-clear-button admin-danger" }
  ],
  confirmed: [{ action: "cancel", label: "Ləğv et", className: "admin-clear-button admin-danger" }],
  expired: [{ action: "reopen", label: "Yenidən aç", className: "admin-clear-button" }]
};

const reservationCard = (item) => {
  const badge = item.status === "pending" ? "is-pending" : item.status === "confirmed" ? "" : "is-closed";
  const name = `${item.first_name} ${item.last_name}`.trim();
  const actions = (RESERVATION_ACTIONS[item.status] ?? [])
    .map(({ action, label, className }) => `<button class="${className}" type="button" data-reservation-action="${action}">${typeof label === "function" ? label() : label}</button>`)
    .join("");
  return `
    <article class="admin-reservation ${item.status === "pending" ? "is-pending" : ""}" data-reservation-id="${item.id}">
      <header>
        <h3>#${item.number} · ${homes[item.home] ?? escapeAttr(item.home)}</h3>
        <span class="admin-badge ${badge}">${RESERVATION_STATUS[item.status] ?? item.status}</span>
      </header>
      ${item.status === "pending" ? `<p class="admin-hold">⏳ Tarixlər saxlanılır: ${formatDateTime(item.hold_until)} (${holdLeftText(item.hold_until)})</p>` : ""}
      <dl>
        <dt>Tarixlər</dt><dd>${formatAdminDate(item.checkin)} – ${formatAdminDate(item.checkout)} (${nightsBetween(item.checkin, item.checkout)} gecə)</dd>
        <dt>Qonaqlar</dt><dd>${reservationGuests(item)}</dd>
        <dt>Ad</dt><dd>${escapeAttr(name)}</dd>
        <dt>Telefon</dt><dd><a href="tel:${escapeAttr(item.phone)}">${escapeAttr(item.phone)}</a> · <a href="https://wa.me/${whatsappNumber(item.phone)}" target="_blank" rel="noopener">WhatsApp</a></dd>
        ${item.email ? `<dt>E-poçt</dt><dd>${escapeAttr(item.email)}</dd>` : ""}
        <dt>Cəmi</dt><dd>${item.total} AZN</dd>
        ${item.promo_code ? `<dt>Promokod</dt><dd>${escapeAttr(item.promo_code)}</dd>` : ""}
        ${item.admin_note ? `<dt>Qeyd</dt><dd>${escapeAttr(item.admin_note)}</dd>` : ""}
        <dt>Göndərilib</dt><dd>${formatDateTime(item.created_at)}</dd>
      </dl>
      ${actions ? `<div class="admin-reservation-actions">${actions}</div>` : ""}
    </article>
  `;
};

const renderReservations = () => {
  if (!reservationsList) {
    return;
  }
  reservationsTabs.forEach((tab) => {
    tab.setAttribute("aria-selected", String(tab.dataset.reservationsTab === reservationsTab));
  });
  ["pending", "confirmed"].forEach((status) => {
    const count = reservations.filter((item) => item.status === status).length;
    document.querySelectorAll(`[data-reservations-count="${status}"]`).forEach((element) => {
      element.textContent = count ? `(${count})` : "";
    });
  });
  const shown = reservations.filter((item) => TAB_STATUSES[reservationsTab].includes(item.status));
  const empty = { pending: "Hazırda gözləyən sorğu yoxdur.", confirmed: "Qarşıdakı təsdiqlənmiş rezerv yoxdur.", closed: "Son 30 gündə ləğv olunmuş və ya vaxtı bitmiş sorğu yoxdur." };
  reservationsList.innerHTML = shown.length ? shown.map(reservationCard).join("") : `<p class="admin-hint">${empty[reservationsTab]}</p>`;
};

// vaxtı bitən gözləmələri bağlayır, son 30 gün və gələcək rezervləri yükləyir
const loadReservations = async () => {
  await supabaseClient.rpc("expire_holds");
  const since = new Date();
  since.setDate(since.getDate() - 30);
  const { data, error } = await supabaseClient.from("reservations").select("*").gte("checkout", toIsoDate(since)).order("checkin");
  if (error) {
    throw error;
  }
  reservations = data;
  siteNights = emptyData();
  reservations
    .filter((item) => item.status === "confirmed" || (item.status === "pending" && new Date(item.hold_until) > new Date()))
    .forEach((item) => {
      for (let night = item.checkin; night < item.checkout; night = addDay(night)) {
        siteNights[item.home]?.push(night);
      }
    });
  renderReservations();
  refreshCalendar();
};

const reloadReservations = async () => {
  try {
    await loadReservations();
    setReservationsStatus("");
  } catch {
    setReservationsStatus("Rezervlər yüklənmədi. İnterneti yoxlayıb \"Yenilə\" düyməsinə basın.");
  }
};

reservationsTabs.forEach((tab) => {
  tab.addEventListener("click", () => {
    reservationsTab = tab.dataset.reservationsTab;
    renderReservations();
  });
});

document.querySelector("[data-reservations-refresh]")?.addEventListener("click", reloadReservations);

reservationsList?.addEventListener("click", async (event) => {
  const button = event.target.closest("[data-reservation-action]");
  if (!button) {
    return;
  }
  const item = reservations.find((reservation) => reservation.id === button.closest("[data-reservation-id]").dataset.reservationId);
  const action = button.dataset.reservationAction;
  const holdMs = SETTINGS.holdHours * 3600000;
  const questions = {
    confirm: `#${item.number} rezervi təsdiqlənsin? Bunu ödəniş alındıqdan sonra edin.`,
    reject: `#${item.number} sorğusu rədd edilsin? Tarixlər dərhal açılacaq.`,
    cancel: `#${item.number} rezervi ləğv edilsin? Tarixlər dərhal açılacaq.`
  };
  if (questions[action] && !window.confirm(questions[action])) {
    return;
  }
  const changes = {
    confirm: { status: "confirmed" },
    extend: { hold_until: new Date(Math.max(Date.now(), new Date(item.hold_until).getTime()) + holdMs).toISOString() },
    reject: { status: "rejected" },
    cancel: { status: "cancelled" },
    reopen: { status: "pending", hold_until: new Date(Date.now() + holdMs).toISOString() }
  }[action];
  button.disabled = true;
  const { error } = await supabaseClient.from("reservations").update(changes).eq("id", item.id);
  await reloadReservations();
  if (error) {
    setReservationsStatus(error.code === "23P01" ? `#${item.number}: bu tarixlər artıq başqa rezervlə tutulub.` : "Dəyişiklik yadda saxlanmadı. İnterneti yoxlayıb yenidən cəhd edin.");
  }
});

/* ---------- giriş və bazadan yükləmə ---------- */
const loginText = document.querySelector("[data-admin-login-text]");
const loginForm = document.querySelector("[data-admin-login-form]");
const loginStatus = document.querySelector("[data-admin-login-status]");
const loginPanel = document.querySelector("[data-admin-login]");
const adminApp = document.querySelector("[data-admin-app]");
const logoutButton = document.querySelector("[data-admin-logout]");

const readLegacy = (key) => {
  try {
    return JSON.parse(localStorage.getItem(key) || "null");
  } catch {
    return null;
  }
};

// Supabase-dən əvvəl bu brauzerdə saxlanan ayarlar, promokodlar və tarixlər baza boşdursa bir dəfə köçürülür
const migrateLegacyData = async (serverSettings, promoRows) => {
  const moved = [];
  const legacySettings = readLegacy(LEGACY_SETTINGS_KEY);
  if (legacySettings && !Object.keys(serverSettings).length) {
    await saveSiteSettings(fixTimes(mergeSettings(DEFAULT_SETTINGS, legacySettings)));
    moved.push("qiymət ayarları");
  }
  if (Array.isArray(legacySettings?.promoCodes) && legacySettings.promoCodes.length && !promoRows.length) {
    promosDraft = legacySettings.promoCodes.map(normalizePromo).filter(Boolean);
    promosSaved = new Map();
    await savePromos();
    moved.push("promokodlar");
  }
  const legacyBooked = readLegacy(LEGACY_BOOKED_KEY);
  if (legacyBooked && homeKeys.every((key) => !savedData[key].length)) {
    const legacy = normalizeData(legacyBooked);
    for (const key of homeKeys) {
      const future = legacy[key].filter((night) => night >= todayIso);
      if (future.length) {
        await persistBookedDates(key, future);
        moved.push(`${homes[key]} tarixləri`);
      }
    }
  }
  localStorage.removeItem(LEGACY_SETTINGS_KEY);
  localStorage.removeItem(LEGACY_BOOKED_KEY);
  return moved;
};

const loadAdminData = async () => {
  const [settingsResult, promosResult] = await Promise.all([
    supabaseClient.from("site_settings").select("data").eq("id", 1).single(),
    supabaseClient.from("promo_codes").select("*").order("created_at")
  ]);
  if (settingsResult.error || promosResult.error) {
    throw settingsResult.error || promosResult.error;
  }
  await loadBlockedNights();
  const moved = await migrateLegacyData(settingsResult.data.data, promosResult.data);
  if (moved.length) {
    await loadAdminData();
    setSettingsStatus(`Bu brauzerdəki köhnə məlumatlar bazaya köçürüldü: ${moved.join(", ")}.`);
    return;
  }

  const serverSettings = settingsResult.data.data;
  localStorage.setItem(SETTINGS_CACHE_KEY, JSON.stringify(serverSettings));
  applySettings(serverSettings);
  renderSettingsForm(SETTINGS);
  showAdminTimes(SETTINGS.checkinTime, SETTINGS.checkoutTime);
  document.querySelectorAll("[data-admin-hold]").forEach((element) => {
    element.textContent = SETTINGS.holdHours;
  });
  specialsDraft = SETTINGS.specials.map((rule) => ({ ...rule, homes: [...rule.homes] }));
  renderSpecialsList();

  promoReservationIds = new Map(promosResult.data.map((row) => [row.code, row.reservation_id]));
  promosDraft = promosResult.data.map((row) => normalizePromo({ ...row.data, code: row.code, used: row.used })).filter(Boolean);
  promosSaved = new Map(promosDraft.map((promo) => [promo.code, JSON.stringify(promoRow(promo))]));
  renderPromosList();

  await loadReservations();
};

const showLoginForm = (message = "") => {
  loginPanel.hidden = false;
  adminApp.hidden = true;
  logoutButton.hidden = true;
  loginForm.hidden = false;
  loginText.textContent = "Admin e-poçtu və parolu ilə daxil olun.";
  loginStatus.textContent = message;
};

const startAdmin = async () => {
  loginForm.hidden = true;
  loginStatus.textContent = "";
  loginText.textContent = "Məlumatlar yüklənir...";
  const { data: isAdmin, error } = await supabaseClient.rpc("is_admin");
  if (error || !isAdmin) {
    await supabaseClient.auth.signOut();
    showLoginForm(error ? "Bazaya qoşulmaq olmadı. İnterneti yoxlayın." : "Bu hesabın admin icazəsi yoxdur.");
    return;
  }
  try {
    await loadAdminData();
  } catch {
    loginText.textContent = "Məlumatlar yüklənmədi. İnterneti yoxlayıb səhifəni yeniləyin.";
    return;
  }
  loginPanel.hidden = true;
  adminApp.hidden = false;
  logoutButton.hidden = false;
  // adminin öz ziyarətləri saytın statistikasına düşməsin
  localStorage.setItem("avakhylNoTrack", "1");
};

loginForm?.addEventListener("submit", async (event) => {
  event.preventDefault();
  const data = new FormData(loginForm);
  loginStatus.textContent = "";
  const { error } = await supabaseClient.auth.signInWithPassword({ email: String(data.get("email")).trim(), password: String(data.get("password")) });
  if (error) {
    loginStatus.textContent = "E-poçt və ya parol səhvdir.";
    return;
  }
  startAdmin();
});

logoutButton?.addEventListener("click", async () => {
  await supabaseClient.auth.signOut();
  window.location.reload();
});

// açıq qalan panel sorğuları hər dəqiqə və səhifəyə qayıdanda yeniləyir
window.setInterval(() => {
  if (!adminApp.hidden) {
    reloadReservations();
  }
}, 60000);
document.addEventListener("visibilitychange", () => {
  if (!document.hidden && !adminApp.hidden) {
    reloadReservations();
  }
});

supabaseClient.auth.getSession().then(({ data }) => {
  if (data.session) {
    startAdmin();
  } else {
    showLoginForm();
  }
});
