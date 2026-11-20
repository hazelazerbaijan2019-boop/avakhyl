const html = document.documentElement;
const params = new URLSearchParams(window.location.search);
const selectedHome = params.get("home") || "qaya";
// qonaq limitləri rəhbər panelindən (settings.js); yalnız böyüklər sayılır, uşaqlar limitə daxil deyil
const maxFor = (key) => (key === "adults" ? homeRules(selectedHome).maxAdults : key === "pets" ? homeRules(selectedHome).maxPets : Infinity);
const minFor = (key) => (key === "adults" ? homeRules(selectedHome).minAdults : 0);
let currentLang = ["az", "ru", "en"].includes(params.get("lang")) ? params.get("lang") : "az";
let currentTheme = params.get("theme") === "dark" ? "dark" : "light";

const reservationForm = document.querySelector("[data-reservation-form]");
const reservationWarning = document.querySelector("[data-reservation-warning]");
const warningClose = document.querySelector("[data-warning-close]");
const warningAccept = document.querySelector("[data-warning-accept]");
const warningSend = document.querySelector("[data-warning-send]");
const bookingStatus = document.querySelector("[data-booking-status]");

const clampNumber = (value, fallback, min = 0, max = 30) => {
  const parsed = Number.parseInt(value, 10);
  if (Number.isNaN(parsed)) {
    return fallback;
  }
  return Math.min(max, Math.max(min, parsed));
};

const state = {
  checkin: params.get("checkin"),
  checkout: params.get("checkout"),
  promo: (params.get("promo") || "").toUpperCase(),
  guests: {
    adults: clampNumber(params.get("adults"), minFor("adults"), minFor("adults"), maxFor("adults")),
    children: clampNumber(params.get("children"), 0),
    pets: clampNumber(params.get("pets"), 0, 0, maxFor("pets"))
  }
};

const homes = {
  qaya: "Qaya 🏔️",
  ardic: "Ardıc 🌳",
  palid: "Palıd 🌲",
  glamp4: "Glamphouse böyük (4 nəfərlik)",
  glamp2: "Glamphouse kiçik (2 nəfərlik)"
};

