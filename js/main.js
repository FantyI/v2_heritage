/* =====================================================================
   НАСЛЕДИЕ — общий скрипт сайта
   ===================================================================== */
(function () {
  'use strict';

  /* ---------- Тост-уведомление ---------- */
  function showToast(message, autoHideMs) {
    var toast = document.createElement('div');
    toast.className = 'quiz-toast';
    toast.textContent = message;
    document.body.appendChild(toast);
    requestAnimationFrame(function () { toast.classList.add('is-visible'); });
    if (autoHideMs) {
      setTimeout(function () {
        toast.classList.remove('is-visible');
        setTimeout(function () { toast.remove(); }, 300);
      }, autoHideMs);
    }
    return toast;
  }

  /* после отправки заявки в опросе нас перекидывает на главную —
     здесь показываем всплывающее уведомление уже на новой странице */
  try {
    if (sessionStorage.getItem('quizLeadSent')) {
      sessionStorage.removeItem('quizLeadSent');
      showToast('Заявка отправлена! Менеджер свяжется с вами в ближайшее время.', 3000);
    }
  } catch (e) {}

  /* ---------- Аккордеон вопросов (FAQ) ---------- */
  var faqItems = document.querySelectorAll('.faq-item');
  faqItems.forEach(function (item) {
    var question = item.querySelector('.faq-item__q');
    if (!question) return;
    question.addEventListener('click', function () {
      var willOpen = !item.classList.contains('is-open');
      // закрываем остальные — открытым может быть только один вопрос
      faqItems.forEach(function (other) {
        if (other !== item) other.classList.remove('is-open');
      });
      item.classList.toggle('is-open', willOpen);
    });
  });

  /* ---------- Аккордеон преимуществ («Почему выбирают нас») ---------- */
  var advTrack = document.querySelector('.advantages-track');
  if (advTrack) {
    var advCards = advTrack.querySelectorAll('.adv-card');
    var advMobile = window.matchMedia('(max-width: 900px)');

    function collapseAll() {
      advCards.forEach(function (c) { c.classList.remove('is-active'); });
    }
    function ensureDesktopActive() {
      if (!advTrack.querySelector('.adv-card.is-active') && advCards.length) {
        advCards[advCards.length - 1].classList.add('is-active');
      }
    }

    /* на мобильных по умолчанию все «кирпичики» */
    if (advMobile.matches) collapseAll();

    advCards.forEach(function (card) {
      card.addEventListener('click', function () {
        if (advMobile.matches) {
          /* тап раскрывает карточку, повторный тап — сворачивает обратно */
          var willOpen = !card.classList.contains('is-active');
          collapseAll();
          if (willOpen) card.classList.add('is-active');
        } else {
          /* на десктопе всегда одна активная карточка справа */
          if (card.classList.contains('is-active')) return;
          collapseAll();
          card.classList.add('is-active');
        }
      });
    });

    /* при смене ширины: на мобильном — всё свернуть, на десктопе — одна активная */
    advMobile.addEventListener('change', function () {
      if (advMobile.matches) {
        collapseAll();
      } else {
        ensureDesktopActive();
      }
    });
  }

  /* ---------- Каталог проектов: карточки, фильтры, «Показать ещё» ---------- */
  var projectsGrid = document.getElementById('projectsGrid');
  if (projectsGrid && typeof HOUSES !== 'undefined' && Array.isArray(HOUSES)) {
    var VISIBLE_COUNT = 6;
    var moreRow = document.querySelector('.more-row');
    var moreBtn = document.getElementById('moreBtn');
    var tabButtons = document.querySelectorAll('.tab');
    var currentFilter = 'all';
    var expanded = false;             // нажата ли «Показать ещё»

    // Категории дома для фильтрации (этажность и гараж — автоматически)
    function houseKeys(h) {
      var keys = [];
      var floors = parseInt(h.floors, 10);
      if (floors === 1) keys.push('floors-1');
      if (floors >= 2) keys.push('floors-2');
      var g = (h.garage || '').toString().trim().toLowerCase();
      if (g && g !== 'нет' && g !== '—' && g !== '-') keys.push('гараж');
      (h.tags || []).forEach(function (t) {
        keys.push(String(t).trim().toLowerCase());
      });
      return keys;
    }

    function buildProjectCard(h) {
      var card = document.createElement('a');
      card.className = 'project-card';
      card.setAttribute('href', 'proekty/' + encodeURIComponent(h.id) + '.html');

      var media = document.createElement('div');
      media.className = 'project-card__media';
      var img = document.createElement('img');
      img.setAttribute('src', (h.images && h.images[0]) || '');
      img.setAttribute('alt', 'Проект «' + h.name + '»');
      media.appendChild(img);
      var price = document.createElement('span');
      price.className = 'project-card__price';
      var dot = document.createElement('span');
      dot.className = 'dot';
      price.appendChild(dot);
      price.appendChild(document.createTextNode(h.priceShort || h.price || ''));
      media.appendChild(price);
      card.appendChild(media);

      var foot = document.createElement('div');
      foot.className = 'project-card__foot';
      var name = document.createElement('h3');
      name.className = 'project-card__name';
      name.textContent = h.name;
      foot.appendChild(name);

      var meta = document.createElement('div');
      meta.className = 'project-card__meta';
      [
        { icon: 'img/icons/meta-area.svg', value: h.area },
        { icon: 'img/icons/meta-bed.svg',  value: h.rooms },
        { icon: 'img/icons/meta-bath.svg', value: h.bathrooms }
      ].forEach(function (item) {
        if (item.value === undefined || item.value === '') return;
        var span = document.createElement('span');
        var icon = document.createElement('img');
        icon.setAttribute('src', item.icon);
        icon.setAttribute('alt', '');
        span.appendChild(icon);
        span.appendChild(document.createTextNode(String(item.value)));
        meta.appendChild(span);
      });
      foot.appendChild(meta);
      card.appendChild(foot);
      return card;
    }

    // Строим карточки один раз
    var cards = HOUSES.map(function (h) {
      return { el: buildProjectCard(h), keys: houseKeys(h) };
    });
    projectsGrid.innerHTML = '';
    cards.forEach(function (c) { projectsGrid.appendChild(c.el); });

    // Сообщение «ничего не найдено»
    var emptyEl = document.createElement('p');
    emptyEl.className = 'projects-empty';
    emptyEl.textContent = 'По этому фильтру пока нет проектов.';
    emptyEl.style.cssText = 'grid-column:1/-1;margin:10px 0;color:#9a9da5;font-size:16px;';
    emptyEl.style.display = 'none';
    projectsGrid.appendChild(emptyEl);

    function applyView() {
      var matching = cards.filter(function (c) {
        return currentFilter === 'all' || c.keys.indexOf(currentFilter) >= 0;
      });
      cards.forEach(function (c) { c.el.style.display = 'none'; });

      // «Показать ещё» работает только в режиме «Все»
      var useMore = currentFilter === 'all' && !expanded && matching.length > VISIBLE_COUNT;
      var toShow = useMore ? matching.slice(0, VISIBLE_COUNT) : matching;
      toShow.forEach(function (c) { c.el.style.display = ''; });

      if (moreRow) moreRow.style.display = useMore ? '' : 'none';
      emptyEl.style.display = matching.length ? 'none' : '';
    }

    // Клик по вкладке-фильтру
    tabButtons.forEach(function (tab) {
      tab.addEventListener('click', function () {
        tabButtons.forEach(function (t) { t.classList.remove('is-active'); });
        tab.classList.add('is-active');
        currentFilter = tab.getAttribute('data-filter') || 'all';
        expanded = false;
        applyView();
      });
    });

    // Кнопка «Показать ещё»
    if (moreBtn) {
      moreBtn.addEventListener('click', function () {
        expanded = true;
        applyView();
      });
    }

    applyView();
  }

  /* ---------- Примеры готовых домов: реальные проекты из каталога ---------- */
  var examplesGrid = document.getElementById('examplesGrid');
  if (examplesGrid && typeof HOUSES !== 'undefined' && Array.isArray(HOUSES)) {
    var featuredIds = (examplesGrid.getAttribute('data-featured') || '')
      .split(',').map(function (s) { return s.trim(); }).filter(Boolean);
    var featured = [];
    featuredIds.forEach(function (id) {
      var h = HOUSES.filter(function (x) { return x.id === id; })[0];
      if (h) featured.push(h);
    });
    if (!featured.length) featured = HOUSES.slice(0, 3);
    featured = featured.slice(0, 3);

    examplesGrid.innerHTML = '';
    featured.forEach(function (h) {
      var a = document.createElement('a');
      a.className = 'example-card';
      a.setAttribute('href', 'proekty/' + encodeURIComponent(h.id) + '.html');

      var img = document.createElement('img');
      img.setAttribute('src', (h.images && h.images[0]) || '');
      img.setAttribute('alt', 'Проект «' + h.name + '»');
      a.appendChild(img);

      var chips = document.createElement('div');
      chips.className = 'example-card__chips';
      [
        { color: 'var(--gold)',   text: h.area },
        { color: 'var(--cyan)',   text: h.rooms ? h.rooms + ' комн.' : '' },
        { color: 'var(--orange)', text: h.bathrooms ? h.bathrooms + ' с/у' : '' }
      ].forEach(function (c) {
        if (!c.text) return;
        var chip = document.createElement('span');
        chip.className = 'chip';
        var dot = document.createElement('span');
        dot.className = 'dot';
        dot.style.background = c.color;
        chip.appendChild(dot);
        chip.appendChild(document.createTextNode(c.text));
        chips.appendChild(chip);
      });
      a.appendChild(chips);

      var name = document.createElement('h3');
      name.className = 'example-card__name';
      name.textContent = h.name;
      a.appendChild(name);

      examplesGrid.appendChild(a);
    });
  }

  /* ---------- Маска телефона для полей type="tel" ---------- */
  function formatPhone(raw) {
    var d = raw.replace(/\D/g, '');
    if (d[0] === '8') d = '7' + d.slice(1);
    if (d && d[0] !== '7') d = '7' + d;
    d = d.slice(0, 11);
    var out = '+7';
    if (d.length > 1) out += ' (' + d.slice(1, 4);
    if (d.length >= 4) out += ') ' + d.slice(4, 7);
    if (d.length >= 7) out += '-' + d.slice(7, 9);
    if (d.length >= 9) out += '-' + d.slice(9, 11);
    return out;
  }
  document.querySelectorAll('input[type="tel"]').forEach(function (input) {
    input.addEventListener('input', function () {
      input.value = formatPhone(input.value);
    });
    input.addEventListener('focus', function () {
      if (!input.value) input.value = '+7 ';
    });
    input.addEventListener('blur', function () {
      if (input.value === '+7' || input.value === '+7 ') input.value = '';
    });
  });

  /* ---------- Слайдеры (плавная прокрутка вручную) ---------- */
  function animateScroll(el, to) {
    var start = el.scrollLeft;
    var max = el.scrollWidth - el.clientWidth;
    to = Math.max(0, Math.min(to, max));
    var dist = to - start;
    if (Math.abs(dist) < 1) return;
    var duration = 380, t0 = null;
    function step(ts) {
      if (t0 === null) t0 = ts;
      var p = Math.min((ts - t0) / duration, 1);
      var ease = 1 - Math.pow(1 - p, 3); /* ease-out-cubic */
      el.scrollLeft = start + dist * ease;
      if (p < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }
  function bindSlider(trackId, prevSel, nextSel) {
    var track = document.getElementById(trackId);
    if (!track) return;
    /* Шаг прокрутки = одна карточка. Считаем не от текущего scrollLeft,
       а от позиции самих карточек — так шаг не «уплывает» и следующее
       видео всегда встаёт ровно в кадр (без обрезанного края). */
    function step(dir) {
      var items = track.children;
      if (!items.length) return;
      var base = items[0].offsetLeft; /* учитываем внутренние отступы трека */
      var stepW = items.length > 1
        ? items[1].offsetLeft - items[0].offsetLeft
        : items[0].getBoundingClientRect().width;
      if (!stepW) return;
      var idx = Math.round((track.scrollLeft) / stepW);
      idx = Math.max(0, Math.min(items.length - 1, idx + dir));
      animateScroll(track, items[idx].offsetLeft - base);
    }
    document.querySelectorAll(nextSel).forEach(function (b) {
      b.addEventListener('click', function () { step(1); });
    });
    document.querySelectorAll(prevSel).forEach(function (b) {
      b.addEventListener('click', function () { step(-1); });
    });
  }
  bindSlider('reelsTrack', '[data-reels-prev]', '[data-reels-next]');
  bindSlider('stepsTrack', '[data-steps-prev]', '[data-steps-next]');

  /* ---------- Видео-ролики «Стройка без фильтров» ---------- */
  (function () {
    var reels = document.querySelectorAll('.reel');
    if (!reels.length) return;
    var videos = [];
    reels.forEach(function (reel) {
      var video = reel.querySelector('video');
      if (!video) return;
      videos.push(video);
      reel.addEventListener('click', function () {
        if (video.paused) {
          // ставим на паузу остальные ролики
          videos.forEach(function (v) { if (v !== video) v.pause(); });
          var p = video.play();
          if (p && p.catch) p.catch(function () {});
        } else {
          video.pause();
        }
      });
      video.addEventListener('play', function () { reel.classList.add('is-playing'); });
      video.addEventListener('pause', function () { reel.classList.remove('is-playing'); });
      video.addEventListener('ended', function () { reel.classList.remove('is-playing'); });
    });
  })();

  /* ---------- Плавающая кнопка опроса: скрытие (крестик/свайп) на любом экране ---------- */
  (function () {
    var fab = document.querySelector('.quiz-fab');
    if (!fab) return;
    var startX = 0, startY = 0, moved = false;

    /* крестик — спрятать опрос (работает на всех устройствах) */
    var closeBtn = fab.querySelector('.quiz-fab__close');
    function collapse(e) {
      if (e) { e.preventDefault(); e.stopPropagation(); }
      fab.classList.add('is-collapsed');
    }
    if (closeBtn) {
      closeBtn.addEventListener('click', collapse);
      closeBtn.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') collapse(e);
      });
    }

    /* свайп вправо прячет, влево — возвращает (тач) */
    fab.addEventListener('touchstart', function (e) {
      var t = e.touches[0];
      startX = t.clientX;
      startY = t.clientY;
      moved = false;
    }, { passive: true });
    fab.addEventListener('touchmove', function (e) {
      var t = e.touches[0];
      var dx = t.clientX - startX;
      var dy = t.clientY - startY;
      if (Math.abs(dx) > 8 && Math.abs(dx) > Math.abs(dy)) moved = true;
      if (dx > 24) fab.classList.add('is-collapsed');
      else if (dx < -24) fab.classList.remove('is-collapsed');
    }, { passive: true });

    /* клик: если свёрнут — раскрываем (а не переходим); был свайп — не переходим */
    fab.addEventListener('click', function (e) {
      var wasMoved = moved;
      moved = false;
      if (fab.classList.contains('is-collapsed')) {
        e.preventDefault();
        fab.classList.remove('is-collapsed');
        return;
      }
      if (wasMoved) e.preventDefault();
    });
  })();

  /* ---------- Мобильная панель: опрос + мессенджеры + кнопка «наверх» ---------- */
  (function () {
    if (document.querySelector('.fab-row')) return;
    var fab = document.querySelector('.quiz-fab');
    var quizHref = fab ? fab.getAttribute('href') : 'quiz.html';

    /* ССЫЛКИ: замените '#' на реальные адреса каналов */
    var CHANNELS = [
      { name: 'Telegram', icon: 'img/icons/telegram.svg', href: '#' },
      { name: 'МАКС',     icon: 'img/icons/max.svg',      href: '#' }
    ];

    var row = document.createElement('div');
    row.className = 'fab-row';

    /* 1. оранжевая иконка опроса (ведёт на квиз) */
    var quizIcon = document.createElement('a');
    quizIcon.className = 'fab-row__quiz';
    quizIcon.href = quizHref;
    quizIcon.setAttribute('aria-label', 'Пройти опрос');
    quizIcon.innerHTML = '<img src="img/icons/survey.svg" alt="">';
    row.appendChild(quizIcon);

    /* 2. мессенджеры */
    CHANNELS.forEach(function (c) {
      var a = document.createElement('a');
      a.className = 'social-fab__btn';
      a.href = c.href;
      a.setAttribute('aria-label', c.name);
      /* внешнюю вкладку открываем только для настоящих ссылок */
      if (/^https?:/i.test(c.href)) { a.target = '_blank'; a.rel = 'noopener'; }
      var img = document.createElement('img');
      img.src = c.icon;
      img.alt = c.name;
      a.appendChild(img);
      row.appendChild(a);
    });

    /* 3. контурная кнопка-призыв */
    var cta = document.createElement('a');
    cta.className = 'fab-cta';
    cta.href = quizHref;
    cta.textContent = 'рассчитать проект';
    row.appendChild(cta);

    document.body.appendChild(row);

    /* кнопка «наверх» — отдельно справа */
    var toTop = document.createElement('button');
    toTop.type = 'button';
    toTop.className = 'fab-totop';
    toTop.setAttribute('aria-label', 'Наверх');
    toTop.innerHTML =
      '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true">' +
      '<path d="M6 14l6-6 6 6" stroke="currentColor" stroke-width="2.2" ' +
      'stroke-linecap="round" stroke-linejoin="round"/></svg>';
    toTop.addEventListener('click', function () {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
    document.body.appendChild(toTop);
  })();

  /* ---------- Мобильное меню (бургер) ---------- */
  var burger = document.querySelector('.burger');
  var nav = document.querySelector('.nav');
  if (burger && nav) {
    burger.addEventListener('click', function () {
      nav.classList.toggle('is-open');
    });
  }

  /* ---------- Модальное окно заявки ---------- */
  var modal = document.querySelector('.modal');
  if (modal) {
    var closeEls = modal.querySelectorAll('[data-modal-close]');
    var titleEl = modal.querySelector('.modal__title');
    var textEl = modal.querySelector('.modal__text');
    var commentEl = modal.querySelector('textarea');
    var defaultTitle = titleEl ? titleEl.textContent : '';
    document.querySelectorAll('[data-modal-open]').forEach(function (trigger) {
      trigger.addEventListener('click', function (e) {
        e.preventDefault();
        // Заголовок окна: из data-modal-title, иначе — заголовок по умолчанию
        if (titleEl) {
          titleEl.textContent = trigger.hasAttribute('data-modal-title')
            ? trigger.getAttribute('data-modal-title')
            : defaultTitle;
        }
        // Поясняющий текст: пустое значение data-modal-text прячет абзац
        if (textEl) {
          textEl.style.display =
            trigger.getAttribute('data-modal-text') === '' ? 'none' : '';
        }
        // Поле комментария: скрываем, если у кнопки есть data-modal-nocomment
        if (commentEl) {
          commentEl.style.display =
            trigger.hasAttribute('data-modal-nocomment') ? 'none' : '';
        }
        modal.classList.add('is-open');
        document.body.style.overflow = 'hidden';
      });
    });
    function closeModal() {
      modal.classList.remove('is-open');
      document.body.style.overflow = '';
    }
    closeEls.forEach(function (el) { el.addEventListener('click', closeModal); });
    modal.addEventListener('click', function (e) {
      if (e.target === modal) closeModal();
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') closeModal();
    });
  }

  /* ---------- Окно «Спасибо за заявку» (открывается при отправке заявки) ---------- */
  function socialBtn(mod, href, label, icon) {
    return '<a class="lt-soc lt-soc--' + mod + '" href="' + href + '"' +
      (href === '#' ? '' : ' target="_blank" rel="noopener"') + '>' +
      '<span class="lt-soc__ic"><img src="' + icon + '" alt="" /></span>' +
      '<span class="lt-soc__label">' + label + '</span></a>';
  }

  function showLeadThanks() {
    var ov = document.createElement('div');
    ov.className = 'lead-thanks';
    ov.setAttribute('role', 'dialog');
    ov.setAttribute('aria-label', 'Заявка отправлена');
    ov.innerHTML =
      '<div class="lead-thanks__box lead-thanks__box--social">' +
      '<button type="button" class="lead-thanks__close" aria-label="Закрыть">&times;</button>' +
      '<div class="lead-thanks__ic"><svg viewBox="0 0 24 24" fill="none">' +
      '<path d="M4 12.5l5 5 11-11" stroke="currentColor" stroke-width="2.4" ' +
      'stroke-linecap="round" stroke-linejoin="round"/></svg></div>' +
      '<h3 class="lead-thanks__title">Спасибо за заявку!</h3>' +
      '<p class="lead-thanks__text">Наш менеджер свяжется с вами в ближайшее время. ' +
      'А пока вы можете посмотреть наш сайт и контент в социальных сетях.</p>' +
      '<div class="lead-thanks__socials">' +
      socialBtn('site', '#', 'Наш сайт', 'img/icons/globe.svg') +
      socialBtn('zen', '#', 'Дзен', 'img/icons/zen.svg') +
      socialBtn('vk', '#', 'Вконтакте', 'img/icons/vk-blue.svg') +
      socialBtn('tg', '#', 'Telegram', 'img/icons/telegram.svg') +
      socialBtn('max', '#', 'Макс', 'img/icons/max-blue.svg') +
      socialBtn('inst', '#', 'Instagram', 'img/icons/instagram.svg') +
      '</div>' +
      '<p class="lead-thanks__note">*Компания Meta Platforms Inc., владеющая социальными сетями ' +
      'Facebook и Instagram, по решению суда от 21.03.2022 признана экстремистской организацией, ' +
      'ее деятельность на территории России запрещена.</p>' +
      '</div>';
    document.body.appendChild(ov);
    document.body.style.overflow = 'hidden';

    function close() {
      ov.classList.remove('is-open');
      document.body.style.overflow = '';
      setTimeout(function () { if (ov.parentNode) ov.parentNode.removeChild(ov); }, 250);
      document.removeEventListener('keydown', onKey);
    }
    function onKey(e) { if (e.key === 'Escape') close(); }
    ov.querySelector('.lead-thanks__close').addEventListener('click', close);
    ov.addEventListener('click', function (e) { if (e.target === ov) close(); });
    document.addEventListener('keydown', onKey);
    requestAnimationFrame(function () {
      requestAnimationFrame(function () { ov.classList.add('is-open'); });
    });
  }

  /* ---------- Отправка форм-заявок ---------- */
  document.querySelectorAll('form[data-lead-form]').forEach(function (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      form.reset();
      // если форма внутри модального окна — сначала закрываем модалку
      var m = form.closest('.modal');
      if (m) {
        m.classList.remove('is-open');
        document.body.style.overflow = '';
      }
      showLeadThanks();
    });
  });

  /* ---------- Тень у закреплённой шапки при скролле ---------- */
  var headerEl = document.querySelector('.header');
  if (headerEl) {
    var onHeaderScroll = function () {
      headerEl.classList.toggle('is-stuck', window.scrollY > 8);
    };
    window.addEventListener('scroll', onHeaderScroll, { passive: true });
    onHeaderScroll();
  }

  /* ---------- 3D-наклон карточек при наведении ---------- */
  var finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (finePointer && !reduceMotion) {
    var MAX_TILT = 9; /* градусов */
    document.querySelectorAll('.service-card, .example-card').forEach(function (card) {
      var raf = null;
      card.addEventListener('mousemove', function (e) {
        var r = card.getBoundingClientRect();
        var nx = (e.clientX - r.left) / r.width - 0.5;
        var ny = (e.clientY - r.top) / r.height - 0.5;
        if (raf) cancelAnimationFrame(raf);
        raf = requestAnimationFrame(function () {
          /* угол под курсором «проседает» (уходит на задний план) */
          card.style.transform =
            'perspective(900px) rotateX(' + (-ny * MAX_TILT).toFixed(2) +
            'deg) rotateY(' + (nx * MAX_TILT).toFixed(2) + 'deg) scale(1.015)';
        });
      });
      card.addEventListener('mouseenter', function () {
        card.classList.add('is-tilting');
      });
      card.addEventListener('mouseleave', function () {
        if (raf) cancelAnimationFrame(raf);
        card.classList.remove('is-tilting');
        card.style.transform = '';
      });
    });
  }

  /* ---------- Уведомление об использовании cookies ---------- */
  (function () {
    var STORAGE_KEY = 'cookieConsent';
    var consent;
    try { consent = localStorage.getItem(STORAGE_KEY); } catch (e) { consent = 'accepted'; }
    if (consent === 'accepted') return; // согласие уже получено — баннер не показываем

    var banner = document.createElement('div');
    banner.className = 'cookie-banner';
    banner.setAttribute('role', 'dialog');
    banner.setAttribute('aria-label', 'Уведомление об использовании cookies');
    banner.innerHTML =
      '<p class="cookie-banner__text">Мы используем файлы cookie, чтобы сайт работал' +
      ' корректно и был удобнее для вас. Продолжая пользоваться сайтом, вы соглашаетесь' +
      ' на обработку файлов cookie. <a href="#">Подробнее</a></p>' +
      '<button type="button" class="cookie-banner__btn">Принять</button>';

    function dismiss() {
      try { localStorage.setItem(STORAGE_KEY, 'accepted'); } catch (e) {}
      banner.classList.remove('is-visible');
      setTimeout(function () {
        if (banner.parentNode) banner.parentNode.removeChild(banner);
      }, 400);
    }
    banner.querySelector('.cookie-banner__btn').addEventListener('click', dismiss);

    document.body.appendChild(banner);
    /* запускаем появление на следующем кадре, чтобы сработал transition */
    requestAnimationFrame(function () {
      requestAnimationFrame(function () { banner.classList.add('is-visible'); });
    });
  })();

})();

