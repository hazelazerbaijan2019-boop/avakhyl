// qonağın öz rezervini ləğv etdiyi səhifə: link WhatsApp mesajında gəlir (cancel.html?token=...)
const params = new URLSearchParams(window.location.search);
const token = params.get("token") || "";
let currentLang = ["az", "ru", "en"].includes(params.get("lang")) ? params.get("lang") : "az";
let reservation = null;
let cancelled = false;

document.documentElement.dataset.theme = params.get("theme") === "dark" ? "dark" : "light";

const homeNames = { qaya: "Qaya", ardic: "Ardıc", palid: "Palıd", glamp4: "Glamphouse (4)", glamp2: "Glamphouse (2)" };

const text = {
  az: {
    title: "Rezervi ləğv et",
    number: "Rezerv",
    home: "Ev",
    dates: "Tarixlər",
    status: "Vəziyyət",
    loading: "Yüklənir...",
    notFound: "Rezerv tapılmadı. Linki yoxlayın və ya bizə WhatsApp-dan yazın.",
    ask: "Rezervi ləğv etmək istəyirsiniz? Tarixlər digər qonaqlar üçün açılacaq.",
    paid: "Ödənilmiş məbləğ geri qaytarılmır.",
    accept: "Bəli, rezervi ləğv etmək istəyirəm",
    button: "Rezervi ləğv et",
    done: "Rezerviniz ləğv olundu.",
    closed: "Bu rezervi artıq ləğv etmək mümkün deyil.",
    closedBy: {
      expired: "Sorğu təsdiqlənmədiyi üçün gözləmə müddəti bitib və tarixlər artıq boşdur. Ləğv etməyə ehtiyac yoxdur. Yenidən rezerv etmək üçün sorğunu təkrar göndərin.",
      cancelled: "Bu rezerv artıq ləğv olunub.",
      rejected: "Bu sorğu rədd edilib, tarixlər boşdur."
    },
    failed: "Ləğv olunmadı. İnterneti yoxlayıb yenidən cəhd edin və ya bizə WhatsApp-dan yazın.",
    home_link: "Ana səhifəyə qayıt",
    statuses: { pending: "Gözləyir", confirmed: "Təsdiqlənib", cancelled: "Ləğv olunub", rejected: "Rədd edilib", expired: "Vaxtı bitib" }
  },
  ru: {
    title: "Отмена бронирования",
    number: "Бронь",
    home: "Дом",
    dates: "Даты",
    status: "Статус",
    loading: "Загрузка...",
    notFound: "Бронь не найдена. Проверьте ссылку или напишите нам в WhatsApp.",
    ask: "Вы хотите отменить бронь? Даты станут доступны другим гостям.",
    paid: "Оплаченная сумма не возвращается.",
    accept: "Да, я хочу отменить бронь",
    button: "Отменить бронь",
    done: "Ваша бронь отменена.",
    closed: "Эту бронь уже нельзя отменить.",
    closedBy: {
      expired: "Запрос не был подтверждён, срок ожидания истёк, и даты уже свободны. Отменять ничего не нужно. Чтобы забронировать снова, отправьте запрос повторно.",
      cancelled: "Эта бронь уже отменена.",
      rejected: "Этот запрос отклонён, даты свободны."
    },
    failed: "Не удалось отменить. Проверьте интернет и попробуйте снова или напишите нам в WhatsApp.",
    home_link: "На главную",
    statuses: { pending: "Ожидает", confirmed: "Подтверждена", cancelled: "Отменена", rejected: "Отклонена", expired: "Истекла" }
  },
  en: {
    title: "Cancel reservation",
    number: "Reservation",
    home: "Home",
    dates: "Dates",
    status: "Status",
    loading: "Loading...",
    notFound: "Reservation not found. Check the link or message us on WhatsApp.",
    ask: "Do you want to cancel your reservation? The dates will become available to other guests.",
    paid: "The amount paid is not refunded.",
    accept: "Yes, I want to cancel the reservation",
    button: "Cancel reservation",
    done: "Your reservation has been cancelled.",
    closed: "This reservation can no longer be cancelled.",
    closedBy: {
      expired: "The request was not confirmed, so the hold has expired and the dates are free again. There is nothing to cancel. To book, please send the request again.",
      cancelled: "This reservation has already been cancelled.",
      rejected: "This request was declined; the dates are free."
    },
    failed: "Cancellation failed. Check your connection and try again, or message us on WhatsApp.",
    home_link: "Back to home page",
    statuses: { pending: "Pending", confirmed: "Confirmed", cancelled: "Cancelled", rejected: "Rejected", expired: "Expired" }
  }
};

