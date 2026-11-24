// SubmitTED 2026 — Pure Passive Campus TV Screen Controller
// Zero clickable links, zero buttons, zero 2D kroki SVG.
// Displays live Zone occupancy, clear text Zone-to-Building location guide,
// vertically stacked Daily Plan, and automatic "X dk içinde -> ..." live countdowns.

(function () {
  'use strict';

  const api = window.SubmitTEDTelemetry;
  if (!api) return;

  const params = new URLSearchParams(window.location.search);
  const timeOverride = params.get('time'); // Optional HH:MM override (e.g. ?time=13:45)

  const totalInsideEl = document.getElementById('dash-total-inside');
  const clockEl = document.getElementById('dash-clock');
  const clockLabelEl = document.getElementById('tv-clock-label');
  const rowsEl = document.getElementById('tv-rows');
  const locListEl = document.getElementById('tv-loc-list');
  const scheduleListEl = document.getElementById('tv-schedule-list');
  const scheduleNoteEl = document.getElementById('tv-schedule-note');
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
    if (realMins >= 9 * 60 + 30 && realMins <= 17 * 60 + 30) {
      return { mins: realMins, label: hhmm, simulated: false };
    }
    return { mins: 11 * 60 + 45, label: hhmm, simulated: true };
  }

  function buildChronologicalPlan(snap) {
    const events = [];
    snap.zones.forEach((z) => {
      if (z.id !== 'tech' && z.id !== 'teacher-plus') return;
      z.items.forEach((it) => {
        const range = it.timeSlot.split('–').map((s) => s.trim());
        if (range.length !== 2) return;
        events.push({
          id: it.id,
          zoneId: z.id,
          zoneName: z.shortName,
          building: z.building,
          timeSlot: it.timeSlot,
          title: it.name,
          role: it.role,
          startMin: parseMinutes(range[0]),
          endMin: parseMinutes(range[1])
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

  function renderLocationGuide(snap) {
    if (!locListEl) return;
    const directories = [
      {
        id: 'red',
        name: 'Red Zone',
        place: 'Fuaye Alanı · K Blok (İncesu)',
        detail: 'Akfen Holding · DenizBank · EY Türkiye · Coca-Cola İçecek · KPMG · Anadolu Efes'
      },
      {
        id: 'blue',
        name: 'Blue Zone',
        place: 'Spor Merkezi · E Blok (Aksu)',
        detail: 'ASELSAN · TUSAŞ · MİLSOFT · FNSS · ROKETSAN · GAMA Enerji'
      },
      {
        id: 'tech',
        name: 'Tech&Innovation',
        place: 'D Blok Amfi Salon D-104 (Aksu)',
        detail: 'Teknoloji, savunma ve mühendislik söyleşileri (Stant yoktur)'
      },
      {
        id: 'teacher-plus',
        name: 'Teacher+ Zone',
        place: 'A / B Blok Konferans Salonu (İncesu)',
        detail: 'Eğitim liderleri ve akademik konferanslar (Stant yoktur)'
      },
      {
        id: 'one-to-one',
        name: 'One-to-One Meetings',
        place: 'G Blok Görüşme Odaları (Aksu)',
        detail: 'Randevulu 1:1 İK ön mülakat ve CV değerlendirme seansları'
      },
      {
        id: 'food-beverage',
        name: 'Food&Beverage Zone',
        place: 'C / F Merkez Avlu & İncesu Bahçe',
        detail: 'Gün boyu kahve ikramı, öğle servisi ve sosyal buluşma alanı'
      }
    ];

    locListEl.innerHTML = directories.map((d) => {
      const z = snap.zonesById[d.id];
      return (
        `<div class="tv-loc-row">` +
          `<div class="tv-loc-zone"><i style="background:${z ? z.color : '#7dc84d'}"></i><span>${d.name}</span></div>` +
          `<div class="tv-loc-place"><strong>${d.place}</strong><span>${d.detail}</span></div>` +
        `</div>`
      );
    }).join('');
  }

  function renderSchedule(plan, refMins) {
    if (!scheduleListEl) return;
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

  function renderZones(snap, plan, refMins, primaryEvent) {
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
        `<div class="tv-row ${isPrimaryZone ? 'is-highlighted' : ''}" style="--zc:${z.color};--sc:${st.color}">` +
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
  }

  function render(snap) {
    const ref = getReferenceMinutes();
    if (clockLabelEl) {
      clockLabelEl.textContent = timeOverride ? `Simülasyon Saati (${ref.label})` : (ref.simulated ? 'Zirve Önizleme (11.45)' : 'Anlık Saat');
    }

    const plan = buildChronologicalPlan(snap);
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
        : 'Saate göre konferans akışı';
    }

    if (soonOrLive) {
      const timed = getTimedStatus(soonOrLive, ref.mins);
      if (routingBadgeEl) routingBadgeEl.textContent = timed.shortBadge;
      if (routingCopyEl) {
        routingCopyEl.textContent = `${timed.label} (${soonOrLive.zoneName} · ${soonOrLive.building})`;
      }
    }

    renderZones(snap, plan, ref.mins, soonOrLive);
    renderLocationGuide(snap);
    renderSchedule(plan, ref.mins);
  }

  api.subscribe(render);

  setInterval(() => {
    api.nudgeTelemetryTick();
  }, 4500);
})();
