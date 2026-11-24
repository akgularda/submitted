// SubmitTED 2026 — TV Wayfinding Display Controller
// Location information lives on the 2D Kroki side; left side shows location-free Zone occupancy +
// vertically stacked Daily Plan ("Günün Planı") + automatic "X dk içinde -> ..." live countdowns.

(function () {
  'use strict';

  const api = window.SubmitTEDTelemetry;
  if (!api) return;

  const params = new URLSearchParams(window.location.search);
  const lockedZone = params.get('zone');
  const timeOverride = params.get('time'); // Optional HH:MM override for testing (e.g. ?time=13:45)
  let activeZoneFilter = lockedZone && api.ZONES.some((z) => z.id === lockedZone) ? lockedZone : 'all';

  const boardTitleEl = document.getElementById('tv-board-title');
  const boardSubEl = document.getElementById('tv-board-sub');
  const totalInsideEl = document.getElementById('dash-total-inside');
  const clockEl = document.getElementById('dash-clock');
  const clockLabelEl = document.getElementById('tv-clock-label');
  const panelHeadEl = document.getElementById('tv-panel-head');
  const rowsEl = document.getElementById('tv-rows');
  const scheduleListEl = document.getElementById('tv-schedule-list');
  const scheduleNoteEl = document.getElementById('tv-schedule-note');
  const legendEl = document.getElementById('tv-location-legend');
  const balanceHintEl = document.getElementById('tv-balance-hint');
  const routingBadgeEl = document.getElementById('routing-badge');
  const routingCopyEl = document.getElementById('routing-copy');

  function parseMinutes(hhmm) {
    const parts = hhmm.trim().replace(':', '.').split('.');
    return Number(parts[0]) * 60 + Number(parts[1] || 0);
  }

  function getReferenceMinutes() {
    if (timeOverride && /^\d{1,2}[:.]\d{2}$/.test(timeOverride)) {
      return { mins: parseMinutes(timeOverride), label: timeOverride.replace('.', ':'), simulated: true };
    }
    const now = new Date();
    const realMins = now.getHours() * 60 + now.getMinutes();
    const hhmm = now.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
    // Inside live summit window (09:30–17:30) use actual wall clock; outside conference hours show 11:45 summit reference
    if (realMins >= 9 * 60 + 30 && realMins <= 17 * 60 + 30) {
      return { mins: realMins, label: hhmm, simulated: false };
    }
    return { mins: 11 * 60 + 45, label: `${hhmm}`, simulated: true };
  }

  function buildChronologicalPlan(snap) {
    const events = [];
    snap.zones.forEach((z) => {
      // "Günün Planı" focuses on scheduled Conference Zones (Tech&Innovation + Teacher+)
      if (z.id !== 'tech' && z.id !== 'teacher-plus') return;
      z.items.forEach((it) => {
        const range = it.timeSlot.split('–').map((s) => s.trim());
        if (range.length !== 2) return;
        const startMin = parseMinutes(range[0]);
        const endMin = parseMinutes(range[1]);
        events.push({
          id: it.id,
          zoneId: z.id,
          zoneName: z.shortName,
          zoneColor: z.color,
          building: z.building,
          timeSlot: it.timeSlot,
          title: it.name,
          role: it.role,
          startMin,
          endMin
        });
      });
    });
    events.sort((a, b) => a.startMin - b.startMin);
    return events;
  }

  function getTimedStatus(ev, nowMins) {
    const diffStart = ev.startMin - nowMins;
    if (diffStart > 0 && diffStart <= 25) {
      return { state: 'soon', label: `${diffStart} dk içinde → ${ev.title}`, shortBadge: `${diffStart} dk içinde` };
    }
    if (nowMins >= ev.startMin && nowMins < ev.endMin) {
      return { state: 'live', label: `Şu an → ${ev.title}`, shortBadge: 'Şu an Sahnede' };
    }
    if (diffStart > 25) {
      return { state: 'upcoming', label: `${ev.timeSlot.split('–')[0].trim()} · ${ev.title}`, shortBadge: ev.zoneName };
    }
    return { state: 'done', label: ev.title, shortBadge: 'Tamamlandı' };
  }

  function updateClock() {
    if (!clockEl) return;
    if (timeOverride && /^\d{1,2}[:.]\d{2}$/.test(timeOverride)) {
      clockEl.textContent = timeOverride.replace('.', ':');
      return;
    }
    clockEl.textContent = new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
  }
  updateClock();
  setInterval(updateClock, 5000);

  function getStatusMeta(pct) {
    if (pct >= 85) return { label: 'Yoğun', color: '#ef4444' };
    if (pct >= 65) return { label: 'Kalabalık', color: '#f5a623' };
    return { label: 'Müsait', color: '#27c96b' };
  }

  function updateKrokiMap(snap, activeTargetZoneId) {
    snap.zones.forEach((z) => {
      const pctEl = document.querySelector(`[data-kroki-pct="${z.id}"]`);
      if (pctEl) pctEl.textContent = `%${z.pct}`;

      const boxEl = document.querySelector(`[data-kroki-box="${z.id}"]`);
      if (boxEl) {
        boxEl.setAttribute('stroke-width', activeTargetZoneId === z.id ? '3.5' : '2');
      }
    });
  }

  function renderLegend(snap) {
    if (!legendEl) return;
    const labels = [
      { id: 'red', text: '<strong>Red Zone:</strong> Fuaye Alanı (K Blok)' },
      { id: 'blue', text: '<strong>Blue Zone:</strong> Spor Merkezi (E Blok)' },
      { id: 'tech', text: '<strong>Tech&amp;Innovation:</strong> D Blok Amfi' },
      { id: 'teacher-plus', text: '<strong>Teacher+ Zone:</strong> A / B Blok Salonu' },
      { id: 'one-to-one', text: '<strong>One-to-One:</strong> G Blok Görüşme Odaları' },
      { id: 'food-beverage', text: '<strong>Food&amp;Beverage:</strong> C / F Merkez Avlu' }
    ];
    legendEl.innerHTML = labels.map((item) => {
      const z = snap.zonesById[item.id];
      return `<div class="legend-item"><i style="background:${z ? z.color : '#7dc84d'}"></i><span>${item.text}</span></div>`;
    }).join('');
  }

  function renderSchedule(plan, refMins) {
    if (!scheduleListEl) return;
    // Show upcoming & live sessions cleanly so Günün Planı always fits comfortably on a TV screen
    const relevant = plan.filter((ev) => ev.endMin > refMins);
    const displayList = (relevant.length ? relevant : plan).slice(0, 5);

    scheduleListEl.innerHTML = displayList.map((ev) => {
      const st = getTimedStatus(ev, refMins);
      const rowCls = st.state === 'soon' ? 'is-soon' : (st.state === 'live' ? 'is-live' : '');
      const badgeCls = st.state === 'soon' ? 'is-soon' : (st.state === 'live' ? 'is-live' : 'is-zone');
      const badgeText = st.state === 'soon' || st.state === 'live' ? `${st.shortBadge} · ${ev.zoneName}` : ev.zoneName;

      return (
        `<div class="tv-plan-row ${rowCls}">` +
          `<div class="tv-plan-time">${ev.timeSlot}</div>` +
          `<div class="tv-plan-info"><strong>${ev.title}</strong><span>${ev.role}</span></div>` +
          `<span class="tv-plan-badge ${badgeCls}">${badgeText}</span>` +
        `</div>`
      );
    }).join('');
  }

  function renderAllZones(snap, plan, refMins, primaryEvent) {
    if (boardTitleEl) boardTitleEl.textContent = 'Kampüs Doluluk ve Zirve Akışı';
    if (boardSubEl) boardSubEl.textContent = 'TED Üniversitesi · Canlı Zirve Ekranı';
    if (panelHeadEl) {
      panelHeadEl.innerHTML = '<span>Bölge &amp; Yaklaşan Akış</span><span>Doluluk</span><span style="text-align:right">Durum</span>';
    }

    rowsEl.innerHTML = snap.zones.map((z) => {
      const st = getStatusMeta(z.pct);
      const zoneSoon = plan.find((ev) => ev.zoneId === z.id && ev.startMin - refMins > 0 && ev.startMin - refMins <= 25);
      const zoneActive = plan.find((ev) => ev.zoneId === z.id && refMins >= ev.startMin && refMins < ev.endMin);
      const zoneNext = zoneSoon || zoneActive || plan.find((ev) => ev.zoneId === z.id && ev.startMin > refMins);

      let subText = z.zoneType === 'stands'
        ? `${z.items.length} Kurumsal Stant Açık`
        : (z.id === 'one-to-one' ? 'Randevulu 1:1 Mülakat Seansları' : 'Gün Boyu Kahve & Öğle İkramı');
      let isUrgent = false;

      if (zoneNext) {
        const timed = getTimedStatus(zoneNext, refMins);
        subText = timed.label;
        isUrgent = timed.state === 'soon' || timed.state === 'live';
      }

      const isPrimaryZone = primaryEvent && primaryEvent.zoneId === z.id;

      return (
        `<div class="tv-row ${isPrimaryZone ? 'is-highlighted' : ''}" data-open-zone="${z.id}" style="--zc:${z.color};--sc:${st.color}">` +
          `<div class="tv-col-zone">` +
            `<span class="tv-zone-accent" aria-hidden="true"></span>` +
            `<div>` +
              `<div class="tv-zone-title">${z.name}</div>` +
              `<div class="tv-zone-detail ${isUrgent ? 'is-urgent' : ''}">${subText}</div>` +
            `</div>` +
          `</div>` +
          `<div class="tv-col-occ">` +
            `<div class="tv-occ-top">` +
              `<span class="tv-pct">%${z.pct}</span>` +
              `<span class="tv-count">${z.count} / ${z.capacity}</span>` +
            `</div>` +
            `<div class="tv-bar-track"><div class="tv-bar-fill" style="width:${z.pct}%"></div></div>` +
          `</div>` +
          `<div class="tv-col-status"><span class="tv-status-pill">${st.label}</span></div>` +
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
    if (boardSubEl) boardSubEl.textContent = `Toplam Doluluk %${zone.pct} (${zone.count}/${zone.capacity}) · Tüm bölgelere dönmek için satıra tıklayın`;

    if (panelHeadEl) {
      panelHeadEl.innerHTML = isStands
        ? '<span>Kurum &amp; Stant</span><span>Doluluk</span><span style="text-align:right">Durum</span>'
        : '<span>Saat &amp; Konferans</span><span>Doluluk</span><span style="text-align:right">Durum</span>';
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

  document.querySelectorAll('[data-kroki-zone]').forEach((el) => {
    el.addEventListener('click', () => {
      const targetId = el.dataset.krokiZone;
      activeZoneFilter = activeZoneFilter === targetId ? 'all' : targetId;
      render(api.getSnapshot());
    });
  });

  function render(snap) {
    const ref = getReferenceMinutes();
    if (clockLabelEl) {
      clockLabelEl.textContent = timeOverride ? `Simülasyon Saati (${ref.label})` : (ref.simulated ? 'Zirve Akış Önizlemesi (11.45)' : 'Anlık Saat');
    }

    const plan = buildChronologicalPlan(snap);
    // Prioritize upcoming sessions within 25 min first ("15 dk içinde -> ..."), then ongoing sessions
    const soonEvent = plan.find((ev) => {
      const diff = ev.startMin - ref.mins;
      return diff > 0 && diff <= 25;
    });
    const liveEvent = plan.find((ev) => ref.mins >= ev.startMin && ref.mins < ev.endMin);
    const soonOrLive = soonEvent || liveEvent || plan.find((ev) => ev.startMin > ref.mins) || plan[0];

    if (totalInsideEl) totalInsideEl.textContent = `${snap.totalInside} / ${snap.totalCapacity}`;
    if (balanceHintEl) balanceHintEl.textContent = `Red Zone %${snap.zonesById.red?.pct || 0} · Blue Zone %${snap.zonesById.blue?.pct || 0}`;
    if (scheduleNoteEl) {
      scheduleNoteEl.textContent = soonEvent
        ? `${soonEvent.startMin - ref.mins} dk içinde sonraki konferans başlıyor`
        : 'Saate göre konferans takibi aktif';
    }

    if (soonOrLive) {
      const timed = getTimedStatus(soonOrLive, ref.mins);
      if (routingBadgeEl) routingBadgeEl.textContent = timed.shortBadge;
      if (routingCopyEl) {
        routingCopyEl.textContent = `${timed.label} (${soonOrLive.zoneName} · ${soonOrLive.building})`;
      }
    }

    updateKrokiMap(snap, soonOrLive ? soonOrLive.zoneId : null);
    renderLegend(snap);
    renderSchedule(plan, ref.mins);

    if (activeZoneFilter === 'all') {
      renderAllZones(snap, plan, ref.mins, soonOrLive);
    } else {
      renderSingleZone(snap, snap.zonesById[activeZoneFilter] || snap.zones[0]);
    }
  }

  api.subscribe(render);

  setInterval(() => {
    api.nudgeTelemetryTick();
  }, 4500);
})();
