localStorage.removeItem("avakhylBookedDates");

const storageKey = "avakhylBookedDatesV2";
const storageVersionKey = "avakhylBookedDatesVersion";
const bookingChannel = "BroadcastChannel" in window ? new BroadcastChannel("avakhylBookingDates") : null;
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

const loadSavedData = () => {
  try {
    return normalizeData(JSON.parse(localStorage.getItem(storageKey) || "{}"));
  } catch {
    return emptyData();
  }
};

const cloneData = (value) => normalizeData(value);

let selectedHome = null;
let calendarStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
let savedData = loadSavedData();
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

const persistBookedDates = () => {
  savedData = normalizeData(savedData);
  const version = String(Date.now());
  const serialized = JSON.stringify(savedData);
  localStorage.setItem(storageKey, serialized);
  localStorage.setItem(storageVersionKey, version);
  bookingChannel?.postMessage({
    type: "booked-dates-updated",
    version,
    data: savedData
  });
};

const reloadBookedDates = () => {
  savedData = loadSavedData();
  draftData = cloneData(savedData);
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
  const blanks = Array.from({ length: leadBlanks }, () => `<span class="admin-calendar-day is-empty"></span>`).join("");
  const days = Array.from({ length: totalDays }, (_, index) => {
    const day = index + 1;
    const iso = `${year}-${pad(month + 1)}-${pad(day)}`;
    const isPast = iso < todayIso;
    const isSelected = selectedDates.has(iso);
    const isSaved = savedDates.has(iso);

    return `
      <button
        class="admin-calendar-day ${isSelected ? "is-booked" : ""} ${isSaved ? "is-saved" : ""} ${isPast ? "is-past" : ""}"
        type="button"
        data-admin-date="${iso}"
        ${isPast ? "disabled" : ""}
      >
        <span>${day}</span>
        <em>${isSelected ? "Rezerv" : "Boş"}</em>
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
  adminSave.addEventListener("click", () => {
    if (!selectedHome) {
      return;
    }
    savedData = cloneData(draftData);
    persistBookedDates();
    renderCounts();
    renderCalendar();
    renderSummary();
    setStatus("Rezerv tarixləri təsdiqləndi və sayta tətbiq olundu.");
  });
}

window.addEventListener("storage", (event) => {
  if (event.key === storageKey || event.key === storageVersionKey) {
    reloadBookedDates();
  }
});

bookingChannel?.addEventListener("message", (event) => {
  if (event.data?.type === "booked-dates-updated") {
    reloadBookedDates();
  }
});

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
    ${homeCards}
    <fieldset class="admin-settings-card">
      <legend>Bütün evlər</legend>
      ${numberField("deposit", { label: "Depozit (AZN)", hint: "Girişdə ödənilir, çıxışda qaytarılır", min: 0 }, settings.deposit)}
      ${numberField("holdHours", { label: "Gözləmə müddəti (saat)", hint: "Sorğudan sonra tarixlər bu müddət saxlanılır; beh alınmasa avtomatik açılır", min: 1, max: 72 }, settings.holdHours)}
      ${numberField("prepayPercent", { label: "Beh (%)", hint: "Təsdiqdən sonra ödənilir, ləğv olunarsa qaytarılmır. 0 olsa beh alınmır", min: 0, max: 100 }, settings.prepayPercent)}
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

  const next = { homes: {}, heating: {}, deposit: readNumber("deposit"), prepayPercent: readNumber("prepayPercent", { min: 0, max: 100 }), holdHours: readNumber("holdHours", { min: 1, max: 72 }) };
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

settingsSave?.addEventListener("click", () => {
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
  settings.promoCodes = promosDraft.map(normalizePromo);
  localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
  setSettingsStatus("Yadda saxlanıldı. Sayt yeni qiymət və qaydalarla işləyir.");
});

settingsReset?.addEventListener("click", () => {
  if (!window.confirm("Bütün qiymət və qaydalar standart dəyərlərə qaytarılsın?")) {
    return;
  }
  localStorage.removeItem(SETTINGS_STORAGE_KEY);
  renderSettingsForm(DEFAULT_SETTINGS);
  specialsDraft = [];
  renderSpecialsList();
  promosDraft = [];
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
  setSettingsStatus("Standart dəyərlər bərpa olundu.");
});

/* ---------- bayram və xüsusi günlər ---------- */
const specialsList = document.querySelector("[data-specials-list]");
const specialPreset = document.querySelector("[data-special-preset]");
const specialAdd = document.querySelector("[data-special-add]");

// Azərbaycanın rəsmi bayramları; dəyişkən tarixli bayramlarda tarixləri admin özü seçir
const HOLIDAY_PRESETS = [
  { name: "Boş qayda", start: "", end: "", yearly: false },
  { name: "Yeni il", start: "12-31", end: "01-02", yearly: true },
  { name: "Qadınlar günü", start: "03-08", end: "03-08", yearly: true },
  { name: "Novruz bayramı", start: "03-20", end: "03-24", yearly: true },
  { name: "Ramazan bayramı", start: "", end: "", yearly: false },
  { name: "Qələbə günü", start: "05-09", end: "05-09", yearly: true },
  { name: "Müstəqillik günü", start: "05-28", end: "05-28", yearly: true },
  { name: "Qurban bayramı", start: "", end: "", yearly: false },
  { name: "Milli Qurtuluş günü", start: "06-15", end: "06-15", yearly: true },
  { name: "Silahlı Qüvvələr günü", start: "06-26", end: "06-26", yearly: true },
  { name: "Zəfər günü", start: "11-08", end: "11-08", yearly: true },
  { name: "Dövlət Bayrağı günü", start: "11-09", end: "11-09", yearly: true }
];

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
    : `<p class="admin-hint">Hələ xüsusi gün yoxdur. Yuxarıdan hazır bayram seçib "Əlavə et" düyməsinə basın.</p>`;
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

const nextYearFor = (monthDay) => {
  const year = new Date().getFullYear();
  return `${year}-${monthDay}` >= todayIso ? year : year + 1;
};

if (specialPreset) {
  specialPreset.innerHTML = HOLIDAY_PRESETS.map((preset, index) => `<option value="${index}">${preset.name}</option>`).join("");
}

specialAdd?.addEventListener("click", () => {
  syncSpecialsFromForm();
  const preset = HOLIDAY_PRESETS[Number(specialPreset?.value) || 0];
  const startYear = preset.start ? nextYearFor(preset.start) : null;
  // ilin sonundan keçən bayramda (Yeni il) son tarix növbəti ilə düşür
  const endYear = preset.end ? (preset.end < preset.start ? startYear + 1 : startYear) : null;
  specialsDraft.push({
    name: preset.name === "Boş qayda" ? "" : preset.name,
    start: preset.start ? `${startYear}-${preset.start}` : "",
    end: preset.end ? `${endYear}-${preset.end}` : "",
    yearly: preset.yearly,
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
    saveSettingsNow();
    return;
  }
  if (event.target.closest("[data-promo-remove]")) {
    syncPromosFromForm();
    promosDraft.splice(Number(card.dataset.promoIndex), 1);
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
