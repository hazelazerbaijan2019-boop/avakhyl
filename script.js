const header = document.querySelector("[data-header]");
const mobileMenu = document.querySelector("[data-mobile-menu]");
const menuOpen = document.querySelector("[data-menu-open]");
const menuClose = document.querySelector("[data-menu-close]");
const bookingForm = document.querySelector("[data-booking-form]");
const homeSelect = document.querySelector("[data-home-select]");
const modal = document.querySelector("[data-modal]");
const modalClose = document.querySelector("[data-modal-close]");
const guestCountOutputs = document.querySelectorAll("[data-guest-count]");
const guestStepButtons = document.querySelectorAll("[data-guest-step]");
const guestCalculate = document.querySelector("[data-guest-calculate]");
const faqList = document.querySelector("[data-faq-list]");
const mailLink = document.querySelector("[data-mail-link]");
const html = document.documentElement;
// dil və fon digər səhifələrdən linklə gəlir (?lang=ru&theme=dark)
const pageParams = new URLSearchParams(window.location.search);
let currentLang = ["az", "ru", "en"].includes(pageParams.get("lang")) ? pageParams.get("lang") : "az";
let currentTheme = pageParams.get("theme") === "dark" ? "dark" : "light";
let selectedCottage = "qaya";
const guestCounts = {
  adults: 1,
  children: 0,
  pets: 0
};

const housePages = {
  qaya: "house.html?home=qaya",
  ardic: "house.html?home=ardic",
  glamp4: "house.html?home=glamp4",
  glamp2: "house.html?home=glamp2",
  palid: "house.html?home=palid"
};

