// SubmitTED Kariyer Zirvesi 2026 — 3D Campus Zone Metadata & UI Controller
// Adapted from radiotedu/tedufest 3D TEDU campus map architecture.

const SUMMIT_AREAS = {
  keynote: {
    label: '1. Sahne · K Blok',
    title: 'Çok Amaçlı Konferans Salonu',
    text: 'İncesu kampüsünün doğu kanadındaki K Blok ve Çok Amaçlı Konferans Salonu; açılış konuşmaları, C-level liderlik panelleri ve ana sahne oturumlarına ev sahipliği yapar.',
    items: [
      'Kapasite: 250 Kişi (Anlık: 184 İçeride)',
      '09:30 – 17:00 Kesintisiz Ana Sahne Akışı',
      'ASELSAN, Akfen Holding, Coca-Cola İçecek Panelleri'
    ],
    color: '#5fa832',
    ctaTarget: '#registration-hub',
    ctaText: 'Bu Sahneyi Seç'
  },
  booths: {
    label: 'Kurumsal Stantlar · İncesu',
    title: 'İncesu Orta Bahçe Kariyer Alanı',
    text: 'A ve B Bloklar arasındaki İncesu Orta Bahçe yürüyüş bandında katılımcı kurumların tanıtım stantları, staj bilgilendirme noktaları ve networking masaları yer alır.',
    items: [
      '32+ İşveren Kurum Stant Hattı',
      'Gün Boyu Staj & MT Programı Tanıtımı',
      'Sektör Temsilcileriyle Doğrudan Temas'
    ],
    color: '#235789',
    ctaTarget: '#corporate-portfolio',
    ctaText: 'Kurumsal Portfolyoyu Gör'
  },
  checkin: {
    label: 'QR Akreditasyon · İncesu',
    title: 'Ana Giriş & Canlı Kapasite Sayacı',
    text: 'Ziya Gökalp Caddesi ve kampüs ana giriş noktasında QR yaka kartı teslimi ve Faz 2 mobil uygulamaya veri sağlayan anlık katılımcı giriş takibi yapılır.',
    items: [
      'Anlık Kampüs Girişi: 412 Kişi İçeride',
      'Hızlı QR Yaka Kartı Aktivasyonu',
      'Öğrenci, Mezun ve Kurumsal Karşılama Masası'
    ],
    color: '#262a29',
    ctaTarget: '#mobile-showcase',
    ctaText: 'Canlı Uygulamayı İncele'
  },
  tech: {
    label: '2. Sahne · D Blok Amfi',
    title: 'Teknoloji, YZ ve Ürün Sahnesi',
    text: 'Aksu avlusunun batı cephesindeki D Blok amfi salonunda yapay zeka, veri bilimi, savunma sistemleri ve ürün yönetimi teknik oturumları düzenlenir.',
    items: [
      'Kapasite: 140 Kişi (Anlık: 96 İçeride)',
      '10:30 – 16:30 Mühendislik & Ürün Panelleri',
      'EY Türkiye, TUSAŞ & FNSS Teknik Liderleri'
    ],
    color: '#488524',
    ctaTarget: '#registration-hub',
    ctaText: 'Bu Sahneyi Seç'
  },
  roundtable: {
    label: '3–4. Sahne · Aksu',
    title: 'Yönetici Yuvarlak Masa Odaları',
    text: 'Aksu kampüsü iç avlu toplantı salonlarında, 12 kişilik seçilmiş öğrenci gruplarıyla direktörler eşliğinde gerçek iş vakası çalışmaları gerçekleştirilir.',
    items: [
      'Kontenjan: 42 / 48 Katılımcı (Sınırlı)',
      '75 Dakikalık İnteraktif Vaka Çözümü',
      'CV Değerlendirmesiyle Ön Kabul'
    ],
    color: '#b86e00',
    ctaTarget: '#registration-hub',
    ctaText: 'Ön Başvuru Yap'
  },
  interviews: {
    label: '5–6. Alan · G Blok',
    title: '1:1 Mülakat Kabinleri & CV Kliniği',
    text: 'Aksu avlusunun kuzeyindeki G Blok Fuaye alanında 12 adet 1:1 hızlı mülakat kabini, CV inceleme masaları ve kurumsal İK görüşme slotları bulunur.',
    items: [
      'Kapasite: 132 / 200 Kişi · 12 Görüşme Kabini',
      'Randevulu 15 Dk Birebir İK Mülakatları',
      'Ücretsiz CV & LinkedIn Profil Geri Bildirimi'
    ],
    color: '#1d4f7c',
    ctaTarget: '#corporate-portfolio',
    ctaText: 'Şirketler İçin Detaylar'
  }
};

export function selectSummitArea(key, focus = false) {
  const area = SUMMIT_AREAS[key];
  if (!area) return;

  const labelEl = document.getElementById('world-detail-label');
  const titleEl = document.getElementById('world-detail-title');
  const textEl = document.getElementById('world-detail-text');
  const listEl = document.getElementById('world-detail-list');
  const ctaEl = document.getElementById('world-detail-cta');

  if (labelEl) labelEl.textContent = area.label;
  if (titleEl) titleEl.textContent = area.title;
  if (textEl) textEl.textContent = area.text;
  if (listEl) listEl.innerHTML = area.items.map((t) => `<li>${t}</li>`).join('');
  if (ctaEl) {
    ctaEl.setAttribute('href', area.ctaTarget);
    ctaEl.textContent = area.ctaText + ' →';
  }

  document.querySelectorAll('[data-map-zone]').forEach((b) => {
    b.setAttribute('aria-pressed', String(b.dataset.mapZone === key));
  });

  document.dispatchEvent(new CustomEvent('summit-zone-selected', { detail: { key, focus } }));
}

const zonesBar = document.getElementById('world-zones-bar');
if (zonesBar) {
  zonesBar.innerHTML = Object.entries(SUMMIT_AREAS)
    .map(([id, a]) => `<button type="button" data-map-zone="${id}" aria-pressed="${id === 'keynote'}"><i style="background:${a.color}"></i>${a.label}</button>`)
    .join('');

  zonesBar.querySelectorAll('[data-map-zone]').forEach((btn) => {
    btn.addEventListener('click', () => selectSummitArea(btn.dataset.mapZone, true));
  });
}

document.addEventListener('summit-scene-pick', (e) => {
  selectSummitArea(e.detail.key, e.detail.focus !== false);
});

// Wire split zone banners below the 3D map to focus İncesu / Aksu areas smoothly
document.querySelectorAll('[data-zone]').forEach((bannerBtn) => {
  bannerBtn.addEventListener('click', () => {
    const z = bannerBtn.dataset.zone;
    if (z === 'blue') {
      selectSummitArea('interviews', true);
    } else if (z === 'green') {
      selectSummitArea('keynote', true);
    }
  });
});

selectSummitArea('keynote', false);
