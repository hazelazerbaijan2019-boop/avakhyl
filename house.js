const html = document.documentElement;
const params = new URLSearchParams(window.location.search);
const selectedHome = params.get("home") || "qaya";
// qonaq limitləri rəhbər panelindən (settings.js); yalnız böyüklər sayılır, uşaqlar limitə daxil deyil
const maxFor = (key) => (key === "adults" ? homeRules(selectedHome).maxAdults : key === "pets" ? homeRules(selectedHome).maxPets : Infinity);
const minFor = (key) => (key === "adults" ? homeRules(selectedHome).minAdults : 0);
const lightbox = document.querySelector("[data-lightbox]");
const lightboxImage = document.querySelector("[data-lightbox-image]");
const lightboxClose = document.querySelector("[data-lightbox-close]");
const galleryModal = document.querySelector("[data-gallery-modal]");
const galleryClose = document.querySelector("[data-gallery-close]");
const galleryAll = document.querySelector("[data-gallery-all]");
const galleryTitle = document.querySelector("[data-gallery-title]");
const shareButton = document.querySelector("[data-share-button]");
const shareMenu = document.querySelector("[data-share-menu]");
const shareLinks = document.querySelectorAll("[data-share-link]");
const instagramShare = document.querySelector("[data-instagram-share]");
const calendarMonths = document.querySelector("[data-calendar-months]");
const facilitiesList = document.querySelector("[data-facilities-list]");
const calendarPrev = document.querySelector("[data-calendar-prev]");
const calendarNext = document.querySelector("[data-calendar-next]");
const reservationGuestLine = document.querySelector("[data-reservation-guest-line]");
const reservationGuestToggle = document.querySelector("[data-reservation-guests-toggle]");
const reservationGuestEditor = document.querySelector("[data-reservation-guest-editor]");
const reservationGuestOutputs = document.querySelectorAll("[data-res-guest-count]");
const reservationGuestSteps = document.querySelectorAll("[data-res-guest-step]");
const reserveStart = document.querySelector("[data-reserve-start]");
const reservationFormSection = document.querySelector("[data-reservation-form-section]");
const reservationForm = document.querySelector("[data-reservation-form]");
const reservationWarning = document.querySelector("[data-reservation-warning]");
const warningClose = document.querySelector("[data-warning-close]");
const warningAccept = document.querySelector("[data-warning-accept]");
const warningSend = document.querySelector("[data-warning-send]");
const bookingStatus = document.querySelector("[data-booking-status]");
let currentLang = ["az", "ru", "en"].includes(params.get("lang")) ? params.get("lang") : "az";
let currentTheme = params.get("theme") === "dark" ? "dark" : "light";

const clampNumber = (value, fallback, min = 0, max = 30) => {
  const parsed = Number.parseInt(value, 10);
  if (Number.isNaN(parsed)) {
    return fallback;
  }
  return Math.min(max, Math.max(min, parsed));
};

const reservationState = {
  calendarStart: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
  checkin: null,
  checkout: null,
  promo: (params.get("promo") || "").toUpperCase(),
  guests: {
    adults: clampNumber(params.get("adults"), minFor("adults"), minFor("adults"), maxFor("adults")),
    children: clampNumber(params.get("children"), 0),
    pets: clampNumber(params.get("pets"), 0, 0, maxFor("pets"))
  }
};
fitChildren(homeRules(selectedHome), reservationState.guests);