const translations = {
  az: {
    metaTitle: "Avakhyl | Təbiətin içində ev rahatlığı",
    metaDescription: "Avakhyl Şamaxı, Avaxıl kəndində sakit, özəl və rahat kotec istirahəti üçün rezervasiya sorğusu.",
    "aria.home": "Avakhyl əsas səhifə",
    "aria.nav": "Əsas naviqasiya",
    "aria.language": "Dil seçimi",
    "aria.openMenu": "Menyunu aç",
    "aria.closeMenu": "Menyunu bağla",
    "aria.close": "Bağla",
    "aria.benefits": "Avakhyl əsas üstünlükləri",
    "aria.homeSelect": "Evi seç",
    "brand.by": "by Epoxy Azerbaijan Co.",
    "nav.homes": "Evlər",
    "nav.experience": "AGACH",
    "nav.notes": "Qeydlər",
    "nav.faq": "FAQ",
    "theme.toDark": "Qara fon",
    "theme.toLight": "Ağ fon",
    "action.request": "Sorğu göndər",
    "action.instagram": "Instagram",
    "action.booking": "Rezervasiya sorğusu",
    "action.viewHomes": "Evlərə bax",
    "action.prepare": "Evlərə bax",
    "action.select": "Seç",
    "action.start": "Evi seç",
    "action.email": "E-mail ilə göndər",
    "action.top": "Yuxarı",
    "hero.location": "Şamaxı, Avaxıl kəndi",
    "hero.lead": "Təbiətin içində sakit ev rahatlığı, özəl məkan hissi və şəhər ritmindən yumşaq fasilə.",
    "note.private.title": "Özəl",
    "note.private.text": "ayrı giriş və sakit zona",
    "note.natural.title": "Təbii",
    "note.natural.text": "Şamaxı dağ kəndi atmosferi",
    "note.comfort.title": "Rahat",
    "note.comfort.text": "loft interyer, balkon və Wi-Fi",
    "booking.home": "Evi seç",
    "homes.eyebrow": "Evlər",
    "homes.title": "Avakhyl evləri",
    "homes.text": "Şamaxı, Avaxıl kəndində beş ev seçimi: Qaya, Ardıc, Palıd, Glamphouse böyük və Glamphouse kiçik. Hər evin səhifəsində ayrıca foto və video qalereyası var.",
    "card.one.kicker": "Dağ mənzərəsi",
    "card.one.title": "Qaya 🏔️",
    "card.one.text": "Dağ havası, geniş baxış və sakit səhər ritmi.",
    "card.two.kicker": "Meşə sakitliyi",
    "card.two.title": "Ardıc 🌳",
    "card.two.text": "Loft / Industrial interyer və yaşıl mənzərəyə açılan balkon.",
    "card.three.kicker": "Ailə rahatlığı",
    "card.three.title": "Palıd 🌲",
    "card.three.text": "Tam təchizatlı mətbəx, smart TV, Netflix, YouTube və Fiber Wi-Fi.",
    "card.four.kicker": "Glamping günbəzi",
    "card.four.title": "Glamphouse böyük (4 nəfərlik)",
    "card.four.text": "Panoram pəncərə, mini mətbəx, kondisioner və terras.",
    "card.five.kicker": "Cütlüklər üçün",
    "card.five.title": "Glamphouse kiçik (2 nəfərlik)",
    "card.five.text": "İki nəfərlik yataq, panoram pəncərə və kondisioner.",
    "price.qaya.summary": "2-3 nəfər: 90 AZN-dən",
    "price.ardic.summary": "2-3 nəfərlik: 60 AZN",
    "price.palid.summary": "2-3 nəfərlik: 60 AZN",
    "experience.eyebrow": "AGACH Interiors",
    "experience.title": "Kotecelərin interyeri AGACH tərəfindən hazırlanıb.",
    "experience.text": "Loft / Industrial üslubunda hər detal Avakhyl-in dağ kəndi ruhuna uyğun, isti və funksional hazırlanıb.",
    "feature.one": "AGACH Interiors konseptual dizaynı",
    "feature.two": "Loft / Industrial üslubda isti interyer",
    "feature.three": "Hər ev üçün özəl dizayner detalları",
    "flow.eyebrow": "Rezervasiya axını",
    "flow.title": "Dörd addımda Avakhyl sorğusu",
    "flow.one.title": "Evi seç",
    "flow.one.text": "Qaya, Ardıc, Palıd, Glamphouse böyük və ya kiçik seçimlərindən birini seç.",
    "flow.two.title": "Tarixi əlavə et",
    "flow.two.text": "Giriş və çıxış tarixlərini qeyd et.",
    "flow.three.title": "Şəxsi məlumatları qeyd et",
    "flow.three.text": "Ad, soyad, əlaqə və digər lazımi məlumatları əlavə et.",
    "flow.four.title": "Təsdiq gözlə",
    "flow.four.text": "Komanda yoxlayıb geri dönüş edir və rezervasiyan hazır olur.",
    "notes.eyebrow": "Vacib qeydlər",
    "notes.title": "Girişdən əvvəl bilinməli olanlar",
    "notes.text": "Bu qaydalar evlərin qorunması və qonaqların rahat qalması üçün tətbiq olunur.",
    "notes.one": "Check-in zamanı {deposit} AZN depozit tələb olunur. Depozit girişdə ödənilir və çıxışda geri qaytarılır.",
    "notes.two": "İstisnasız qaydada 18 yaş üstü bütün qonaqlarımız şəxsiyyət vəsiqəsini təqdim etməlidir.",
    "notes.three": "Qeyd olunan məbləğlərə manqal və samovar seti daxildir.",
    "notes.petsTitle": "Ev heyvanlarının qəbulu qaydaları",
    "notes.four": "Evlərə yalnız kiçik ölçülü ev heyvanlarının gətirilməsinə icazə verilir. Heyvanlar qonağın nəzarəti altında olmalıdır.",
    "notes.fourB": "Aqressiv və təhlükə yarada biləcək heyvanların, o cümlədən doberman, alman ovçarkası, pitbull və rotveyler cinslərinin qəbulu qadağandır.",
    "notes.fourC": "Hər evə maksimum {maxPets} ev heyvanı qəbul edilir.",
    "notes.five": "{heatingFrom} – {heatingTo} tarixləri arasında {heatingUnit} +{heatingFee} AZN istilik ödənişi alınır.",
    "faq.eyebrow": "FAQ",
    "faq.title": "Ən çox soruşulanlar",
    "faq.text": "Avakhyl haqqında əsas cavablar burada toplanıb.",
    "closing.title": "Təbiətə yaxın, qərar verməyə asan.",
    "modal.eyebrow": "Sorğu hazırdır",
    "modal.title": "Avakhyl rezervasiya sorğusu",
    "mail.subject": "Avakhyl rezervasiya sorğusu",
    "guest.title": "Qonaq sayını əlavə et",
    "guest.adults": "Böyük",
    "guest.children": "Uşaq",
    "guest.childrenAge": "3-12 yaş",
    "guest.petsNote": "Yalnız kiçik ölçülü, maksimum {maxPets}",
    "guest.petsInfo": "Yalnız kiçik ölçülü ev heyvanları qəbul edilir (hər evə maksimum {maxPets}). Heyvanlar qonağın nəzarəti altında olmalıdır. Doberman, alman ovçarkası, pitbull və rotveyler cinsləri qəbul edilmir.",
    "guest.pets": "Ev heyvanı",
    "guest.calculate": "HESABLA",
    "alt.hero": "Avaxıl kəndinin dağ mənzərəsi",
    "alt.qaya": "Qaya evinin daş fasadı və balkonu",
    "alt.ardic": "Ardıc evinin yataq otağı",
    "alt.palid": "Palıd evinin qonaq otağı",
    "alt.glamp4": "Glamphouse böyük günbəzinin içi",
    "alt.glamp2": "Glamphouse kiçik günbəzinin içi",
    "alt.deck": "Avakhyl balkon və deck görünüşü",
    "alt.interior": "Avakhyl loft industrial interyeri",
    "alt.cabin": "Avakhyl koteci meşə və dağ mənzərəsində",
    cottage: {
      qaya: "Qaya 🏔️",
      ardic: "Ardıc 🌳",
      glamp4: "Glamphouse böyük (4 nəfərlik)",
      glamp2: "Glamphouse kiçik (2 nəfərlik)",
      palid: "Palıd 🌲"
    },
    faq: [
      {
        q: "Otaqlarınızın görünüşü necədir?",
        a: `<p>Kotecelərimiz konseptual olaraq <strong>AGACH Interiors</strong> şirkəti tərəfindən hazırlanmışdır. Loft / Industrial üslubdadır. Hər bir detal dizaynerlər tərəfindən diqqətlə hazırlanmışdır.</p><p>Ardıc və Palıd kotecelərinin hər birində:</p><ul><li>1 yataq otağı</li><li>1 studiya mətbəxli qonaq otağı</li><li>1 balkon</li><li>1 sanuzel vardır.</li></ul>`
      },
      {
        q: "İnternet və ya mobil rabitə var?",
        a: `<p>Smart televizor, Netflix, YouTube və Fiber Wi-Fi mövcuddur.</p><p>Mobil rabitədə də heç bir problem yoxdur.</p>`
      },
      {
        q: "Ərzaq alınmalıdır, yoxsa orada satılır?",
        a: `<p>Yemək xidməti təqdim etmirik, lakin tam təchizatlı mətbəximiz var.</p><p>Gələrkən ərzaq almağınız tövsiyə olunur. Bununla yanaşı, kənd mərkəzində kiçik market fəaliyyət göstərir və zəruri qidaları əməkdaşlarımız vasitəsilə də əldə edə bilərsiniz.</p>`
      },
      {
        q: "İlin hər fəslində fəaliyyət göstərirsiniz?",
        a: `<p>Bəli, ilboyu fəaliyyət göstəririk.</p>`
      },
      {
        q: "Giriş və çıxış saatları necədir?",
        a: `<p><strong>Giriş:</strong> {checkin}<br /><strong>Çıxış:</strong> {checkout}</p>`
      },
      {
        q: "Kənardan yemək sifariş etmək mümkündür?",
        a: `<p>Bəli, əlbəttə. Yaxınlıqda manqal və qazan yeməkləri sifariş edə biləcəyiniz məkanlar mövcuddur.</p>`
      },
      {
        q: "Niyə qiymətiniz digər məkanlarla müqayisədə daha münasibdir?",
        a: `<p>Məqsədimiz hər kəsin keyfiyyətli istirahət edə bilməsidir. Qiymətlərimizi standart bir ailənin 3-5 gün rahat şəkildə istirahət edə biləcəyi səviyyədə saxlayırıq.</p>`
      },
      {
        q: "Evlərin qiymətləri necə hesablanır?",
        a: `{priceFaq}`
      },
      {
        q: "Ev heyvanlarına icazə verilir?",
        a: `<p>Bəli, amma yalnız kiçik ölçülü ev heyvanlarına icazə verilir. Heyvanlar qonağın nəzarəti altında olmalıdır.</p><p>Aqressiv və təhlükə yarada biləcək heyvanların, o cümlədən doberman, alman ovçarkası, pitbull və rotveyler cinslərinin qəbulu qadağandır.</p><p>Hər evə maksimum {maxPets} ev heyvanı qəbul edilir.</p>`
      },
      {
        q: "İstilik üçün əlavə ödəniş varmı?",
        a: `<p>Bəli, {heatingFrom} – {heatingTo} tarixləri arasında {heatingUnit} +{heatingFee} AZN istilik ödənişi alınır.</p>`
      },
      {
        q: "Check-in zamanı depozit tələb olunur?",
        a: `<p>Bəli, hər bir evdə check-in zamanı {deposit} AZN depozit tələb olunur. Depozit girişdə ödənilir və çıxışda geri qaytarılır.</p>`
      }
    ]
  },
  ru: {
    metaTitle: "Avakhyl | Домашний комфорт среди природы",
    metaDescription: "Avakhyl: запрос на бронирование уютного коттеджа в селе Авакыл, Шамахы.",
    "aria.home": "Главная страница Avakhyl",
    "aria.nav": "Основная навигация",
    "aria.language": "Выбор языка",
    "aria.openMenu": "Открыть меню",
    "aria.closeMenu": "Закрыть меню",
    "aria.close": "Закрыть",
    "aria.benefits": "Основные преимущества Avakhyl",
    "aria.homeSelect": "Выберите дом",
    "brand.by": "by Epoxy Azerbaijan Co.",
    "nav.homes": "Дома",
    "nav.experience": "AGACH",
    "nav.notes": "Заметки",
    "nav.faq": "FAQ",
    "theme.toDark": "Черный фон",
    "theme.toLight": "Белый фон",
    "action.request": "Отправить запрос",
    "action.instagram": "Instagram",
    "action.booking": "Запрос брони",
    "action.viewHomes": "Смотреть дома",
    "action.prepare": "Смотреть дома",
    "action.select": "Выбрать",
    "action.start": "Выбрать дом",
    "action.email": "Отправить e-mail",
    "action.top": "Наверх",
    "hero.location": "Шамахы, село Авакыл",
    "hero.lead": "Тихий домашний комфорт среди природы, ощущение приватного пространства и мягкая пауза от городского ритма.",
    "note.private.title": "Приватно",
    "note.private.text": "отдельный вход и тихая зона",
    "note.natural.title": "Природно",
    "note.natural.text": "атмосфера горного села Шамахы",
    "note.comfort.title": "Комфортно",
    "note.comfort.text": "loft интерьер, балкон и Wi-Fi",
    "booking.home": "Выберите дом",
    "homes.eyebrow": "Дома",
    "homes.title": "Дома Avakhyl",
    "homes.text": "В селе Авакыл, Шамахы доступны пять домов: Qaya, Ardıc, Palıd, большой и малый Glamphouse. У каждого дома есть отдельная страница с фото и видео.",
    "card.one.kicker": "Горный вид",
    "card.one.title": "Qaya 🏔️",
    "card.one.text": "Горный воздух, широкий обзор и спокойный утренний ритм.",
    "card.two.kicker": "Лесная тишина",
    "card.two.title": "Ardıc 🌳",
    "card.two.text": "Loft / Industrial интерьер и балкон с зеленым видом.",
    "card.three.kicker": "Семейный комфорт",
    "card.three.title": "Palıd 🌲",
    "card.three.text": "Полностью оборудованная кухня, smart TV, Netflix, YouTube и Fiber Wi-Fi.",
    "card.four.kicker": "Глэмпинг-купол",
    "card.four.title": "Glamphouse большой (на 4 гостей)",
    "card.four.text": "Панорамное окно, мини-кухня, кондиционер и терраса.",
    "card.five.kicker": "Для пар",
    "card.five.title": "Glamphouse малый (на 2 гостей)",
    "card.five.text": "Двуспальная кровать, панорамное окно и кондиционер.",
    "price.qaya.summary": "2-3 гостя: от 90 AZN",
    "price.ardic.summary": "2-3 гостя: 60 AZN",
    "price.palid.summary": "2-3 гостя: 60 AZN",
    "experience.eyebrow": "AGACH Interiors",
    "experience.title": "Интерьеры коттеджей разработаны AGACH.",
    "experience.text": "Каждая деталь в стиле Loft / Industrial создана теплой, функциональной и созвучной атмосфере горного села Avakhyl.",
    "feature.one": "Концептуальный дизайн AGACH Interiors",
    "feature.two": "Теплый интерьер в стиле Loft / Industrial",
    "feature.three": "Авторские дизайнерские детали для каждого дома",
    "flow.eyebrow": "Бронирование",
    "flow.title": "Запрос Avakhyl в четыре шага",
    "flow.one.title": "Выберите дом",
    "flow.one.text": "Выберите Qaya, Ardıc, Palıd или Glamphouse (большой или малый).",
    "flow.two.title": "Добавьте даты",
    "flow.two.text": "Укажите даты заезда и выезда.",
    "flow.three.title": "Укажите личные данные",
    "flow.three.text": "Добавьте имя, фамилию, контакт и другие необходимые данные.",
    "flow.four.title": "Дождитесь подтверждения",
    "flow.four.text": "Команда проверит запрос, свяжется с вами, и бронь будет готова.",
    "notes.eyebrow": "Важные заметки",
    "notes.title": "Что важно знать до заезда",
    "notes.text": "Эти правила помогают сохранить дома и обеспечить комфортный отдых гостей.",
    "notes.one": "При заезде требуется депозит {deposit} AZN. Депозит оплачивается при заезде и возвращается при выезде.",
    "notes.two": "Без исключений все гости старше 18 лет должны предоставить удостоверение личности.",
    "notes.three": "В указанную стоимость входит набор для мангала и самовара.",
    "notes.petsTitle": "Правила размещения с домашними животными",
    "notes.four": "Разрешается привозить только домашних животных небольшого размера. Животные должны находиться под присмотром гостя.",
    "notes.fourB": "Запрещено размещение агрессивных и потенциально опасных животных, в том числе пород доберман, немецкая овчарка, питбуль и ротвейлер.",
    "notes.fourC": "В каждый дом допускается не более {maxPets} домашних животных.",
    "notes.five": "С {heatingFrom} по {heatingTo} взимается +{heatingFee} AZN за отопление {heatingUnit}.",
    "faq.eyebrow": "FAQ",
    "faq.title": "Частые вопросы",
    "faq.text": "Здесь собраны основные ответы об Avakhyl.",
    "closing.title": "Ближе к природе, проще в решении.",
    "modal.eyebrow": "Запрос готов",
    "modal.title": "Запрос бронирования Avakhyl",
    "mail.subject": "Запрос бронирования Avakhyl",
    "guest.title": "Добавьте количество гостей",
    "guest.adults": "Взрослые",
    "guest.children": "Дети",
    "guest.childrenAge": "3-12 лет",
    "guest.petsNote": "Только небольшие, максимум {maxPets}",
    "guest.petsInfo": "Принимаются только небольшие домашние животные (не более {maxPets} на дом). Животные должны находиться под присмотром гостя. Породы доберман, немецкая овчарка, питбуль и ротвейлер не допускаются.",
    "guest.pets": "Домашнее животное",
    "guest.calculate": "РАССЧИТАТЬ",
    "alt.hero": "Горный пейзаж села Авакыл",
    "alt.qaya": "Каменный фасад и балкон дома Qaya",
    "alt.ardic": "Спальня дома Ardıc",
    "alt.palid": "Гостиная дома Palıd",
    "alt.glamp4": "Интерьер большого Glamphouse",
    "alt.glamp2": "Интерьер малого Glamphouse",
    "alt.deck": "Балкон и deck Avakhyl",
    "alt.interior": "Loft industrial интерьер Avakhyl",
    "alt.cabin": "Коттедж Avakhyl с видом на лес и горы",
    cottage: {
      qaya: "Qaya 🏔️",
      ardic: "Ardıc 🌳",
      glamp4: "Glamphouse большой (на 4 гостей)",
      glamp2: "Glamphouse малый (на 2 гостей)",
      palid: "Palıd 🌲"
    },
    faq: [
      {
        q: "Как выглядят ваши комнаты?",
        a: `<p>Концептуально коттеджи разработаны компанией <strong>AGACH Interiors</strong>. Интерьер выполнен в стиле Loft / Industrial. Каждая деталь тщательно подготовлена дизайнерами.</p><p>В каждом из коттеджей Ardıc и Palıd есть:</p><ul><li>1 спальня</li><li>1 гостиная-студия с кухней</li><li>1 балкон</li><li>1 санузел</li></ul>`
      },
      {
        q: "Есть интернет или мобильная связь?",
        a: `<p>Есть smart TV, Netflix, YouTube и Fiber Wi-Fi.</p><p>С мобильной связью также нет проблем.</p>`
      },
      {
        q: "Нужно покупать продукты или они продаются на месте?",
        a: `<p>Мы не предоставляем питание, но у нас есть полностью оборудованная кухня.</p><p>Рекомендуем купить продукты заранее. Также в центре села работает небольшой магазин, а необходимые продукты можно получить через наших сотрудников.</p>`
      },
      {
        q: "Работаете ли вы круглый год?",
        a: `<p>Да, мы работаем круглый год.</p>`
      },
      {
        q: "Какое время заезда и выезда?",
        a: `<p><strong>Заезд:</strong> {checkin}<br /><strong>Выезд:</strong> {checkout}</p>`
      },
      {
        q: "Можно ли заказать еду дополнительно?",
        a: `<p>Да, конечно. Поблизости есть места, где можно заказать блюда на мангале и блюда в казане.</p>`
      },
      {
        q: "Почему ваша цена доступнее по сравнению с другими местами?",
        a: `<p>Наша цель - чтобы каждый мог позволить себе качественный отдых. Мы держим цены на уровне, при котором обычная семья может комфортно отдохнуть 3-5 дней.</p>`
      },
      {
        q: "Как рассчитываются цены на дома?",
        a: `{priceFaq}`
      },
      {
        q: "Можно ли с домашними животными?",
        a: `<p>Да, но только с домашними животными небольшого размера. Животные должны находиться под присмотром гостя.</p><p>Запрещено размещение агрессивных и потенциально опасных животных, в том числе пород доберман, немецкая овчарка, питбуль и ротвейлер.</p><p>В каждый дом допускается не более {maxPets} домашних животных.</p>`
      },
      {
        q: "Есть ли доплата за отопление?",
        a: `<p>Да, с {heatingFrom} по {heatingTo} взимается +{heatingFee} AZN за отопление {heatingUnit}.</p>`
      },
      {
        q: "Требуется ли депозит при check-in?",
        a: `<p>Да, при check-in для каждого дома требуется депозит {deposit} AZN. Он оплачивается при заезде и возвращается при выезде.</p>`
      }
    ]
  },
  en: {
    metaTitle: "Avakhyl | Cabin comfort in nature",
    metaDescription: "Avakhyl booking request for a calm private cottage stay in Avakhyl village, Shamakhi.",
    "aria.home": "Avakhyl home page",
    "aria.nav": "Main navigation",
    "aria.language": "Language selection",
    "aria.openMenu": "Open menu",
    "aria.closeMenu": "Close menu",
    "aria.close": "Close",
    "aria.benefits": "Avakhyl key benefits",
    "aria.homeSelect": "Choose home",
    "brand.by": "by Epoxy Azerbaijan Co.",
    "nav.homes": "Homes",
    "nav.experience": "AGACH",
    "nav.notes": "Notes",
    "nav.faq": "FAQ",
    "theme.toDark": "Black mode",
    "theme.toLight": "White mode",
    "action.request": "Send request",
    "action.instagram": "Instagram",
    "action.booking": "Booking request",
    "action.viewHomes": "View homes",
    "action.prepare": "View homes",
    "action.select": "Select",
    "action.start": "Choose home",
    "action.email": "Send by e-mail",
    "action.top": "Top",
    "hero.location": "Shamakhi, Avakhyl village",
    "hero.lead": "Quiet cabin comfort in nature, a private-place feeling, and a soft pause from the city rhythm.",
    "note.private.title": "Private",
    "note.private.text": "separate entrance and quiet zone",
    "note.natural.title": "Natural",
    "note.natural.text": "Shamakhi mountain village atmosphere",
    "note.comfort.title": "Comfort",
    "note.comfort.text": "loft interior, balcony and Wi-Fi",
    "booking.home": "Choose home",
    "homes.eyebrow": "Homes",
    "homes.title": "Avakhyl homes",
    "homes.text": "There are five home choices in Avakhyl village, Shamakhi: Qaya, Ardıc, Palıd, and the large and small Glamphouse. Each home has its own photo and video gallery.",
    "card.one.kicker": "Mountain view",
    "card.one.title": "Qaya 🏔️",
    "card.one.text": "Mountain air, a wide view, and a quiet morning rhythm.",
    "card.two.kicker": "Forest calm",
    "card.two.title": "Ardıc 🌳",
    "card.two.text": "Loft / Industrial interior and a balcony opening to green views.",
    "card.three.kicker": "Family comfort",
    "card.three.title": "Palıd 🌲",
    "card.three.text": "Fully equipped kitchen, smart TV, Netflix, YouTube, and Fiber Wi-Fi.",
    "card.four.kicker": "Glamping dome",
    "card.four.title": "Glamphouse large (4 guests)",
    "card.four.text": "Panoramic window, kitchenette, air conditioning and a terrace.",
    "card.five.kicker": "For couples",
    "card.five.title": "Glamphouse small (2 guests)",
    "card.five.text": "Double bed, panoramic window and air conditioning.",
    "price.qaya.summary": "2-3 guests: from 90 AZN",
    "price.ardic.summary": "2-3 guests: 60 AZN",
    "price.palid.summary": "2-3 guests: 60 AZN",
    "experience.eyebrow": "AGACH Interiors",
    "experience.title": "The cottage interiors were designed by AGACH.",
    "experience.text": "Every Loft / Industrial detail is warm, functional, and shaped around Avakhyl's mountain-village atmosphere.",
    "feature.one": "Concept design by AGACH Interiors",
    "feature.two": "Warm Loft / Industrial interior",
    "feature.three": "Custom designer details for each home",
    "flow.eyebrow": "Booking flow",
    "flow.title": "Avakhyl request in four steps",
    "flow.one.title": "Choose a home",
    "flow.one.text": "Choose Qaya, Ardıc, Palıd, or a Glamphouse (large or small).",
    "flow.two.title": "Add dates",
    "flow.two.text": "Add your check-in and check-out dates.",
    "flow.three.title": "Add personal details",
    "flow.three.text": "Enter your name, surname, contact details, and other needed information.",
    "flow.four.title": "Wait for confirmation",
    "flow.four.text": "The team checks the request, gets back to you, and your reservation is ready.",
    "notes.eyebrow": "Important notes",
    "notes.title": "Good to know before check-in",
    "notes.text": "These rules help protect the homes and keep every stay comfortable.",
    "notes.one": "A {deposit} AZN deposit is required at check-in. It is paid on arrival and refunded at check-out.",
    "notes.two": "Without exception, every guest over 18 must present an identity document.",
    "notes.three": "The listed prices include the barbecue and samovar set.",
    "notes.petsTitle": "Pet policy",
    "notes.four": "Only small pets are allowed. Pets must be kept under the guest's supervision.",
    "notes.fourB": "Aggressive or potentially dangerous animals are not allowed, including Doberman, German Shepherd, Pit Bull and Rottweiler breeds.",
    "notes.fourC": "A maximum of {maxPets} pets is allowed per home.",
    "notes.five": "From {heatingFrom} to {heatingTo}, a heating fee of +{heatingFee} AZN is charged {heatingUnit}.",
    "faq.eyebrow": "FAQ",
    "faq.title": "Frequently asked questions",
    "faq.text": "Key answers about Avakhyl are collected here.",
    "closing.title": "Close to nature, easy to decide.",
    "modal.eyebrow": "Request ready",
    "modal.title": "Avakhyl booking request",
    "mail.subject": "Avakhyl booking request",
    "guest.title": "Add guest count",
    "guest.adults": "Adults",
    "guest.children": "Children",
    "guest.childrenAge": "Ages 3-12",
    "guest.petsNote": "Small pets only, max. {maxPets}",
    "guest.petsInfo": "Only small pets are accepted (maximum {maxPets} per home). Pets must be under the guest's supervision. Doberman, German Shepherd, Pit Bull and Rottweiler breeds are not allowed.",
    "guest.pets": "Pet",
    "guest.calculate": "CALCULATE",
    "alt.hero": "Mountain landscape of Avakhyl village",
    "alt.qaya": "Stone facade and balcony of Qaya home",
    "alt.ardic": "Bedroom of Ardıc home",
    "alt.palid": "Living room of Palıd home",
    "alt.glamp4": "Inside the large Glamphouse dome",
    "alt.glamp2": "Inside the small Glamphouse dome",
    "alt.deck": "Avakhyl balcony and deck view",
    "alt.interior": "Avakhyl loft industrial interior",
    "alt.cabin": "Avakhyl cottage with forest and mountain view",
    cottage: {
      qaya: "Qaya 🏔️",
      ardic: "Ardıc 🌳",
      glamp4: "Glamphouse large (4 guests)",
      glamp2: "Glamphouse small (2 guests)",
      palid: "Palıd 🌲"
    },
    faq: [
      {
        q: "What do your rooms look like?",
        a: `<p>Our cottages were conceptually designed by <strong>AGACH Interiors</strong>. They follow a Loft / Industrial style. Every detail has been carefully prepared by dedicated designers.</p><p>Each of the Ardıc and Palıd cottages includes:</p><ul><li>1 bedroom</li><li>1 studio living room with kitchen</li><li>1 balcony</li><li>1 bathroom</li></ul>`
      },
      {
        q: "Is there internet or mobile coverage?",
        a: `<p>Smart TV, Netflix, YouTube, and Fiber Wi-Fi are available.</p><p>There are no issues with mobile coverage either.</p>`
      },
      {
        q: "Should we buy groceries, or are they sold there?",
        a: `<p>We do not provide meal service, but we have a fully equipped kitchen.</p><p>We recommend buying groceries before arrival. There is also a small market in the village center, and necessary food items can be obtained through our staff.</p>`
      },
      {
        q: "Do you operate in every season?",
        a: `<p>Yes, we operate year-round.</p>`
      },
      {
        q: "What are the check-in and check-out times?",
        a: `<p><strong>Check-in:</strong> {checkin}<br /><strong>Check-out:</strong> {checkout}</p>`
      },
      {
        q: "Can we order extra food from outside?",
        a: `<p>Yes, of course. Nearby places offer barbecue and cauldron dishes for order.</p>`
      },
      {
        q: "Why is your price more affordable than other places?",
        a: `<p>Our goal is for everyone to be able to enjoy quality rest. We keep our prices at a level where a standard family can comfortably rest for 3-5 days.</p>`
      },
      {
        q: "How are home prices calculated?",
        a: `{priceFaq}`
      },
      {
        q: "Are pets allowed?",
        a: `<p>Yes, but only small pets are allowed. Pets must be kept under the guest's supervision.</p><p>Aggressive or potentially dangerous animals are not allowed, including Doberman, German Shepherd, Pit Bull and Rottweiler breeds.</p><p>A maximum of {maxPets} pets is allowed per home.</p>`
      },
      {
        q: "Is there an extra heating charge?",
        a: `<p>Yes, from {heatingFrom} to {heatingTo} a heating fee of +{heatingFee} AZN is charged {heatingUnit}.</p>`
      },
      {
        q: "Is a deposit required at check-in?",
        a: `<p>Yes, a {deposit} AZN deposit is required at check-in for every home. It is paid at check-in and returned at check-out.</p>`
      }
    ]
  }
};

