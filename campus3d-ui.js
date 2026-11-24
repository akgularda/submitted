// SubmitTED Kariyer Zirvesi 2026 — 6-Zone 3D Campus Metadata & UI Controller
// Official 6-Zone Architecture: Red (Fuaye K Blok), Blue (Spor Merkezi E Blok),
// Tech&Innovation (D Blok), One-to-One Meetings (G Blok), Teacher+ (A/B Blok), Food&Beverage (Avlu).

const telemetryApi = window.SubmitTEDTelemetry;

const FALLBACK_ZONES = {
  red: {
    id: 'red',
    name: 'Red Zone',
    subtitle: '1. İşveren Alanı · Fuaye Alanı',
    building: 'K Blok · Ana Fuaye',
    color: '#D92D20',
    capacity: 250,
    count: 208,
    pct: 83,
    description: 'İncesu kanadındaki K Blok Ana Fuaye Alanında birinci küme işveren stantları ve hızlı kayıt/geçiş hattı yer alır.',
    companies: [
      { name: 'Akfen Holding', pct: 83 },
      { name: 'DenizBank', pct: 85 },
      { name: 'EY Türkiye', pct: 87 }
    ]
  },
  blue: {
    id: 'blue',
    name: 'Blue Zone',
    subtitle: '2. İşveren Alanı · Spor Merkezi',
    building: 'E Blok · Spor Merkezi',
    color: '#1570EF',
    capacity: 300,
    count: 144,
    pct: 48,
    description: 'Aksu kanadındaki E Blok Spor Merkezinde savunma sanayi ve yüksek teknoloji işveren stantları yer alır.',
    companies: [
      { name: 'ASELSAN', pct: 58 },
      { name: 'TUSAŞ', pct: 51 },
      { name: 'HAVELSAN', pct: 52 }
    ]
  },
  tech: {
    id: 'tech',
    name: 'Tech&Innovation Zone',
    subtitle: 'Konferans & Söyleşi Salonu',
    building: 'D Blok · Amfi D-104',
    color: '#00A847',
    capacity: 120,
    count: 92,
    pct: 77,
    description: 'Şirket stantlarının yer almadığı; 12.00 ASELSAN, 13.30 MİLSOFT ve teknoloji söyleşilerinin yapıldığı konferans alanı.',
    companies: [
      { name: '12.00–13.30 ASELSAN Söyleşisi', pct: 85 },
      { name: '13.30–14.15 MİLSOFT Konferansı', pct: 73 }
    ]
  },
  'one-to-one': {
    id: 'one-to-one',
    name: 'One-to-One Meetings Zone',
    subtitle: 'Randevulu Mülakat & Görüşme Salonu',
    building: 'G Blok · Görüşme Odaları',
    color: '#1D4F7C',
    capacity: 48,
    count: 38,
    pct: 79,
    description: 'Konum QR koduyla giriş yapılan randevulu 1:1 İK mülakat ve CV değerlendirme seansları.',
    companies: [
      { name: '10.00–12.30 Mühendislik Seansı', pct: 85 },
      { name: '13.30–15.30 Finans & MT Seansı', pct: 81 }
    ]
  },
  'teacher-plus': {
    id: 'teacher-plus',
    name: 'Teacher+ Zone',
    subtitle: 'Eğitim & Akademik Konferans Salonu',
    building: 'A / B Blok · İncesu',
    color: '#6E56CF',
    capacity: 80,
    count: 54,
    pct: 68,
    description: '14.00 Prof. Dr. Kürşat Çağıltay Konferansı ve 16.00 TED Ankara Koleji İK Müdürü söyleşisinin gerçekleştiği konferans alanı.',
    companies: [
      { name: '14.00–15.00 Prof. Dr. Kürşat Çağıltay', pct: 85 },
      { name: '16.00–17.00 TED Ankara Koleji İK', pct: 64 }
    ]
  },
  'food-beverage': {
    id: 'food-beverage',
    name: 'Food&Beverage Zone',
    subtitle: 'İkram, Kahve & Açık Hava Networking',
    building: 'C / F Arası & Avlu',
    color: '#D97706',
    capacity: 185,
    count: 112,
    pct: 61,
    description: 'Kampüsün merkezinde sıcak içecek, yemek ve açık hava networking noktaları.',
    companies: [
      { name: 'Aksu Avlu İkram Hattı', pct: 62 },
      { name: 'İncesu Bahçe Espresso Bar', pct: 59 }
    ]
  }
};

