// rəhbər paneli: analitika bölməsi (məlumat analytics.js-in topladığı hadisələrdən, analytics_summary və analytics_live funksiyaları ilə)
const analyticsPanel = document.querySelector("[data-analytics-panel]");
const analyticsKpis = document.querySelector("[data-analytics-kpis]");
const analyticsLive = document.querySelector("[data-analytics-live]");
const analyticsChart = document.querySelector("[data-analytics-chart]");
const analyticsChartTitle = document.querySelector("[data-analytics-chart-title]");
const analyticsGrid = document.querySelector("[data-analytics-grid]");
const analyticsStatus = document.querySelector("[data-analytics-status]");
const analyticsTest = document.querySelector("[data-analytics-test]");
const analyticsRangeButtons = document.querySelectorAll("[data-analytics-range]");
const analyticsMetricButtons = document.querySelectorAll("[data-analytics-metric]");

let analyticsRange = 7;
let analyticsMetric = "visitors";
let analyticsData = null;

const METRIC_LABELS = { visitors: "Ziyarətçilər", sessions: "Sessiyalar", pageviews: "Səhifə baxışları" };

const PAGE_NAMES = {
  "index.html": "Ana səhifə",
  "avaxil.html": "Avaxıl haqqında",
  "cancel.html": "Rezervin ləğvi səhifəsi"
};

// "house.html?home=qaya" → "Ev: Qaya 🏔️"
const pageName = (page) => {
  if (!page) return "—";
  const [file, query] = page.split("?");
  const home = new URLSearchParams(query || "").get("home");
  if (file === "house.html") return `Ev: ${homes[home] ?? home ?? "?"}`;
  if (file === "reservation.html") return `Rezerv formu: ${homes[home] ?? home ?? "?"}`;
  return PAGE_NAMES[file] ?? file;
};

const formatNumber = (value) => new Intl.NumberFormat("az-AZ").format(Math.round(Number(value) || 0));

const formatDuration = (seconds) => {
  const total = Math.round(Number(seconds) || 0);
  if (total < 60) return `${total} san`;
  const minutes = Math.floor(total / 60);
  return `${minutes} dəq ${pad(total % 60)} san`;
};

const percent = (part, whole) => (whole ? Math.round((part / whole) * 1000) / 10 : 0);

// ölkə kodundan bayraq: "AZ" → 🇦🇿
const countryLabel = (code) => {
  if (!/^[A-Z]{2}$/.test(code)) return "Naməlum";
  const flag = String.fromCodePoint(...[...code].map((letter) => 127397 + letter.charCodeAt(0)));
  let name = code;
  try {
    name = new Intl.DisplayNames(["az"], { type: "region" }).of(code) ?? code;
  } catch {
    // köhnə brauzerdə ölkə adı kod kimi qalır
  }
  return `${flag} ${name}`;
};

const SOURCE_NAMES = {
  "(birbaşa)": "Birbaşa (link yazılıb və ya əlfəcin)",
  instagram: "Instagram",
  facebook: "Facebook",
  google: "Google",
  whatsapp: "WhatsApp",
  telegram: "Telegram",
  tiktok: "TikTok",
  youtube: "YouTube",
  bing: "Bing",
  yandex: "Yandex"
};

const LANG_NAMES = { az: "Azərbaycan", ru: "Rus", en: "İngilis" };

const rangeDates = () => {
  const from = new Date();
  from.setHours(0, 0, 0, 0);
  from.setDate(from.getDate() - (analyticsRange - 1));
  const to = new Date(Date.now() + 60000);
  return { from, to };
};

const setAnalyticsStatus = (message) => {
  if (analyticsStatus) analyticsStatus.textContent = message;
};

