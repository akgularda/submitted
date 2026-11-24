// SubmitTED 2026 — Multi-Screen Live Occupancy Dashboard Controller
// Displays Zone occupancy rates + per-Zone Company Booth/Desk occupancy rates + Live Session Routing.
// Intentionally renders ZERO QR codes on Dashboard displays.

(function () {
  'use strict';

  const api = window.SubmitTEDTelemetry;
  if (!api) return;

  const params = new URLSearchParams(window.location.search);
  const initialZone = params.get('zone');
  const isKioskMode = params.get('kiosk') === '1';

  // "all" highlights all 6 zones AND displays focused zone company telemetry;
  // passing ?zone=red locks a Zone screen to Red Zone's companies prominently.
  let selectedZoneId = initialZone && api.ZONES.some((z) => z.id === initialZone) ? initialZone : 'all';
  let companyDetailZoneId = selectedZoneId === 'all' ? 'red' : selectedZoneId;
  let simActive = true;

  const clockEl = document.getElementById('dash-clock');
  const totalInsideEl = document.getElementById('dash-total-inside');
  const routingBadgeEl = document.getElementById('routing-badge');
  const routingTitleEl = document.getElementById('routing-title');
  const routingSpeakerEl = document.getElementById('routing-speaker');
  const routingFocusBtn = document.getElementById('routing-focus-btn');
  const tickerTextEl = document.getElementById('dash-ticker-text');
  const balanceTextEl = document.getElementById('dash-balance-text');
  const zoneTabsEl = document.getElementById('dash-zone-tabs');
  const zonesGridEl = document.getElementById('zones-telemetry-grid');
  const globalSectionEl = document.getElementById('dash-global-section');
  const companiesKickerEl = document.getElementById('companies-zone-kicker');
  const companiesTitleEl = document.getElementById('companies-section-title');
  const zoneSummaryChipEl = document.getElementById('zone-summary-chip');
  const companiesGridEl = document.getElementById('companies-grid');

  if (isKioskMode) {
    const controlsBar = document.getElementById('dash-controls-bar');
    if (controlsBar) controlsBar.style.display = 'none';
  }

  function updateClock() {
    if (!clockEl) return;
    const now = new Date();
    clockEl.textContent = now.toLocaleTimeString('tr-TR', { hour12: false });
  }
  updateClock();
  setInterval(updateClock, 1000);

  function renderTabs(snap) {
    if (!zoneTabsEl) return;
    const tabs = [
      `<button type="button" class="zone-tab-btn ${selectedZoneId === 'all' ? 'is-active' : ''}" data-tab-zone="all">Tümü (6 Zone)</button>`
    ];
    snap.zones.forEach((z) => {
      tabs.push(
        `<button type="button" class="zone-tab-btn ${selectedZoneId === z.id ? 'is-active' : ''}" data-tab-zone="${z.id}">` +
          `<i style="background:${z.color}"></i>${z.shortName} · %${z.pct}` +
        `</button>`
      );
    });
    zoneTabsEl.innerHTML = tabs.join('');

    zoneTabsEl.querySelectorAll('[data-tab-zone]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const zId = btn.dataset.tabZone;
        selectedZoneId = zId;
        if (zId !== 'all') companyDetailZoneId = zId;
        render(api.getSnapshot());
      });
    });
  }

  function renderZonesGrid(snap) {
    if (!zonesGridEl || !globalSectionEl) return;

    // On a single-zone display (?zone=blue clicked), keep a compact top switcher and prominently showcase that zone's companies,
    // or show the single focused zone hero card cleanly alongside its booths.
    const visibleZones = selectedZoneId === 'all'
      ? snap.zones
      : snap.zones.filter((z) => z.id === selectedZoneId);

    zonesGridEl.style.gridTemplateColumns = selectedZoneId === 'all' ? '' : '1fr';

    zonesGridEl.innerHTML = visibleZones.map((z) => {
      const isRoutingTarget = snap.routing && snap.routing.targetZoneId === z.id;
      const isSelected = companyDetailZoneId === z.id;
      const topCompanies = z.companies.slice(0, 3).map((c) => (
        `<div class="zone-sub-row"><span>${c.name}</span><strong>${c.count}/${c.capacity} (%${c.pct})</strong></div>`
      )).join('');

      return (
        `<article class="zone-card ${isSelected ? 'is-selected' : ''} ${isRoutingTarget ? 'is-routing-target' : ''}" ` +
          `style="--zone-color:${z.color};--status-color:${z.status.color}" data-select-zone="${z.id}" tabindex="0">` +
          `<div class="zone-card-head">` +
            `<div>` +
              `<span class="zone-kicker">${z.campusSide} · ${z.building}</span>` +
              `<h3>${z.name}</h3>` +
            `</div>` +
            `<span class="zone-status-badge">${z.status.label}</span>` +
          `</div>` +
          `<div class="zone-meter-row">` +
            `<strong class="zone-pct-big">%${z.pct}</strong>` +
            `<span class="zone-count-meta">${z.count} / ${z.capacity} Kişi</span>` +
          `</div>` +
          `<div class="zone-progress-track"><div class="zone-progress-fill" style="width:${z.pct}%"></div></div>` +
          (isRoutingTarget ? `<span class="routing-tag-mini">ŞU AN YÖNLENDİRİLEN ALAN</span>` : '') +
          `<div class="zone-sub-preview">${topCompanies}</div>` +
        `</article>`
      );
    }).join('');

    zonesGridEl.querySelectorAll('[data-select-zone]').forEach((card) => {
      card.addEventListener('click', () => {
        companyDetailZoneId = card.dataset.selectZone;
        render(api.getSnapshot());
      });
    });
  }

  function renderCompaniesSection(snap) {
    const activeZone = snap.zonesById[companyDetailZoneId] || snap.zones[0];
    if (!activeZone || !companiesGridEl) return;

    companiesKickerEl.textContent = `${activeZone.name.toUpperCase()} EKRANI · ${activeZone.building.toUpperCase()}`;
    companiesKickerEl.style.color = activeZone.color;
    companiesTitleEl.textContent = `${activeZone.name} — Kurum ve Masa Doluluk Oranları`;
    zoneSummaryChipEl.textContent = `Bölge Doluluğu: %${activeZone.pct} (${activeZone.count} / ${activeZone.capacity} Kişi) · ${activeZone.walkingHint}`;

    companiesGridEl.innerHTML = activeZone.companies.map((c) => (
      `<div class="company-card" style="--zone-color:${activeZone.color};--status-color:${c.status.color}">` +
        `<div class="company-card-top">` +
          `<div>` +
            `<h4>${c.name}</h4>` +
            `<span class="company-role">${c.role}</span>` +
          `</div>` +
          `<strong class="company-pct">%${c.pct}</strong>` +
        `</div>` +
        `<div class="company-desk">${c.desk}</div>` +
        `<div class="company-bar-track"><div class="company-bar-fill" style="width:${c.pct}%"></div></div>` +
        `<div class="company-card-foot">` +
          `<span>Anlık Yoğunluk: ${c.count} / ${c.capacity}</span>` +
          `<strong style="color:${c.status.color}">${c.status.label}</strong>` +
        `</div>` +
      `</div>`
    )).join('');
  }

  function renderRoutingAndBalance(snap) {
    if (totalInsideEl) totalInsideEl.textContent = `${snap.totalInside} / ${snap.totalCapacity}`;

    if (snap.routing) {
      const targetZone = snap.zonesById[snap.routing.targetZoneId];
      if (routingBadgeEl) routingBadgeEl.textContent = snap.routing.badge;
      if (routingTitleEl) {
        routingTitleEl.textContent = `${snap.routing.title} → ${targetZone ? targetZone.name : ''} (${targetZone ? targetZone.building : ''})`;
      }
      if (routingSpeakerEl) routingSpeakerEl.textContent = snap.routing.speaker;
      if (routingFocusBtn) {
        routingFocusBtn.textContent = snap.routing.actionText || `${targetZone?.shortName || 'Alan'} Ekranına Geç →`;
        routingFocusBtn.onclick = () => {
          selectedZoneId = snap.routing.targetZoneId;
          companyDetailZoneId = snap.routing.targetZoneId;
          render(api.getSnapshot());
        };
      }
      if (tickerTextEl) {
        tickerTextEl.textContent = snap.routing.ticker || `${snap.routing.speaker} — ${snap.routing.title}`;
      }
    }

    if (snap.balance && balanceTextEl) {
      balanceTextEl.textContent = snap.balance.message;
    }
  }

  function render(snap) {
    renderRoutingAndBalance(snap);
    renderTabs(snap);
    renderZonesGrid(snap);
    renderCompaniesSection(snap);
  }

  // Controls Wiring
  const simToggleBtn = document.getElementById('dash-sim-toggle');
  if (simToggleBtn) {
    simToggleBtn.addEventListener('click', () => {
      simActive = !simActive;
      simToggleBtn.setAttribute('aria-pressed', String(simActive));
      simToggleBtn.textContent = simActive ? 'Canlı Akış: Açık' : 'Canlı Akış: Duraklatıldı';
    });
  }

  const dispatchToggleBtn = document.getElementById('dash-dispatch-toggle');
  const dispatchPanelEl = document.getElementById('dash-dispatch-panel');
  if (dispatchToggleBtn && dispatchPanelEl) {
    dispatchToggleBtn.addEventListener('click', () => {
      const next = dispatchPanelEl.hidden;
      dispatchPanelEl.hidden = !next;
      dispatchToggleBtn.setAttribute('aria-expanded', String(next));
    });
  }

  const presetContainer = document.getElementById('dispatch-preset-buttons');
  if (presetContainer) {
    presetContainer.innerHTML = api.ROUTING_PRESETS.map((p) => (
      `<button type="button" class="dash-btn" data-preset-id="${p.id}">${p.speaker.split('·')[0].trim()} → ${api.ZONES.find((z) => z.id === p.targetZoneId)?.shortName}</button>`
    )).join('');
    presetContainer.querySelectorAll('[data-preset-id]').forEach((btn) => {
      btn.addEventListener('click', () => {
        api.setRoutingAlert(btn.dataset.presetId);
      });
    });
  }

  const customZoneSelect = document.getElementById('custom-target-zone');
  if (customZoneSelect) {
    customZoneSelect.innerHTML = api.ZONES.map((z) => `<option value="${z.id}">${z.name} (${z.building})</option>`).join('');
  }

  const customForm = document.getElementById('custom-dispatch-form');
  if (customForm) {
    customForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const speaker = document.getElementById('custom-speaker').value.trim();
      const title = document.getElementById('custom-title').value.trim();
      const targetZoneId = document.getElementById('custom-target-zone').value;
      const targetZone = api.ZONES.find((z) => z.id === targetZoneId);
      api.setRoutingAlert({
        speaker,
        title,
        targetZoneId,
        actionText: `${targetZone ? targetZone.shortName : 'Alan'} Ekranına Geç →`,
        ticker: `RadioTEDU Canlı Anons · ${speaker}: ${title} (${targetZone ? targetZone.name + ' · ' + targetZone.building : ''})`
      });
      customForm.reset();
    });
  }

  const fsBtn = document.getElementById('dash-fullscreen-btn');
  if (fsBtn) {
    fsBtn.addEventListener('click', () => {
      if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen?.();
      } else {
        document.exitFullscreen?.();
      }
    });
  }

  api.subscribe(render);

  setInterval(() => {
    if (simActive) api.nudgeTelemetryTick();
  }, 4500);
})();