const getText = (key) => {
  const summary = key.match(/^price\.(\w+)\.summary$/);
  if (summary) {
    return priceSummary(summary[1], currentLang);
  }
  return fillSettings(translations[currentLang][key] ?? translations.az[key] ?? sharedText(currentLang, key) ?? key, currentLang);
};

const buildHouseUrl = (house = selectedCottage, guests = null) => {
  const params = new URLSearchParams({
    home: house,
    lang: currentLang,
    theme: currentTheme
  });
  if (guests) {
    params.set("adults", String(guests.adults));
    params.set("children", String(guests.children));
    params.set("pets", String(guests.pets));
  }
  return `house.html?${params.toString()}`;
};

const setHeaderState = () => {
  header.classList.toggle("is-scrolled", window.scrollY > 20);
};

const setMobileMenu = (isOpen) => {
  mobileMenu.classList.toggle("is-open", isOpen);
  mobileMenu.setAttribute("aria-hidden", String(!isOpen));
  document.body.classList.toggle("menu-open", isOpen);
};

// qonaq limitləri rəhbər panelindən (settings.js); yalnız böyüklər sayılır, uşaqlar limitə daxil deyil
const maxFor = (key) => (key === "adults" ? homeRules(selectedCottage).maxAdults : key === "pets" ? homeRules(selectedCottage).maxPets : Infinity);
const minFor = (key) => (key === "adults" ? homeRules(selectedCottage).minAdults : 0);
const limitReached = (key) => guestCounts[key] >= maxFor(key);