const text = {
  az: {
    "nav.homes": "Evlər",
    "theme.toDark": "Qara fon",
    "theme.toLight": "Ağ fon",
    "action.back": "Geri",
    "location": "Şamaxı, Avaxıl kəndi",
    "media.eyebrow": "Qalereya",
    "media.title": "Foto və video sahəsi",
    "media.text": "Seçilən evin real foto və videoları burada toplanır.",
    "media.video": "Video",
    "media.openImage": "Şəkli böyüt",
    "media.openGallery": "Bütün foto və videoları aç",
    "media.showAll": "Bütün foto və videoları göstər",
    "media.allTitle": "Bütün foto və videolar",
    "media.close": "Bağla",
    "location.map": "(Xəritədə göstər)",
    "action.share": "Paylaşın",
    "facilities.eyebrow": "Şərait",
    "facilities.title": "Rahatlığınız üçün düşünülmüş şərait",
    "facilities.text": "Evdə gündəlik qalmaq üçün lazımi avadanlıq və imkanlar mövcuddur.",
    "details.eyebrow": "Ev haqqında",
    "spec.bedroom": "1 yataq otağı",
    "spec.studio": "Studiya mətbəxli qonaq otağı",
    "spec.balcony": "Balkon",
    "spec.bath": "Sanuzel",
    "spec.wifi": "Fiber Wi-Fi",
    "pricing.eyebrow": "Qiymət",
    "pricing.title": "Qonaq sayına görə",
    "pricing.text": "Məbləğlərə manqal və samovar seti daxildir. {heatingFrom} – {heatingTo} tarixləri arasında {heatingUnit} +{heatingFee} AZN istilik ödənişi əlavə olunur.",
    "notes.eyebrow": "Vacib qeydlər",
    "notes.title": "Girişdən əvvəl bilinməli olanlar",
    "notes.one": "Check-in zamanı {deposit} AZN depozit tələb olunur. Depozit girişdə ödənilir və çıxışda geri qaytarılır.",
    "notes.two": "İstisnasız qaydada 18 yaş üstü bütün qonaqlarımız şəxsiyyət vəsiqəsini təqdim etməlidir.",
    "notes.three": "Qeyd olunan məbləğlərə manqal və samovar seti daxildir.",
    "notes.petsTitle": "Ev heyvanlarının qəbulu qaydaları",
    "notes.four": "Evlərə yalnız kiçik ölçülü ev heyvanlarının gətirilməsinə icazə verilir. Heyvanlar qonağın nəzarəti altında olmalıdır.",
    "notes.fourB": "Aqressiv və təhlükə yarada biləcək heyvanların, o cümlədən doberman, alman ovçarkası, pitbull və rotveyler cinslərinin qəbulu qadağandır.",
    "notes.fourC": "Hər evə maksimum {maxPets} ev heyvanı qəbul edilir.",
    "notes.five": "{heatingFrom} – {heatingTo} tarixləri arasında {heatingUnit} +{heatingFee} AZN istilik ödənişi alınır.",
    "other.title": "Digər evlərə də bax",
    "action.open": "Aç",
    "availability.title": "Doluluq və Qiymət Kalendarı",
    "reservation.title": "Sizin Rezervasiyanız",
    "reservation.checkin": "Giriş tarixi",
    "reservation.checkout": "Çıxış tarixi",
    "reservation.selectDate": "Tarix seçin",
    "reservation.guest": "Qonaq",
    "reservation.guests": "Qonaqlar",
    "reservation.adults": "Böyük",
    "reservation.children": "Uşaq",
    "reservation.childrenAge": "3-12 yaş",
    "reservation.petsNote": "Yalnız kiçik ölçülü, maksimum {maxPets}",
    "reservation.petsInfo": "Yalnız kiçik ölçülü ev heyvanları qəbul edilir (hər evə maksimum {maxPets}). Heyvanlar qonağın nəzarəti altında olmalıdır. Doberman, alman ovçarkası, pitbull və rotveyler cinsləri qəbul edilmir.",
    "reservation.pets": "Ev heyvanı",
    "reservation.priceDetails": "Qiymət təfərrüatları",
    "reservation.discount": "Endirim ({discountNights}+ gecə, {discount}%)",
    "reservation.checkoutOnly": "Yalnız çıxış",
    "reservation.times": "Giriş saatı {checkin}, çıxış saatı {checkout}",
    "reservation.pickDates": "Rezervasiya üçün əvvəlcə giriş və çıxış tarixlərini seçin.",
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
    "specials.night": "gecə",
    "specials.title": "Bayram və xüsusi təkliflər",
    "reservation.heating": "İstilik ödənişi ({heatingFromShort} – {heatingToShort})",
    "reservation.deposit": "Depozit (girişdə ödənilir, çıxışda qaytarılır)",
    "reservation.cleaning": "Təmizlik xidməti",
    "reservation.total": "Cəmi",
    "reservation.book": "REZERVASİYA ET",
    "reservation.formTitle": "Rezervasiya məlumatları",
    "reservation.infoTitle": "Rezervasiya məlumatları",
    "reservation.firstName": "Adınız",
    "reservation.lastName": "Soyadınız",
    "reservation.email": "Gmail",
    "reservation.phone": "+994 mobil nömrə",
    "reservation.continue": "Davam Et",
    "reservation.nightCount": "Cəmi gecə sayı",
    "reservation.warningTitle": "Xəbərdarlıq",
    "reservation.warningText": "Bu sorğunu göndərməklə rezervasiya prosesini başladırsınız. Sorğunuz yoxlanıldıqdan sonra əməkdaşımız sizinlə əlaqə saxlayacaq və ümumi məbləğin ödənişini qəbul edəcək — rezervasiya ödəniş edildikdən sonra təsdiqlənir. Ödəniş öncədən alınır; rezervasiya ləğv olunarsa, ödəniş geri qaytarılmır.",
    "reservation.accept": "Təsdiq edirəm",
    "reservation.send": "Göndər",
    "reservation.reserved": "Rezerv",
    "reservation.noDates": "Rezervasiya üçün giriş və çıxış tarixini seçin."
  },
  ru: {
    "nav.homes": "Дома",
    "theme.toDark": "Черный фон",
    "theme.toLight": "Белый фон",
    "action.back": "Назад",
    "location": "Шамахы, село Авакыл",
    "media.eyebrow": "Галерея",
    "media.title": "Фото и видео",
    "media.text": "Здесь собраны реальные фото и видео выбранного дома.",
    "media.video": "Видео",
    "media.openImage": "Увеличить фото",
    "media.openGallery": "Открыть все фото и видео",
    "media.showAll": "Показать все фото и видео",
    "media.allTitle": "Все фото и видео",
    "media.close": "Закрыть",
    "location.map": "(Показать на карте)",
    "action.share": "Поделиться",
    "facilities.eyebrow": "Условия",
    "facilities.title": "Все необходимое для комфортного отдыха",
    "facilities.text": "В доме есть необходимые удобства и принадлежности для повседневного проживания.",
    "details.eyebrow": "О доме",
    "spec.bedroom": "1 спальня",
    "spec.studio": "Гостиная-студия с кухней",
    "spec.balcony": "Балкон",
    "spec.bath": "Санузел",
    "spec.wifi": "Fiber Wi-Fi",
    "pricing.eyebrow": "Цена",
    "pricing.title": "По количеству гостей",
    "pricing.text": "В стоимость входит набор для мангала и самовара. С {heatingFrom} по {heatingTo} добавляется +{heatingFee} AZN за отопление {heatingUnit}.",
    "notes.eyebrow": "Важные заметки",
    "notes.title": "Что важно знать до заезда",
    "notes.one": "При заезде требуется депозит {deposit} AZN. Депозит оплачивается при заезде и возвращается при выезде.",
    "notes.two": "Без исключений все гости старше 18 лет должны предоставить удостоверение личности.",
    "notes.three": "В указанную стоимость входит набор для мангала и самовара.",
    "notes.petsTitle": "Правила размещения с домашними животными",
    "notes.four": "Разрешается привозить только домашних животных небольшого размера. Животные должны находиться под присмотром гостя.",
    "notes.fourB": "Запрещено размещение агрессивных и потенциально опасных животных, в том числе пород доберман, немецкая овчарка, питбуль и ротвейлер.",
    "notes.fourC": "В каждый дом допускается не более {maxPets} домашних животных.",
    "notes.five": "С {heatingFrom} по {heatingTo} взимается +{heatingFee} AZN за отопление {heatingUnit}.",
    "other.title": "Посмотрите и другие дома",
    "action.open": "Открыть",
    "availability.title": "Календарь занятости и цен",
    "reservation.title": "Ваше бронирование",
    "reservation.checkin": "Дата заезда",
    "reservation.checkout": "Дата выезда",
    "reservation.selectDate": "Выберите дату",
    "reservation.guest": "Гость",
    "reservation.guests": "Гости",
    "reservation.adults": "Взрослые",
    "reservation.children": "Дети",
    "reservation.childrenAge": "3-12 лет",
    "reservation.petsNote": "Только небольшие, максимум {maxPets}",
    "reservation.petsInfo": "Принимаются только небольшие домашние животные (не более {maxPets} на дом). Животные должны находиться под присмотром гостя. Породы доберман, немецкая овчарка, питбуль и ротвейлер не допускаются.",
    "reservation.pets": "Домашнее животное",
    "reservation.priceDetails": "Детали цены",
    "reservation.discount": "Скидка (от {discountNights} ночей, {discount}%)",
    "reservation.checkoutOnly": "Только выезд",
    "reservation.times": "Заезд с {checkin}, выезд до {checkout}",
    "reservation.pickDates": "Сначала выберите даты заезда и выезда.",
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
    "specials.night": "ночь",
    "specials.title": "Праздничные и специальные предложения",
    "reservation.heating": "Отопление ({heatingFromShort} – {heatingToShort})",
    "reservation.deposit": "Депозит (оплачивается при заезде, возвращается при выезде)",
    "reservation.cleaning": "Уборка",
    "reservation.total": "Итого",
    "reservation.book": "ЗАБРОНИРОВАТЬ",
    "reservation.formTitle": "Данные бронирования",
    "reservation.infoTitle": "Данные бронирования",
    "reservation.firstName": "Имя",
    "reservation.lastName": "Фамилия",
    "reservation.email": "Gmail",
    "reservation.phone": "+994 мобильный номер",
    "reservation.continue": "Продолжить",
    "reservation.nightCount": "Всего ночей",
    "reservation.warningTitle": "Предупреждение",
    "reservation.warningText": "Отправляя этот запрос, вы начинаете процесс бронирования. После проверки запроса наш сотрудник свяжется с вами и примет оплату полной суммы — бронирование подтверждается после оплаты. Оплата вносится заранее; при отмене бронирования она не возвращается.",
    "reservation.accept": "Подтверждаю",
    "reservation.send": "Отправить",
    "reservation.reserved": "Занято",
    "reservation.noDates": "Выберите даты заезда и выезда для бронирования."
  },
  en: {
    "nav.homes": "Homes",
    "theme.toDark": "Black mode",
    "theme.toLight": "White mode",
    "action.back": "Back",
    "location": "Shamakhi, Avakhyl village",
    "media.eyebrow": "Gallery",
    "media.title": "Photo and video area",
    "media.text": "Real photos and videos for the selected home are gathered here.",
    "media.video": "Video",
    "media.openImage": "Open photo",
    "media.openGallery": "Open all photos and videos",
    "media.showAll": "Show all photos and videos",
    "media.allTitle": "All photos and videos",
    "media.close": "Close",
    "location.map": "(Show on map)",
    "action.share": "Share",
    "facilities.eyebrow": "Amenities",
    "facilities.title": "Everything prepared for a comfortable stay",
    "facilities.text": "Each home includes the essentials and thoughtful details for daily comfort.",
    "details.eyebrow": "About the home",
    "spec.bedroom": "1 bedroom",
    "spec.studio": "Studio living room with kitchen",
    "spec.balcony": "Balcony",
    "spec.bath": "Bathroom",
    "spec.wifi": "Fiber Wi-Fi",
    "pricing.eyebrow": "Price",
    "pricing.title": "By guest count",
    "pricing.text": "The barbecue and samovar set is included. From {heatingFrom} to {heatingTo}, a heating fee of +{heatingFee} AZN is added {heatingUnit}.",
    "notes.eyebrow": "Important notes",
    "notes.title": "Good to know before check-in",
    "notes.one": "A {deposit} AZN deposit is required at check-in. It is paid on arrival and refunded at check-out.",
    "notes.two": "Without exception, every guest over 18 must present an identity document.",
    "notes.three": "The listed prices include the barbecue and samovar set.",
    "notes.petsTitle": "Pet policy",
    "notes.four": "Only small pets are allowed. Pets must be kept under the guest's supervision.",
    "notes.fourB": "Aggressive or potentially dangerous animals are not allowed, including Doberman, German Shepherd, Pit Bull and Rottweiler breeds.",
    "notes.fourC": "A maximum of {maxPets} pets is allowed per home.",
    "notes.five": "From {heatingFrom} to {heatingTo}, a heating fee of +{heatingFee} AZN is charged {heatingUnit}.",
    "other.title": "View other homes",
    "action.open": "Open",
    "availability.title": "Availability and Price Calendar",
    "reservation.title": "Your Reservation",
    "reservation.checkin": "Check-in date",
    "reservation.checkout": "Check-out date",
    "reservation.selectDate": "Select date",
    "reservation.guest": "Guest",
    "reservation.guests": "Guests",
    "reservation.adults": "Adults",
    "reservation.children": "Children",
    "reservation.childrenAge": "Ages 3-12",
    "reservation.petsNote": "Small pets only, max. {maxPets}",
    "reservation.petsInfo": "Only small pets are accepted (maximum {maxPets} per home). Pets must be under the guest's supervision. Doberman, German Shepherd, Pit Bull and Rottweiler breeds are not allowed.",
    "reservation.pets": "Pet",
    "reservation.priceDetails": "Price details",
    "reservation.discount": "Discount ({discountNights}+ nights, {discount}%)",
    "reservation.checkoutOnly": "Check-out only",
    "reservation.times": "Check-in from {checkin}, check-out by {checkout}",
    "reservation.pickDates": "Choose your check-in and check-out dates first.",
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
    "specials.night": "night",
    "specials.title": "Holiday and special offers",
    "reservation.heating": "Heating fee ({heatingFromShort} – {heatingToShort})",
    "reservation.deposit": "Deposit (paid at check-in, refunded at check-out)",
    "reservation.cleaning": "Cleaning service",
    "reservation.total": "Total",
    "reservation.book": "RESERVE",
    "reservation.formTitle": "Reservation details",
    "reservation.infoTitle": "Reservation details",
    "reservation.firstName": "First name",
    "reservation.lastName": "Last name",
    "reservation.email": "Gmail",
    "reservation.phone": "+994 mobile number",
    "reservation.continue": "Continue",
    "reservation.nightCount": "Total nights",
    "reservation.warningTitle": "Warning",
    "reservation.warningText": "By sending this request you start the reservation process. Once your request is reviewed, our team will contact you to collect payment of the full amount — the reservation is confirmed once it is paid. Payment is taken in advance and is not refunded if the reservation is cancelled.",
    "reservation.accept": "I confirm",
    "reservation.send": "Send",
    "reservation.reserved": "Reserved",
    "reservation.noDates": "Choose check-in and check-out dates before reserving."
  }
};

