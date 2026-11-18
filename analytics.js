// Avakhyl analitikası (GA4-ə bənzər, məlumat öz Supabase bazamızda): səhifə baxışları, kliklər, scroll, səhifədə vaxt, sorğular.
// Ziyarətçi anonimdir: brauzerdə təsadüfi id saxlanılır. Admin paneldən daxil olan brauzer izlənmir.
(() => {
  const VISITOR_KEY = "avakhylVisitor";
  const SESSION_KEY = "avakhylSession";
  const NO_TRACK_KEY = "avakhylNoTrack";
  // GA4 kimi: 30 dəqiqə hərəkətsizlikdən sonra yeni sessiya başlayır
  const SESSION_TIMEOUT = 30 * 60 * 1000;
  const FLUSH_INTERVAL = 15000;
  const HEARTBEAT_INTERVAL = 30000;

  const storage = (() => {
    try {
      localStorage.setItem("avakhylProbe", "1");
      localStorage.removeItem("avakhylProbe");
      return localStorage;
    } catch {
      return null;
    }
  })();

  // avtomatlaşdırılmış brauzerlər (botlar, testlər) sayılmır
  if (!storage || storage.getItem(NO_TRACK_KEY) === "1" || navigator.webdriver || typeof SUPABASE_URL === "undefined") {
    window.trackEvent = () => {};
    return;
  }

  // dil dəyişəndə düymə mətnləri dəyişir; kliklər hər dildə eyni adla sayılsın deyə ilkin (AZ) mətn yadda saxlanılır
  document.querySelectorAll("[data-i18n]").forEach((element) => {
    if (!element.dataset.trackText) {
      element.dataset.trackText = element.textContent.replace(/\s+/g, " ").trim();
    }
  });

  const params = new URLSearchParams(window.location.search);
  const fileName = window.location.pathname.split("/").pop() || "index.html";
  // ev səhifəsi hansı evə baxıldığı ilə yazılır; qalan URL parametrləri (dil, tarix, qonaq sayı) atılır
  const page = params.get("home") && /^(house|reservation)\.html$/.test(fileName) ? `${fileName}?home=${params.get("home")}` : fileName;

  const uuid = () =>
    crypto.randomUUID?.() ??
    "10000000-1000-4000-8000-100000000000".replace(/[018]/g, (c) => (c ^ (crypto.getRandomValues(new Uint8Array(1))[0] & (15 >> (c / 4)))).toString(16));

  let isNewVisitor = false;
  let visitorId = storage.getItem(VISITOR_KEY);
  if (!visitorId) {
    visitorId = uuid();
    isNewVisitor = true;
    storage.setItem(VISITOR_KEY, visitorId);
  }

  const readSession = () => {
    try {
      return JSON.parse(storage.getItem(SESSION_KEY) || "null");
    } catch {
      return null;
    }
  };

  const SOURCE_RULES = [
    [/instagram/, "instagram"],
    [/facebook|fb\.com|fb\.me/, "facebook"],
    [/google\./, "google"],
    [/bing\./, "bing"],
    [/yandex\./, "yandex"],
    [/wa\.me|whatsapp/, "whatsapp"],
    [/t\.me|telegram/, "telegram"],
    [/tiktok/, "tiktok"],
    [/youtube|youtu\.be/, "youtube"]
  ];

  const referrerHost = (() => {
    try {
      return document.referrer ? new URL(document.referrer).hostname.replace(/^www\./, "") : "";
    } catch {
      return "";
    }
  })();
  const isInternalReferrer = referrerHost && referrerHost === window.location.hostname.replace(/^www\./, "");

  const detectSource = () => {
    if (params.get("utm_source")) return params.get("utm_source").toLowerCase();
    if (!referrerHost || isInternalReferrer) return "";
    return SOURCE_RULES.find(([pattern]) => pattern.test(referrerHost))?.[1] ?? referrerHost;
  };

  const userAgent = navigator.userAgent;
  const detectDevice = () => {
    if (/iPad|Tablet/i.test(userAgent) || (/Android/i.test(userAgent) && !/Mobile/i.test(userAgent))) return "planşet";
    if (/Mobi|iPhone|Android/i.test(userAgent)) return "mobil";
    return "kompüter";
  };
  const detectBrowser = () => {
    if (/Instagram/i.test(userAgent)) return "Instagram brauzeri";
    if (/FBAN|FBAV/i.test(userAgent)) return "Facebook brauzeri";
    if (/Edg\//.test(userAgent)) return "Edge";
    if (/OPR\/|Opera/.test(userAgent)) return "Opera";
    if (/YaBrowser/.test(userAgent)) return "Yandex";
    if (/SamsungBrowser/.test(userAgent)) return "Samsung";
    if (/Firefox|FxiOS/.test(userAgent)) return "Firefox";
    if (/Chrome|CriOS/.test(userAgent)) return "Chrome";
    if (/Safari/.test(userAgent)) return "Safari";
    return "digər";
  };
  const detectOs = () => {
    if (/iPhone|iPad|iPod/.test(userAgent)) return "iOS";
    if (/Android/.test(userAgent)) return "Android";
    if (/Windows/.test(userAgent)) return "Windows";
    if (/Mac OS X|Macintosh/.test(userAgent)) return "macOS";
    if (/Linux/.test(userAgent)) return "Linux";
    return "digər";
  };

  // mövcud sessiya 30 dəqiqə ərzində davam edir; reklam linki (utm) ilə gəliş yeni sessiya açır
  const now = Date.now();
  let session = readSession();
  if (!session || now - session.lastActivity > SESSION_TIMEOUT || (params.get("utm_source") && params.get("utm_source").toLowerCase() !== session.source)) {
    session = { id: uuid(), lastActivity: now, source: detectSource(), sent: false };
  }
  session.lastActivity = now;
  storage.setItem(SESSION_KEY, JSON.stringify(session));

  const sessionInfo = () => ({
    host: window.location.hostname,
    landing: page,
    referrer: isInternalReferrer ? "" : document.referrer.slice(0, 300),
    source: session.source,
    medium: (params.get("utm_medium") || (session.source && !params.get("utm_source") ? "referral" : "")).toLowerCase(),
    campaign: params.get("utm_campaign") || "",
    device: detectDevice(),
    browser: detectBrowser(),
    os: detectOs(),
    lang: params.get("lang") || document.documentElement.lang || "az",
    isNew: isNewVisitor
  });

  let queue = [];

  const send = (keepalive = false) => {
    const events = queue.splice(0, 30);
    session.lastActivity = Date.now();
    storage.setItem(SESSION_KEY, JSON.stringify(session));
    fetch(`${SUPABASE_URL}/rest/v1/rpc/track`, {
      method: "POST",
      keepalive,
      headers: { apikey: SUPABASE_KEY, "Content-Type": "application/json" },
      body: JSON.stringify({ p: { sessionId: session.id, visitorId, page, session: sessionInfo(), events } })
    }).catch(() => {});
    if (queue.length) {
      send(keepalive);
    }
  };

  const trackEvent = (type, { label = "", target = "", value } = {}) => {
    queue.push({ type, page, label: String(label).slice(0, 120), target: String(target).slice(0, 200), ...(Number.isFinite(value) ? { value } : {}) });
  };
  // səhifənin öz kodundan çağırılır (məs. sorğu göndərildi); ardınca WhatsApp-a keçid olduğu üçün keepalive ilə göndərilir
  window.trackEvent = (type, data) => {
    trackEvent(type, data);
    send(true);
  };

  /* ---------- kliklər ---------- */
  const clean = (text) => (text || "").replace(/\s+/g, " ").trim().slice(0, 60);

  // klikin adı: data-track > ilkin AZ mətn > aria-label > görünən mətn; təkrarlanan elementlər (kalendar günləri, dil) qruplaşdırılır
  const clickLabel = (element) => {
    if (element.dataset.track) return element.dataset.track;
    if (element.closest("[data-calendar-months]")) return "Kalendar: tarix seçimi";
    if (element.matches("[data-lang]")) return `Dil: ${element.dataset.lang.toUpperCase()}`;
    if (element.matches("[data-theme-toggle]")) return "Fon rəngi (ağ/qara)";
    if (element.matches(".wa-float")) return "WhatsApp düyməsi (sağ aşağı)";
    if (element.matches("[data-guest-step], [data-res-guest-step], [data-step]")) return "Qonaq sayı +/−";
    const translated = element.dataset.trackText || element.querySelector("[data-track-text]")?.dataset.trackText;
    if (translated) return translated;
    const aria = element.getAttribute("aria-label");
    if (aria) return clean(aria);
    const text = clean(element.innerText);
    if (text) return text;
    const image = element.querySelector("img[alt]");
    if (image) return `Şəkil: ${clean(image.alt)}`;
    return clean(element.getAttribute("title") || element.getAttribute("name") || element.tagName.toLowerCase());
  };

  const clickTarget = (element) => {
    const href = element.getAttribute("href");
    if (!href || href.startsWith("#")) return "";
    try {
      const url = new URL(href, window.location.href);
      if (url.hostname !== window.location.hostname) return url.hostname.replace(/^www\./, "");
      return url.pathname.split("/").pop() || "index.html";
    } catch {
      return "";
    }
  };

  document.addEventListener(
    "click",
    (event) => {
      const element = event.target.closest("a, button, summary, [role='button'], [data-track], input[type='checkbox'], select");
      if (!element) return;
      const target = clickTarget(element);
      trackEvent("click", { label: clickLabel(element), target });
      // başqa sayta və ya səhifəyə keçid: göndərməni gözləmədən dərhal yolla
      if (target) send(true);
    },
    true
  );

  /* ---------- scroll dərinliyi və səhifədə aktiv vaxt ---------- */
  let maxScroll = 0;
  const measureScroll = () => {
    const scrollable = document.documentElement.scrollHeight - window.innerHeight;
    const percent = scrollable > 0 ? Math.round((window.scrollY / scrollable) * 100) : 100;
    maxScroll = Math.max(maxScroll, Math.min(100, percent));
  };
  window.addEventListener("scroll", measureScroll, { passive: true });

  // səhifə gizlənəndə (başqa taba keçid, bağlama) bu görünmə müddəti saniyə ilə yazılır; hesabat səhifə üzrə cəmləyir.
  // scroll yalnız əvvəlki göndərişdən dərinləşibsə yazılır; hesabat hər sessiyanın ən böyük dəyərini götürür
  let visibleSince = document.hidden ? null : Date.now();
  let sentScroll = -1;

  const sendLeave = () => {
    if (visibleSince) {
      const seconds = Math.round((Date.now() - visibleSince) / 1000);
      visibleSince = null;
      if (seconds > 0) trackEvent("engagement", { value: seconds });
    }
    measureScroll();
    if (maxScroll > sentScroll) {
      trackEvent("scroll", { value: maxScroll });
      sentScroll = maxScroll;
    }
    send(true);
  };

  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      sendLeave();
    } else {
      visibleSince = Date.now();
      send();
    }
  });
  window.addEventListener("pagehide", sendLeave);

  /* ---------- başlanğıc ---------- */
  trackEvent("page_view", { label: document.title });
  send();
  window.setInterval(() => {
    if (queue.length) send();
  }, FLUSH_INTERVAL);
  // "indi saytda" sayğacı üçün: səhifə açıq və görünəndirsə hər 30 saniyədən bir xəbər verir
  window.setInterval(() => {
    if (!document.hidden) send();
  }, HEARTBEAT_INTERVAL);
})();