const renderGuestCounts = () => {
  guestCountOutputs.forEach((output) => {
    output.textContent = String(guestCounts[output.dataset.guestCount]);
  });
  document.querySelectorAll("[data-pets-info]").forEach((box) => {
    box.hidden = !guestCounts.pets;
  });
  guestStepButtons.forEach((button) => {
    const key = button.dataset.guestStep;
    const isMinus = Number(button.dataset.step) < 0;
    const minimum = minFor(key);
    button.disabled = isMinus ? guestCounts[key] <= minimum : limitReached(key);
  });
};

const resetGuestCounts = () => {
  guestCounts.adults = 1;
  guestCounts.children = 0;
  guestCounts.pets = 0;
  renderGuestCounts();
};

const openModal = () => {
  resetGuestCounts();
  modal.classList.add("is-open");
  modal.setAttribute("aria-hidden", "false");
  document.body.classList.add("modal-open");
};

const closeModal = () => {
  modal.classList.remove("is-open");
  modal.setAttribute("aria-hidden", "true");
  document.body.classList.remove("modal-open");
};

const renderFaq = () => {
  faqList.innerHTML = translations[currentLang].faq
    .map(
      (item, index) => `
        <button class="faq-item" type="button" aria-expanded="${index === 0 ? "true" : "false"}">
          <span>${item.q}</span>
          <svg><use href="#icon-chevron" /></svg>
        </button>
        <div class="faq-panel ${index === 0 ? "open" : ""}">
          ${fillSettings(item.a, currentLang)}
        </div>
      `
    )
    .join("");

  faqList.querySelectorAll(".faq-item").forEach((item) => {
    item.addEventListener("click", () => {
      const panel = item.nextElementSibling;
      const isOpen = item.getAttribute("aria-expanded") === "true";

      faqList.querySelectorAll(".faq-item").forEach((faq) => faq.setAttribute("aria-expanded", "false"));
      faqList.querySelectorAll(".faq-panel").forEach((faqPanel) => faqPanel.classList.remove("open"));

      if (!isOpen) {
        item.setAttribute("aria-expanded", "true");
        panel.classList.add("open");
      }
    });
  });
};