const text = {
  az: {
    "nav.homes": "Evlər",
    "theme.toDark": "Qara fon",
    "theme.toLight": "Ağ fon",
    "action.back": "Geri",
    "reservation.eyebrow": "Rezervasiya",
    "reservation.formTitle": "Rezervasiya məlumatları",
    "reservation.infoTitle": "Rezervasiya məlumatları",
    "reservation.home": "Ev",
    "reservation.checkin": "Giriş tarixi",
    "reservation.checkout": "Çıxış tarixi",
    "reservation.selectDate": "Tarix seçin",
    "reservation.nightCount": "Cəmi gecə sayı",
    "reservation.guests": "Qonaqlar",
    "reservation.priceDetails": "Qiymət təfərrüatları",
    "reservation.discount": "Endirim ({discountNights}+ gecə, {discount}%)",
    "reservation.times": "Giriş saatı {checkin}, çıxış saatı {checkout}",
    "promo.label": "Promokod",
    "promo.placeholder": "Promokodu daxil edin",
    "promo.apply": "Tətbiq et",
    "promo.row": "Promokod",
    "promo.ok": "Promokod tətbiq olundu.",
    "promo.invalid": "Belə promokod tapılmadı.",
    "promo.used": "Bu promokod artıq istifadə olunub.",
    "promo.inactive": "Bu promokod hazırda aktiv deyil.",
    "promo.expired": "Bu promokodun müddəti bitib və ya hələ başlamayıb.",
    "promo.home": "Bu promokod seçdiyiniz ev üçün keçərli deyil.",
    "promo.nights": "Bu promokod minimum {n} gecəlik rezervasiya üçündür.",
    "promo.notBetter": "Uzun qalış endiriminiz daha sərfəlidir, promokod əlavə olunmadı.",
    "reservation.petsNote": "Yalnız kiçik ölçülü, maksimum {maxPets}",
    "reservation.petsInfo": "Yalnız kiçik ölçülü ev heyvanları qəbul edilir (hər evə maksimum {maxPets}). Heyvanlar qonağın nəzarəti altında olmalıdır. Doberman, alman ovçarkası, pitbull və rotveyler cinsləri qəbul edilmir.",
    "reservation.heating": "İstilik ödənişi ({heatingFromShort} – {heatingToShort})",
    "reservation.deposit": "Depozit (girişdə ödənilir, çıxışda qaytarılır)",
    "reservation.cleaning": "Təmizlik xidməti",
    "reservation.total": "Cəmi",
    "reservation.firstName": "Adınız",
    "reservation.lastName": "Soyadınız",
    "reservation.email": "Gmail",
    "reservation.phone": "+994 mobil nömrə",
    "reservation.continue": "Davam Et",
    "reservation.warningTitle": "Xəbərdarlıq",
    "reservation.warningText": "Bu sorğunu göndərməklə rezervasiya prosesini başladırsınız. Sorğunuz yoxlanıldıqdan sonra əməkdaşımız sizinlə əlaqə saxlayacaq və ümumi məbləğin ödənişini qəbul edəcək — rezervasiya ödəniş edildikdən sonra təsdiqlənir.",
    "reservation.accept": "Təsdiq edirəm",
    "reservation.send": "Göndər"
  },
  ru: {
    "nav.homes": "Дома",
    "theme.toDark": "Черный фон",
    "theme.toLight": "Белый фон",
    "action.back": "Назад",
    "reservation.eyebrow": "Бронирование",
    "reservation.formTitle": "Данные бронирования",
    "reservation.infoTitle": "Данные бронирования",
    "reservation.home": "Дом",
    "reservation.checkin": "Дата заезда",
    "reservation.checkout": "Дата выезда",
    "reservation.selectDate": "Выберите дату",
    "reservation.nightCount": "Всего ночей",
    "reservation.guests": "Гости",
    "reservation.priceDetails": "Детали цены",
    "reservation.discount": "Скидка (от {discountNights} ночей, {discount}%)",
    "reservation.times": "Заезд с {checkin}, выезд до {checkout}",
    "promo.label": "Промокод",
    "promo.placeholder": "Введите промокод",
    "promo.apply": "Применить",
    "promo.row": "Промокод",
    "promo.ok": "Промокод применён.",
    "promo.invalid": "Такой промокод не найден.",
    "promo.used": "Этот промокод уже использован.",
    "promo.inactive": "Этот промокод сейчас не активен.",
    "promo.expired": "Срок действия промокода истёк или ещё не начался.",
    "promo.home": "Этот промокод не действует для выбранного дома.",
    "promo.nights": "Этот промокод действует от {n} ночей.",
    "promo.notBetter": "Ваша скидка за длительное проживание выгоднее, промокод не применён.",
    "reservation.petsNote": "Только небольшие, максимум {maxPets}",
    "reservation.petsInfo": "Принимаются только небольшие домашние животные (не более {maxPets} на дом). Животные должны находиться под присмотром гостя. Породы доберман, немецкая овчарка, питбуль и ротвейлер не допускаются.",
    "reservation.heating": "Отопление ({heatingFromShort} – {heatingToShort})",
    "reservation.deposit": "Депозит (оплачивается при заезде, возвращается при выезде)",
    "reservation.cleaning": "Уборка",
    "reservation.total": "Итого",
    "reservation.firstName": "Имя",
    "reservation.lastName": "Фамилия",
    "reservation.email": "Gmail",
    "reservation.phone": "+994 мобильный номер",
    "reservation.continue": "Продолжить",
    "reservation.warningTitle": "Предупреждение",
    "reservation.warningText": "Отправляя этот запрос, вы начинаете процесс бронирования. После проверки запроса наш сотрудник свяжется с вами и примет оплату полной суммы — бронирование подтверждается после оплаты.",
    "reservation.accept": "Подтверждаю",
    "reservation.send": "Отправить"
  },
  en: {
    "nav.homes": "Homes",
    "theme.toDark": "Black mode",
    "theme.toLight": "White mode",
    "action.back": "Back",
    "reservation.eyebrow": "Reservation",
    "reservation.formTitle": "Reservation details",
    "reservation.infoTitle": "Reservation details",
    "reservation.home": "Home",
    "reservation.checkin": "Check-in date",
    "reservation.checkout": "Check-out date",
    "reservation.selectDate": "Select date",
    "reservation.nightCount": "Total nights",
    "reservation.guests": "Guests",
    "reservation.priceDetails": "Price details",
    "reservation.discount": "Discount ({discountNights}+ nights, {discount}%)",
    "reservation.times": "Check-in from {checkin}, check-out by {checkout}",
    "promo.label": "Promo code",
    "promo.placeholder": "Enter promo code",
    "promo.apply": "Apply",
    "promo.row": "Promo code",
    "promo.ok": "Promo code applied.",
    "promo.invalid": "This promo code was not found.",
    "promo.used": "This promo code has already been used.",
    "promo.inactive": "This promo code is not active right now.",
    "promo.expired": "This promo code has expired or is not active yet.",
    "promo.home": "This promo code is not valid for the selected home.",
    "promo.nights": "This promo code requires at least {n} nights.",
    "promo.notBetter": "Your long-stay discount is better, so the promo code was not applied.",
    "reservation.petsNote": "Small pets only, max. {maxPets}",
    "reservation.petsInfo": "Only small pets are accepted (maximum {maxPets} per home). Pets must be under the guest's supervision. Doberman, German Shepherd, Pit Bull and Rottweiler breeds are not allowed.",
    "reservation.heating": "Heating fee ({heatingFromShort} – {heatingToShort})",
    "reservation.deposit": "Deposit (paid at check-in, refunded at check-out)",
    "reservation.cleaning": "Cleaning service",
    "reservation.total": "Total",
    "reservation.firstName": "First name",
    "reservation.lastName": "Last name",
    "reservation.email": "Gmail",
    "reservation.phone": "+994 mobile number",
    "reservation.continue": "Continue",
    "reservation.warningTitle": "Warning",
    "reservation.warningText": "By sending this request you start the reservation process. Once your request is reviewed, our team will contact you to collect payment of the full amount — the reservation is confirmed once it is paid.",
    "reservation.accept": "I confirm",
    "reservation.send": "Send"
  }
};