const qayaImages = Array.from({ length: 18 }, (_, index) => `assets/qaya/qaya-${String(index + 1).padStart(2, "0")}.webp`);
const qayaVideos = Array.from({ length: 5 }, (_, index) => `assets/qaya/qaya-video-${String(index + 1).padStart(2, "0")}.mp4`);
const ardicImages = Array.from({ length: 16 }, (_, index) => `assets/ardic/ardic-${String(index + 1).padStart(2, "0")}.webp`);
const ardicVideos = Array.from({ length: 8 }, (_, index) => `assets/ardic/ardic-video-${String(index + 1).padStart(2, "0")}.mp4`);
const palidImages = Array.from({ length: 17 }, (_, index) => `assets/palid/palid-${String(index + 1).padStart(2, "0")}.webp`);
const palidVideos = Array.from({ length: 6 }, (_, index) => `assets/palid/palid-video-${String(index + 1).padStart(2, "0")}.mp4`);
const glamp2Images = ["01", "02", "06"].map((n) => `assets/glamp2/glamp2-${n}.webp`);
const glamp2Videos = ["assets/glamp2/glamp2-video-01.mp4"];
const glamp4Images = Array.from({ length: 11 }, (_, index) => `assets/glamp4/glamp4-${String(index + 1).padStart(2, "0")}.webp`);
const glamp4Videos = ["assets/glamp4/glamp4-video-01.mp4"];

const homes = {
  qaya: {
    name: "Qaya 🏔️",
    image: "assets/qaya/qaya-01.webp",
    gallery: qayaImages,
    videos: qayaVideos,
    kicker: {
      az: "Dağ mənzərəsi",
      ru: "Горный вид",
      en: "Mountain view"
    },
    description: {
      az: "Şamaxı, Avaxıl kəndində dağ havasına açılan sakit ev.",
      ru: "Спокойный дом в селе Авакыл, Шамахы, открытый к горному воздуху.",
      en: "A calm home in Avakhyl village, Shamakhi, opening to mountain air."
    },
    detail: {
      az: "Qaya daha geniş mənzərə hissi və səhər işığı üçün seçilən evdir.",
      ru: "Qaya выбран для ощущения широкого вида и мягкого утреннего света.",
      en: "Qaya is shaped around a wider view and soft morning light."
    },
  },
  ardic: {
    name: "Ardıc 🌳",
    image: "assets/ardic/ardic-01.webp",
    gallery: ardicImages,
    videos: ardicVideos,
    kicker: {
      az: "Meşə sakitliyi",
      ru: "Лесная тишина",
      en: "Forest calm"
    },
    description: {
      az: "Loft / Industrial interyer və yaşıl mənzərəyə açılan balkon.",
      ru: "Loft / Industrial интерьер и балкон с зеленым видом.",
      en: "Loft / Industrial interior with a balcony opening to green views."
    },
    detail: {
      az: "Ardıc interyer rahatlığı və meşə sakitliyini birləşdirən seçimdir.",
      ru: "Ardıc объединяет интерьерный комфорт и лесное спокойствие.",
      en: "Ardıc combines interior comfort with forest stillness."
    },
  },
  palid: {
    name: "Palıd 🌲",
    image: "assets/palid/palid-01.webp",
    gallery: palidImages,
    videos: palidVideos,
    kicker: {
      az: "Ailə rahatlığı",
      ru: "Семейный комфорт",
      en: "Family comfort"
    },
    description: {
      az: "Tam təchizatlı mətbəx, smart TV, Netflix, YouTube və Fiber Wi-Fi ilə rahat plan.",
      ru: "Удобный план с полностью оборудованной кухней, smart TV, Netflix, YouTube и Fiber Wi-Fi.",
      en: "A comfortable plan with a fully equipped kitchen, smart TV, Netflix, YouTube, and Fiber Wi-Fi."
    },
    detail: {
      az: "Palıd ailəvi istirahət və uzun qalma üçün daha sakit ritm yaradır.",
      ru: "Palıd создает спокойный ритм для семейного отдыха и более долгого пребывания.",
      en: "Palıd creates a calmer rhythm for family stays and longer rest."
    },
  },
  glamp4: {
    name: "Glamphouse böyük (4 nəfərlik)",
    image: "assets/glamp4/glamp4-02.webp",
    gallery: glamp4Images,
    videos: glamp4Videos,
    kicker: {
      az: "Glamping günbəzi",
      ru: "Глэмпинг-купол",
      en: "Glamping dome"
    },
    description: {
      az: "Panoram pəncərəli 4 nəfərlik günbəz: iki nəfərlik yataq, 2 təknəfərlik çarpayı, mini mətbəx, kondisioner və terras.",
      ru: "Купол на 4 гостей с панорамным окном: двуспальная кровать, 2 односпальные кровати, мини-кухня, кондиционер и терраса.",
      en: "A dome for 4 guests with a panoramic window: a double bed, 2 single beds, a kitchenette, air conditioning and a terrace."
    },
    detail: {
      az: "Böyük Glamphouse çadır altında yatmaq hissini ev rahatlığı ilə birləşdirir: pəncərədən dağ və duman mənzərəsi açılır.",
      ru: "Большой Glamphouse сочетает ощущение ночёвки в шатре с домашним комфортом: из окна открывается вид на горы и туман.",
      en: "The large Glamphouse pairs the feel of sleeping under canvas with home comfort, with mountain and mist views from the window."
    }
  },
  glamp2: {
    name: "Glamphouse kiçik (2 nəfərlik)",
    image: "assets/glamp2/glamp2-01.webp",
    gallery: glamp2Images,
    videos: glamp2Videos,
    kicker: {
      az: "Cütlüklər üçün",
      ru: "Для пар",
      en: "For couples"
    },
    description: {
      az: "Panoram pəncərəli 2 nəfərlik günbəz: iki nəfərlik yataq, pəncərə önündə epoksi masa və iki kreslo, kondisioner.",
      ru: "Купол на 2 гостей с панорамным окном: двуспальная кровать, эпоксидный столик и два кресла у окна, кондиционер.",
      en: "A dome for 2 with a panoramic window: a double bed, an epoxy table with two armchairs by the window, and air conditioning."
    },
    detail: {
      az: "Kiçik Glamphouse iki nəfər üçün isti bir sığınacaqdır: tünd yaşıl günbəz, yumşaq işıq və dumanlı meşəyə açılan pəncərə.",
      ru: "Малый Glamphouse — уютное убежище для двоих: тёмно-зелёный купол, мягкий свет и окно в туманный лес.",
      en: "The small Glamphouse is a warm hideaway for two: a deep green dome, soft light, and a window onto the misty forest."
    }
  }
};