let currentZoneKey = 'red';

function getZoneData(key) {
  if (telemetryApi) {
    const snap = telemetryApi.getSnapshot();
    return snap.zonesById[key] || snap.zones[0];
  }
  return FALLBACK_ZONES[key] || FALLBACK_ZONES.red;
}

function getAllZones() {
  if (telemetryApi) return telemetryApi.getSnapshot().zones;
  return Object.values(FALLBACK_ZONES);
}

export function selectSummitArea(key, focus = false) {
  const zone = getZoneData(key);
  if (!zone) return;
  currentZoneKey = zone.id;

  const labelEl = document.getElementById('world-detail-label');
  const titleEl = document.getElementById('world-detail-title');
  const textEl = document.getElementById('world-detail-text');
  const listEl = document.getElementById('world-detail-list');
  const ctaEl = document.getElementById('world-detail-cta');

  if (labelEl) {
    labelEl.textContent = `${zone.building} · %${zone.pct} DOLU`;
    labelEl.style.color = zone.color;
  }
  if (titleEl) titleEl.textContent = zone.name;
  if (textEl) textEl.textContent = zone.description;
  if (listEl) {
    const companySummary = zone.companies.slice(0, 3).map((c) => `${c.name} (%${c.pct})`).join(' · ');
    const rows = [
      `Anlık Doluluk: ${zone.count} / ${zone.capacity} Kişi (%${zone.pct})`,
      `Yerleşke: ${zone.subtitle}`,
      companySummary ? `Alt Alanlar: ${companySummary}` : zone.walkingHint
    ];
    listEl.innerHTML = rows.map((t) => `<li>${t}</li>`).join('');
  }
  if (ctaEl) {
    ctaEl.setAttribute('href', `dashboard.html?zone=${zone.id}`);
    ctaEl.textContent = `${zone.shortName} Canlı Ekranını Aç →`;
  }

  document.querySelectorAll('[data-map-zone]').forEach((b) => {
    b.setAttribute('aria-pressed', String(b.dataset.mapZone === zone.id));
  });

  document.dispatchEvent(new CustomEvent('summit-zone-selected', { detail: { key: zone.id, focus } }));
}

function renderZonesBar() {
  const zonesBar = document.getElementById('world-zones-bar');
  if (!zonesBar) return;
  const zones = getAllZones();
  zonesBar.innerHTML = zones
    .map((z) => `<button type="button" data-map-zone="${z.id}" aria-pressed="${z.id === currentZoneKey}"><i style="background:${z.color}"></i>${z.shortName} · %${z.pct}</button>`)
    .join('');

  zonesBar.querySelectorAll('[data-map-zone]').forEach((btn) => {
    btn.addEventListener('click', () => selectSummitArea(btn.dataset.mapZone, true));
  });
}

renderZonesBar();

document.addEventListener('summit-scene-pick', (e) => {
  selectSummitArea(e.detail.key, e.detail.focus !== false);
});

// Wire split zone banners below the 3D map to focus Red Zone (Fuaye K Blok) / Blue Zone (Spor Merkezi E Blok)
document.querySelectorAll('[data-zone]').forEach((bannerBtn) => {
  bannerBtn.addEventListener('click', () => {
    const z = bannerBtn.dataset.zone;
    if (z === 'red') {
      selectSummitArea('red', true);
    } else if (z === 'blue') {
      selectSummitArea('blue', true);
    }
  });
});

if (telemetryApi) {
  telemetryApi.subscribe(() => {
    renderZonesBar();
    selectSummitArea(currentZoneKey, false);
  });
} else {
  selectSummitArea('red', false);
}
