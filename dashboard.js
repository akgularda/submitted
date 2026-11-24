// SubmitTED 2026 — Dark Airport FIDS (Flight Information Display System) Controller
// Zero QR codes.
// Red Zone & Blue Zone -> Company Stands board;
// Tech&Innovation, Teacher+, One-to-One, Food&Beverage -> Scheduled Conference / Session board.

(function () {
  'use strict';

  const api = window.SubmitTEDTelemetry;
  if (!api) return;

  const params = new URLSearchParams(window.location.search);
  const initialZone = params.get('zone');
  const isKioskMode = params.get('kiosk') === '1';

  let activeZoneFilter = initialZone && api.ZONES.some((z) => z.id === initialZone) ? initialZone : 'all';

  const boardTitleEl = document.getElementById('fids-board-title');
  const clockEl = document.getElementById('dash-clock');
  const totalInsideEl = document.getElementById('dash-total-inside');
  const tabsEl = document.getElementById('dash-zone-tabs');
  const balanceTextEl = document.getElementById('dash-balance-text');
  const headEl = document.getElementById('fids-table-head');
  const rowsEl = document.getElementById('fids-rows');
  const hintEl = document.getElementById('fids-board-hint');
  const routingBadgeEl = document.getElementById('routing-badge');
  const routingCopyEl = document.getElementById('routing-copy');
  const routingFocusBtn = document.getElementById('routing-focus-btn');

  if (isKioskMode) {
    const controls = document.getElementById('dash-controls-bar');
    if (controls) controls.style.display = 'none';
  }

  function updateClock() {
    if (clockEl) clockEl.textContent = new Date().toLocaleTimeString('tr-TR', { hour12: false });
  }
  updateClock();
  setInterval(updateClock, 1000);

  function getFidsStatusColor(pct) {
    if (pct >= 85) return { label: 'YOĞUN', color: '#ef4444' };
    if (pct >= 65) return { label: 'KALABALIK', color: '#f5a623' };
    return { label: 'MÜSAİT', color: '#27c96b' };
  }

  function renderTabs(snap) {
    if (!tabsEl) return;
    const html = [
      `<button type="button" class="fids-tab ${activeZoneFilter === 'all' ? 'is-active' : ''}" data-zone-tab="all">TÜM ZONE’LAR</button>`
    ];
    snap.zones.forEach((z) => {
      html.push(
        `<button type="button" class="fids-tab ${activeZoneFilter === z.id ? 'is-active' : ''}" data-zone-tab="${z.id}">` +
          `<i style="background:${z.color}"></i>${z.shortName.toUpperCase()}` +
        `</button>`
      );
    });
    tabsEl.innerHTML = html.join('');
    tabsEl.querySelectorAll('[data-zone-tab]').forEach((btn) => {
      btn.addEventListener('click', () => {
        activeZoneFilter = btn.dataset.zoneTab;
        render(api.getSnapshot());
      });
    });
  }

  function renderGlobalZonesBoard(snap) {
    boardTitleEl.textContent = 'KAMPÜS DOLULUK PANOSU';
    headEl.innerHTML = '<span>ZONE / ALAN</span><span>YERLEŞKE / TÜR</span><span>KİŞİ</span><span>DOLULUK ORANI</span><span style="text-align:right">DURUM</span>';

    rowsEl.innerHTML = snap.zones.map((z) => {
      const st = getFidsStatusColor(z.pct);
      const isTarget = snap.routing && snap.routing.targetZoneId === z.id;
      const modeLabel = z.zoneType === 'stands' ? 'Şirket Stant Alanı' : 'Konferans / Oturum Alanı';
      return (
        `<div class="fids-row ${isTarget ? 'is-highlighted' : ''}" role="listitem" tabindex="0" data-open-zone="${z.id}" style="--zc:${z.color};--sc:${st.color}">` +
          `<div class="fids-col-zone">` +
            `<span class="fids-zone-bar" aria-hidden="true"></span>` +
            `<div>` +
              `<div class="fids-zone-name">${z.name}</div>` +
              `<div class="fids-zone-sub">${z.building}</div>` +
            `</div>` +
          `</div>` +
          `<div class="fids-col-loc">${modeLabel}</div>` +
          `<div class="fids-col-count">${z.count} / ${z.capacity}</div>` +
          `<div class="fids-col-pct">` +
            `<span class="fids-pct-num">%${z.pct}</span>` +
            `<div class="fids-led-track"><div class="fids-led-fill" style="width:${z.pct}%"></div></div>` +
          `</div>` +
          `<div class="fids-col-status"><span class="fids-status-tag">${isTarget ? 'YÖNLENDİRME' : st.label}</span></div>` +
        `</div>`
      );
    }).join('');

    rowsEl.querySelectorAll('[data-open-zone]').forEach((row) => {
      const openZone = () => {
        activeZoneFilter = row.dataset.openZone;
        render(api.getSnapshot());
      };
      row.addEventListener('click', openZone);
      row.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          openZone();
        }
      });
    });

    hintEl.innerHTML = '<span>Red &amp; Blue Zone stant yoğunluklarını, diğer Zone’larda konferans programını görmek için satıra tıklayın.</span><span>Canlı yenileme aktif</span>';
  }

  function renderZoneDetailBoard(snap, zone) {
    const isStands = zone.zoneType === 'stands';
    boardTitleEl.textContent = isStands
      ? `${zone.name.toUpperCase()} · ŞİRKET STANT DOLULUĞU`
      : `${zone.name.toUpperCase()} · KONFERANS VE OTURUM PROGRAMI`;

    headEl.innerHTML = isStands
      ? '<span>STANT / KURUM</span><span>SEKTÖR &amp; KONUM</span><span>KİŞİ</span><span>DOLULUK ORANI</span><span style="text-align:right">DURUM</span>'
      : '<span>SAAT &amp; KONFERANS</span><span>SALON &amp; BAŞLIK</span><span>SALON KİŞİ</span><span>DOLULUK ORANI</span><span style="text-align:right">DURUM</span>';

    rowsEl.innerHTML = zone.items.map((it) => {
      const st = getFidsStatusColor(it.pct);
      const leftMain = isStands ? it.name : `${it.timeSlot} · ${it.name}`;
      const leftSub = isStands ? `${it.timeSlot} · ${it.role}` : it.role;
      return (
        `<div class="fids-row" role="listitem" style="--zc:${zone.color};--sc:${st.color}">` +
          `<div class="fids-col-zone">` +
            `<span class="fids-zone-bar" aria-hidden="true"></span>` +
            `<div>` +
              `<div class="fids-zone-name">${leftMain}</div>` +
              `<div class="fids-zone-sub">${leftSub}</div>` +
            `</div>` +
          `</div>` +
          `<div class="fids-col-loc">${it.desk}</div>` +
          `<div class="fids-col-count">${it.count} / ${it.capacity}</div>` +
          `<div class="fids-col-pct">` +
            `<span class="fids-pct-num">%${it.pct}</span>` +
            `<div class="fids-led-track"><div class="fids-led-fill" style="width:${it.pct}%"></div></div>` +
          `</div>` +
          `<div class="fids-col-status"><span class="fids-status-tag">${st.label}</span></div>` +
        `</div>`
      );
    }).join('');

    hintEl.innerHTML =
      `<span>${zone.name} (${zone.building}) · %${zone.pct} (${zone.count} / ${zone.capacity} Kişi) · ${zone.walkingHint}</span>` +
      `<button type="button" class="fids-back-btn" id="fids-return-all">← Tüm Zone’lara Dön</button>`;

    document.getElementById('fids-return-all')?.addEventListener('click', () => {
      activeZoneFilter = 'all';
      render(api.getSnapshot());
    });
  }

  function render(snap) {
    if (totalInsideEl) totalInsideEl.textContent = `${snap.totalInside} / ${snap.totalCapacity}`;
    if (balanceTextEl && snap.balance) {
      balanceTextEl.textContent = snap.balance.message;
    }

    if (snap.routing) {
      if (routingBadgeEl) routingBadgeEl.textContent = snap.routing.badge;
      if (routingCopyEl) {
        routingCopyEl.textContent = snap.routing.ticker || `${snap.routing.speaker} — ${snap.routing.title}`;
      }
      if (routingFocusBtn) {
        routingFocusBtn.onclick = () => {
          activeZoneFilter = snap.routing.targetZoneId;
          render(api.getSnapshot());
        };
      }
    }

    renderTabs(snap);
    if (activeZoneFilter === 'all') {
      renderGlobalZonesBoard(snap);
    } else {
      const zone = snap.zonesById[activeZoneFilter] || snap.zones[0];
      renderZoneDetailBoard(snap, zone);
    }
  }

  // Organizer dispatch controls
  const dispatchToggleBtn = document.getElementById('dash-dispatch-toggle');
  const dispatchPanelEl = document.getElementById('dash-dispatch-panel');
  if (dispatchToggleBtn && dispatchPanelEl) {
    dispatchToggleBtn.addEventListener('click', () => {
      const next = dispatchPanelEl.hidden;
      dispatchPanelEl.hidden = !next;
      dispatchToggleBtn.setAttribute('aria-expanded', String(next));
    });
  }

  const presetRow = document.getElementById('dispatch-preset-buttons');
  if (presetRow) {
    presetRow.innerHTML = api.ROUTING_PRESETS.map((p) => (
      `<button type="button" class="fids-tool-btn" data-preset="${p.id}">${p.speaker} → ${api.ZONES.find((z) => z.id === p.targetZoneId)?.shortName}</button>`
    )).join('');
    presetRow.querySelectorAll('[data-preset]').forEach((btn) => {
      btn.addEventListener('click', () => api.setRoutingAlert(btn.dataset.preset));
    });
  }

  const targetSelect = document.getElementById('custom-target-zone');
  if (targetSelect) {
    targetSelect.innerHTML = api.ZONES.map((z) => `<option value="${z.id}">${z.name} (${z.building})</option>`).join('');
  }

  const dispatchForm = document.getElementById('custom-dispatch-form');
  if (dispatchForm) {
    dispatchForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const speaker = document.getElementById('custom-speaker').value.trim();
      const title = document.getElementById('custom-title').value.trim();
      const targetZoneId = document.getElementById('custom-target-zone').value;
      const tz = api.ZONES.find((z) => z.id === targetZoneId);
      api.setRoutingAlert({
        speaker,
        title,
        targetZoneId,
        ticker: `${speaker.toUpperCase()} · ${title.toUpperCase()} — ${tz ? tz.name.toUpperCase() + ' (' + tz.building.toUpperCase() + ')' : ''}`
      });
      dispatchForm.reset();
    });
  }

  document.getElementById('dash-fullscreen-btn')?.addEventListener('click', () => {
    if (!document.fullscreenElement) document.documentElement.requestFullscreen?.();
    else document.exitFullscreen?.();
  });

  api.subscribe(render);

  setInterval(() => {
    api.nudgeTelemetryTick();
  }, 4500);
})();