const facilityIconPaths = {
  default: '<path d="M12 3l2.4 5.2L20 9l-4 3.9.9 5.6L12 15.8 7.1 18.5 8 12.9 4 9l5.6-.8L12 3Z"/>',
  hairdryer: '<path d="M4 8h8a4 4 0 0 1 0 8H4V8Z"/><path d="M12 12h6l2 5M7 16v4"/>',
  bath: '<path d="M4 12h16v3a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5v-3Z"/><path d="M7 12V7a3 3 0 0 1 6 0"/>',
  heater: '<path d="M7 3v18M17 3v18M5 7h14M5 12h14M5 17h14"/>',
  bottle: '<path d="M10 2h4v4l2 2v12a2 2 0 0 1-2 2h-4a2 2 0 0 1-2-2V8l2-2V2Z"/>',
  shower: '<path d="M5 11a7 7 0 0 1 14 0"/><path d="M4 14h16M7 17h.01M12 17h.01M17 17h.01M9 20h.01M15 20h.01"/>',
  bed: '<path d="M4 11V5h8a3 3 0 0 1 3 3v3M4 11h16v8M4 19v-3M20 19v-8h-5"/>',
  roll: '<path d="M8 3h8v18H8V3Z"/><path d="M16 7h2a3 3 0 0 1 0 6h-2"/>',
  desk: '<path d="M4 9h16M6 9v10M18 9v10M8 13h8"/>',
  hanger: '<path d="M12 8V7a2 2 0 1 0-2-2"/><path d="M12 8 5 14v2h14v-2l-7-6Z"/>',
  wardrobe: '<path d="M5 3h14v18H5V3Z"/><path d="M12 3v18M9 12h.01M15 12h.01"/>',
  fridge: '<path d="M7 2h10v20H7V2Z"/><path d="M7 9h10M10 6v1M10 13v1"/>',
  cooktop: '<path d="M5 4h14v16H5V4Z"/><path d="M9 8h.01M15 8h.01M9 14h.01M15 14h.01"/>',
  kettle: '<path d="M6 9h10v8a4 4 0 0 1-4 4H9a3 3 0 0 1-3-3V9Z"/><path d="M16 11h2a3 3 0 0 1 0 6h-2M9 5h4"/>',
  utensils: '<path d="M6 3v8M4 3v8M8 3v8M4 11h4v10M14 3v18M14 3c4 2 4 8 0 10"/>',
  knife: '<path d="M4 20 20 4M14 4l6 6M4 20l5-1"/>',
  pot: '<path d="M5 11h14v7a3 3 0 0 1-3 3H8a3 3 0 0 1-3-3v-7Z"/><path d="M8 11V8h8v3M4 13h-1M21 13h-1"/>',
  wine: '<path d="M8 3h8v5a4 4 0 0 1-8 0V3Z"/><path d="M12 12v8M9 21h6"/>',
  table: '<path d="M4 8h16M6 8v12M18 8v12M8 14h8"/>',
  picnic: '<path d="M4 14h16M6 10h12M8 14l-3 6M16 14l3 6M12 10v10"/>',
  fire: '<path d="M8.5 14.5A4 4 0 1 0 16 16c0-4-4-5.5-4-11-3 2-6 5-6 10a6 6 0 0 0 12 0c0-1.2-.3-2.4-.8-3.3"/>',
  parking: '<path d="M6 21V3h7a5 5 0 0 1 0 10H9v8M9 10h4a2 2 0 0 0 0-4H9v4Z"/>'
};