/* ---------- göstərici kartları ---------- */
const renderKpis = (totals) => {
  const pagesPerSession = totals.sessions ? (totals.pageviews / totals.sessions).toFixed(1) : "0";
  const tiles = [
    { label: "Ziyarətçilər", value: formatNumber(totals.visitors), hint: "Unikal insanlar (brauzerlər)" },
    { label: "Yeni ziyarətçilər", value: formatNumber(totals.newVisitors), hint: "Sayta ilk dəfə girənlər" },
    { label: "Sessiyalar", value: formatNumber(totals.sessions), hint: "Gəlişlər: 30 dəq fasilədən sonra yenisi sayılır" },
    { label: "Səhifə baxışları", value: formatNumber(totals.pageviews), hint: `Hər gəlişdə orta ${pagesPerSession} səhifə` },
    { label: "Orta qalma müddəti", value: formatDuration(totals.avgDuration), hint: "Bir gəlişin orta uzunluğu" },
    { label: "Dərhal çıxanlar", value: `${totals.bounceRate}%`, hint: "1 səhifəyə 10 saniyədən az baxıb çıxanlar" },
    { label: "Rezerv sorğuları", value: formatNumber(totals.bookings), hint: "Saytdan göndərilən sorğular" },
    { label: "Konversiya", value: `${percent(totals.bookingSessions, totals.sessions)}%`, hint: "Sorğu ilə bitən gəlişlərin payı" }
  ];
  analyticsKpis.innerHTML = tiles
    .map((tile) => `<div class="analytics-kpi"><span>${tile.label}</span><strong>${tile.value}</strong><small>${tile.hint}</small></div>`)
    .join("");
};

/* ---------- canlı: indi saytda ---------- */
const renderLive = (live) => {
  const pages = live.pages
    .map((item) => `<span class="analytics-chip">${escapeAttr(pageName(item.page))} <b>${item.visitors}</b></span>`)
    .join("");
  analyticsLive.innerHTML = `
    <div class="analytics-live-count"><i aria-hidden="true"></i><span>İndi saytda</span><strong>${live.active}</strong><span>nəfər</span></div>
    <div class="analytics-live-pages">${pages || `<span class="admin-hint">Hazırda saytda heç kim yoxdur.</span>`}</div>
  `;
};

/* ---------- əsas qrafik: gündəlik xətt və ya bu gün üçün saatlar ---------- */
const dailySeries = (daily) => {
  const byDay = new Map(daily.map((row) => [row.day, row]));
  const { from } = rangeDates();
  return Array.from({ length: analyticsRange }, (_, index) => {
    const date = new Date(from);
    date.setDate(from.getDate() + index);
    const iso = toIsoDate(date);
    return { key: iso, label: `${date.getDate()} ${monthNames[date.getMonth()].slice(0, 3)}`, value: Number(byDay.get(iso)?.[analyticsMetric] ?? 0) };
  });
};

const hourlySeries = (hours) => {
  const byHour = new Map(hours.map((row) => [row.hour, row.sessions]));
  return Array.from({ length: 24 }, (_, hour) => ({ key: String(hour), label: `${pad(hour)}:00`, value: Number(byHour.get(hour) ?? 0) }));
};

// ox üçün "gözəl" yuxarı hədd: 1, 2, 5 × 10ⁿ
const niceMax = (value) => {
  if (value <= 4) return 4;
  const power = 10 ** Math.floor(Math.log10(value));
  const step = [1, 2, 5, 10].find((factor) => factor * power >= value / 4) * power;
  return Math.ceil(value / step) * step;
};

const CHART = { width: 760, height: 260, left: 40, right: 12, top: 14, bottom: 30 };

const renderLineChart = (series, valueLabel) => {
  const max = niceMax(Math.max(...series.map((point) => point.value)));
  const plotWidth = CHART.width - CHART.left - CHART.right;
  const plotHeight = CHART.height - CHART.top - CHART.bottom;
  const x = (index) => CHART.left + (series.length === 1 ? plotWidth / 2 : (index / (series.length - 1)) * plotWidth);
  const y = (value) => CHART.top + plotHeight - (value / max) * plotHeight;
  const points = series.map((point, index) => [x(index), y(point.value)]);
  const line = points.map(([px, py], index) => `${index ? "L" : "M"}${px.toFixed(1)},${py.toFixed(1)}`).join("");
  const area = `${line}L${points.at(-1)[0].toFixed(1)},${y(0)}L${points[0][0].toFixed(1)},${y(0)}Z`;
  const ticks = [0, 0.25, 0.5, 0.75, 1].map((share) => Math.round(max * share));
  const labelEvery = Math.ceil(series.length / 8);
  return `
    <svg viewBox="0 0 ${CHART.width} ${CHART.height}" role="img" aria-label="${valueLabel} qrafiki">
      ${ticks.map((tick) => `<line class="analytics-grid-line" x1="${CHART.left}" x2="${CHART.width - CHART.right}" y1="${y(tick)}" y2="${y(tick)}" /><text class="analytics-axis" x="${CHART.left - 8}" y="${y(tick) + 4}" text-anchor="end">${tick}</text>`).join("")}
      ${series.map((point, index) => (index % labelEvery === 0 ? `<text class="analytics-axis" x="${x(index)}" y="${CHART.height - 8}" text-anchor="middle">${point.label}</text>` : "")).join("")}
      <path class="analytics-area" d="${area}" />
      <path class="analytics-line" d="${line}" />
      <line class="analytics-crosshair" data-crosshair y1="${CHART.top}" y2="${CHART.top + plotHeight}" x1="0" x2="0" style="display:none" />
      <circle class="analytics-dot" data-dot r="5" cx="0" cy="0" style="display:none" />
    </svg>
    <div class="analytics-tooltip" data-tooltip hidden></div>
  `;
};

