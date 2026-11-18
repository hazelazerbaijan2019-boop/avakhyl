// "Avaxıl haqqında" səhifəsi: dil, fon və görünmə animasiyası (digər səhifələrlə eyni ?lang=&theme= qaydası)
const html = document.documentElement;
const params = new URLSearchParams(window.location.search);
let currentLang = ["az", "ru", "en"].includes(params.get("lang")) ? params.get("lang") : "az";
let currentTheme = params.get("theme") === "dark" ? "dark" : "light";

const text = {
  az: {
    "nav.homes": "Evlər",
    "theme.toDark": "Qara fon",
    "theme.toLight": "Ağ fon",
    "page.title": "Avakhyl | Avaxıl haqqında",
    "av.heroAlt": "Avaxıl ətrafında dağ mənzərəsi",
    "av.eyebrow": "Şamaxı · Dağlıq Şirvan",
    "av.lead": "Böyük Qafqazın cənub-şərq yamaclarında, Pirqulu meşələrinin yaxınlığında yerləşən sakit dağ kəndi. Avakhyl evləri məhz buradadır: təmiz havanın, ulduzlu gecələrin və meşə səssizliyinin içində.",
    "av.fact1": "Şamaxı şəhərindən yolla, ≈ 30 dəqiqə",
    "av.fact2": "Bakı mərkəzindən yolla, ≈ 2 saat",
    "av.fact3": "rəsədxana ərazisində ildə açıq gecə",
    "av.fact4": "Pirqulu qoruğunda ağac növü",
    "av.village.eyebrow": "Kənd",
    "av.village.title": "Kiçik, sakit, dağların qoynunda",
    "av.village.text1": "Avaxıl Şamaxı rayonunun dağlıq ərazisində yerləşən kənddir. Kəndin təxminən 500 nəfər əhalisi var. İnzibati baxımdan Avaxıl kəndi Nağaraxana bələdiyyəsinin əhatə etdiyi ərazilərdən biridir.",
    "av.village.text2": "Şəhər həyatının səs-küyündən uzaqda yerləşən Avaxıl daş həyətləri, meyvə bağları, dağ mənzərələri və sakit yolları ilə seçilir. Burada səhərlər quşların səsi ilə açılır, axşamlar isə təbiətin sakitliyi kəndi bürüyür.",
    "av.village.alt": "Avaxıldan dağ mənzərəsi",
    "av.forest.eyebrow": "Təbiət",
    "av.forest.title": "Pirqulu meşələrinin qonşuluğunda",
    "av.forest.text1": "Kənd Pirqulu Dövlət Qoruğunun meşələrinə yaxındır. Qoruğun meşə zolağı 800–2100 metr hündürlükdə uzanır və burada palıd, fındıq, fıstıq kimi 30-dan çox ağac növü bitir.",
    "av.forest.text2": "Evlərimizin adları da bu təbiətdən gəlir: Palıd, Ardıc, Qaya. Payızda meşəni bürüyən duman, yazda yaşıl yamaclar, qışda isə qar örtüyü — Avaxılın hər fəslin öz mənzərəsi var.",
    "av.forest.alt": "Pirqulu meşələri",
    "av.stars.eyebrow": "Ulduzlar",
    "av.stars.title": "Ulduzlu gecələrin kəndi",
    "av.stars.text1": "Bir neçə kilometr aralıda, Pirqulu dağının yamacında, təxminən 1500 metr hündürlükdə N. Tusi adına Şamaxı Astrofizika Rəsədxanası yerləşir. Ərazidə ildə 190–200 açıq, ulduzlu gecə olur.",
    "av.stars.text2": "Şəhər işıqlarından uzaq olduğu üçün buradan gecə səması aydın görünür. Glamphouse-ların panoram pəncərəsindən ulduzları birbaşa yataqdan seyr etmək olar.",
    "av.stars.alt": "Şamaxı Astrofizika Rəsədxanası",
    "av.route.eyebrow": "Yol",
    "av.route.title": "Avaxıla necə gəlmək olar",
    "av.route.step1": "Bakıdan Şamaxıya — təxminən 122 km (≈ 1,5 saat).",
    "av.route.step2": "Şamaxıdan şimala, Pirqulu istiqamətində — təxminən 26 km dağ yolu (≈ 30 dəqiqə).",
    "av.route.step3": "Avaxıl kəndinə çatanda bizə WhatsApp-dan yazın — yolu göstərəcəyik.",
    "av.route.note": "Maşınla gəlmək tövsiyə olunur; ərazidə ödənişsiz parking var. Qış aylarında yola çıxmazdan əvvəl yol şəraitini yoxlayın.",
    "av.route.map": "Google Maps-də aç",
    "av.route.mapTitle": "Avaxıl xəritədə",
    "av.cta.title": "Avaxılda qalmağa hazırsınız?",
    "av.cta.button": "Evlərə bax",
    "av.pir.eyebrow": "Avaxılın irsi",
    "av.pir.title": "Pir Ömər Sultan ziyarətgahı",
    "av.pir.text1": "Tarixi Pir Ömər Sultan ziyarətgahı məhz Avaxıl kəndində yerləşir. Arxeoloji tədqiqatlar zamanı burada XIV əsrin ortalarına aid türbə qalıqları və onun xəlvətilik təliminin banisi Pir Ömər Avaxılıya aid olduğunu təsdiqləyən artefaktlar tapılıb.",
    "av.pir.text2": "Prezident İlham Əliyev və birinci xanım Mehriban Əliyeva 2020-ci ildə Şamaxıya səfərləri zamanı ziyarətgahda olub, abidənin konservasiyası barədə tapşırıq veriblər. Heydər Əliyev Fondunun dəstəyi ilə ziyarətgah konservasiya edilib: qoruyucu daş divar hörülüb, üzərində 16 metr hündürlüyündə səkkizbucaqlı çardaq qurulub, ziyarətçilər üçün gəzinti zolağı salınıb.",
    "av.pir.text3": "17 sentyabr 2026-cı ildə dövlət başçısı və birinci xanım görülən işlərlə yerində tanış olublar. Bu, bölgənin tarixi irsinin dövlət səviyyəsində qorunmasının bariz nümunəsidir.",
    "av.pir.alt1": "Prezident İlham Əliyev və birinci xanım Mehriban Əliyeva Pir Ömər Sultan ziyarətgahında",
    "av.pir.alt2": "Pir Ömər Sultan ziyarətgahının səkkizbucaqlı çardağı",
    "av.pir.alt3": "Ziyarətgahda konservasiya edilmiş türbə qalıqları",
    "av.nesimi.eyebrow": "Yeni məkan",
    "av.nesimi.title": "Nəsimi Bağları",
    "av.nesimi.text1": "Şamaxı rayonunda yeni istifadəyə verilən “Nəsimi Bağları” turizm, mədəniyyət və istirahət kompleksidir. Prezident İlham Əliyev və birinci xanım Mehriban Əliyeva 17 sentyabr 2026-cı ildə kompleks ilə tanış olublar. Həmin səfər çərçivəsində Şamaxıda turizm və mədəniyyət üçün bir sıra yeni məkanlar istifadəyə verilib.",
    "av.nesimi.text2": "Ərazidə dahi şair İmadəddin Nəsiminin 21 metr hündürlüyündə müasir üslubda abidəsi ucalır və Şamaxının bir çox yerindən görünür. Kompleksdə Azərbaycan və xarici sənətkarların 100-dən çox əsəri, Şamaxının tarixini əks etdirən muzey, “Magic Village” hobbit evləri, 9 metrlik baxış qülləsi və Azərbaycanda ilk kapibara ferması — “Capybara Land” var. Ərazidə şam ağacları və üzüm bağları salınıb.",
    "av.nesimi.alt1": "İmadəddin Nəsiminin 21 metrlik abidəsi",
    "av.nesimi.alt2": "Nəsimi Bağlarının girişi",
    "av.nesimi.alt3": "Üzüm bağları arasında baxış qülləsi",
    "av.nesimi.alt4": "Nəsimi Bağlarında üzüm bağları",
    "av.nesimi.alt5": "“Magic Village” hobbit evi",
    "av.nesimi.alt6": "Kompleksdə heykəl instalyasiyası",
    "av.nesimi.alt7": "Kompleksin daxili zalı",
    "av.nesimi.alt8": "Nəsiminin portreti olan metal pano",
    "av.nesimi.alt9": "Şamaxının tarixini əks etdirən muzey",
    "av.nesimi.alt10": "Kompleksin restoran zalı",
    "av.wine.eyebrow": "Şərab ənənəsi",
    "av.wine.title": "Şamaxı Üzüm və Şərab Festivalı",
    "av.wine.text1": "Şamaxı üzüm bağları ilə tanınan bölgədir. 2019-cu ildən keçirilən Üzüm və Şərab Festivalı Meysəri kəndində, “Şirvan şərabları” üzümçülük və şərabçılıq kompleksinin ərazisində təşkil olunur.",
    "av.wine.text2": "2025-ci ildə festival 13–14 sentyabrda keçirildi və 24 şərab brendi təmsil olundu. Qonaqlar yerli və xarici şərabları dadır, ustad dərslərinə qatılır və konsert proqramını izləyirlər. Festivalın təşkilatçıları arasında Nəsimi Bağları kompleksi də var. Avaxıldan festivala maşınla gəlmək rahatdır.",
    "av.wine.alt1": "Meysəri kəndi",
    "av.wine.alt2": "Nəsimi Bağlarında şərab çəlləkləri",
    "av.places.eyebrow": "Gəzməli yerlər",
    "av.places.title": "Avaxıl ətrafında nə görmək olar",
    "av.places.text": "Kəndin özündən Şamaxının qədim abidələrinə qədər — qaldığınız müddətdə bir günü gəzintiyə ayırın.",
    "av.place.pir.where": "Avaxıl kəndində",
    "av.place.pir.title": "Pir Ömər Sultan ziyarətgahı",
    "av.place.pir.text": "XIV əsrə aid türbə qalıqları; Heydər Əliyev Fondunun dəstəyi ilə konservasiya olunub.",
    "av.place.obs.where": "Pirqulu · bir neçə km",
    "av.place.obs.title": "Şamaxı Astrofizika Rəsədxanası",
    "av.place.obs.text": "N. Tusi adına rəsədxana, təxminən 1500 metr hündürlükdə, ildə 190–200 açıq gecə.",
    "av.place.reserve.where": "Kəndin yaxınlığında",
    "av.place.reserve.title": "Pirqulu Dövlət Qoruğu",
    "av.place.reserve.text": "Palıd, fındıq və fıstıq meşələri, təmiz dağ havası və gəzinti yolları.",
    "av.place.nesimi.where": "Şamaxı rayonu",
    "av.place.nesimi.title": "Nəsimi Bağları",
    "av.place.nesimi.text": "21 metrlik Nəsimi abidəsi, muzey, baxış qülləsi, hobbit evləri və kapibara ferması.",
    "av.place.juma.where": "Şamaxı şəhəri",
    "av.place.juma.title": "Şamaxı Cümə məscidi",
    "av.place.juma.text": "Əsası 743-cü ildə qoyulub; Qafqazın ən qədim məscidlərindən biri.",
    "av.place.yeddi.where": "Şamaxıdan 1,5 km cənubda",
    "av.place.yeddi.title": "Yeddi Günbəz türbələri",
    "av.place.yeddi.text": "Şamaxı hökmdarlarının məqbərələrinin olduğu tarixi qəbiristanlıq.",
    "av.place.gulustan.where": "Şamaxı şəhəri yaxınlığında",
    "av.place.gulustan.title": "Gülüstan qalası",
    "av.place.gulustan.text": "XI–XII əsrlərə aid qala; buradan Şamaxıya geniş mənzərə açılır.",
    "av.place.diribaba.where": "Qobustan rayonu · Bakıdan gələrkən yol üstü",
    "av.place.diribaba.title": "Diri Baba türbəsi",
    "av.place.diribaba.text": "1402-ci ildə qayanın içində tikilmiş iki mərtəbəli türbə — Şirvan memarlığının incisi.",
    "av.credit.photo": "Foto",
    "av.credit.photos": "Fotolar"
  },
  ru: {
    "nav.homes": "Дома",
    "theme.toDark": "Черный фон",
    "theme.toLight": "Белый фон",
    "page.title": "Avakhyl | Об Авахыле",
    "av.heroAlt": "Горный пейзаж вокруг Авахыла",
    "av.eyebrow": "Шамахы · Горный Ширван",
    "av.lead": "Тихая горная деревня на юго-восточных склонах Большого Кавказа, рядом с лесами Пиргулу. Именно здесь находятся дома Avakhyl: среди чистого воздуха, звёздных ночей и лесной тишины.",
    "av.fact1": "от Шамахы по дороге, ≈ 30 минут",
    "av.fact2": "от центра Баку по дороге, ≈ 2 часа",
    "av.fact3": "ясных ночей в год в районе обсерватории",
    "av.fact4": "видов деревьев в заповеднике Пиргулу",
    "av.village.eyebrow": "Деревня",
    "av.village.title": "Маленькая и тихая, в объятиях гор",
    "av.village.text1": "Авахыл — село в горной части Шамахинского района. Население села — около 500 человек. В административном отношении Авахыл входит в территорию муниципалитета Нагарахана.",
    "av.village.text2": "Расположенный вдали от городского шума, Авахыл отличается каменными дворами, фруктовыми садами, горными пейзажами и тихими дорогами. Утро здесь начинается с пения птиц, а вечером деревню окутывает тишина природы.",
    "av.village.alt": "Вид на горы из Авахыла",
    "av.forest.eyebrow": "Природа",
    "av.forest.title": "По соседству с лесами Пиргулу",
    "av.forest.text1": "Село находится рядом с лесами Пиргулинского государственного заповедника. Лесная зона заповедника лежит на высоте 800–2100 метров, здесь растёт более 30 видов деревьев — дуб, лещина, бук и другие.",
    "av.forest.text2": "Названия наших домов тоже пришли отсюда: Palıd (дуб), Ardıc (можжевельник), Qaya (скала). Осенний туман над лесом, зелёные склоны весной, снег зимой — у каждого сезона в Авахыле свой пейзаж.",
    "av.forest.alt": "Леса Пиргулу",
    "av.stars.eyebrow": "Звёзды",
    "av.stars.title": "Деревня звёздных ночей",
    "av.stars.text1": "В нескольких километрах, на склоне горы Пиргулу, на высоте около 1500 метров находится Шамахинская астрофизическая обсерватория имени Н. Туси. Здесь бывает 190–200 ясных ночей в год.",
    "av.stars.text2": "Вдали от городских огней ночное небо видно особенно чётко. Из панорамного окна глэмпхаусов можно смотреть на звёзды прямо из кровати.",
    "av.stars.alt": "Шамахинская астрофизическая обсерватория",
    "av.route.eyebrow": "Дорога",
    "av.route.title": "Как добраться до Авахыла",
    "av.route.step1": "Из Баку до Шамахы — около 122 км (≈ 1,5 часа).",
    "av.route.step2": "Из Шамахы на север, в сторону Пиргулу — около 26 км по горной дороге (≈ 30 минут).",
    "av.route.step3": "Когда доедете до Авахыла, напишите нам в WhatsApp — мы покажем дорогу.",
    "av.route.note": "Рекомендуем ехать на машине; на территории есть бесплатная парковка. Зимой перед выездом проверьте состояние дороги.",
    "av.route.map": "Открыть в Google Maps",
    "av.route.mapTitle": "Авахыл на карте",
    "av.cta.title": "Готовы остановиться в Авахыле?",
    "av.cta.button": "Смотреть дома",
    "av.pir.eyebrow": "Наследие Авахыла",
    "av.pir.title": "Святилище Пир Омар Султан",
    "av.pir.text1": "Историческое святилище Пир Омар Султан находится именно в селе Авахыл. Археологические исследования обнаружили здесь остатки усыпальницы середины XIV века и артефакты, подтверждающие, что она принадлежит Пир Омару Авахылы — основателю учения халватия.",
    "av.pir.text2": "Президент Ильхам Алиев и первая леди Мехрибан Алиева посетили святилище во время поездки в Шамахы в 2020 году и поручили провести консервацию памятника. При поддержке Фонда Гейдара Алиева святилище законсервировано: возведена защитная каменная стена, над ней установлен восьмигранный навес высотой 16 метров, для посетителей проложена прогулочная дорожка.",
    "av.pir.text3": "17 сентября 2026 года глава государства и первая леди ознакомились с проделанной работой на месте. Это яркий пример того, как историческое наследие региона сохраняется на государственном уровне.",
    "av.pir.alt1": "Президент Ильхам Алиев и первая леди Мехрибан Алиева у святилища Пир Омар Султан",
    "av.pir.alt2": "Восьмигранный навес святилища Пир Омар Султан",
    "av.pir.alt3": "Законсервированные остатки усыпальницы",
    "av.nesimi.eyebrow": "Новое место",
    "av.nesimi.title": "Nəsimi Bağları (Сады Насими)",
    "av.nesimi.text1": "«Nəsimi Bağları» — новый туристический, культурный и рекреационный комплекс в Шамахинском районе. Президент Ильхам Алиев и первая леди Мехрибан Алиева ознакомились с комплексом 17 сентября 2026 года. В рамках этой поездки в Шамахы был открыт ряд новых объектов туризма и культуры.",
    "av.nesimi.text2": "Здесь возвышается 21-метровый памятник великому поэту Имадеддину Насими в современном стиле — его видно из многих мест Шамахы. В комплексе более 100 работ азербайджанских и зарубежных мастеров, музей истории Шамахы, домики в стиле хоббитов «Magic Village», 9-метровая смотровая башня и первая в Азербайджане ферма капибар — «Capybara Land». На территории высажены сосны и виноградники.",
    "av.nesimi.alt1": "21-метровый памятник Имадеддину Насими",
    "av.nesimi.alt2": "Вход в Nəsimi Bağları",
    "av.nesimi.alt3": "Смотровая башня среди виноградников",
    "av.nesimi.alt4": "Виноградники Nəsimi Bağları",
    "av.nesimi.alt5": "Домик хоббита «Magic Village»",
    "av.nesimi.alt6": "Скульптурная инсталляция в комплексе",
    "av.nesimi.alt7": "Внутренний зал комплекса",
    "av.nesimi.alt8": "Металлическое панно с портретом Насими",
    "av.nesimi.alt9": "Музей истории Шамахы",
    "av.nesimi.alt10": "Ресторанный зал комплекса",
    "av.wine.eyebrow": "Винная традиция",
    "av.wine.title": "Фестиваль винограда и вина в Шамахы",
    "av.wine.text1": "Шамахы славится своими виноградниками. Фестиваль винограда и вина, который проводится с 2019 года, организуется в селе Мейсери, на территории винодельческого комплекса «Şirvan şərabları».",
    "av.wine.text2": "В 2025 году фестиваль прошёл 13–14 сентября, на нём были представлены 24 винных бренда. Гости дегустируют местные и зарубежные вина, посещают мастер-классы и концертную программу. Среди организаторов фестиваля — комплекс Nəsimi Bağları. Из Авахыла на фестиваль удобно добраться на машине.",
    "av.wine.alt1": "Село Мейсери",
    "av.wine.alt2": "Винные бочки в Nəsimi Bağları",
    "av.places.eyebrow": "Что посмотреть",
    "av.places.title": "Что посмотреть рядом с Авахылом",
    "av.places.text": "От самой деревни до древних памятников Шамахы — выделите во время отдыха день на прогулки.",
    "av.place.pir.where": "В самом Авахыле",
    "av.place.pir.title": "Святилище Пир Омар Султан",
    "av.place.pir.text": "Остатки усыпальницы XIV века; законсервированы при поддержке Фонда Гейдара Алиева.",
    "av.place.obs.where": "Пиргулу · несколько км",
    "av.place.obs.title": "Шамахинская астрофизическая обсерватория",
    "av.place.obs.text": "Обсерватория имени Н. Туси на высоте около 1500 м, 190–200 ясных ночей в год.",
    "av.place.reserve.where": "Рядом с деревней",
    "av.place.reserve.title": "Пиргулинский государственный заповедник",
    "av.place.reserve.text": "Леса из дуба, лещины и бука, чистый горный воздух и тропы для прогулок.",
    "av.place.nesimi.where": "Шамахинский район",
    "av.place.nesimi.title": "Nəsimi Bağları",
    "av.place.nesimi.text": "21-метровый памятник Насими, музей, смотровая башня, домики хоббитов и ферма капибар.",
    "av.place.juma.where": "Город Шамахы",
    "av.place.juma.title": "Шамахинская Джума-мечеть",
    "av.place.juma.text": "Основана в 743 году — одна из древнейших мечетей Кавказа.",
    "av.place.yeddi.where": "1,5 км к югу от Шамахы",
    "av.place.yeddi.title": "Мавзолеи Едди Гюмбез",
    "av.place.yeddi.text": "Историческое кладбище с усыпальницами правителей Шамахы.",
    "av.place.gulustan.where": "Рядом с Шамахы",
    "av.place.gulustan.title": "Крепость Гюлистан",
    "av.place.gulustan.text": "Крепость XI–XII веков с широким видом на Шамахы.",
    "av.place.diribaba.where": "Гобустанский район · по пути из Баку",
    "av.place.diribaba.title": "Мавзолей Дири Баба",
    "av.place.diribaba.text": "Двухэтажный мавзолей, высеченный в скале в 1402 году, — жемчужина ширванской архитектуры.",
    "av.credit.photo": "Фото",
    "av.credit.photos": "Фото"
  },
  en: {
    "nav.homes": "Homes",
    "theme.toDark": "Black mode",
    "theme.toLight": "White mode",
    "page.title": "Avakhyl | About Avaxıl",
    "av.heroAlt": "Mountain landscape around Avaxıl",
    "av.eyebrow": "Shamakhi · Mountainous Shirvan",
    "av.lead": "A quiet mountain village on the south-eastern slopes of the Greater Caucasus, close to the Pirgulu forests. This is where the Avakhyl homes are: among clean air, starry nights and forest silence.",
    "av.fact1": "by road from Shamakhi, ≈ 30 minutes",
    "av.fact2": "by road from central Baku, ≈ 2 hours",
    "av.fact3": "clear nights a year around the observatory",
    "av.fact4": "tree species in the Pirgulu reserve",
    "av.village.eyebrow": "Village",
    "av.village.title": "Small and quiet, in the embrace of the mountains",
    "av.village.text1": "Avaxıl is a village in the mountainous part of Shamakhi district, with a population of about 500. Administratively, Avaxıl is one of the areas covered by the Nağaraxana municipality.",
    "av.village.text2": "Set far from the noise of city life, Avaxıl stands out for its stone courtyards, orchards, mountain views and quiet roads. Mornings here begin with birdsong, and in the evening the calm of nature settles over the village.",
    "av.village.alt": "Mountain view from Avaxıl",
    "av.forest.eyebrow": "Nature",
    "av.forest.title": "Next to the Pirgulu forests",
    "av.forest.text1": "The village is close to the forests of the Pirgulu State Reserve. The reserve's forest belt lies at 800–2,100 metres, with more than 30 tree species including oak, hazel and beech.",
    "av.forest.text2": "Our homes are named after this nature: Palıd (oak), Ardıc (juniper), Qaya (rock). Autumn mist over the forest, green slopes in spring, snow in winter — every season in Avaxıl has its own view.",
    "av.forest.alt": "Pirgulu forests",
    "av.stars.eyebrow": "Stars",
    "av.stars.title": "A village of starry nights",
    "av.stars.text1": "A few kilometres away, on the slope of Mount Pirgulu at about 1,500 metres, stands the N. Tusi Shamakhi Astrophysical Observatory. The area has 190–200 clear nights a year.",
    "av.stars.text2": "Far from city lights, the night sky is especially clear. From the glamphouses' panoramic windows you can watch the stars straight from bed.",
    "av.stars.alt": "Shamakhi Astrophysical Observatory",
    "av.route.eyebrow": "Getting here",
    "av.route.title": "How to get to Avaxıl",
    "av.route.step1": "From Baku to Shamakhi — about 122 km (≈ 1.5 hours).",
    "av.route.step2": "From Shamakhi north towards Pirgulu — about 26 km of mountain road (≈ 30 minutes).",
    "av.route.step3": "When you reach Avaxıl village, message us on WhatsApp and we will guide you.",
    "av.route.note": "Coming by car is recommended; free parking is available on site. In winter, check road conditions before setting off.",
    "av.route.map": "Open in Google Maps",
    "av.route.mapTitle": "Avaxıl on the map",
    "av.cta.title": "Ready to stay in Avaxıl?",
    "av.cta.button": "See the homes",
    "av.pir.eyebrow": "Avaxıl's heritage",
    "av.pir.title": "Pir Omar Sultan shrine",
    "av.pir.text1": "The historic Pir Omar Sultan shrine stands in Avaxıl village itself. Archaeological research uncovered the remains of a mid-14th-century tomb and artefacts confirming that it belongs to Pir Omar Avakhyli, founder of the Khalwati teaching.",
    "av.pir.text2": "President Ilham Aliyev and First Lady Mehriban Aliyeva visited the shrine during their 2020 trip to Shamakhi and instructed that the monument be conserved. With the support of the Heydar Aliyev Foundation, the shrine has been conserved: a protective stone wall was built, a 16-metre octagonal canopy was raised above it, and a walking path was laid for visitors.",
    "av.pir.text3": "On 17 September 2026, the head of state and the First Lady viewed the completed work on site — a clear example of how the region's historical heritage is protected at state level.",
    "av.pir.alt1": "President Ilham Aliyev and First Lady Mehriban Aliyeva at the Pir Omar Sultan shrine",
    "av.pir.alt2": "The octagonal canopy over the Pir Omar Sultan shrine",
    "av.pir.alt3": "Conserved remains of the tomb",
    "av.nesimi.eyebrow": "New in Shamakhi",
    "av.nesimi.title": "Nəsimi Bağları (Nasimi Gardens)",
    "av.nesimi.text1": "“Nəsimi Bağları” is a newly opened tourism, culture and leisure complex in Shamakhi district. President Ilham Aliyev and First Lady Mehriban Aliyeva toured the complex on 17 September 2026, a visit during which several new tourism and cultural venues opened in Shamakhi.",
    "av.nesimi.text2": "A 21-metre contemporary monument to the great poet Imadaddin Nasimi rises over the site and can be seen from many parts of Shamakhi. The complex holds more than 100 works by Azerbaijani and international artists, a museum of Shamakhi's history, “Magic Village” hobbit-style houses, a 9-metre observation tower and Azerbaijan's first capybara farm, “Capybara Land”. Pines and vineyards have been planted across the grounds.",
    "av.nesimi.alt1": "The 21-metre monument to Imadaddin Nasimi",
    "av.nesimi.alt2": "Entrance to Nəsimi Bağları",
    "av.nesimi.alt3": "Observation tower among the vineyards",
    "av.nesimi.alt4": "Vineyards at Nəsimi Bağları",
    "av.nesimi.alt5": "A “Magic Village” hobbit house",
    "av.nesimi.alt6": "A sculpture installation in the complex",
    "av.nesimi.alt7": "An interior hall of the complex",
    "av.nesimi.alt8": "Metal panel with Nasimi's portrait",
    "av.nesimi.alt9": "Museum of Shamakhi's history",
    "av.nesimi.alt10": "The complex's restaurant hall",
    "av.wine.eyebrow": "Wine tradition",
    "av.wine.title": "Shamakhi Grape and Wine Festival",
    "av.wine.text1": "Shamakhi is known for its vineyards. Held since 2019, the Grape and Wine Festival takes place in Meysəri village, on the grounds of the “Şirvan şərabları” winemaking complex.",
    "av.wine.text2": "In 2025 the festival ran on 13–14 September with 24 wine brands. Guests taste local and international wines, join masterclasses and enjoy a concert programme. The Nəsimi Bağları complex is among the organisers. The festival is an easy drive from Avaxıl.",
    "av.wine.alt1": "Meysəri village",
    "av.wine.alt2": "Wine barrels at Nəsimi Bağları",
    "av.places.eyebrow": "Places to visit",
    "av.places.title": "What to see around Avaxıl",
    "av.places.text": "From the village itself to Shamakhi's ancient monuments — set aside a day of your stay to explore.",
    "av.place.pir.where": "In Avaxıl village",
    "av.place.pir.title": "Pir Omar Sultan shrine",
    "av.place.pir.text": "Remains of a 14th-century tomb, conserved with the support of the Heydar Aliyev Foundation.",
    "av.place.obs.where": "Pirgulu · a few km",
    "av.place.obs.title": "Shamakhi Astrophysical Observatory",
    "av.place.obs.text": "The N. Tusi observatory at about 1,500 m, with 190–200 clear nights a year.",
    "av.place.reserve.where": "Next to the village",
    "av.place.reserve.title": "Pirgulu State Reserve",
    "av.place.reserve.text": "Oak, hazel and beech forests, clean mountain air and walking trails.",
    "av.place.nesimi.where": "Shamakhi district",
    "av.place.nesimi.title": "Nəsimi Bağları",
    "av.place.nesimi.text": "The 21-metre Nasimi monument, a museum, an observation tower, hobbit houses and a capybara farm.",
    "av.place.juma.where": "Shamakhi town",
    "av.place.juma.title": "Juma Mosque of Shamakhi",
    "av.place.juma.text": "Founded in 743, it is one of the oldest mosques in the Caucasus.",
    "av.place.yeddi.where": "1.5 km south of Shamakhi",
    "av.place.yeddi.title": "Yeddi Gumbaz mausoleums",
    "av.place.yeddi.text": "A historic cemetery holding the tombs of Shamakhi's rulers.",
    "av.place.gulustan.where": "Near Shamakhi town",
    "av.place.gulustan.title": "Gulustan fortress",
    "av.place.gulustan.text": "An 11th–12th-century fortress with a wide view over Shamakhi.",
    "av.place.diribaba.where": "Gobustan district · on the way from Baku",
    "av.place.diribaba.title": "Diri Baba mausoleum",
    "av.place.diribaba.text": "A two-storey mausoleum built into the rock in 1402 — a gem of Shirvan architecture.",
    "av.credit.photo": "Photo",
    "av.credit.photos": "Photos"
  }
};