const applyLanguage = (lang) => {
  currentLang = lang;
  html.lang = lang;
  document.title = translations[lang].metaTitle;
  document.querySelector('meta[name="description"]').setAttribute("content", translations[lang].metaDescription);

  carryParams(currentLang, currentTheme);
  document.querySelectorAll("[data-i18n]").forEach((element) => {
    element.textContent = getText(element.dataset.i18n);
  });

  document.querySelectorAll("[data-i18n-aria]").forEach((element) => {
    element.setAttribute("aria-label", getText(element.dataset.i18nAria));
  });

  document.querySelectorAll("[data-i18n-alt]").forEach((element) => {
    element.setAttribute("alt", getText(element.dataset.i18nAlt));
  });

  document.querySelectorAll("[data-lang]").forEach((button) => {
    const isActive = button.dataset.lang === lang;
    button.classList.toggle("is-active", isActive);
    button.setAttribute("aria-pressed", String(isActive));
  });

  document.querySelectorAll("[data-house-option]").forEach((option) => {
    option.textContent = translations[lang].cottage[option.value];
  });
  if (mailLink) {
    mailLink.href = `mailto:info@avakhyl.az?subject=${encodeURIComponent(getText("mail.subject"))}`;
  }
  renderFaq();
  updateThemeLabels();
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
};