const renderColumnChart = (series, valueLabel) => {
  const max = niceMax(Math.max(...series.map((point) => point.value)));
  const plotWidth = CHART.width - CHART.left - CHART.right;
  const plotHeight = CHART.height - CHART.top - CHART.bottom;
  const slot = plotWidth / series.length;
  const barWidth = Math.max(4, slot - 4);
  const y = (value) => CHART.top + plotHeight - (value / max) * plotHeight;
  const ticks = [0, 0.25, 0.5, 0.75, 1].map((share) => Math.round(max * share));
  return `
    <svg viewBox="0 0 ${CHART.width} ${CHART.height}" role="img" aria-label="${valueLabel} qrafiki">
      ${ticks.map((tick) => `<line class="analytics-grid-line" x1="${CHART.left}" x2="${CHART.width - CHART.right}" y1="${y(tick)}" y2="${y(tick)}" /><text class="analytics-axis" x="${CHART.left - 8}" y="${y(tick) + 4}" text-anchor="end">${tick}</text>`).join("")}
      ${series
        .map((point, index) => {
          const left = CHART.left + index * slot + (slot - barWidth) / 2;
          const height = Math.max(0, y(0) - y(point.value));
          return `${point.value ? `<rect class="analytics-bar" x="${left}" y="${y(point.value)}" width="${barWidth}" height="${height}" rx="3" />` : ""}
            <rect class="analytics-hit" data-index="${index}" x="${CHART.left + index * slot}" y="${CHART.top}" width="${slot}" height="${plotHeight}" />
            ${index % 3 === 0 ? `<text class="analytics-axis" x="${left + barWidth / 2}" y="${CHART.height - 8}" text-anchor="middle">${point.label}</text>` : ""}`;
        })
        .join("")}
    </svg>
    <div class="analytics-tooltip" data-tooltip hidden></div>
  `;
};

// qrafikin üzərində siçan: ən yaxın nöqtənin tarixi və dəyəri göstərilir
const bindChartHover = (container, series, valueLabel, isLine) => {
  const svg = container.querySelector("svg");
  const tooltip = container.querySelector("[data-tooltip]");
  const crosshair = container.querySelector("[data-crosshair]");
  const dot = container.querySelector("[data-dot]");
  const plotWidth = CHART.width - CHART.left - CHART.right;
  const show = (index, clientX) => {
    const point = series[index];
    tooltip.innerHTML = `<span>${point.label}</span><strong>${formatNumber(point.value)}</strong> ${valueLabel.toLowerCase()}`;
    tooltip.hidden = false;
    const box = container.getBoundingClientRect();
    tooltip.style.left = `${Math.min(Math.max(clientX - box.left, 70), box.width - 70)}px`;
    if (isLine) {
      const max = niceMax(Math.max(...series.map((item) => item.value)));
      const px = CHART.left + (series.length === 1 ? plotWidth / 2 : (index / (series.length - 1)) * plotWidth);
      const py = CHART.top + (CHART.height - CHART.top - CHART.bottom) * (1 - point.value / max);
      crosshair.setAttribute("x1", px);
      crosshair.setAttribute("x2", px);
      crosshair.style.display = "";
      dot.setAttribute("cx", px);
      dot.setAttribute("cy", py);
      dot.style.display = "";
    }
  };
  const hide = () => {
    tooltip.hidden = true;
    if (crosshair) crosshair.style.display = "none";
    if (dot) dot.style.display = "none";
  };
  svg.addEventListener("pointermove", (event) => {
    const box = svg.getBoundingClientRect();
    const svgX = ((event.clientX - box.left) / box.width) * CHART.width;
    const share = (svgX - CHART.left) / plotWidth;
    const index = isLine
      ? Math.round(Math.min(1, Math.max(0, share)) * (series.length - 1))
      : Math.min(series.length - 1, Math.max(0, Math.floor(share * series.length)));
    show(index, event.clientX);
  });
  svg.addEventListener("pointerleave", hide);
};