const facilityItems = [
  {
    icon: "hairdryer",
    title: { az: "Saç qurudan", ru: "Фен", en: "Hair dryer" },
    description: { az: "Saçlarınız üçün qayğı", ru: "Уход за волосами", en: "For easy hair care" }
  },
  {
    icon: "bath",
    title: { az: "Hamam ləvazimatları", ru: "Ванные принадлежности", en: "Bathroom essentials" },
    description: { az: "Şampun, sabun, duş geli və s.", ru: "Шампунь, мыло, гель для душа", en: "Shampoo, soap, shower gel and more" }
  },
  {
    icon: "heater",
    title: { az: "İsidici", ru: "Отопление", en: "Heating" },
    description: { az: "Qış aylarında isti və rahat mühit", ru: "Тепло и комфорт зимой", en: "Warm comfort in winter months" }
  },
  {
    icon: "bottle",
    title: { az: "Şampun", ru: "Шампунь", en: "Shampoo" },
    description: { az: "Keyfiyyətli saç baxım məhsulu", ru: "Качественное средство для волос", en: "Quality hair care product" }
  },
  {
    icon: "shower",
    title: { az: "İsti su", ru: "Горячая вода", en: "Hot water" },
    description: { az: "24/7 fasiləsiz isti su təchizatı", ru: "Горячая вода 24/7", en: "Continuous hot water supply" }
  },
  {
    icon: "bottle",
    title: { az: "Saç kondisioneri", ru: "Кондиционер для волос", en: "Hair conditioner" },
    description: { az: "Yumşaqlıq və parıltı üçün", ru: "Для мягкости и блеска", en: "For softness and shine" }
  },
  {
    icon: "shower",
    title: { az: "Duş kabini", ru: "Душевая кабина", en: "Shower cabin" },
    description: { az: "Rahat və geniş duş sahəsi", ru: "Удобная душевая зона", en: "Comfortable shower area" }
  },
  {
    icon: "bottle",
    title: { az: "Sabun", ru: "Мыло", en: "Soap" },
    description: { az: "Əl və bədən üçün sabun", ru: "Для рук и тела", en: "For hands and body" }
  },
  {
    icon: "bottle",
    title: { az: "Duş geli", ru: "Гель для душа", en: "Shower gel" },
    description: { az: "Təravətli duş təcrübəsi", ru: "Свежесть после душа", en: "A fresh shower experience" }
  },
  {
    icon: "bed",
    title: { az: "Mələfələr", ru: "Простыни", en: "Sheets" },
    description: { az: "Təmiz və yumşaq mələfələr", ru: "Чистые и мягкие простыни", en: "Clean and soft sheets" }
  },
  {
    icon: "roll",
    title: { az: "Tualet kağızı", ru: "Туалетная бумага", en: "Toilet paper" },
    description: { az: "Daimi təminat", ru: "Постоянно в наличии", en: "Always stocked" }
  },
  {
    icon: "bed",
    title: { az: "Əlavə yataq və ədyallar", ru: "Дополнительная кровать и одеяла", en: "Extra bed and blankets" },
    description: { az: "Əlavə rahatlıq üçün", ru: "Для дополнительного комфорта", en: "For extra comfort" }
  },
  {
    icon: "bottle",
    title: { az: "Qab yuyan maye", ru: "Средство для посуды", en: "Dish soap" },
    description: { az: "Mətbəx təmizliyi üçün", ru: "Для чистоты на кухне", en: "For kitchen cleanup" }
  },
  {
    icon: "desk",
    title: { az: "Xüsusi iş masası", ru: "Рабочий стол", en: "Dedicated workspace" },
    description: { az: "İş və oxu üçün rahat zona", ru: "Удобная зона для работы и чтения", en: "A comfortable work and reading spot" }
  },
  {
    icon: "hanger",
    title: { az: "Asılqan", ru: "Вешалки", en: "Hangers" },
    description: { az: "Geyimlərinizi səliqəli saxlayın", ru: "Для аккуратного хранения одежды", en: "Keep clothes neatly stored" }
  },
  {
    icon: "bath",
    title: { az: "Dəsmallar", ru: "Полотенца", en: "Towels" },
    description: { az: "Hamam üçün təmiz dəsmallar", ru: "Чистые полотенца для ванной", en: "Clean bathroom towels" }
  },
  {
    icon: "wardrobe",
    title: { az: "Geyim dolabı", ru: "Шкаф для одежды", en: "Wardrobe" },
    description: { az: "Geniş və rahat dolab", ru: "Просторный и удобный шкаф", en: "Spacious and practical storage" }
  },
  {
    icon: "wardrobe",
    title: { az: "Otağı qaranlıqlaşdıran pərdələr", ru: "Плотные шторы", en: "Room-darkening curtains" },
    description: { az: "Dərin və rahat yuxu üçün", ru: "Для глубокого и спокойного сна", en: "For deeper, calmer sleep" }
  },
  {
    icon: "bed",
    title: { az: "Yataq dəsti", ru: "Постельный комплект", en: "Bedding set" },
    description: { az: "Keyfiyyətli yataq dəsti", ru: "Качественный комплект постели", en: "Quality bedding set" }
  },
  {
    icon: "fridge",
    title: { az: "Soyuducu", ru: "Холодильник", en: "Refrigerator" },
    description: { az: "Yemək və içkilərinizi təzə saxlayın", ru: "Для свежести еды и напитков", en: "Keep food and drinks fresh" }
  },
  {
    icon: "cooktop",
    title: { az: "Elektrik bişirmə paneli", ru: "Электрическая плита", en: "Electric cooktop" },
    description: { az: "Rahat yemək hazırlığı", ru: "Для удобного приготовления еды", en: "Easy meal preparation" }
  },
  {
    icon: "utensils",
    title: { az: "Qab və qaşıq", ru: "Посуда и приборы", en: "Dishes and cutlery" },
    description: { az: "Tam dəst qablar və mətbəx ləvazimatları", ru: "Полный набор кухонных принадлежностей", en: "Complete kitchenware set" }
  },
  {
    icon: "kettle",
    title: { az: "Elektrik çaydan", ru: "Электрический чайник", en: "Electric kettle" },
    description: { az: "Çay və qəhvə üçün", ru: "Для чая и кофе", en: "For tea and coffee" }
  },
  {
    icon: "utensils",
    title: { az: "Konserv açan", ru: "Открывалка", en: "Can opener" },
    description: { az: "Praktik mətbəx aləti", ru: "Практичный кухонный инструмент", en: "A practical kitchen tool" }
  },
  {
    icon: "knife",
    title: { az: "Mətbəx bıçaqları", ru: "Кухонные ножи", en: "Kitchen knives" },
    description: { az: "Kəsmə işləri üçün", ru: "Для нарезки продуктов", en: "For food preparation" }
  },
  {
    icon: "pot",
    title: { az: "Qazan və tava", ru: "Кастрюля и сковорода", en: "Pots and pans" },
    description: { az: "Yemək bişirmək üçün", ru: "Для приготовления еды", en: "For cooking meals" }
  },
  {
    icon: "utensils",
    title: { az: "Yağ, duz və istiot", ru: "Масло, соль и перец", en: "Oil, salt and pepper" },
    description: { az: "Əsas ədviyyatlar", ru: "Базовые специи", en: "Essential seasonings" }
  },
  {
    icon: "roll",
    title: { az: "Mətbəx salfeti", ru: "Кухонные салфетки", en: "Kitchen towels" },
    description: { az: "Təmizlik və rahatlıq üçün", ru: "Для чистоты и удобства", en: "For cleanup and comfort" }
  },
  {
    icon: "wine",
    title: { az: "Şərab stəkanları", ru: "Бокалы для вина", en: "Wine glasses" },
    description: { az: "Xüsusi anlar üçün", ru: "Для особых моментов", en: "For special moments" }
  },
  {
    icon: "table",
    title: { az: "Yemək masası", ru: "Обеденный стол", en: "Dining table" },
    description: { az: "Rahat yemək sahəsi", ru: "Удобное место для еды", en: "A comfortable dining area" }
  },
  {
    icon: "picnic",
    title: { az: "Piknik masası və stullar", ru: "Стол и стулья для пикника", en: "Picnic table and chairs" },
    description: { az: "Açıq hava istirahəti üçün", ru: "Для отдыха на свежем воздухе", en: "For outdoor relaxation" }
  },
  {
    icon: "fire",
    title: { az: "Tonqal yeri", ru: "Место для костра", en: "Fire pit" },
    description: { az: "Axşamlar üçün xoş atmosfer", ru: "Уютная атмосфера по вечерам", en: "A warm evening atmosphere" }
  },
  {
    icon: "parking",
    title: { az: "Ödənişsiz parking", ru: "Бесплатная парковка", en: "Free parking" },
    description: { az: "Təhlükəsiz parking imkanı", ru: "Безопасное место для парковки", en: "Secure parking space" }
  }
];

const getText = (key) => fillSettings(text[currentLang][key] ?? text.az[key] ?? sharedText(currentLang, key) ?? key, currentLang, selectedHome);
const getHome = () => homes[selectedHome] ?? homes.qaya;

const renderFacilityIcon = (icon) => `
  <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
    ${facilityIconPaths[icon] ?? facilityIconPaths.default}
  </svg>
`;

const renderFacilities = () => {
  if (!facilitiesList) {
    return;
  }

  facilitiesList.innerHTML = facilityItems
    .map(
      (item, index) => `
        <article class="facility-item" style="--facility-delay: ${index % 9}">
          <span class="facility-icon">${renderFacilityIcon(item.icon)}</span>
          <span class="facility-copy">
            <strong>${item.title[currentLang]}</strong>
          </span>
        </article>
      `
    )
    .join("");
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
  renderOtherHomes();
};

const houseUrl = (home) => {
  const query = new URLSearchParams({
    home,
    lang: currentLang,
    theme: currentTheme
  });
  return `house.html?${query.toString()}`;
};

const updateShareLinks = () => {
  const pageUrl = window.location.href;
  const title = document.title;

  shareLinks.forEach((link) => {
    if (link.dataset.shareLink === "facebook") {
      link.href = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(pageUrl)}`;
    }
    if (link.dataset.shareLink === "whatsapp") {
      link.href = `https://wa.me/?text=${encodeURIComponent(`${title} ${pageUrl}`)}`;
    }
    if (link.dataset.shareLink === "telegram") {
      link.href = `https://t.me/share/url?url=${encodeURIComponent(pageUrl)}&text=${encodeURIComponent(title)}`;
    }
  });
};

const setShareMenu = (isOpen) => {
  if (!shareMenu || !shareButton) {
    return;
  }
  shareMenu.classList.toggle("is-open", isOpen);
  shareMenu.setAttribute("aria-hidden", String(!isOpen));
  shareButton.setAttribute("aria-expanded", String(isOpen));
};