const fanPositions = [
  { rot: -21, scale: 0.7756, x: -30, y: 7.3, zIndex: 1 },
  { rot: -14, scale: 0.8498, x: -22, y: 4.0, zIndex: 2 },
  { rot: -7, scale: 0.9346, x: -11, y: 1.3, zIndex: 3 },
  { rot: 0, scale: 1, x: 0, y: 0, zIndex: 10 },
  { rot: 7, scale: 0.9346, x: 11, y: 1.3, zIndex: 3 },
  { rot: 14, scale: 0.8498, x: 22, y: 4.0, zIndex: 2 },
  { rot: 21, scale: 0.7756, x: 30, y: 7.3, zIndex: 1 }
];

const getFanMultiplier = () => {
  const width = window.innerWidth;
  if (width < 480) {
    return 0.28;
  }
  if (width < 640) {
    return 0.38;
  }
  if (width < 768) {
    return 0.5;
  }
  if (width < 1024) {
    return 0.74;
  }
  return 1;
};

const initFanCarousels = () => {
  document.querySelectorAll("[data-fan-carousel]").forEach((carousel) => {
    const cards = Array.from(carousel.querySelectorAll("[data-fan-card]"));
    const dots = carousel.querySelector("[data-fan-dots]");
    const previous = carousel.querySelector("[data-fan-prev]");
    const next = carousel.querySelector("[data-fan-next]");
    const maxVisible = 7;
    const half = 3;
    let centerIndex = cards.length > maxVisible ? half : Math.floor(cards.length / 2);
    let hoveredSlot = null;

    if (!cards.length) {
      return;
    }

    const getVisibleMap = () => {
      const map = new Map();
      if (cards.length <= maxVisible) {
        cards.forEach((_, index) => map.set(index, index));
        return map;
      }
      for (let slot = 0; slot < maxVisible; slot += 1) {
        map.set((centerIndex + slot - half + cards.length) % cards.length, slot);
      }
      return map;
    };

    const getSlotConfig = (slotCount, slot) => {
      if (slotCount >= maxVisible) {
        return fanPositions[slot];
      }
      const center = slotCount >> 1;
      const distance = slotCount > 1 ? (slot - center) / center : 0;
      const absDistance = Math.abs(distance);
      return {
        rot: distance * 21,
        scale: 1 - 0.2244 * absDistance * absDistance,
        x: distance * 30,
        y: absDistance * absDistance * 7.3,
        zIndex: 10 - Math.abs(slot - center)
      };
    };

    const renderDots = () => {
      if (!dots) {
        return;
      }
      dots.innerHTML = cards
        .map(
          (_, index) => `
            <button
              class="fan-dot ${index === centerIndex ? "is-active" : ""}"
              type="button"
              data-fan-dot="${index}"
              aria-label="${index + 1}"
            ></button>
          `
        )
        .join("");
    };

    const applyLayout = () => {
      const visibleMap = getVisibleMap();
      const multiplier = getFanMultiplier();
      const slotCount = Math.min(cards.length, maxVisible);
      const centerSlot = slotCount >> 1;

      cards.forEach((card, index) => {
        const slot = visibleMap.get(index);
        if (slot === undefined) {
          card.dataset.slot = "";
          card.style.opacity = "0";
          card.style.zIndex = "0";
          card.style.pointerEvents = "none";
          card.style.transform = "translate(-50%, -50%) translateY(8rem) scale(0.58)";
          return;
        }

        const base = getSlotConfig(slotCount, slot);
        let targetX = base.x * multiplier;
        let targetY = base.y * multiplier;
        let targetRot = base.rot;
        let targetScale = base.scale;

        if (hoveredSlot !== null) {
          const distance = Math.abs(slot - hoveredSlot);
          if (slot === hoveredSlot) {
            targetY -= 2.5 * multiplier;
            targetScale *= 1.08;
          } else if (slot < hoveredSlot) {
            targetX -= (8 / (distance + 1)) * multiplier;
            targetRot -= 3 / (distance + 1);
          } else {
            targetX += (8 / (distance + 1)) * multiplier;
            targetRot += 3 / (distance + 1);
          }
        }

        card.dataset.slot = String(slot);
        card.style.opacity = "1";
        card.style.zIndex = String(base.zIndex + (slot === hoveredSlot ? 20 : 0));
        card.style.pointerEvents = "auto";
        card.style.transform = `translate(-50%, -50%) translate(${targetX}rem, ${targetY}rem) rotate(${targetRot}deg) scale(${targetScale})`;
      });

      renderDots();
    };

    cards.forEach((card) => {
      card.addEventListener("mouseenter", () => {
        hoveredSlot = Number(card.dataset.slot);
        if (Number.isFinite(hoveredSlot)) {
          applyLayout();
        }
      });
      card.addEventListener("focus", () => {
        hoveredSlot = Number(card.dataset.slot);
        if (Number.isFinite(hoveredSlot)) {
          applyLayout();
        }
      });
    });

    carousel.addEventListener("mouseleave", () => {
      hoveredSlot = null;
      applyLayout();
    });

    carousel.addEventListener("focusout", (event) => {
      if (!carousel.contains(event.relatedTarget)) {
        hoveredSlot = null;
        applyLayout();
      }
    });

    previous?.addEventListener("click", () => {
      centerIndex = (centerIndex - 1 + cards.length) % cards.length;
      hoveredSlot = null;
      applyLayout();
    });

    next?.addEventListener("click", () => {
      centerIndex = (centerIndex + 1) % cards.length;
      hoveredSlot = null;
      applyLayout();
    });

    dots?.addEventListener("click", (event) => {
      const dot = event.target.closest("[data-fan-dot]");
      if (!dot) {
        return;
      }
      centerIndex = Number(dot.dataset.fanDot);
      hoveredSlot = null;
      applyLayout();
    });

    window.addEventListener("resize", applyLayout, { passive: true });
    requestAnimationFrame(applyLayout);
  });
};