const renderMainChart = () => {
  if (!analyticsData) return;
  const isToday = analyticsRange === 1;
  const series = isToday ? hourlySeries(analyticsData.hours) : dailySeries(analyticsData.daily);
  const valueLabel = isToday ? "Sessiyalar" : METRIC_LABELS[analyticsMetric];
  analyticsChartTitle.textContent = isToday ? "Bu gün saatlar üzrə gəlişlər" : `Gündəlik: ${METRIC_LABELS[analyticsMetric].toLowerCase()}`;
  document.querySelector("[data-analytics-metrics]").hidden = isToday;
  analyticsChart.innerHTML = isToday ? renderColumnChart(series, valueLabel) : renderLineChart(series, valueLabel);
  bindChartHover(analyticsChart, series, valueLabel, !isToday);
};

/* ---------- siyahı kartları: üfüqi zolaqlar ---------- */
// rows: [{ name, value, detail }] — zolaq ən böyük dəyərə nisbətdə çəkilir
const barList = (rows, emptyText) => {
  if (!rows.length) return `<p class="admin-hint">${emptyText}</p>`;
  const max = Math.max(...rows.map((row) => row.value), 1);
  return `<ol class="analytics-bars">${rows
    .map(
      (row) => `
      <li title="${escapeAttr(row.name)}: ${formatNumber(row.value)}">
        <div class="analytics-bar-label"><span>${escapeAttr(row.name)}</span><strong>${formatNumber(row.value)}</strong></div>
        <div class="analytics-bar-track"><i style="width:${Math.max(2, (row.value / max) * 100)}%"></i></div>
        ${row.detail ? `<small>${row.detail}</small>` : ""}
      </li>`
    )
    .join("")}</ol>`;
};

const card = (title, hint, body, wide = false) => `
  <div class="analytics-card ${wide ? "analytics-wide" : ""}">
    <header><div><h3>${title}</h3>${hint ? `<p>${hint}</p>` : ""}</div></header>
    ${body}
  </div>
`;

const funnelCard = (funnel) => {
  const steps = [
    { name: "Sayta girdi", value: funnel.sessions },
    { name: "Ev səhifəsinə baxdı", value: funnel.house },
    { name: "Rezerv formunu açdı", value: funnel.reservation },
    { name: "Sorğu göndərdi", value: funnel.submitted }
  ];
  const body = `<ol class="analytics-funnel">${steps
    .map((step, index) => {
      const share = percent(step.value, funnel.sessions);
      const fromPrevious = index ? percent(step.value, steps[index - 1].value) : 100;
      return `<li>
        <div class="analytics-bar-label"><span>${index + 1}. ${step.name}</span><strong>${formatNumber(step.value)}</strong></div>
        <div class="analytics-bar-track"><i style="width:${Math.max(2, share)}%"></i></div>
        <small>${index ? `Əvvəlki addımdan ${fromPrevious}% keçib · ` : ""}bütün gəlişlərin ${share}%-i</small>
      </li>`;
    })
    .join("")}</ol>`;
  return card("Rezerv hunisi", "Gəlişlərin neçəsi hansı addıma qədər çatır; ən böyük düşüş harada olduğunu göstərir", body);
};