const renderOtherHomes = () => {
  const container = document.querySelector("[data-other-homes]");
  container.innerHTML = Object.entries(homes)
    .filter(([key]) => key !== selectedHome)
    .map(([key, home]) => `<a class="secondary-link" href="${houseUrl(key)}">${home.name}<svg><use href="#icon-arrow" /></svg></a>`)
    .join("");
};

const formatSpecialValue = (rule) =>
  rule.type === "price" ? `${rule.value} AZN / ${getText("specials.night")}` : `${rule.type === "increase" ? "+" : "−"}${rule.value}%`;
const formatSpecialDates = (rule) =>
  rule.yearly
    ? `${formatMonthDay(rule.start.slice(5), currentLang)} – ${formatMonthDay(rule.end.slice(5), currentLang)}`
    : `${formatDate(rule.start)} – ${formatDate(rule.end)}`;

const renderSpecials = () => {
  const box = document.querySelector("[data-special-offers]");
  if (!box) {
    return;
  }
  const rules = upcomingSpecials(selectedHome, todayIso);
  box.hidden = !rules.length;
  box.innerHTML = rules.length
    ? `<h3>${getText("specials.title")}</h3>${rules
        .map((rule) => `<div class="price-row special-row"><span>${rule.name}<small>${formatSpecialDates(rule)}</small></span><strong>${formatSpecialValue(rule)}</strong></div>`)
        .join("")}`
    : "";
};

const renderPrices = () => {
  const container = document.querySelector("[data-price-list]");
  container.innerHTML = priceRows(selectedHome, currentLang)
    .map(
      (row) => `
        <div class="price-row${row.value ? "" : " is-note"}">
          <span>${row.label}</span>
          ${row.value ? `<strong>${row.value}</strong>` : ""}
        </div>
      `
    )
    .join("");
};

const pad = (value) => String(value).padStart(2, "0");

const monthNames = {
  az: ["yanvar", "fevral", "mart", "aprel", "may", "iyun", "iyul", "avqust", "sentyabr", "oktyabr", "noyabr", "dekabr"],
  ru: ["январь", "февраль", "март", "апрель", "май", "июнь", "июль", "август", "сентябрь", "октябрь", "ноябрь", "декабрь"],
  en: ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"]
};

const weekdayNames = {
  az: ["BE", "ÇA", "Çə", "CA", "Cü", "Şə", "Bz"],
  ru: ["ПН", "ВТ", "СР", "ЧТ", "ПТ", "СБ", "ВС"],
  en: ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"]
};

const emptyBookedDates = () => ({ qaya: [], ardic: [], palid: [], glamp4: [], glamp2: [] });
const isIsoDate = (value) => typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value);
const normalizeBookedDateList = (dates) => [...new Set(Array.isArray(dates) ? dates.filter(isIsoDate) : [])].sort();
const normalizeBookedDates = (value) => ({
  qaya: normalizeBookedDateList(value?.qaya),
  ardic: normalizeBookedDateList(value?.ardic),
  glamp4: normalizeBookedDateList(value?.glamp4),
  glamp2: normalizeBookedDateList(value?.glamp2),
  palid: normalizeBookedDateList(value?.palid)
});

// dolu gecələr bazadan gəlir (admin bağladıqları + gözləyən və təsdiqlənmiş rezervlər)
let busyNights = emptyBookedDates();

const getSelectedBookedDates = () => new Set(busyNights[selectedHome] || []);