/* ---------- Опрос (квиз) ---------- */
(function () {
  'use strict';

  var quiz = document.querySelector('[data-quiz]');
  if (!quiz) return;

  var box = quiz.querySelector('.quiz__box');
  var head = quiz.querySelector('.quiz__head');
  var countEl = quiz.querySelector('.quiz__count');
  var pctEl = quiz.querySelector('.quiz__pct');
  var barEl = quiz.querySelector('.quiz__progress span');
  var progressWrap = quiz.querySelector('.quiz__progress');
  var panels = Array.prototype.slice.call(quiz.querySelectorAll('.quiz-panel'));
  var current = 0;

  function showPanel(index) {
    if (index < 0 || index >= panels.length) return;
    current = index;
    panels.forEach(function (p, i) { p.classList.toggle('is-active', i === index); });

    var panel = panels[index];
    var progress = panel.getAttribute('data-progress');
    if (progress) {
      head.style.display = '';
      progressWrap.style.display = '';
      countEl.textContent = panel.getAttribute('data-count') || '';
      pctEl.textContent = progress + '%';
      barEl.style.width = progress + '%';
    } else {
      head.style.display = 'none';
      progressWrap.style.display = 'none';
    }
    if (box) box.scrollTop = 0;
  }

  /* выбор вариантов (одиночный / множественный) */
  panels.forEach(function (panel) {
    var multi = panel.getAttribute('data-multi') === 'true';
    var opts = Array.prototype.slice.call(panel.querySelectorAll('.quiz-opt'));
    opts.forEach(function (opt) {
      opt.addEventListener('click', function () {
        if (multi) {
          opt.classList.toggle('is-selected');
        } else {
          opts.forEach(function (o) { o.classList.remove('is-selected'); });
          opt.classList.add('is-selected');
        }
      });
    });
  });

  /* кнопки «Далее» — требуем выбор перед переходом */
  quiz.querySelectorAll('[data-quiz-next]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var panel = btn.closest('.quiz-panel');
      var options = panel.querySelector('.quiz-options');
      if (options && !panel.querySelector('.quiz-opt.is-selected')) {
        options.classList.remove('quiz-options--shake');
        void options.offsetWidth; /* перезапуск анимации */
        options.classList.add('quiz-options--shake');
        return;
      }
      showPanel(current + 1);
    });
  });

  /* выбор канала связи (Telegram / МАКС) — для Telegram показываем поле «ник»
     и делаем его обязательным; для МАКС поле прячется и не требуется */
  var tgRow = quiz.querySelector('.quiz-tg-row');
  var tgInput = tgRow ? tgRow.querySelector('input') : null;
  function selectChannel(ch) {
    quiz.querySelectorAll('.quiz-channel').forEach(function (c) { c.classList.remove('is-selected'); });
    ch.classList.add('is-selected');
    var isTg = ch.classList.contains('quiz-channel-tg');
    if (tgRow) tgRow.hidden = !isTg;
    if (tgInput) tgInput.required = isTg;
  }
  quiz.querySelectorAll('.quiz-channel').forEach(function (ch) {
    ch.addEventListener('click', function () { selectChannel(ch); });
  });
  /* начальное состояние по выбранному по умолчанию каналу */
  var preselected = quiz.querySelector('.quiz-channel.is-selected') || quiz.querySelector('.quiz-channel');
  if (preselected) selectChannel(preselected);

  /* отправка контактов -> сразу переходим на главную, где покажем уведомление */
  var form = quiz.querySelector('[data-quiz-form]');
  if (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var submitBtn = form.querySelector('[type="submit"]');
      if (submitBtn) submitBtn.disabled = true;
      try { sessionStorage.setItem('quizLeadSent', '1'); } catch (err) {}
      window.location.href = 'index.html';
    });
  }

  /* инициализация первого шага */
  showPanel(0);
})();