const monthNames = {
  az: ["yanvar", "fevral", "mart", "aprel", "may", "iyun", "iyul", "avqust", "sentyabr", "oktyabr", "noyabr", "dekabr"],
  ru: ["января", "февраля", "марта", "апреля", "мая", "июня", "июля", "августа", "сентября", "октября", "ноября", "декабря"],
  en: ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"]
};

const getText = (key) => fillSettings(text[currentLang][key] ?? text.az[key] ?? sharedText(currentLang, key) ?? key, currentLang, selectedHome);
const selectedHomeName = () => homes[selectedHome] ?? homes.qaya;
const pad = (value) => String(value).padStart(2, "0");
const fromIsoDate = (iso) => {
  if (!iso) return null;
  const [year, month, day] = iso.split("-").map(Number);
  return new Date(year, month - 1, day);
};

const formatCurrency = (amount) => `${amount} ₼`;

const formatDate = (iso) => {
  const date = fromIsoDate(iso);
  if (!date) {
    return getText("reservation.selectDate");
  }
  return `${date.getDate()} ${monthNames[currentLang][date.getMonth()]} ${date.getFullYear()}`;
};

const dayDiff = (startIso, endIso) => {
  const start = fromIsoDate(startIso);
  const end = fromIsoDate(endIso);
  if (!start || !end) {
    return 0;
  }
  return Math.max(0, Math.round((end - start) / 86400000));
};

const formatNightText = (nights) => {
  if (currentLang === "en") {
    return `${nights} ${nights === 1 ? "night" : "nights"}`;
  }
  if (currentLang === "ru") {
    return `${nights} ${nights === 1 ? "ночь" : "ночей"}`;
  }
  return `${nights} gecə`;
};

const formatGuestLine = () => {
  const { adults, children, pets } = state.guests;
  if (currentLang === "ru") {
    return [`${adults} взросл.`, children ? `${children} дет.` : "", pets ? `${pets} дом. живот.` : ""].filter(Boolean).join(", ");
  }
  if (currentLang === "en") {
    return [`${adults} adult${adults === 1 ? "" : "s"}`, children ? `${children} child${children === 1 ? "" : "ren"}` : "", pets ? `${pets} pet${pets === 1 ? "" : "s"}` : ""].filter(Boolean).join(", ");
  }
  return [`${adults} böyük`, children ? `${children} uşaq` : "", pets ? `${pets} ev heyvanı` : ""].filter(Boolean).join(", ");
};

