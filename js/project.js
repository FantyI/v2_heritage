/* =====================================================================
   НАСЛЕДИЕ — скрипт страницы проекта
   ===================================================================== */

/* ---------- Загрузка данных дома из URL параметра ---------- */
(function () {
  'use strict';

  var params = new URLSearchParams(window.location.search);
  // id берём из ?id=… либо из data-project-id (статические страницы /proekty/<id>.html)
  var id = params.get('id') || document.documentElement.getAttribute('data-project-id');

  if (typeof HOUSES === 'undefined') return;

  var h = null;
  for (var i = 0; i < HOUSES.length; i++) {
    if (HOUSES[i].id === id) { h = HOUSES[i]; break; }
  }

  if (!h) {
    window.location.replace('index.html#projects');
    return;
  }

  document.title = h.name + ' — проект дома из газобетона | Наследие';

  function setText(sel, val) {
    var el = document.querySelector(sel);
    if (el && val !== undefined) el.textContent = val;
  }

  /* --- Карточка покупки --- */
  setText('.buy-card__name', h.name);
  setText('.buy-card__type', h.style);
  setText('.buy-card__price', h.price);
  setText('.buy-card__id', 'ID объекта: ' + h.objectId);

  /* --- Характеристики --- */
  var specLabels = document.querySelectorAll('.spec-card__label');
  var specMap = {
    'Общая площадь':  h.area,
    'Жилая площадь':  h.livingArea,
    'Этажей':         String(h.floors),
    'Комнат':         String(h.rooms),
    'Санузлов':       String(h.bathrooms),
    'Габариты':       h.dimensions,
    'Гараж':          h.garage
  };
  specLabels.forEach(function (label) {
    var val = specMap[label.textContent.trim()];
    if (val !== undefined) {
      var valueEl = label.parentElement.querySelector('.spec-card__value');
      if (valueEl) valueEl.textContent = val;
    }
  });

  /* --- Бейдж стиля в заголовке характеристик --- */
  var mapBadge = document.querySelector('.specs__map-badge');
  if (mapBadge) mapBadge.textContent = h.style;

  /* --- Текст модального окна --- */
  var modalText = document.querySelector('.modal__text');
  if (modalText) modalText.textContent = 'Заполните форму, и мы свяжемся с вами для подробной презентации проекта «' + h.name + '».';

  /* --- Комплектация --- */
  if (h.complectation) {
    var cols = document.querySelectorAll('.complectation__col');
    var contours = [
      { key: 'cold', label: 'Холодный контур' },
      { key: 'warm', label: 'Теплый контур' }
    ];
    contours.forEach(function (contour, colIndex) {
      var col = cols[colIndex];
      if (!col || !h.complectation[contour.key]) return;
      var title = col.querySelector('.complectation__col-title');
      if (title) title.textContent = contour.label;
      var groupsContainer = col.querySelector('.complectation__groups');
      if (!groupsContainer) return;
      groupsContainer.innerHTML = '';
      h.complectation[contour.key].forEach(function (group) {
        var div = document.createElement('div');
        div.className = 'spec-group';
        var h4 = document.createElement('h4');
        h4.className = 'spec-group__title';
        h4.textContent = group.title;
        div.appendChild(h4);
        var ul = document.createElement('ul');
        group.items.forEach(function (item) {
          var li = document.createElement('li');
          li.textContent = item;
          ul.appendChild(li);
        });
        div.appendChild(ul);
        groupsContainer.appendChild(div);
      });
    });
  }

  /* --- Кнопка «Презентация»: скачивание файла либо форма заявки --- */
  var presentBtn = document.getElementById('presentBtn');
  if (presentBtn && h.presentationUrl) {
    // клон снимает обработчик модалки из main.js, оставляя только скачивание
    var freshBtn = presentBtn.cloneNode(true);
    presentBtn.parentNode.replaceChild(freshBtn, presentBtn);
    freshBtn.addEventListener('click', function (e) {
      e.preventDefault();
      var a = document.createElement('a');
      a.href = h.presentationUrl;
      a.setAttribute('download', '');
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    });
  }

  /* --- Видео-визитка --- */
  var videoCard = document.querySelector('.video-card');
  if (videoCard) {
    var videoImg = videoCard.querySelector('img');
    if (videoImg && h.videoThumb) {
      videoImg.setAttribute('src', h.videoThumb);
      videoImg.setAttribute('alt', 'Видео-визитка проекта «' + h.name + '»');
    }
    // Если видео нет — скрываем секцию
    var videoSection = videoCard.closest('section');
    if (!h.videoUrl) {
      if (videoSection) videoSection.style.display = 'none';
    } else {
      if (videoSection) videoSection.style.display = '';
      videoCard.style.cursor = 'pointer';
      videoCard.addEventListener('click', function () {
        var iframe = document.createElement('iframe');
        iframe.src = h.videoUrl + '?autoplay=1';
        iframe.allow = 'autoplay; fullscreen';
        iframe.style.cssText = 'position:absolute;top:0;left:0;width:100%;height:100%;border:0;border-radius:inherit;';
        videoCard.style.position = 'relative';
        videoCard.innerHTML = '';
        videoCard.appendChild(iframe);
      });
    }
  }

  /* --- Галерея: динамически генерируем миниатюры --- */
  function dropSkeleton(img, wrap) {
    if (!wrap) return;
    var done = function () { wrap.classList.remove('is-skeleton'); };
    img.addEventListener('load', done, { once: true });
    img.addEventListener('error', done, { once: true });
  }

  var thumbsContainer = document.querySelector('.gallery__thumbs');
  var mainImg = document.querySelector('.gallery__main img');
  if (h.images && h.images.length && thumbsContainer) {
    thumbsContainer.innerHTML = '';
    h.images.forEach(function (src, i) {
      var div = document.createElement('div');
      div.className = 'gallery__thumb is-skeleton' + (i === 0 ? ' is-active' : '');
      var img = document.createElement('img');
      img.setAttribute('alt', 'Вид ' + (i + 1));
      div.appendChild(img);
      thumbsContainer.appendChild(div);
      dropSkeleton(img, div);
      img.setAttribute('src', src);
    });
    if (mainImg) {
      mainImg.setAttribute('alt', 'Проект дома «' + h.name + '»');
      dropSkeleton(mainImg, mainImg.closest('.gallery__main'));
      mainImg.setAttribute('src', h.images[0]);
    }
  }

})();