const renderGrid = (data) => {
  const clicks = barList(
    data.clicks.map((row) => ({
      name: row.label,
      value: row.clicks,
      detail: `${formatNumber(row.visitors)} nəfər · ${escapeAttr(pageName(row.page))}${row.target ? ` → ${escapeAttr(row.target)}` : ""}`
    })),
    "Bu dövrdə klik qeydə alınmayıb."
  );
  const pages = barList(
    data.pages.map((row) => ({
      name: pageName(row.page),
      value: row.views,
      detail: `${formatNumber(row.visitors)} nəfər · orta ${formatDuration(row.avgSeconds)}${row.avgScroll !== null ? ` · səhifənin ${row.avgScroll}%-nə qədər oxunub` : ""}`
    })),
    "Bu dövrdə baxış qeydə alınmayıb."
  );
  const sources = barList(
    data.sources.map((row) => ({ name: SOURCE_NAMES[row.name] ?? row.name, value: row.sessions, detail: `${formatNumber(row.visitors)} nəfər` })),
    "Məlumat yoxdur."
  );
  const campaigns = barList(
    data.campaigns.map((row) => ({ name: row.name, value: row.sessions, detail: [row.source, row.medium].filter(Boolean).map(escapeAttr).join(" / ") })),
    'Hələ kampaniya linki ilə gəliş yoxdur. Instagram bio və ya reklam linkinə <code>?utm_source=instagram&utm_campaign=yay</code> əlavə etsəniz, burada ayrıca görünəcək.'
  );
  const simple = (rows, names = {}) => barList(rows.map((row) => ({ name: names[row.name] ?? row.name, value: row.sessions })), "Məlumat yoxdur.");
  const countries = barList(data.countries.map((row) => ({ name: countryLabel(row.name), value: row.sessions })), "Məlumat yoxdur.");
  const hours = barList(
    data.hours
      .slice()
      .sort((a, b) => b.sessions - a.sessions)
      .slice(0, 8)
      .map((row) => ({ name: `${pad(row.hour)}:00 – ${pad((row.hour + 1) % 24)}:00`, value: row.sessions })),
    "Məlumat yoxdur."
  );

  analyticsGrid.innerHTML = [
    card("Ən çox klik edilənlər", "Düymələr və linklər: neçə dəfə basılıb, neçə nəfər basıb, harada və hara aparıb", clicks, true),
    card("Ən çox baxılan səhifələr", "Baxış sayı, orta vaxt və səhifənin nə qədər aşağı oxunduğu", pages, true),
    funnelCard(data.funnel),
    card("Haradan gəlirlər", "Ziyarətçini sayta gətirən mənbə (gəliş sayı)", sources),
    card("Kampaniyalar (UTM)", "utm_campaign olan linklərlə gəlişlər", campaigns),
    card("Cihazlar", "Gəliş sayı", simple(data.devices)),
    card("Ölkələr", "Gəliş sayı", countries),
    card("Brauzerlər", "Gəliş sayı", simple(data.browsers)),
    card("Əməliyyat sistemləri", "Gəliş sayı", simple(data.os)),
    card("Saytın dili", "Ziyarətçinin ilk açdığı dil", simple(data.langs, LANG_NAMES)),
    card("Ən aktiv saatlar", "Bakı vaxtı ilə gəlişlərin ən çox olduğu saatlar", hours)
  ].join("");
};

/* ---------- yükləmə ---------- */
const loadAnalytics = async () => {
  if (!analyticsPanel || document.querySelector("[data-admin-app]").hidden) return;
  const { from, to } = rangeDates();
  setAnalyticsStatus("");
  const [summary, live] = await Promise.all([
    supabaseClient.rpc("analytics_summary", { p_from: from.toISOString(), p_to: to.toISOString(), p_test: analyticsTest.checked }),
    supabaseClient.rpc("analytics_live", { p_test: analyticsTest.checked })
  ]);
  if (summary.error || live.error) {
    setAnalyticsStatus("Analitika yüklənmədi. İnterneti yoxlayıb \"Yenilə\" düyməsinə basın.");
    return;
  }
  analyticsData = summary.data;
  renderLive(live.data);
  renderKpis(analyticsData.totals);
  renderMainChart();
  renderGrid(analyticsData);
};

const loadLive = async () => {
  if (document.hidden || document.querySelector("[data-admin-app]").hidden) return;
  const { data, error } = await supabaseClient.rpc("analytics_live", { p_test: analyticsTest.checked });
  if (!error) renderLive(data);
};

analyticsRangeButtons.forEach((button) => {
  button.addEventListener("click", () => {
    analyticsRange = Number(button.dataset.analyticsRange);
    analyticsRangeButtons.forEach((item) => item.setAttribute("aria-selected", String(item === button)));
    loadAnalytics();
  });
});

analyticsMetricButtons.forEach((button) => {
  button.addEventListener("click", () => {
    analyticsMetric = button.dataset.analyticsMetric;
    analyticsMetricButtons.forEach((item) => item.setAttribute("aria-selected", String(item === button)));
    renderMainChart();
  });
});

analyticsTest?.addEventListener("change", loadAnalytics);
document.querySelector("[data-analytics-refresh]")?.addEventListener("click", loadAnalytics);

// panel açılanda yüklənir; "indi saytda" hər 20 saniyədə, qalan göstəricilər hər 2 dəqiqədə yenilənir
new MutationObserver(() => {
  if (!document.querySelector("[data-admin-app]").hidden && !analyticsData) loadAnalytics();
}).observe(document.querySelector("[data-admin-app]"), { attributes: true, attributeFilter: ["hidden"] });
window.setInterval(loadLive, 20000);
window.setInterval(() => {
  if (!document.hidden) loadAnalytics();
}, 120000);