const guestLimitReached = (guests, key) => guests[key] >= maxFor(key);

const getNightlyPrice = () => nightlyPrice(selectedHome, state.guests.adults);

const getReservationMath = () => {
  const nights = dayDiff(state.checkin, state.checkout);
  return stayMath(selectedHome, state.guests.adults, state.checkin, state.checkout, nights, state.promo);
};

const setElementText = (selector, value) => {
  document.querySelectorAll(selector).forEach((element) => {
    element.textContent = value;
  });
};

const updateThemeLabels = () => {
  const label = currentTheme === "dark" ? getText("theme.toLight") : getText("theme.toDark");
  const icon = currentTheme === "dark" ? "#icon-sun" : "#icon-moon";
  document.querySelectorAll("[data-theme-toggle]").forEach((button) => {
    button.setAttribute("aria-label", label);
  });
  document.querySelectorAll("[data-theme-label]").forEach((element) => {
    element.textContent = label;
  });
  document.querySelectorAll("[data-theme-icon] use").forEach((use) => {
    use.setAttribute("href", icon);
  });
  document.querySelectorAll("[data-brand-logo]").forEach((image) => {
    const logo = currentTheme === "dark" ? image.dataset.logoDark : image.dataset.logoLight;
    if (logo) {
      image.src = logo;
    }
  });
};

const setTheme = (theme) => {
  currentTheme = theme;
  carryParams(currentLang, currentTheme);
  html.dataset.theme = theme;
  updateThemeLabels();
  updateBackLink();
};

const backUrl = () => {
  const query = new URLSearchParams({
    home: selectedHome,
    lang: currentLang,
    theme: currentTheme,
    adults: String(state.guests.adults),
    children: String(state.guests.children),
    pets: String(state.guests.pets),
    promo: state.promo
  });
  return `house.html?${query.toString()}`;
};

const updateBackLink = () => {
  const link = document.querySelector("[data-back-link]");
  if (link) {
    link.href = backUrl();
  }
};

const renderReservation = () => {
  const { nights, lines, discount, promo, heating, total } = getReservationMath();
  renderPromoUi(promo, state.promo, getText, formatCurrency);

  html.lang = currentLang;
  document.title = `Avakhyl | ${getText("reservation.formTitle")}`;
  setElementText("[data-form-home]", selectedHomeName());
  setElementText("[data-form-checkin]", formatDate(state.checkin));
  setElementText("[data-form-checkout]", formatDate(state.checkout));
  setElementText("[data-form-nights]", formatNightText(nights));
  setElementText("[data-form-guests]", formatGuestLine());
  renderNightLines(
    lines,
    (line) => `${formatCurrency(line.price)} x ${formatNightText(line.nights)}${line.label ? ` · ${line.label}` : ""}`,
    (line) => formatCurrency(line.price * line.nights)
  );
  document.querySelectorAll("[data-pets-info]").forEach((box) => {
    box.hidden = !state.guests.pets;
  });
  setElementText("[data-form-total]", formatCurrency(total));
  setElementText("[data-summary-discount], [data-form-discount]", `−${formatCurrency(discount)}`);
  document.querySelectorAll("[data-discount-row]").forEach((row) => {
    row.hidden = !discount;
  });
  setElementText("[data-summary-heating], [data-form-heating]", `+${formatCurrency(heating)}`);
  document.querySelectorAll("[data-heating-row]").forEach((row) => {
    row.hidden = !heating;
  });
  setElementText("[data-deposit-amount]", formatCurrency(DEPOSIT));

  carryParams(currentLang, currentTheme);
  document.querySelectorAll("[data-i18n]").forEach((element) => {
    element.textContent = getText(element.dataset.i18n);
  });
  document.querySelectorAll("[data-i18n-placeholder]").forEach((element) => {
    element.setAttribute("placeholder", getText(element.dataset.i18nPlaceholder));
  });
  document.querySelectorAll("[data-lang]").forEach((button) => {
    const isActive = button.dataset.lang === currentLang;
    button.classList.toggle("is-active", isActive);
    button.setAttribute("aria-pressed", String(isActive));
  });

  updateThemeLabels();
  updateBackLink();
};

