// SubmitTED 2026 — At-a-Glance Campus TV Wayfinding & Occupancy Controller
// Clean TV display with zero button clutter, 2D Campus Kroki sync, and soft-flashing bottom announcement.

(function () {
  'use strict';

  const api = window.SubmitTEDTelemetry;
  if (!api) return;

  const params = new URLSearchParams(window.location.search);
  const lockedZone = params.get('zone');
  let activeZoneFilter = lockedZone && api.ZONES.some((z) => z.id === lockedZone) ? lockedZone : 'all';

  const boardTitleEl = document.getElementById('tv-board-title');
  const boardSubEl = document.getElementById('tv-board-sub');
  const totalInsideEl = document.getElementById('dash-total-inside');
  const clockEl = document.getElementById('dash-clock');
  const panelHeadEl = document.getElementById('tv-panel-head');
  const rowsEl = document.getElementById('tv-rows');
  const balanceHintEl = document.getElementById('tv-balance-hint');
  const routingBadgeEl = document.getElementById('routing-badge');
  const routingCopyEl = document.getElementById('routing-copy');

  function updateClock() {
    if (clockEl) {
      clockEl.textContent = new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
    }
  }
  updateClock();
  setInterval(updateClock, 5000);

  function getStatusMeta(pct) {
    if (pct >= 85) return { label: 'Yoğun', color: '#ef4444' };
    if (pct >= 65) return { label: 'Kalabalık', color: '#f5a623' };
    return { label: 'Müsait', color: '#27c96b' };
  }

  function summarizeZoneContent(zone) {
    if (zone.id === 'red' || zone.id === 'blue') {
      return zone.items.slice(0, 4).map((i) => i.name).join(' · ') + ' +2 Kurum';
    }
    if (zone.id === 'tech') {
      return '12.00 ASELSAN Söyleşisi · 13.30 MİLSOFT Konferansı · 14.30 TUSAŞ';
    }
    if (zone.id === 'teacher-plus') {
      return '14.00 Prof. Dr. Kürşat Çağıltay · 16.00 TED Ankara Koleji İK Müdürü';
    }
    if (zone.id === 'one-to-one') {
      return '10.00–17.15 Randevulu 1:1 İK Mülakatları & CV Değerlendirme';
    }
    return 'Gün Boyu Kahve İkramı · 12.15–14.00 Öğle Arası';
  }

  function updateKrokiMap(snap) {
    snap.zones.forEach((z) => {
      const pctEl = document.querySelector(`[data-kroki-pct="${z.id}"]`);
      if (pctEl) pctEl.textContent = `%${z.pct}`;

      const boxEl = document.querySelector(`[data-kroki-box="${z.id}"]`);
      if (boxEl) {
        const isRoutingTarget = snap.routing && snap.routing.targetZoneId === z.id;
        boxEl.setAttribute('stroke-width', isRoutingTarget ? '3.5' : '2');
      }
    });
  }

  function renderAllZones(snap) {
    if (boardTitleEl) boardTitleEl.textContent = 'Kampüs Doluluk ve Yönlendirme Ekranı';
    if (boardSubEl) boardSubEl.textContent = 'TED Üniversitesi · İncesu & Aksu Yerleşkesi';
    if (panelHeadEl) {
      panelHeadEl.innerHTML = '<span>Bölge &amp; İçerik</span><span>Konum</span><span>Doluluk</span><span style="text-align:right">Durum</span>';
    }

    rowsEl.innerHTML = snap.zones.map((z) => {
      const st = getStatusMeta(z.pct);
      const isTarget = snap.routing && snap.routing.targetZoneId === z.id;
      const summary = summarizeZoneContent(z);
      const kindSub = z.zoneType === 'stands' ? 'Şirket Stant Alanı' : 'Konferans / Oturum Alanı';

      return (
        `<div class="tv-row ${isTarget ? 'is-highlighted' : ''}" data-open-zone="${z.id}" style="--zc:${z.color};--sc:${st.color}">` +
          `<div class="tv-col-zone">` +
            `<span class="tv-zone-accent" aria-hidden="true"></span>` +
            `<div>` +
              `<div class="tv-zone-title">${z.name}</div>` +
              `<div class="tv-zone-detail">${summary}</div>` +
            `</div>` +
          `</div>` +
          `<div class="tv-col-loc">${z.building}<small>${kindSub}</small></div>` +
          `<div class="tv-col-occ">` +
            `<div class="tv-occ-top">` +
              `<span class="tv-pct">%${z.pct}</span>` +
              `<span class="tv-count">${z.count} / ${z.capacity}</span>` +
            `</div>` +
            `<div class="tv-bar-track"><div class="tv-bar-fill" style="width:${z.pct}%"></div></div>` +
          `</div>` +
          `<div class="tv-col-status"><span class="tv-status-pill">${isTarget ? 'Yönlendirme' : st.label}</span></div>` +
        `</div>`
      );
    }).join('');

    rowsEl.querySelectorAll('[data-open-zone]').forEach((row) => {
      row.addEventListener('click', () => {
        activeZoneFilter = row.dataset.openZone;
        render(api.getSnapshot());
      });
    });
  }

  function renderSingleZone(snap, zone) {
    const isStands = zone.zoneType === 'stands';
    if (boardTitleEl) boardTitleEl.textContent = `${zone.name} · ${isStands ? 'Şirket Stantları' : 'Konferans Programı'}`;
    if (boardSubEl) boardSubEl.textContent = `${zone.building} · Toplam %${zone.pct} (${zone.count}/${zone.capacity} Kişi) · Tüm bölgelere dönmek için satıra tıklayın`;

    if (panelHeadEl) {
      panelHeadEl.innerHTML = isStands
        ? '<span>Kurum &amp; Sektör</span><span>Stant Yeri</span><span>Doluluk</span><span style="text-align:right">Durum</span>'
        : '<span>Saat &amp; Konferans</span><span>Salon</span><span>Doluluk</span><span style="text-align:right">Durum</span>';
    }

    rowsEl.innerHTML = zone.items.map((it) => {
      const st = getStatusMeta(it.pct);
      const titleText = isStands ? it.name : `${it.timeSlot} · ${it.name}`;
      const subText = isStands ? `${it.timeSlot} · ${it.role}` : it.role;

      return (
        `<div class="tv-row" data-return-all="1" style="--zc:${zone.color};--sc:${st.color}">` +
          `<div class="tv-col-zone">` +
            `<span class="tv-zone-accent" aria-hidden="true"></span>` +
            `<div>` +
              `<div class="tv-zone-title">${titleText}</div>` +
              `<div class="tv-zone-detail">${subText}</div>` +
            `</div>` +
          `</div>` +
          `<div class="tv-col-loc">${it.desk}</div>` +
          `<div class="tv-col-occ">` +
            `<div class="tv-occ-top">` +
              `<span class="tv-pct">%${it.pct}</span>` +
              `<span class="tv-count">${it.count} / ${it.capacity}</span>` +
            `</div>` +
            `<div class="tv-bar-track"><div class="tv-bar-fill" style="width:${it.pct}%"></div></div>` +
          `</div>` +
          `<div class="tv-col-status"><span class="tv-status-pill">${st.label}</span></div>` +
        `</div>`
      );
    }).join('');

    rowsEl.querySelectorAll('[data-return-all]').forEach((row) => {
      row.addEventListener('click', () => {
        activeZoneFilter = 'all';
        render(api.getSnapshot());
      });
    });
  }

  // Clicking blocks on the 2D Kroki also toggles detail view cleanly for interactive users
  document.querySelectorAll('[data-kroki-zone]').forEach((el) => {
    el.addEventListener('click', () => {
      const targetId = el.dataset.krokiZone;
      activeZoneFilter = activeZoneFilter === targetId ? 'all' : targetId;
      render(api.getSnapshot());
    });
  });

  function render(snap) {
    if (totalInsideEl) totalInsideEl.textContent = `${snap.totalInside} / ${snap.totalCapacity}`;
    if (balanceHintEl && snap.balance) {
      balanceHintEl.textContent = `Red Zone %${snap.zonesById.red?.pct || 0} · Blue Zone %${snap.zonesById.blue?.pct || 0}`;
    }
    if (snap.routing) {
      if (routingBadgeEl) routingBadgeEl.textContent = 'Canlı Yönlendirme';
      if (routingCopyEl) {
        const tz = snap.zonesById[snap.routing.targetZoneId];
        const fallbackLoc = tz && !snap.routing.title.includes(tz.name) ? ` (${tz.name} · ${tz.building})` : '';
        routingCopyEl.textContent = `${snap.routing.speaker} — ${snap.routing.title}${fallbackLoc}`;
      }
    }

    updateKrokiMap(snap);

    if (activeZoneFilter === 'all') {
      renderAllZones(snap);
    } else {
      renderSingleZone(snap, snap.zonesById[activeZoneFilter] || snap.zones[0]);
    }
  }

  api.subscribe(render);

  setInterval(() => {
    api.nudgeTelemetryTick();
  }, 4500);
})();