const getText = (key) => text[currentLang][key] ?? text.az[key] ?? sharedText(currentLang, key) ?? key;

// foto müəllifləri: Wikimedia Commons (müəllif + lisenziya) və president.az rəsmi fotoları (mənbə göstərilməklə)
const PHOTO_CREDITS = {
  "pirqulu-forest": {
    "by": "Aytanbabakishiyeva",
    "license": "CC BY-SA 4.0",
    "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0",
    "source": "https://commons.wikimedia.org/wiki/File:Aytan%27s.jpg"
  },
  "juma": {
    "by": "Diego Delso",
    "license": "CC BY-SA 4.0",
    "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0",
    "source": "https://commons.wikimedia.org/wiki/File:Mezquita_del_Viernes,_Shamakhi,_Azerbaiy%C3%A1n,_2016-09-27,_DD_13-15_HDR.jpg"
  },
  "yeddi": {
    "by": "Bernard Gagnon",
    "license": "CC BY 4.0",
    "licenseUrl": "https://creativecommons.org/licenses/by/4.0",
    "source": "https://commons.wikimedia.org/wiki/File:Yeddi_Gumbaz_Mausoleum_02.jpg"
  },
  "diribaba": {
    "by": "Diego Delso",
    "license": "CC BY-SA 4.0",
    "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0",
    "source": "https://commons.wikimedia.org/wiki/File:Mausoleo_de_Diri_Baba,_Qobustan,_Azerbaiy%C3%A1n,_2016-09-27,_DD_05.jpg"
  },
  "observatory": {
    "by": "Interfase",
    "license": "CC BY-SA 4.0",
    "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0",
    "source": "https://commons.wikimedia.org/wiki/File:Shamakhi_Astrophysical_Observatory_10.jpg"
  },
  "gulustan": {
    "by": "Interfase",
    "license": "CC BY-SA 4.0",
    "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0",
    "source": "https://commons.wikimedia.org/wiki/File:Gulustan_Castle_19.jpg"
  },
  "pirqulu": {
    "by": "Ktmkamran",
    "license": "CC BY-SA 3.0",
    "licenseUrl": "https://creativecommons.org/licenses/by-sa/3.0",
    "source": "https://commons.wikimedia.org/wiki/File:Pirqulu.JPG"
  },
  "meysari": {
    "by": "Zohrab Javad",
    "license": "CC BY-SA 4.0",
    "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0",
    "source": "https://commons.wikimedia.org/wiki/File:Meysari_village,_Shamakhi_District,_Azerbaijan,_2025.jpg"
  },
  "president": {
    "by": "president.az",
    "license": "CC BY 4.0",
    "licenseUrl": "https://creativecommons.org/licenses/by/4.0",
    "source": "https://president.az/az/articles/view/73522"
  },
  "nesimi-cellar": {
    "by": "president.az",
    "license": "CC BY 4.0",
    "licenseUrl": "https://creativecommons.org/licenses/by/4.0",
    "source": "https://president.az/az/articles/view/73522"
  },
  "pir-visit": {
    "by": "president.az",
    "license": "CC BY 4.0",
    "licenseUrl": "https://creativecommons.org/licenses/by/4.0",
    "source": "https://president.az/az/articles/view/73524"
  }
};