const setSelectedCottage = (cottage) => {
  selectedCottage = cottage;
  guestCounts.adults = Math.min(Math.max(guestCounts.adults, minFor("adults")), maxFor("adults"));
  guestCounts.pets = Math.min(guestCounts.pets, maxFor("pets"));
  renderGuestCounts();
  if (homeSelect) {
    homeSelect.value = cottage;
  }
  document.querySelectorAll("[data-cottage-card]").forEach((card) => {
    card.classList.toggle("is-selected", card.dataset.cottageCard === cottage);
  });
};

menuOpen.addEventListener("click", () => setMobileMenu(true));
menuClose.addEventListener("click", () => setMobileMenu(false));

mobileMenu.addEventListener("click", (event) => {
  if (event.target.matches("a") || event.target === mobileMenu) {
    setMobileMenu(false);
  }
});

document.querySelectorAll("[data-lang]").forEach((button) => {
  button.addEventListener("click", () => applyLanguage(button.dataset.lang));
});

document.querySelectorAll("[data-theme-toggle]").forEach((button) => {
  button.addEventListener("click", () => setTheme(currentTheme === "dark" ? "light" : "dark"));
});

homeSelect.addEventListener("change", () => {
  setSelectedCottage(homeSelect.value);
});

document.querySelectorAll("[data-select-cottage]").forEach((button) => {
  button.addEventListener("click", () => {
    setSelectedCottage(button.dataset.selectCottage);
    openModal();
  });
});

guestStepButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const key = button.dataset.guestStep;
    const step = Number(button.dataset.step);
    const minimum = minFor(key);
    if (step > 0 && limitReached(key)) {
      return;
    }
    guestCounts[key] = Math.max(minimum, guestCounts[key] + step);
    renderGuestCounts();
  });
});

guestCalculate.addEventListener("click", () => {
  window.location.href = buildHouseUrl(selectedCottage, guestCounts);
});

bookingForm.addEventListener("submit", (event) => {
  event.preventDefault();
  setSelectedCottage(homeSelect.value);
  openModal();
});

modalClose.addEventListener("click", closeModal);
modal.addEventListener("click", (event) => {
  if (event.target === modal) {
    closeModal();
  }
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    setMobileMenu(false);
    closeModal();
  }
});

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
window.addEventListener("scroll", setHeaderState, { passive: true });
setSelectedCottage(selectedCottage);
setTheme(currentTheme);
applyLanguage(currentLang);
document.addEventListener("avakhyl:settings", () => applyLanguage(currentLang));
initFanCarousels();
setHeaderState();