const openReservationWarning = () => {
  if (!reservationWarning) {
    return;
  }
  reservationWarning.classList.add("is-open");
  reservationWarning.setAttribute("aria-hidden", "false");
  if (warningAccept) {
    warningAccept.checked = false;
  }
  if (warningSend) {
    warningSend.disabled = true;
  }
  if (bookingStatus) {
    bookingStatus.hidden = true;
  }
  document.body.classList.add("modal-open");
};

const closeReservationWarning = () => {
  if (!reservationWarning) {
    return;
  }
  reservationWarning.classList.remove("is-open");
  reservationWarning.setAttribute("aria-hidden", "true");
  document.body.classList.remove("modal-open");
};

const buildWhatsAppMessage = (result) => {
  const { nights, lines, discount, promo, heating, total } = getReservationMath();
  const formData = new FormData(reservationForm);
  return [
    ...reservationMessageHead(result, currentLang),
    `Ev: ${selectedHomeName()}`,
    `Giriş (saat ${SETTINGS.checkinTime}): ${formatDate(state.checkin)}`,
    `Çıxış (saat ${SETTINGS.checkoutTime}): ${formatDate(state.checkout)}`,
    `Gecə sayı: ${nights}`,
    `Qonaqlar: ${formatGuestLine()}`,
    ...lines.map((line) => `Qiymət: ${formatCurrency(line.price)} x ${formatNightText(line.nights)}${line.label ? ` (${line.label})` : ""}`),
    ...(discount ? [`${fillSettings(text.az["reservation.discount"], "az", selectedHome)}: −${formatCurrency(discount)}`] : []),
    ...(promo.amount ? [`Promokod ${promo.code}: −${formatCurrency(promo.amount)}`] : []),
    ...(heating ? [`İstilik ödənişi: +${formatCurrency(heating)}`] : []),
    `Cəmi: ${formatCurrency(total)}`,
    `Depozit (girişdə ödənilir, çıxışda qaytarılır): ${formatCurrency(DEPOSIT)}`,
    `Ad: ${formData.get("firstName")}`,
    `Soyad: ${formData.get("lastName")}`,
    `Əlaqə nömrəsi: ${formData.get("phone")}`,
    `Gmail: ${formData.get("email")}`
  ].join("\n");
};

document.querySelectorAll("[data-lang]").forEach((button) => {
  button.addEventListener("click", () => {
    currentLang = button.dataset.lang;
    renderReservation();
  });
});

document.querySelectorAll("[data-theme-toggle]").forEach((button) => {
  button.addEventListener("click", () => setTheme(currentTheme === "dark" ? "light" : "dark"));
});

bindPromoInputs((code) => {
  state.promo = code;
  renderReservation();
});

if (reservationForm) {
  reservationForm.addEventListener("submit", (event) => {
    event.preventDefault();
    if (!reservationForm.checkValidity()) {
      reservationForm.reportValidity();
      return;
    }
    openReservationWarning();
  });
}

if (warningClose) {
  warningClose.addEventListener("click", closeReservationWarning);
}

if (warningAccept && warningSend) {
  warningAccept.addEventListener("change", () => {
    warningSend.disabled = !warningAccept.checked;
  });
  warningSend.addEventListener("click", () => {
    if (!warningAccept.checked) {
      return;
    }
    const payload = reservationPayload({
      home: selectedHome,
      checkin: state.checkin,
      checkout: state.checkout,
      guests: state.guests,
      form: reservationForm,
      math: getReservationMath(),
      lang: currentLang
    });
    sendReservation({ payload, buildMessage: buildWhatsAppMessage, getText, button: warningSend, statusBox: bookingStatus });
  });
}

if (reservationWarning) {
  reservationWarning.addEventListener("click", (event) => {
    if (event.target === reservationWarning) {
      closeReservationWarning();
    }
  });
}

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    closeReservationWarning();
  }
});

setTheme(currentTheme);
renderReservation();
document.addEventListener("avakhyl:settings", renderReservation);
if (state.promo) {
  loadPromo(state.promo).then(renderReservation);
}