const title = document.querySelector("[data-cancel-title]");
const details = document.querySelector("[data-cancel-details]");
const message = document.querySelector("[data-cancel-text]");
const confirmBox = document.querySelector("[data-cancel-confirm]");
const accept = document.querySelector("[data-cancel-accept]");
const acceptLabel = document.querySelector("[data-cancel-accept-label]");
const statusBox = document.querySelector("[data-cancel-status]");
const button = document.querySelector("[data-cancel-button]");
const homeLink = document.querySelector("[data-cancel-home]");

const formatDate = (iso) => iso.split("-").reverse().join(".");
const isOpen = () => reservation && !cancelled && ["pending", "confirmed"].includes(reservation.status);

const render = (state = "") => {
  const t = text[currentLang];
  document.documentElement.lang = currentLang;
  document.title = `Avakhyl | ${t.title}`;
  title.textContent = t.title;
  acceptLabel.textContent = t.accept;
  button.textContent = t.button;
  homeLink.textContent = t.home_link;
  homeLink.href = `index.html?lang=${currentLang}`;
  document.querySelectorAll("[data-lang]").forEach((langButton) => {
    langButton.setAttribute("aria-pressed", String(langButton.dataset.lang === currentLang));
  });

  details.hidden = !reservation;
  if (reservation) {
    details.innerHTML = "";
    [
      [t.number, `#${reservation.number}`],
      [t.home, homeNames[reservation.home] ?? reservation.home],
      [t.dates, `${formatDate(reservation.checkin)} – ${formatDate(reservation.checkout)}`],
      [t.status, t.statuses[cancelled ? "cancelled" : reservation.status] ?? reservation.status]
    ].forEach(([label, value]) => {
      const dt = document.createElement("dt");
      const dd = document.createElement("dd");
      dt.textContent = label;
      dd.textContent = value;
      details.append(dt, dd);
    });
  }

  if (state === "loading") message.textContent = t.loading;
  else if (!reservation) message.textContent = t.notFound;
  else if (cancelled) message.textContent = t.done;
  else if (isOpen()) message.textContent = `${t.ask}${reservation.status === "confirmed" ? ` ${t.paid}` : ""}`;
  else message.textContent = t.closedBy[reservation.status] ?? t.closed;

  confirmBox.hidden = !isOpen();
  button.hidden = !isOpen();
  button.disabled = !accept.checked;
};

const showError = (key) => {
  statusBox.textContent = text[currentLang][key];
  statusBox.classList.add("is-error");
  statusBox.hidden = false;
};

document.querySelectorAll("[data-lang]").forEach((langButton) => {
  langButton.addEventListener("click", () => {
    currentLang = langButton.dataset.lang;
    render();
  });
});

accept.addEventListener("change", () => render());

button.addEventListener("click", async () => {
  button.disabled = true;
  statusBox.hidden = true;
  try {
    await cancelReservationByToken(token);
    cancelled = true;
    render();
  } catch (error) {
    showError(error.message === "not_cancellable" ? "closed" : "failed");
    render();
  }
});

const load = async () => {
  render("loading");
  try {
    reservation = /^[0-9a-f-]{36}$/i.test(token) ? await getReservationByToken(token) : null;
  } catch {
    reservation = null;
  }
  render();
};

load();