const renderCredits = () => {
  document.querySelectorAll("[data-credit]").forEach((element) => {
    const credit = PHOTO_CREDITS[element.dataset.credit];
    if (!credit) {
      element.hidden = true;
      return;
    }
    const label = getText(element.dataset.credit === "president" ? "av.credit.photos" : "av.credit.photo");
    element.innerHTML = `${label}: <a href="${credit.source}" target="_blank" rel="noopener">${credit.by}</a>, <a href="${credit.licenseUrl}" target="_blank" rel="noopener">${credit.license}</a>`;
  });
};

const render = () => {
  html.lang = currentLang;
  html.dataset.theme = currentTheme;
  document.title = getText("page.title");
  carryParams(currentLang, currentTheme);
  document.querySelectorAll("[data-i18n]").forEach((element) => {
    element.textContent = getText(element.dataset.i18n);
  });
  document.querySelectorAll("[data-i18n-alt]").forEach((element) => {
    element.setAttribute("alt", getText(element.dataset.i18nAlt));
  });
  document.querySelectorAll("[data-i18n-aria]").forEach((element) => {
    element.setAttribute("aria-label", getText(element.dataset.i18nAria));
  });
  document.querySelectorAll("[data-i18n-title]").forEach((element) => {
    element.setAttribute("title", getText(element.dataset.i18nTitle));
  });
  renderCredits();
  document.querySelectorAll("[data-lang]").forEach((button) => {
    const isActive = button.dataset.lang === currentLang;
    button.classList.toggle("is-active", isActive);
    button.setAttribute("aria-pressed", String(isActive));
  });
  const label = currentTheme === "dark" ? getText("theme.toLight") : getText("theme.toDark");
  document.querySelectorAll("[data-theme-toggle]").forEach((button) => button.setAttribute("aria-label", label));
  document.querySelectorAll("[data-theme-label]").forEach((element) => {
    element.textContent = label;
  });
  document.querySelectorAll("[data-theme-icon] use").forEach((use) => {
    use.setAttribute("href", currentTheme === "dark" ? "#icon-sun" : "#icon-moon");
  });
};

document.querySelectorAll("[data-lang]").forEach((button) => {
  button.addEventListener("click", () => {
    currentLang = button.dataset.lang;
    render();
  });
});

document.querySelectorAll("[data-theme-toggle]").forEach((button) => {
  button.addEventListener("click", () => {
    currentTheme = currentTheme === "dark" ? "light" : "dark";
    render();
  });
});

const header = document.querySelector("[data-header]");
const syncHeader = () => header?.classList.toggle("is-scrolled", window.scrollY > 24);
window.addEventListener("scroll", syncHeader, { passive: true });

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

render();
syncHeader();
