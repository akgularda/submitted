// SubmitTED Kariyer Zirvesi 2026 — Shared Telemetry, Zone Occupancy, Location QR Check-In,
// Summit Passport, Cross-Campus Balancing & Live Session Routing Engine.
// Red Zone & Blue Zone = Company Stands; all other Zones = Scheduled Conference / Session Halls.

(function (global) {
  'use strict';

  const STORAGE_KEY = 'submitted26_telemetry_v3';
  const ATTENDEE_KEY = 'submitted26_attendee_v2';
  const PASSPORT_KEY = 'submitted26_passport_v2';
  const SESSION_TTL_MS = 90 * 60 * 1000;

  const ZONES = [
    {
      id: 'red',
      zoneType: 'stands',
      name: 'Red Zone',
      shortName: 'Red Zone',
      subtitle: '1. İşveren Alanı · Fuaye Alanı (Şirket Stantları)',
      campusSide: 'İncesu Yerleşkesi',
      building: 'K Blok · Ana Fuaye Alanı',
      color: '#D92D20',
      capacity: 250,
      defaultCount: 204,
      camera: 'incesu',
      walkingHint: 'Ziya Gökalp doğu kanadı, ana girişten 1 dk.',
      description: 'İncesu kanadındaki K Blok Ana Fuaye Alanında birinci küme şirket stantları yer alır.',
      items: [
        { id: 'stand-akfen', timeSlot: 'STANT R-01', name: 'Akfen Holding', role: 'Altyapı & Yatırım', desk: 'K Blok Fuaye Kuzey', capacity: 35, defaultCount: 28 },
        { id: 'stand-denizbank', timeSlot: 'STANT R-02', name: 'DenizBank', role: 'Finans & Bankacılık', desk: 'K Blok Fuaye Merkez', capacity: 40, defaultCount: 33 },
        { id: 'stand-ey', timeSlot: 'STANT R-03', name: 'EY Türkiye', role: 'Denetim & Danışmanlık', desk: 'K Blok Fuaye Doğu', capacity: 45, defaultCount: 39 },
        { id: 'stand-cci', timeSlot: 'STANT R-04', name: 'Coca-Cola İçecek', role: 'Hızlı Tüketim (FMCG)', desk: 'K Blok Fuaye Güney', capacity: 45, defaultCount: 36 },
        { id: 'stand-kpmg', timeSlot: 'STANT R-05', name: 'KPMG Türkiye', role: 'Danışmanlık & Vergi', desk: 'K Blok Fuaye Hol', capacity: 40, defaultCount: 31 },
        { id: 'stand-efes', timeSlot: 'STANT R-06', name: 'Anadolu Efes', role: 'Pazarlama & MT Programı', desk: 'K Blok Fuaye Çıkış', capacity: 45, defaultCount: 37 }
      ]
    },
    {
      id: 'blue',
      zoneType: 'stands',
      name: 'Blue Zone',
      shortName: 'Blue Zone',
      subtitle: '2. İşveren Alanı · Spor Merkezi (Şirket Stantları)',
      campusSide: 'Aksu Yerleşkesi',
      building: 'E Blok · TEDÜ Spor Merkezi',
      color: '#1570EF',
      capacity: 300,
      defaultCount: 148,
      camera: 'aksu',
      walkingHint: 'Red Zone (Fuaye)’den Ziya Gökalp geçişiyle ~2 dk yürüme.',
      description: 'Aksu kanadındaki E Blok Spor Merkezinde ikinci küme şirket stantları ve savunma/teknoloji işverenleri yer alır.',
      items: [
        { id: 'stand-aselsan', timeSlot: 'STANT B-01', name: 'ASELSAN', role: 'Savunma & Yüksek Teknoloji', desk: 'Spor Salonu Ana Ekseni', capacity: 60, defaultCount: 36 },
        { id: 'stand-tusas', timeSlot: 'STANT B-02', name: 'TUSAŞ', role: 'Havacılık & Uzay', desk: 'Spor Salonu Kuzey', capacity: 55, defaultCount: 28 },
        { id: 'stand-milsoft', timeSlot: 'STANT B-03', name: 'MİLSOFT', role: 'Yazılım & Komuta Kontrol', desk: 'Spor Salonu Merkez', capacity: 45, defaultCount: 23 },
        { id: 'stand-fnss', timeSlot: 'STANT B-04', name: 'FNSS', role: 'Savunma Sistemleri', desk: 'Spor Salonu Doğu', capacity: 45, defaultCount: 21 },
        { id: 'stand-roketsan', timeSlot: 'STANT B-05', name: 'ROKETSAN', role: 'Uzay & İtki Teknolojileri', desk: 'Spor Salonu Güney', capacity: 50, defaultCount: 24 },
        { id: 'stand-gama', timeSlot: 'STANT B-06', name: 'GAMA Enerji', role: 'Enerji & Mühendislik', desk: 'Spor Salonu Giriş', capacity: 45, defaultCount: 16 }
      ]
    },
    {
      id: 'tech',
      zoneType: 'conference',
      name: 'Tech&Innovation Zone',
      shortName: 'Tech&Innovation',
      subtitle: 'Konferans & Söyleşi Salonu (Stant Yoktur)',
      campusSide: 'Aksu Yerleşkesi',
      building: 'D Blok · Amfi Salon D-104',
      color: '#00A847',
      capacity: 120,
      defaultCount: 92,
      camera: 'aksu',
      walkingHint: 'Aksu avlusunun batı cephesi (Spor Merkezinden 1 dk).',
      description: 'Şirket stantlarının yer almadığı; teknoloji söyleşileri, mühendislik ve yapay zeka konferanslarının yapıldığı amfi salonu.',
      items: [
        { id: 'tech-ey-1030', timeSlot: '10.30 – 11.45', name: 'EY Türkiye · Üretken Yapay Zeka ve Veri Analitiği', role: 'Konferans Oturumu', desk: 'D Blok Amfi Salon D-104', capacity: 120, defaultCount: 74 },
        { id: 'tech-aselsan-1200', timeSlot: '12.00 – 13.30', name: 'ASELSAN Söyleşisi', role: 'Savunma & Yüksek Teknolojide Yetenek', desk: 'D Blok Amfi Salon D-104', capacity: 120, defaultCount: 102 },
        { id: 'tech-milsoft-1330', timeSlot: '13.30 – 14.15', name: 'MİLSOFT Konferansı', role: 'Büyük Ölçekli Yazılım ve Sistem Mimarileri', desk: 'D Blok Amfi Salon D-104', capacity: 120, defaultCount: 88 },
        { id: 'tech-tusas-1430', timeSlot: '14.30 – 16.00', name: 'TUSAŞ · Havacılık ve Mühendislik Oturumu', role: 'Konferans & Soru-Cevap', desk: 'D Blok Amfi Salon D-104', capacity: 120, defaultCount: 81 }
      ]
    },
    {
      id: 'one-to-one',
      zoneType: 'conference',
      name: 'One-to-One Meetings Zone',
      shortName: '1:1 Meetings',
      subtitle: 'Randevulu Mülakat & Görüşme Salonu',
      campusSide: 'Aksu Yerleşkesi',
      building: 'G Blok · Görüşme Odaları',
      color: '#1D4F7C',
      capacity: 48,
      defaultCount: 38,
      camera: 'interviews',
      walkingHint: 'Aksu avlusunun kuzey kanadı (G Blok zemin kat).',
      description: 'Gün boyu saat dilimlerine bölünmüş 1:1 İK ön mülakatları ve birebir CV değerlendirme oturumları.',
      items: [
        { id: '1on1-morning', timeSlot: '10.00 – 12.30', name: 'Mühendislik & Teknoloji 1:1 Ön Mülakat Seansı', role: 'Randevulu 15 Dk Görüşmeler', desk: 'G Blok Kabin 01–12', capacity: 48, defaultCount: 41 },
        { id: '1on1-afternoon', timeSlot: '13.30 – 15.30', name: 'Finans, Danışmanlık & FMCG 1:1 Seansı', role: 'MT & Staj Görüşmeleri', desk: 'G Blok Kabin 01–12', capacity: 48, defaultCount: 39 },
        { id: '1on1-cv', timeSlot: '15.45 – 17.15', name: 'CV & LinkedIn Profil İnceleme Oturumu', role: 'Birebir Geri Bildirim', desk: 'G Blok Değerlendirme Salonu', capacity: 48, defaultCount: 34 }
      ]
    },
    {
      id: 'teacher-plus',
      zoneType: 'conference',
      name: 'Teacher+ Zone',
      shortName: 'Teacher+ Zone',
      subtitle: 'Eğitim & Akademik Konferans Salonu (Stant Yoktur)',
      campusSide: 'İncesu Yerleşkesi',
      building: 'A / B Blok · Konferans Salonu',
      color: '#6E56CF',
      capacity: 80,
      defaultCount: 54,
      camera: 'incesu',
      walkingHint: 'İncesu A Blok girişi, Red Zone fuayesinin yanı.',
      description: 'Akademisyenler, eğitim liderleri ve öğretmen adayları için konferans ve söyleşilerin düzenlendiği salon.',
      items: [
        { id: 'teacher-tedu-1100', timeSlot: '11.00 – 12.15', name: 'TEDÜ Eğitim Fakültesi · Geleceğin Öğrenme Ortamları', role: 'Açılış Konferansı', desk: 'A Blok Konferans Salonu', capacity: 80, defaultCount: 46 },
        { id: 'teacher-cagiltay-1400', timeSlot: '14.00 – 15.00', name: 'Prof. Dr. Kürşat Çağıltay Konferansı', role: 'Eğitim Teknolojileri ve Araştırma', desk: 'A Blok Konferans Salonu', capacity: 80, defaultCount: 68 },
        { id: 'teacher-tedkolej-1600', timeSlot: '16.00 – 17.00', name: 'TED Ankara Koleji İK Müdürü', role: 'Eğitim Kurumlarında Yetenek & İK Süreçleri', desk: 'A Blok Konferans Salonu', capacity: 80, defaultCount: 51 }
      ]
    },
    {
      id: 'food-beverage',
      zoneType: 'conference',
      name: 'Food&Beverage Zone',
      shortName: 'Food&Beverage',
      subtitle: 'İkram, Kahve Molası & Sosyal Alan',
      campusSide: 'Aksu & İncesu Avlu',
      building: 'C / F Arası & İncesu Bahçe',
      color: '#D97706',
      capacity: 185,
      defaultCount: 110,
      camera: 'campus',
      walkingHint: 'Oturum aralarında Aksu ve İncesu ortak avluları.',
      description: 'Konferans aralarında sıcak içecek, öğle ikramı ve açık hava dinlenme saatleri.',
      items: [
        { id: 'food-coffee-allday', timeSlot: '09.30 – 17.30', name: 'Gün Boyu Kahve & Atıştırmalık Servisi', role: 'İkram & Mola Noktası', desk: 'İncesu & Aksu Avlu', capacity: 185, defaultCount: 96 },
        { id: 'food-lunch-1215', timeSlot: '12.15 – 14.00', name: 'Öğle Arası & Kampüs İkram Saati', role: 'Ana Öğle Servisi', desk: 'Aksu Merkezi Avlu', capacity: 185, defaultCount: 142 }
      ]
    }
  ];

  const ROUTING_PRESETS = [
    {
      id: 'aselsan-tech',
      badge: 'SAAT 12.00 – 13.30 · KONFERANS ÇAĞRISI',
      speaker: 'ASELSAN Söyleşisi',
      title: 'Tech&Innovation Zone’da başlıyor (D Blok · Amfi Salon D-104)',
      targetZoneId: 'tech',
      actionText: 'Tech&Innovation Programını Aç →',
      ticker: '12.00 – 13.30 ASELSAN SÖYLEŞİSİ · TECH&INNOVATION ZONE (D BLOK AMFİ D-104)'
    },
    {
      id: 'milsoft-tech',
      badge: 'SAAT 13.30 – 14.15 · KONFERANS ÇAĞRISI',
      speaker: 'MİLSOFT Konferansı',
      title: 'Tech&Innovation Zone’da devam ediyor (D Blok · Amfi Salon D-104)',
      targetZoneId: 'tech',
      actionText: 'Tech&Innovation Programını Aç →',
      ticker: '13.30 – 14.15 MİLSOFT KONFERANSI · TECH&INNOVATION ZONE (D BLOK AMFİ D-104)'
    },
    {
      id: 'cagiltay-teacher',
      badge: 'SAAT 14.00 – 15.00 · KONFERANS ÇAĞRISI',
      speaker: 'Prof. Dr. Kürşat Çağıltay Konferansı',
      title: 'Teacher+ Zone’da başlıyor (A Blok Konferans Salonu)',
      targetZoneId: 'teacher-plus',
      actionText: 'Teacher+ Programını Aç →',
      ticker: '14.00 – 15.00 PROF. DR. KÜRŞAT ÇAĞILTAY KONFERANSI · TEACHER+ ZONE (A BLOK)'
    },
    {
      id: 'tedkolej-teacher',
      badge: 'SAAT 16.00 – 17.00 · KONFERANS ÇAĞRISI',
      speaker: 'TED Ankara Koleji İK Müdürü',
      title: 'Teacher+ Zone’da sahnede (A Blok Konferans Salonu)',
      targetZoneId: 'teacher-plus',
      actionText: 'Teacher+ Programını Aç →',
      ticker: '16.00 – 17.00 TED ANKARA KOLEJİ İK MÜDÜRÜ · TEACHER+ ZONE (A BLOK)'
    }
  ];

  // Build flat lookup map of all scannable Location QR points (Zone entrances + individual Stands/Sessions)
  const LOCATIONS = {};
  ZONES.forEach((zone) => {
    LOCATIONS[zone.id + '-zone'] = {
      locId: zone.id + '-zone',
      zoneId: zone.id,
      itemId: null,
      kind: 'zone',
      title: zone.name + ' Ana Giriş',
      subTitle: zone.building + ' · ' + zone.subtitle,
      capacity: zone.capacity
    };
    zone.items.forEach((item) => {
      LOCATIONS[item.id] = {
        locId: item.id,
        zoneId: zone.id,
        itemId: item.id,
        kind: zone.zoneType === 'stands' ? 'stand' : 'session',
        title: (zone.zoneType === 'conference' ? `${item.timeSlot} · ` : '') + item.name,
        subTitle: item.desk + ' · ' + zone.name,
        capacity: item.capacity
      };
    });
  });

  function safeParse(str, fallback) {
    try {
      return str ? JSON.parse(str) : fallback;
    } catch {
      return fallback;
    }
  }

  function buildInitialState() {
    const zoneCounts = {};
    const itemCounts = {};
    ZONES.forEach((z) => {
      zoneCounts[z.id] = z.defaultCount;
      z.items.forEach((it) => {
        itemCounts[it.id] = it.defaultCount;
      });
    });
    return {
      zoneCounts,
      itemCounts,
      activeRoutingId: 'aselsan-tech',
      customAlert: null,
      totalScans: 684,
      updatedAt: Date.now()
    };
  }

  function loadState() {
    const raw = safeParse(localStorage.getItem(STORAGE_KEY), null);
    if (!raw || !raw.zoneCounts || !raw.itemCounts) {
      const init = buildInitialState();
      localStorage.setItem(STORAGE_KEY, JSON.stringify(init));
      return init;
    }
    return raw;
  }

  function loadAttendee() {
    return safeParse(localStorage.getItem(ATTENDEE_KEY), null);
  }

  function loadPassport() {
    const p = safeParse(localStorage.getItem(PASSPORT_KEY), null);
    if (!p) {
      return {
        visitedZones: [],
        visitedLocations: [],
        currentLocId: null,
        checkedInAt: null,
        history: []
      };
    }
    if (p.currentLocId && p.checkedInAt && Date.now() - p.checkedInAt > SESSION_TTL_MS) {
      p.currentLocId = null;
      p.checkedInAt = null;
      localStorage.setItem(PASSPORT_KEY, JSON.stringify(p));
    }
    return p;
  }

  const channel = typeof BroadcastChannel !== 'undefined'
    ? new BroadcastChannel('submitted_telemetry_v3')
    : null;

  const listeners = new Set();

  function notifyAll(state) {
    listeners.forEach((cb) => {
      try {
        cb(getSnapshot(state));
      } catch (err) {
        console.error('Telemetry listener error:', err);
      }
    });
  }

  function saveState(state, broadcast = true) {
    state.updatedAt = Date.now();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    if (broadcast && channel) {
      channel.postMessage({ type: 'telemetry-update', state });
    }
    notifyAll(state);
  }

  if (channel) {
    channel.addEventListener('message', (e) => {
      if (e.data && e.data.type === 'telemetry-update') {
        notifyAll(loadState());
      }
    });
  }

  global.addEventListener('storage', (e) => {
    if (e.key === STORAGE_KEY || e.key === PASSPORT_KEY || e.key === ATTENDEE_KEY) {
      notifyAll(loadState());
    }
  });

  function getStatusMeta(pct) {
    if (pct >= 85) return { code: 'critical', label: 'YOĞUN', color: '#ef4444' };
    if (pct >= 65) return { code: 'busy', label: 'KALABALIK', color: '#f5a623' };
    return { code: 'open', label: 'MÜSAİT', color: '#27c96b' };
  }

  function getCampusBalance(zonesSnapshot) {
    const red = zonesSnapshot.find((z) => z.id === 'red');
    const blue = zonesSnapshot.find((z) => z.id === 'blue');
    if (!red || !blue) return null;

    const diff = red.pct - blue.pct;
    if (diff >= 18) {
      return {
        isBalanced: false,
        heavyZone: red,
        lighterZone: blue,
        message: `Red Zone (Fuaye) %${red.pct} dolu · Spor Merkezi Blue Zone %${blue.pct} ile müsait (~2 dk yürüme).`
      };
    }
    if (diff <= -18) {
      return {
        isBalanced: false,
        heavyZone: blue,
        lighterZone: red,
        message: `Blue Zone (Spor Merkezi) %${blue.pct} dolu · Fuaye Red Zone %${red.pct} ile müsait (~2 dk yürüme).`
      };
    }
    return {
      isBalanced: true,
      heavyZone: null,
      lighterZone: blue.pct <= red.pct ? blue : red,
      message: `Stant yoğunluğu dengeli: Red Zone (Fuaye) %${red.pct} · Blue Zone (Spor Mrk.) %${blue.pct}`
    };
  }

  function getSnapshot(explicitState) {
    const state = explicitState || loadState();
    let totalInside = 0;
    let totalCapacity = 0;

    const zones = ZONES.map((z) => {
      const count = Math.max(0, Number(state.zoneCounts[z.id] ?? z.defaultCount));
      const pct = Math.min(100, Math.round((count / z.capacity) * 100));
      totalInside += count;
      totalCapacity += z.capacity;

      const items = z.items.map((it) => {
        const itCount = Math.max(0, Number(state.itemCounts[it.id] ?? it.defaultCount));
        const itPct = Math.min(100, Math.round((itCount / it.capacity) * 100));
        return Object.assign({}, it, {
          count: itCount,
          pct: itPct,
          status: getStatusMeta(itPct)
        });
      });

      return Object.assign({}, z, {
        count,
        pct,
        status: getStatusMeta(pct),
        items,
        companies: items // Backwards compatibility alias for map UI
      });
    });

    const routing = state.customAlert
      ? state.customAlert
      : (ROUTING_PRESETS.find((r) => r.id === state.activeRoutingId) || ROUTING_PRESETS[0]);

    return {
      zones,
      zonesById: Object.fromEntries(zones.map((z) => [z.id, z])),
      totalInside,
      totalCapacity,
      overallPct: Math.min(100, Math.round((totalInside / totalCapacity) * 100)),
      totalScans: state.totalScans || 0,
      routing,
      balance: getCampusBalance(zones),
      attendee: loadAttendee(),
      passport: loadPassport(),
      updatedAt: state.updatedAt
    };
  }

  function registerAttendee(info) {
    const id = 'SUB26-' + Math.random().toString(36).slice(2, 6).toUpperCase() + '-' + Date.now().toString().slice(-3);
    const record = {
      id,
      name: (info.name || '').trim(),
      email: (info.email || '').trim(),
      department: (info.department || 'TEDÜ Öğrencisi').trim(),
      profile: info.profile || 'student',
      createdAt: Date.now()
    };
    localStorage.setItem(ATTENDEE_KEY, JSON.stringify(record));
    notifyAll(loadState());
    return record;
  }

  function decrementLocation(state, locId) {
    const loc = LOCATIONS[locId];
    if (!loc) return;
    if (loc.itemId && state.itemCounts[loc.itemId] > 0) {
      state.itemCounts[loc.itemId] -= 1;
    }
    if (state.zoneCounts[loc.zoneId] > 0) {
      state.zoneCounts[loc.zoneId] -= 1;
    }
  }

  function checkInLocation(locId) {
    const loc = LOCATIONS[locId];
    if (!loc) return { ok: false, error: 'Geçersiz konum QR kodu.' };

    const state = loadState();
    const passport = loadPassport();
    const previousLocId = passport.currentLocId;

    if (previousLocId && previousLocId !== locId) {
      decrementLocation(state, previousLocId);
    }

    if (previousLocId !== locId) {
      if (loc.itemId) {
        const itemDef = ZONES.flatMap((z) => z.items).find((it) => it.id === loc.itemId);
        const cap = itemDef ? itemDef.capacity : 80;
        state.itemCounts[loc.itemId] = Math.min(cap + 5, (state.itemCounts[loc.itemId] || 0) + 1);
      }
      const zoneDef = ZONES.find((z) => z.id === loc.zoneId);
      const zCap = zoneDef ? zoneDef.capacity : 300;
      state.zoneCounts[loc.zoneId] = Math.min(zCap + 25, (state.zoneCounts[loc.zoneId] || 0) + 1);
      state.totalScans = (state.totalScans || 0) + 1;
    }

    passport.currentLocId = locId;
    passport.checkedInAt = Date.now();
    if (!passport.visitedZones.includes(loc.zoneId)) {
      passport.visitedZones.push(loc.zoneId);
    }
    if (!passport.visitedLocations.includes(locId)) {
      passport.visitedLocations.push(locId);
    }
    passport.history.unshift({
      locId,
      title: loc.title,
      zoneId: loc.zoneId,
      action: 'checkin',
      at: Date.now()
    });
    passport.history = passport.history.slice(0, 20);

    localStorage.setItem(PASSPORT_KEY, JSON.stringify(passport));
    saveState(state, true);

    return {
      ok: true,
      autoCheckedOutFrom: previousLocId && previousLocId !== locId ? LOCATIONS[previousLocId] : null,
      location: loc,
      snapshot: getSnapshot(state)
    };
  }

  function checkOutCurrent() {
    const state = loadState();
    const passport = loadPassport();
    if (!passport.currentLocId) return { ok: false };

    const oldLoc = LOCATIONS[passport.currentLocId];
    decrementLocation(state, passport.currentLocId);
    passport.history.unshift({
      locId: passport.currentLocId,
      title: oldLoc ? oldLoc.title : passport.currentLocId,
      zoneId: oldLoc ? oldLoc.zoneId : '',
      action: 'checkout',
      at: Date.now()
    });
    passport.history = passport.history.slice(0, 20);
    passport.currentLocId = null;
    passport.checkedInAt = null;

    localStorage.setItem(PASSPORT_KEY, JSON.stringify(passport));
    saveState(state, true);
    return { ok: true, oldLocation: oldLoc, snapshot: getSnapshot(state) };
  }

  function setRoutingAlert(presetIdOrCustom) {
    const state = loadState();
    if (typeof presetIdOrCustom === 'string') {
      state.activeRoutingId = presetIdOrCustom;
      state.customAlert = null;
    } else if (presetIdOrCustom && presetIdOrCustom.targetZoneId) {
      state.customAlert = Object.assign({
        id: 'custom-' + Date.now(),
        badge: 'CANLI ANONS'
      }, presetIdOrCustom);
    }
    saveState(state, true);
  }

  function nudgeTelemetryTick() {
    const state = loadState();
    const zoneIndex = Math.floor(Math.random() * ZONES.length);
    const z = ZONES[zoneIndex];
    const delta = Math.random() > 0.45 ? 1 : -1;
    state.zoneCounts[z.id] = Math.max(Math.round(z.capacity * 0.2), Math.min(Math.round(z.capacity * 0.96), (state.zoneCounts[z.id] || z.defaultCount) + delta));

    const item = z.items[Math.floor(Math.random() * z.items.length)];
    if (item) {
      state.itemCounts[item.id] = Math.max(5, Math.min(item.capacity, (state.itemCounts[item.id] || item.defaultCount) + delta));
    }
    saveState(state, true);
  }

  function subscribe(callback) {
    listeners.add(callback);
    callback(getSnapshot());
    return () => listeners.delete(callback);
  }

  global.SubmitTEDTelemetry = {
    ZONES,
    LOCATIONS,
    ROUTING_PRESETS,
    getSnapshot,
    subscribe,
    registerAttendee,
    checkInLocation,
    checkOutCurrent,
    setRoutingAlert,
    nudgeTelemetryTick,
    getStatusMeta
  };
})(window);