const toIsoDate = (date) => `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
const fromIsoDate = (iso) => {
  const [year, month, day] = iso.split("-").map(Number);
  return new Date(year, month - 1, day);
};
const addDays = (iso, amount) => {
  const date = fromIsoDate(iso);
  date.setDate(date.getDate() + amount);
  return toIsoDate(date);
};
const addMonths = (date, amount) => new Date(date.getFullYear(), date.getMonth() + amount, 1);
const dayDiff = (startIso, endIso) => Math.max(0, Math.round((fromIsoDate(endIso) - fromIsoDate(startIso)) / 86400000));
const todayIso = toIsoDate(new Date());

const guestLimitReached = (guests, key) => guestLimitHit(homeRules(selectedHome), guests, key);

const getNightlyPrice = () => nightlyPrice(selectedHome, reservationState.guests.adults);

const formatCurrency = (amount) => `${amount} ₼`;

const formatDate = (iso) => {
  if (!iso) {
    return getText("reservation.selectDate");
  }
  const date = fromIsoDate(iso);
  return `${date.getDate()} ${monthNames[currentLang][date.getMonth()]} ${date.getFullYear()}`;
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
  const { adults, children, pets } = reservationState.guests;
  if (currentLang === "ru") {
    return [`${adults} взросл.`, children ? `${children} дет.` : "", pets ? `${pets} дом. живот.` : ""].filter(Boolean).join(", ");
  }
  if (currentLang === "en") {
    return [`${adults} adult${adults === 1 ? "" : "s"}`, children ? `${children} child${children === 1 ? "" : "ren"}` : "", pets ? `${pets} pet${pets === 1 ? "" : "s"}` : ""].filter(Boolean).join(", ");
  }
  return [`${adults} böyük`, children ? `${children} uşaq` : "", pets ? `${pets} ev heyvanı` : ""].filter(Boolean).join(", ");
};

const isDateUnavailable = (iso) => {
  return iso < todayIso || getSelectedBookedDates().has(iso);
};

const isDateReserved = (iso) => {
  return getSelectedBookedDates().has(iso);
};

// dolu tarix həmin günün gecəsidir: çıxış saatı girişdən tez olduğu üçün çıxış günü
// başqa qonağın giriş günü ola bilər; yoxlanılan gecələr girişdən çıxışdan bir gün əvvələ qədərdir
const rangeHasUnavailableDate = (startIso, endIso) => {
  let cursor = addDays(startIso, 1);
  while (cursor < endIso) {
    if (isDateUnavailable(cursor)) {
      return true;
    }
    cursor = addDays(cursor, 1);
  }
  return false;
};

const getReservationMath = () => {
  const nights = reservationState.checkin && reservationState.checkout ? dayDiff(reservationState.checkin, reservationState.checkout) : 0;
  return stayMath(selectedHome, reservationState.guests.adults, reservationState.checkin, reservationState.checkout, nights, reservationState.promo);
};

const setElementText = (selector, value) => {
  document.querySelectorAll(selector).forEach((element) => {
    element.textContent = value;
  });
};

const renderGuestEditors = () => {
  document.querySelectorAll("[data-pets-info]").forEach((box) => {
    box.hidden = !reservationState.guests.pets;
  });
  reservationGuestOutputs.forEach((output) => {
    output.textContent = String(reservationState.guests[output.dataset.resGuestCount]);
  });

  reservationGuestSteps.forEach((button) => {
    const key = button.dataset.resGuestStep;
    const minimum = minFor(key);
    const isMinus = Number(button.dataset.step) < 0;
    button.disabled = isMinus ? reservationState.guests[key] <= minimum : guestLimitReached(reservationState.guests, key);
  });
};

const renderReservationSummary = () => {
  const { nights, lines, discount, promo, heating, total } = getReservationMath();
  const guestLine = formatGuestLine();
  renderPromoUi(promo, reservationState.promo, getText, formatCurrency);

  setElementText("[data-summary-checkin]", formatDate(reservationState.checkin));
  setElementText("[data-summary-checkout]", formatDate(reservationState.checkout));
  setElementText("[data-summary-total]", formatCurrency(total));
  setElementText("[data-form-checkin]", formatDate(reservationState.checkin));
  setElementText("[data-form-checkout]", formatDate(reservationState.checkout));
  setElementText("[data-form-nights]", formatNightText(nights));
  setElementText("[data-form-guests]", guestLine);
  renderNightLines(
    lines,
    (line) => `${formatCurrency(line.price)} x ${formatNightText(line.nights)}${line.label ? ` · ${line.label}` : ""}`,
    (line) => formatCurrency(line.price * line.nights)
  );
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

  if (reservationGuestLine) {
    reservationGuestLine.textContent = guestLine;
  }
  if (reserveStart) {
    reserveStart.disabled = !reservationState.checkin || !reservationState.checkout;
    document.querySelectorAll("[data-reserve-hint]").forEach((hint) => {
      hint.hidden = !reserveStart.disabled;
    });
  }
  renderGuestEditors();
};

const buildMonthCalendar = (monthDate) => {
  const year = monthDate.getFullYear();
  const month = monthDate.getMonth();
  const first = new Date(year, month, 1);
  const totalDays = new Date(year, month + 1, 0).getDate();
  const leadBlanks = (first.getDay() + 6) % 7;
  const price = getNightlyPrice();
  const blanks = Array.from({ length: leadBlanks }, () => `<span class="calendar-day is-empty"></span>`).join("");
  const days = Array.from({ length: totalDays }, (_, index) => {
    const day = index + 1;
    const iso = `${year}-${pad(month + 1)}-${pad(day)}`;
    const reserved = isDateReserved(iso);
    const past = iso < todayIso;
    const special = specialFor(selectedHome, iso);
    // seçilmiş girişdən sonra dolu gün yalnız çıxış günü kimi seçilə bilər
    const canCheckout =
      reserved && !past && reservationState.checkin && !reservationState.checkout && iso > reservationState.checkin && !rangeHasUnavailableDate(reservationState.checkin, iso);
    const disabled = past || (reserved && !canCheckout);
    const isCheckin = reservationState.checkin === iso;
    const isCheckout = reservationState.checkout === iso;
    const isInRange = reservationState.checkin && reservationState.checkout && iso > reservationState.checkin && iso < reservationState.checkout;

    return `
      <button
        class="calendar-day ${disabled ? "is-unavailable" : ""} ${past ? "is-past" : ""} ${reserved ? "is-reserved" : ""} ${canCheckout ? "is-checkout-only" : ""} ${isCheckin || isCheckout ? "is-selected" : ""} ${isInRange ? "is-in-range" : ""} ${special && !reserved ? "is-special" : ""}"
        type="button"
        data-calendar-date="${iso}"
        ${special ? `title="${special.name}"` : ""}
        ${disabled ? "disabled" : ""}
      >
        <span>${day}</span>
        <em>${canCheckout ? getText("reservation.checkoutOnly") : reserved ? getText("reservation.reserved") : formatCurrency(calendarNightPrice(selectedHome, reservationState.guests.adults, iso))}</em>
      </button>
    `;
  }).join("");

  return `
    <article class="calendar-month">
      <h3>${monthNames[currentLang][month]} ${year}</h3>
      <div class="calendar-weekdays">
        ${weekdayNames[currentLang].map((day) => `<span>${day}</span>`).join("")}
      </div>
      <div class="calendar-days">${blanks}${days}</div>
    </article>
  `;
};

const renderCalendar = () => {
  if (!calendarMonths) {
    return;
  }
  calendarMonths.innerHTML = [reservationState.calendarStart, addMonths(reservationState.calendarStart, 1)]
    .map((monthDate) => buildMonthCalendar(monthDate))
    .join("");

  calendarMonths.querySelectorAll("[data-calendar-date]").forEach((button) => {
    button.addEventListener("click", () => {
      const iso = button.dataset.calendarDate;
      if (!reservationState.checkin || reservationState.checkout || iso <= reservationState.checkin) {
        if (isDateUnavailable(iso)) {
          return;
        }
        reservationState.checkin = iso;
        reservationState.checkout = null;
      } else if (!rangeHasUnavailableDate(reservationState.checkin, iso)) {
        reservationState.checkout = iso;
      } else if (!isDateUnavailable(iso)) {
        reservationState.checkin = iso;
        reservationState.checkout = null;
      }
      renderCalendar();
      renderReservationSummary();
    });
  });
};

const syncReservationDatesWithAvailability = () => {
  if (reservationState.checkin && isDateUnavailable(reservationState.checkin)) {
    reservationState.checkin = null;
    reservationState.checkout = null;
    return;
  }
  if (
    reservationState.checkin &&
    reservationState.checkout &&
    (reservationState.checkout <= reservationState.checkin || rangeHasUnavailableDate(reservationState.checkin, reservationState.checkout))
  ) {
    reservationState.checkout = null;
  }
};

const renderBookingFlow = () => {
  syncReservationDatesWithAvailability();
  renderCalendar();
  renderReservationSummary();
};

const reservationUrl = () => {
  const query = new URLSearchParams({
    home: selectedHome,
    lang: currentLang,
    theme: currentTheme,
    checkin: reservationState.checkin,
    checkout: reservationState.checkout,
    adults: String(reservationState.guests.adults),
    children: String(reservationState.guests.children),
    pets: String(reservationState.guests.pets),
    promo: reservationState.promo
  });
  return `reservation.html?${query.toString()}`;
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
  syncModalLock();
};

const closeReservationWarning = () => {
  if (!reservationWarning) {
    return;
  }
  reservationWarning.classList.remove("is-open");
  reservationWarning.setAttribute("aria-hidden", "true");
  syncModalLock();
};

const buildWhatsAppMessage = (result) => {
  const home = getHome();
  const { nights, lines, discount, promo, heating, total } = getReservationMath();
  const formData = new FormData(reservationForm);
  return [
    ...reservationMessageHead(result, currentLang),
    `Ev: ${home.name}`,
    `Giriş (saat ${SETTINGS.checkinTime}): ${formatDate(reservationState.checkin)}`,
    `Çıxış (saat ${SETTINGS.checkoutTime}): ${formatDate(reservationState.checkout)}`,
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

const isLightboxOpen = () => lightbox?.classList.contains("is-open");
const isGalleryOpen = () => galleryModal?.classList.contains("is-open");
const isReservationWarningOpen = () => reservationWarning?.classList.contains("is-open");

const syncModalLock = () => {
  document.body.classList.toggle("modal-open", Boolean(isLightboxOpen() || isGalleryOpen() || isReservationWarningOpen()));
};

const getMediaItems = (home) => [
  ...(home.gallery || []).map((src, index) => ({
    type: "image",
    src,
    label: `${home.name} ${index + 1}`
  })),
  ...(home.videos || []).map((src, index) => ({
    type: "video",
    src,
    label: `${home.name} ${getText("media.video")} ${index + 1}`
  }))
];

const openLightbox = (src, alt) => {
  if (!lightbox || !lightboxImage) {
    return;
  }
  lightboxImage.src = src;
  lightboxImage.alt = alt;
  lightbox.classList.add("is-open");
  lightbox.setAttribute("aria-hidden", "false");
  syncModalLock();
};

const closeLightbox = () => {
  if (!lightbox) {
    return;
  }
  lightbox.classList.remove("is-open");
  lightbox.setAttribute("aria-hidden", "true");
  syncModalLock();
};

const renderGalleryModal = (home) => {
  if (!galleryAll || !galleryTitle) {
    return;
  }

  const items = getMediaItems(home);
  galleryTitle.textContent = `${home.name} - ${getText("media.allTitle")}`;
  galleryAll.innerHTML = items
    .map((item, index) => {
      if (item.type === "video") {
        return `
          <div class="all-media-item all-media-video">
            <video src="${item.src}" controls playsinline preload="metadata" aria-label="${item.label}"></video>
          </div>
        `;
      }

      return `
        <button class="all-media-item" type="button" data-lightbox-src="${item.src}" aria-label="${getText("media.openImage")} ${index + 1}">
          <img src="${item.src}" alt="${item.label}" loading="lazy" />
        </button>
      `;
    })
    .join("");

  galleryAll.querySelectorAll("[data-lightbox-src]").forEach((button) => {
    button.addEventListener("click", () => {
      const image = button.querySelector("img");
      openLightbox(button.dataset.lightboxSrc, image?.alt || home.name);
    });
  });
};

const openGallery = () => {
  if (!galleryModal) {
    return;
  }
  galleryModal.classList.add("is-open");
  galleryModal.setAttribute("aria-hidden", "false");
  syncModalLock();
};

const closeGallery = () => {
  if (!galleryModal) {
    return;
  }
  galleryModal.classList.remove("is-open");
  galleryModal.setAttribute("aria-hidden", "true");
  galleryModal.querySelectorAll("video").forEach((video) => video.pause());
  syncModalLock();
};

const renderMedia = (home) => {
  const container = document.querySelector("[data-house-media]");
  const items = getMediaItems(home);

  if (!container) {
    return;
  }

  if (!items.length) {
    container.innerHTML = `
      <div class="media-placeholder">
        <svg><use href="#icon-play" /></svg>
        <span>${getText("media.video")}</span>
      </div>
    `;
    return;
  }

  container.innerHTML = `
    ${items
      .slice(0, 5)
      .map((item, index) => {
        if (item.type === "video") {
          return `
            <button class="media-tile media-preview-video" type="button" data-open-gallery aria-label="${getText("media.openGallery")}">
              <video src="${item.src}" muted playsinline preload="metadata" aria-label="${item.label}"></video>
              <span class="play-badge"><svg><use href="#icon-play" /></svg></span>
            </button>
          `;
        }

        return `
          <button class="media-tile" type="button" data-lightbox-src="${item.src}" aria-label="${getText("media.openImage")} ${index + 1}">
            <img src="${item.src}" alt="${item.label}" loading="${index === 0 ? "eager" : "lazy"}" />
          </button>
        `;
      })
      .join("")}
    <button class="media-show-all" type="button" data-open-gallery aria-label="${getText("media.openGallery")}">
      <svg><use href="#icon-grid" /></svg>
      <span>${getText("media.showAll")}</span>
    </button>
  `;

  container.querySelectorAll("[data-lightbox-src]").forEach((button) => {
    button.addEventListener("click", () => {
      const image = button.querySelector("img");
      openLightbox(button.dataset.lightboxSrc, image?.alt || home.name);
    });
  });

  container.querySelectorAll("[data-open-gallery]").forEach((button) => {
    button.addEventListener("click", openGallery);
  });

  renderGalleryModal(home);
};

const renderPage = () => {
  const home = getHome();
  html.lang = currentLang;
  document.title = `Avakhyl | ${home.name}`;
  document.querySelector('meta[name="description"]').setAttribute("content", `${home.name} - Avakhyl`);
  document.querySelector("[data-house-name]").textContent = home.name;
  document.querySelector("[data-house-kicker]").textContent = home.kicker[currentLang];
  document.querySelector("[data-house-description]").textContent = home.description[currentLang];
  const heroImage = document.querySelector("[data-house-hero]");
  if (heroImage) {
    heroImage.src = home.image;
  }
  renderMedia(home);
  renderFacilities();
  renderPrices();
  renderSpecials();
  renderBookingFlow();
  carryParams(currentLang, currentTheme);
  document.querySelectorAll("[data-i18n]").forEach((element) => {
    element.textContent = getText(element.dataset.i18n);
  });
  document.querySelectorAll("[data-i18n-aria]").forEach((element) => {
    element.setAttribute("aria-label", getText(element.dataset.i18nAria));
  });
  document.querySelectorAll("[data-i18n-placeholder]").forEach((element) => {
    element.setAttribute("placeholder", getText(element.dataset.i18nPlaceholder));
  });
  document.querySelectorAll("[data-lang]").forEach((button) => {
    const isActive = button.dataset.lang === currentLang;
    button.classList.toggle("is-active", isActive);
    button.setAttribute("aria-pressed", String(isActive));
  });
  renderOtherHomes();
  updateThemeLabels();
  updateShareLinks();
};

document.querySelectorAll("[data-lang]").forEach((button) => {
  button.addEventListener("click", () => {
    currentLang = button.dataset.lang;
    renderPage();
  });
});

document.querySelectorAll("[data-theme-toggle]").forEach((button) => {
  button.addEventListener("click", () => setTheme(currentTheme === "dark" ? "light" : "dark"));
});

if (shareButton) {
  shareButton.addEventListener("click", () => {
    setShareMenu(!shareMenu?.classList.contains("is-open"));
  });
}

if (instagramShare) {
  instagramShare.addEventListener("click", async () => {
    const pageUrl = window.location.href;
    if (navigator.share) {
      await navigator.share({ title: document.title, url: pageUrl });
    } else {
      await navigator.clipboard?.writeText(pageUrl);
      window.open("https://www.instagram.com/", "_blank", "noopener");
    }
    setShareMenu(false);
  });
}

shareLinks.forEach((link) => {
  link.addEventListener("click", () => setShareMenu(false));
});

if (calendarPrev) {
  calendarPrev.addEventListener("click", () => {
    reservationState.calendarStart = addMonths(reservationState.calendarStart, -1);
    renderCalendar();
  });
}

if (calendarNext) {
  calendarNext.addEventListener("click", () => {
    reservationState.calendarStart = addMonths(reservationState.calendarStart, 1);
    renderCalendar();
  });
}

if (reservationGuestToggle && reservationGuestEditor) {
  reservationGuestToggle.addEventListener("click", () => {
    reservationGuestEditor.classList.toggle("is-open");
  });
}

reservationGuestSteps.forEach((button) => {
  button.addEventListener("click", () => {
    const key = button.dataset.resGuestStep;
    const step = Number(button.dataset.step);
    const minimum = minFor(key);
    if (step > 0 && guestLimitReached(reservationState.guests, key)) {
      return;
    }
    reservationState.guests[key] = Math.max(minimum, reservationState.guests[key] + step);
    renderCalendar();
    renderReservationSummary();
  });
});

bindPromoInputs((code) => {
  reservationState.promo = code;
  renderReservationSummary();
});

if (reserveStart) {
  reserveStart.addEventListener("click", () => {
    if (!reservationState.checkin || !reservationState.checkout) {
      alert(getText("reservation.noDates"));
      return;
    }
    window.location.href = reservationUrl();
  });
}

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
      checkin: reservationState.checkin,
      checkout: reservationState.checkout,
      guests: reservationState.guests,
      form: reservationForm,
      math: getReservationMath(),
      lang: currentLang
    });
    sendReservation({ payload, buildMessage: buildWhatsAppMessage, getText, button: warningSend, statusBox: bookingStatus }).then(refreshBookingAvailability);
  });
}

if (lightboxClose) {
  lightboxClose.addEventListener("click", closeLightbox);
}

if (galleryClose) {
  galleryClose.addEventListener("click", closeGallery);
}

if (lightbox) {
  lightbox.addEventListener("click", (event) => {
    if (event.target === lightbox) {
      closeLightbox();
    }
  });
}

if (galleryModal) {
  galleryModal.addEventListener("click", (event) => {
    if (event.target === galleryModal) {
      closeGallery();
    }
  });
}

if (reservationWarning) {
  reservationWarning.addEventListener("click", (event) => {
    if (event.target === reservationWarning) {
      closeReservationWarning();
    }
  });
}

document.addEventListener("click", (event) => {
  if (shareMenu?.contains(event.target) || shareButton?.contains(event.target)) {
    return;
  }
  setShareMenu(false);
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    closeLightbox();
    closeGallery();
    closeReservationWarning();
    setShareMenu(false);
  }
});

// dolu tarixlər açılışda, səhifəyə qayıdanda və hər dəqiqə yenilənir
const refreshBookingAvailability = async () => {
  try {
    busyNights = normalizeBookedDates(await fetchBusyNights());
    renderBookingFlow();
  } catch {
    // internet yoxdursa son yüklənən tarixlər qalır
  }
};

window.addEventListener("pageshow", refreshBookingAvailability);
document.addEventListener("visibilitychange", () => {
  if (!document.hidden) {
    refreshBookingAvailability();
  }
});
window.setInterval(refreshBookingAvailability, 60000);

document.addEventListener("avakhyl:settings", renderPage);

const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.14 }
);

document.querySelectorAll(".reveal").forEach((element) => observer.observe(element));
setTheme(currentTheme);
renderPage();
if (reservationState.promo) {
  loadPromo(reservationState.promo).then(renderPage);
}
