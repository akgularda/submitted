// SubmitTED 2026 — Dark Airport FIDS (Flight Information Display System) Controller
// Zero QR codes. Displays clean 6-Zone Airport Departure Board OR per-Zone Company Booth Board,
// paired with a soft-flashing bottom announcement bar.

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
    headEl.innerHTML = '<span>ZONE / BÖLGE</span><span>YERLEŞKE / BLOK</span><span>KİŞİ</span><span>DOLULUK ORANI</span><span style="text-align:right">DURUM</span>';

    rowsEl.innerHTML = snap.zones.map((z) => {
      const st = getFidsStatusColor(z.pct);
      const isTarget = snap.routing && snap.routing.targetZoneId === z.id;
      return (
        `<div class="fids-row ${isTarget ? 'is-highlighted' : ''}" role="listitem" tabindex="0" data-open-zone="${z.id}" style="--zc:${z.color};--sc:${st.color}">` +
          `<div class="fids-col-zone">` +
            `<span class="fids-zone-bar" aria-hidden="true"></span>` +
            `<div>` +
              `<div class="fids-zone-name">${z.name}</div>` +
              `<div class="fids-zone-sub">${z.subtitle}</div>` +
            `</div>` +
          `</div>` +
          `<div class="fids-col-loc">${z.building}</div>` +
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

    hintEl.innerHTML = '<span>Şirket ve masa bazlı ekranı açmak için satıra dokunun.</span><span>Otomatik yenileme aktif</span>';
  }

  function renderZoneCompanyBoard(snap, zone) {
    boardTitleEl.textContent = `${zone.name.toUpperCase()} · KURUM DOLULUK EKRANI`;
    headEl.innerHTML = '<span>KURUM / NOKTA</span><span>STANT / KONUM</span><span>KİŞİ</span><span>DOLULUK ORANI</span><span style="text-align:right">DURUM</span>';

    rowsEl.innerHTML = zone.companies.map((c) => {
      const st = getFidsStatusColor(c.pct);
      return (
        `<div class="fids-row" role="listitem" style="--zc:${zone.color};--sc:${st.color}">` +
          `<div class="fids-col-zone">` +
            `<span class="fids-zone-bar" aria-hidden="true"></span>` +
            `<div>` +
              `<div class="fids-zone-name">${c.name}</div>` +
              `<div class="fids-zone-sub">${c.role}</div>` +
            `</div>` +
          `</div>` +
          `<div class="fids-col-loc">${c.desk}</div>` +
          `<div class="fids-col-count">${c.count} / ${c.capacity}</div>` +
          `<div class="fids-col-pct">` +
            `<span class="fids-pct-num">%${c.pct}</span>` +
            `<div class="fids-led-track"><div class="fids-led-fill" style="width:${c.pct}%"></div></div>` +
          `</div>` +
          `<div class="fids-col-status"><span class="fids-status-tag">${st.label}</span></div>` +
        `</div>`
      );
    }).join('');

    hintEl.innerHTML =
      `<span>${zone.name} Toplam Doluluk: %${zone.pct} (${zone.count} / ${zone.capacity} Kişi) · ${zone.walkingHint}</span>` +
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
      const tz = snap.zonesById[snap.routing.targetZoneId];
      if (routingBadgeEl) routingBadgeEl.textContent = snap.routing.badge.split('·')[0].trim();
      if (routingCopyEl) {
        routingCopyEl.textContent =
          `${snap.routing.speaker.split('·')[0].trim()} · ${snap.routing.title.toUpperCase()} — HEDEF: ${tz ? tz.name.toUpperCase() + ' (' + tz.building.toUpperCase() + ')' : ''}`;
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
      renderZoneCompanyBoard(snap, zone);
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
      `<button type="button" class="fids-tool-btn" data-preset="${p.id}">${p.speaker.split('·')[0].trim()} → ${api.ZONES.find((z) => z.id === p.targetZoneId)?.shortName}</button>`
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
      api.setRoutingAlert({ speaker, title, targetZoneId });
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
