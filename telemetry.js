// SubmitTED Kariyer Zirvesi 2026 — Shared Telemetry, Zone Occupancy, Location QR Check-In,
// Summit Passport, Cross-Campus Balancing & Live Session Routing Engine.
// Works seamlessly offline via BroadcastChannel + localStorage, with optional Supabase bridge.

(function (global) {
  'use strict';

  const STORAGE_KEY = 'submitted26_telemetry_v2';
  const ATTENDEE_KEY = 'submitted26_attendee_v2';
  const PASSPORT_KEY = 'submitted26_passport_v2';
  const SESSION_TTL_MS = 90 * 60 * 1000; // 90-minute safety auto-checkout TTL

  const ZONES = [
    {
      id: 'red',
      name: 'Red Zone',
      shortName: 'Red Zone',
      subtitle: '1. İşveren Alanı · Fuaye Alanı',
      campusSide: 'İncesu Yerleşkesi',
      building: 'K Blok · Ana Fuaye Alanı',
      color: '#D92D20',
      capacity: 250,
      defaultCount: 208,
      camera: 'incesu',
      walkingHint: 'Ziya Gökalp doğu kanadı, ana girişten 1 dk.',
      description: 'İncesu kanadındaki K Blok Ana Fuaye Alanında birinci küme işveren stantları, finans/danışmanlık firmaları ve ana karşılama hattı yer alır.',
      companies: [
        { id: 'stand-akfen', name: 'Akfen Holding', role: 'Altyapı & Yatırım', desk: 'Stant R-01 · Fuaye Kuzey', capacity: 35, defaultCount: 29 },
        { id: 'stand-denizbank', name: 'DenizBank', role: 'Finans & Bankacılık', desk: 'Stant R-02 · Fuaye Merkez', capacity: 40, defaultCount: 34 },
        { id: 'stand-ey', name: 'EY Türkiye', role: 'Denetim & Danışmanlık', desk: 'Stant R-03 · Fuaye Doğu', capacity: 45, defaultCount: 39 },
        { id: 'stand-cci', name: 'Coca-Cola İçecek', role: 'Hızlı Tüketim (FMCG)', desk: 'Stant R-04 · Fuaye Güney', capacity: 45, defaultCount: 36 },
        { id: 'stand-kpmg', name: 'KPMG Türkiye', role: 'Danışmanlık & Vergi', desk: 'Stant R-05 · Fuaye Hol', capacity: 40, defaultCount: 31 },
        { id: 'stand-efes', name: 'Anadolu Efes', role: 'Pazarlama & MT Programı', desk: 'Stant R-06 · Fuaye Çıkış', capacity: 45, defaultCount: 39 }
      ]
    },
    {
      id: 'blue',
      name: 'Blue Zone',
      shortName: 'Blue Zone',
      subtitle: '2. İşveren Alanı · Spor Merkezi',
      campusSide: 'Aksu Yerleşkesi',
      building: 'E Blok · TEDÜ Spor Merkezi',
      color: '#1570EF',
      capacity: 300,
      defaultCount: 144,
      camera: 'aksu',
      walkingHint: 'Red Zone (Fuaye)’den Aksu alt geçit / Ziya Gökalp ile ~2 dk yürüme.',
      description: 'Aksu kanadındaki E Blok Spor Merkezinde savunma sanayi, mühendislik ve havacılık şirketlerinin geniş ölçekli kurumsal stantları bulunur.',
      companies: [
        { id: 'stand-aselsan', name: 'ASELSAN', role: 'Savunma & Yüksek Teknoloji', desk: 'Stant B-01 · Spor Salonu Ana Ekseni', capacity: 65, defaultCount: 38 },
        { id: 'stand-tusas', name: 'TUSAŞ', role: 'Havacılık & Uzay', desk: 'Stant B-02 · Spor Salonu Kuzey', capacity: 55, defaultCount: 28 },
        { id: 'stand-fnss', name: 'FNSS', role: 'Savunma Sistemleri', desk: 'Stant B-03 · Spor Salonu Doğu', capacity: 45, defaultCount: 21 },
        { id: 'stand-havelsan', name: 'HAVELSAN', role: 'Yazılım & Komuta Kontrol', desk: 'Stant B-04 · Spor Salonu Merkez', capacity: 50, defaultCount: 26 },
        { id: 'stand-roketsan', name: 'ROKETSAN', role: 'Uzay & İtki Teknolojileri', desk: 'Stant B-05 · Spor Salonu Güney', capacity: 45, defaultCount: 17 },
        { id: 'stand-gama', name: 'GAMA Enerji', role: 'Enerji & Mühendislik', desk: 'Stant B-06 · Spor Salonu Giriş', capacity: 40, defaultCount: 14 }
      ]
    },
    {
      id: 'tech',
      name: 'Tech&Innovation Zone',
      shortName: 'Tech&Innovation',
      subtitle: 'Teknoloji, AI & Konuşma Amfisi',
      campusSide: 'Aksu Yerleşkesi',
      building: 'D Blok · Amfi Salon D-104 & Sergi',
      color: '#00A847',
      capacity: 120,
      defaultCount: 88,
      camera: 'aksu',
      walkingHint: 'Aksu avlusunun batı cephesi (Spor Merkezinden 1 dk).',
      description: 'Yapay zeka, savunma sistemleri, ürün yönetimi panelleri ve kurumsal teknoloji demolarının gerçekleştiği ana teknik konuşma alanı.',
      companies: [
        { id: 'tech-aselsan-stage', name: 'ASELSAN · Teknoloji Konuşması', role: 'D-104 Ana Teknik Amfi', desk: 'Amfi Sahne · Konuşma & Q&A', capacity: 60, defaultCount: 49 },
        { id: 'tech-ey-lab', name: 'EY Türkiye · YZ & Veri Lab', role: 'Deneyim Masası T-01', desk: 'D Blok Koridor Demo İstasyonu', capacity: 30, defaultCount: 21 },
        { id: 'tech-tedu-proto', name: 'TEDÜ Ar-Ge & Teknopark Vitrini', role: 'Öğrenci & Girişim Demoları', desk: 'D Blok Fuaye Sergi Hattı', capacity: 30, defaultCount: 18 }
      ]
    },
    {
      id: 'one-to-one',
      name: 'One-to-One Meetings Zone',
      shortName: '1:1 Meetings',
      subtitle: 'Randevulu Mülakat & CV Kabinleri',
      campusSide: 'Aksu Yerleşkesi',
      building: 'G Blok · 12 Adet 1:1 Görüşme Kabini',
      color: '#1D4F7C',
      capacity: 48,
      defaultCount: 39,
      camera: 'interviews',
      walkingHint: 'Aksu avlusunun kuzey kanadı (G Blok zemin kat).',
      description: 'Öğrencilerin İK uzmanlarıyla masadaki/kabindeki QR kodunu okutarak katıldığı 15 dakikalık birebir ön mülakat ve CV kliniği bölgesi.',
      companies: [
        { id: '1on1-aselsan', name: 'ASELSAN · Kabin 01–03', role: 'Mühendislik Staj & Yeni Mezun', desk: 'G Blok Kabin 01–03', capacity: 12, defaultCount: 11 },
        { id: '1on1-tusas-fnss', name: 'TUSAŞ & FNSS · Kabin 04–06', role: 'Aday Mühendislik Görüşmeleri', desk: 'G Blok Kabin 04–06', capacity: 12, defaultCount: 10 },
        { id: '1on1-deniz-ey', name: 'DenizBank & EY · Kabin 07–09', role: 'MT & Denetim Ön Mülakat', desk: 'G Blok Kabin 07–09', capacity: 12, defaultCount: 9 },
        { id: '1on1-cv-clinic', name: 'TEDÜ Kariyer · CV Kliniği', role: 'Hızlı Portfolyo & CV Kontrol', desk: 'G Blok Masa 10–12', capacity: 12, defaultCount: 9 }
      ]
    },
    {
      id: 'teacher-plus',
      name: 'Teacher+ Zone',
      shortName: 'Teacher+ Zone',
      subtitle: 'Akademisyen–Sektör & Yuvarlak Masa',
      campusSide: 'İncesu Yerleşkesi',
      building: 'A / B Blok · Yönetici & Akademi Salonları',
      color: '#6E56CF',
      capacity: 50,
      defaultCount: 24,
      camera: 'incesu',
      walkingHint: 'İncesu A Blok & B Blok birleşim katı.',
      description: 'Öğretim üyeleri, C-level yöneticiler ve seçilmiş öğrenci gruplarının vaka analizleri ve Co-op müfredat buluşmaları gerçekleştirdiği özel bölge.',
      companies: [
        { id: 'roundtable-a', name: 'Yuvarlak Masa A · Akfen & GAMA', role: 'Liderlik & Proje Vaka Oturumu', desk: 'A Blok Oda A-201 · Masa QR', capacity: 16, defaultCount: 10 },
        { id: 'roundtable-b', name: 'Yuvarlak Masa B · Coca-Cola İçecek', role: 'Tedarik Zinciri & Yönetim Vakası', desk: 'B Blok Oda B-204 · Masa QR', capacity: 16, defaultCount: 8 },
        { id: 'teacher-lounge', name: 'Teacher+ Akademi–İK Buluşması', role: 'Öğretim Üyesi & Sektör Lounge', desk: 'A Blok Akademik Salon', capacity: 18, defaultCount: 6 }
      ]
    },
    {
      id: 'food-beverage',
      name: 'Food&Beverage Zone',
      shortName: 'Food&Beverage',
      subtitle: 'İkram, Kahve & Açık Hava Networking',
      campusSide: 'Aksu & İncesu Avlu',
      building: 'C / F Blok Arası & İncesu Bahçe',
      color: '#D97706',
      capacity: 185,
      defaultCount: 112,
      camera: 'campus',
      walkingHint: 'Hem Aksu hem İncesu açık avlularında merkez nokta.',
      description: 'Zirve boyunca ücretsiz kahve ikramı, öğle yemek noktaları ve öğrenciler ile şirket temsilcilerinin rahat ortamda sosyalleştiği avlu bölgesi.',
      companies: [
        { id: 'food-aksu', name: 'Aksu Avlu İkram & Kahve Merkezi', role: 'Ana Yemek & Sıcak İçecek Hattı', desk: 'C / F Blok Arası Avlu', capacity: 110, defaultCount: 68 },
        { id: 'food-incesu', name: 'İncesu Bahçe Espresso & Tatlı Bar', role: 'Hızlı Kahve & Açık Oturma', desk: 'K Blok Çıkış Avlusu', capacity: 75, defaultCount: 44 }
      ]
    }
  ];

  const ROUTING_PRESETS = [
    {
      id: 'aselsan-tech',
      badge: 'CANLI YÖNLENDİRME · 10 DK İÇİNDE',
      speaker: 'ASELSAN · Genel Müdür Yardımcısı Ahmet Kaya',
      title: 'Savunma ve Yüksek Teknolojide Yetenek Ekosistemi başlıyor',
      targetZoneId: 'tech',
      actionText: 'Tech&Innovation Zone (D Blok · Aksu)’na Geçiniz →',
      ticker: 'RadioTEDU Zirve Akışı · ASELSAN Konuşması 10 dk içinde Tech&Innovation Zone (D Blok)’da başlıyor · Aksu yerleşkesi D Blok batı girişini kullanabilirsiniz.'
    },
    {
      id: 'tusas-1on1',
      badge: 'RANDEVU ÇAĞRISI · ŞİMDİ',
      speaker: 'TUSAŞ & FNSS · Yetenek Kazanımı Ekibi',
      title: 'Aday Mühendislik 1:1 Hızlı Mülakat slotları açıldı',
      targetZoneId: 'one-to-one',
      actionText: 'One-to-One Meetings Zone (G Blok)’a Yönleniniz →',
      ticker: 'RadioTEDU Canlı · G Blok Kabin 04–06 boşaldı · One-to-One Meetings Zone’da QR okutarak sıranızı onaylayabilirsiniz.'
    },
    {
      id: 'akfen-red-roundtable',
      badge: 'OTURUM BAŞLANGICI · 14:30',
      speaker: 'Akfen Holding & GAMA Enerji',
      title: 'Altyapı ve Enerjide Genç Liderler Yuvarlak Masa Oturumu',
      targetZoneId: 'teacher-plus',
      actionText: 'Teacher+ Zone (A Blok · İncesu)’na Geçiniz →',
      ticker: 'RadioTEDU Kampüs Yayını · Yuvarlak Masa A (Teacher+ Zone) katılımcıları A Blok A-201 masalarındaki QR kodunu okutmalıdır.'
    }
  ];

  // Build flat lookup map of all scannable Location QR points (Zone gates + individual company desks/rooms)
  const LOCATIONS = {};
  ZONES.forEach((zone) => {
    LOCATIONS[zone.id + '-zone'] = {
      locId: zone.id + '-zone',
      zoneId: zone.id,
      companyId: null,
      kind: 'zone',
      title: zone.name + ' Ana Giriş',
      subTitle: zone.building + ' · ' + zone.subtitle,
      capacity: zone.capacity
    };
    zone.companies.forEach((comp) => {
      LOCATIONS[comp.id] = {
        locId: comp.id,
        zoneId: zone.id,
        companyId: comp.id,
        kind: zone.id === 'one-to-one' ? 'cabin' : (zone.id === 'teacher-plus' ? 'table' : 'desk'),
        title: comp.name,
        subTitle: comp.desk + ' · ' + zone.name,
        capacity: comp.capacity
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
    const companyCounts = {};
    ZONES.forEach((z) => {
      zoneCounts[z.id] = z.defaultCount;
      z.companies.forEach((c) => {
        companyCounts[c.id] = c.defaultCount;
      });
    });
    return {
      zoneCounts,
      companyCounts,
      activeRoutingId: 'aselsan-tech',
      customAlert: null,
      totalScans: 684,
      updatedAt: Date.now()
    };
  }

  function loadState() {
    const raw = safeParse(localStorage.getItem(STORAGE_KEY), null);
    if (!raw || !raw.zoneCounts || !raw.companyCounts) {
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
    // Enforce automatic safety TTL expiration
    if (p.currentLocId && p.checkedInAt && Date.now() - p.checkedInAt > SESSION_TTL_MS) {
      p.currentLocId = null;
      p.checkedInAt = null;
      localStorage.setItem(PASSPORT_KEY, JSON.stringify(p));
    }
    return p;
  }

  const channel = typeof BroadcastChannel !== 'undefined'
    ? new BroadcastChannel('submitted_telemetry_v2')
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
    if (pct >= 85) return { code: 'critical', label: 'YOĞUN', color: '#D92D20' };
    if (pct >= 62) return { code: 'busy', label: 'ORTA', color: '#D97706' };
    return { code: 'open', label: 'MÜSAİT', color: '#00A847' };
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
        message: `Red Zone (Fuaye Alanı) %${red.pct} dolulukla yoğun · Aksu tarafındaki Blue Zone (Spor Merkezi) %${blue.pct} ile müsait (~2 dk yürüme).`
      };
    }
    if (diff <= -18) {
      return {
        isBalanced: false,
        heavyZone: blue,
        lighterZone: red,
        message: `Blue Zone (Spor Merkezi) %${blue.pct} dolulukla yoğun · İncesu tarafındaki Red Zone (Fuaye Alanı) %${red.pct} ile daha sakin (~2 dk yürüme).`
      };
    }
    return {
      isBalanced: true,
      heavyZone: null,
      lighterZone: blue.pct <= red.pct ? blue : red,
      message: `İncesu (Red Zone %${red.pct}) ve Aksu (Blue Zone %${blue.pct}) arasındaki yoğunluk dengeli seyrediyor.`
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

      const companies = z.companies.map((c) => {
        const cCount = Math.max(0, Number(state.companyCounts[c.id] ?? c.defaultCount));
        const cPct = Math.min(100, Math.round((cCount / c.capacity) * 100));
        return Object.assign({}, c, {
          count: cCount,
          pct: cPct,
          status: getStatusMeta(cPct)
        });
      });

      return Object.assign({}, z, {
        count,
        pct,
        status: getStatusMeta(pct),
        companies
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
    if (loc.companyId && state.companyCounts[loc.companyId] > 0) {
      state.companyCounts[loc.companyId] -= 1;
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

    // Cross-scan auto-checkout from previous active room/desk/zone
    if (previousLocId && previousLocId !== locId) {
      decrementLocation(state, previousLocId);
    }

    if (previousLocId !== locId) {
      if (loc.companyId) {
        const compDef = ZONES.flatMap((z) => z.companies).find((c) => c.id === loc.companyId);
        const cap = compDef ? compDef.capacity : 50;
        state.companyCounts[loc.companyId] = Math.min(cap + 5, (state.companyCounts[loc.companyId] || 0) + 1);
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
        badge: 'CANLI ANONS · ŞİMDİ'
      }, presetIdOrCustom);
    }
    saveState(state, true);
  }

  function nudgeTelemetryTick() {
    // Gentle organic movement simulation across stands when live pulse is enabled
    const state = loadState();
    const zoneIndex = Math.floor(Math.random() * ZONES.length);
    const z = ZONES[zoneIndex];
    const delta = Math.random() > 0.45 ? 1 : -1;
    const nextZ = Math.max(Math.round(z.capacity * 0.2), Math.min(Math.round(z.capacity * 0.96), (state.zoneCounts[z.id] || z.defaultCount) + delta));
    state.zoneCounts[z.id] = nextZ;

    const comp = z.companies[Math.floor(Math.random() * z.companies.length)];
    if (comp) {
      state.companyCounts[comp.id] = Math.max(3, Math.min(comp.capacity, (state.companyCounts[comp.id] || comp.defaultCount) + delta));
    }
    saveState(state, true);
  }

  function resetDemoState() {
    const fresh = buildInitialState();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(fresh));
    localStorage.removeItem(PASSPORT_KEY);
    if (channel) channel.postMessage({ type: 'telemetry-update', state: fresh });
    notifyAll(fresh);
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
    resetDemoState,
    getStatusMeta
  };
})(window);