/* ---------- Галерея (стрелки + миниатюры) ---------- */
(function () {
  'use strict';

  var mainImage = document.querySelector('.gallery__main img');
  var track = document.querySelector('.gallery__thumbs');
  var thumbs = Array.prototype.slice.call(document.querySelectorAll('.gallery__thumb'));
  if (!mainImage || !thumbs.length) return;

  var current = 0;

  // Подкручиваем ленту мини-фото, чтобы активная миниатюра была видна
  function ensureThumbVisible(el) {
    if (!track) return;
    var t = track.getBoundingClientRect();
    var r = el.getBoundingClientRect();
    var pad = 10, delta = 0;
    if (r.left < t.left + pad) delta = r.left - t.left - pad;
    else if (r.right > t.right - pad) delta = r.right - t.right + pad;
    if (delta) track.scrollBy({ left: delta, behavior: 'smooth' });
  }

  function show(index) {
    if (index < 0) index = thumbs.length - 1;
    if (index >= thumbs.length) index = 0;
    current = index;
    var src = thumbs[index].querySelector('img').getAttribute('src');
    mainImage.setAttribute('src', src);
    thumbs.forEach(function (t) { t.classList.remove('is-active'); });
    thumbs[index].classList.add('is-active');
    ensureThumbVisible(thumbs[index]);
  }

  thumbs.forEach(function (thumb, i) {
    thumb.addEventListener('click', function () { show(i); });
  });

  var prev = document.querySelector('.gallery__nav--prev');
  var next = document.querySelector('.gallery__nav--next');
  if (prev) prev.addEventListener('click', function () { show(current - 1); });
  if (next) next.addEventListener('click', function () { show(current + 1); });

  show(0);
})();

/* ---------- Мини-фото: перетаскивание мышью с инерцией ---------- */
(function () {
  'use strict';

  var track = document.querySelector('.gallery__thumbs');
  if (!track) return;

  var isDown = false;
  var moved = false;
  var startX = 0;
  var startScroll = 0;
  var samples = [];          // последние позиции {x, t} для расчёта скорости
  var rafId = null;

  function cancelRaf() { if (rafId) { cancelAnimationFrame(rafId); rafId = null; } }

  track.addEventListener('mousedown', function (e) {
    if (e.button !== 0) return;
    isDown = true;
    moved = false;
    startX = e.clientX;
    startScroll = track.scrollLeft;
    samples = [{ x: e.clientX, t: performance.now() }];
    cancelRaf();
    track.style.scrollBehavior = 'auto';
    e.preventDefault();
  });

  document.addEventListener('mousemove', function (e) {
    if (!isDown) return;
    var dx = e.clientX - startX;
    if (!moved && Math.abs(dx) > 4) {
      moved = true;
      track.classList.add('is-dragging');
    }
    if (!moved) return;
    track.scrollLeft = startScroll - dx;
    samples.push({ x: e.clientX, t: performance.now() });
    if (samples.length > 8) samples.shift();
  });

  document.addEventListener('mouseup', function () {
    if (!isDown) return;
    isDown = false;
    track.classList.remove('is-dragging');
    if (!moved) return;

    // скорость по выборке за последние ~120 мс
    var now = performance.now();
    var recent = samples.filter(function (s) { return now - s.t < 120; });
    var vScroll = 0;
    if (recent.length >= 2) {
      var a = recent[0], b = recent[recent.length - 1];
      var dt = b.t - a.t;
      if (dt > 0) vScroll = -((b.x - a.x) / dt) * 16;
    }
    if (Math.abs(vScroll) < 0.5) return;

    (function momentum() {
      track.scrollLeft += vScroll;
      vScroll *= 0.95;
      if (Math.abs(vScroll) < 0.5) { rafId = null; return; }
      rafId = requestAnimationFrame(momentum);
    })();
  });

  // после перетаскивания гасим клик, чтобы не сменилось главное фото
  track.addEventListener('click', function (e) {
    if (moved) { e.preventDefault(); e.stopPropagation(); moved = false; }
  }, true);

  track.addEventListener('dragstart', function (e) { e.preventDefault(); });
})();

/* ---------- Раскрытие карточек комплектации («Ещё») ---------- */
(function () {
  'use strict';

  var buttons = Array.prototype.slice.call(document.querySelectorAll('.complectation__more'));
  buttons.forEach(function (btn) {
    btn.addEventListener('click', function () {
      var col = btn.closest('.complectation__col');
      if (!col) return;
      var expanded = col.classList.toggle('is-expanded');
      btn.textContent = expanded ? 'Свернуть' : 'Ещё';
    });
  });
})();