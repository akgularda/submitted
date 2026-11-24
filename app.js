// UI-only interactive previews for SubmitTED Kariyer Zirvesi 2026
// Zero pricing/fees. Supports dual-audience (Student & Corporate) UI states,
// mobile menu drawer, campus zone filter, mobile app screen tabs, and FAQ accordion.

(function () {
  document.documentElement.classList.add('js-reveal');

  const TRACK_LABELS = {
    'day1-main': '20 Ekim · Açılış & Liderlik Zirvesi',
    'day1-roundtable': '20 Ekim · Yuvarlak Masa & Vaka Analizi',
    'day2-summit': '21 Ekim · SubmitTED Ana Zirve',
    'day2-interviews': '21 Ekim · 1:1 Mülakat & Değerlendirme'
  };

  const PROFILE_CONFIG = {
    student: {
      label: 'TEDÜ Öğrencisi / Mezun',
      access: 'Ücretsiz · QR Yaka Kartı',
      status: 'Ön Kayıta Hazır',
      cta: 'ÖN KAYDI TAMAMLA'
    },
    guest: {
      label: 'Misafir Öğrenci / Profesyonel',
      access: 'Ücretsiz · Misafir Ön Kayıt',
      status: 'Kontenjan Onaylı',
      cta: 'ÖN KAYDI TAMAMLA'
    },
    corporate: {
      label: 'Kurumsal / İşveren',
      access: 'Ücretsiz · Kurumsal İş Birliği',
      status: 'Davet Başvurusuna Hazır',
      cta: 'KURUMSAL DAVET TALEBİ OLUŞTUR'
    }
  };

  const STAGE_ACCESS_BY_PROFILE = {
    student: {
      'ana-sahne': { status: 'Ücretsiz · Ön Kayıtlı', note: 'QR Yaka Kartı ile Giriş' },
      'teknoloji': { status: 'Ücretsiz · Açık Oturum', note: 'Mühendislik & Veri Odağı' },
      'yuvarlak-masa': { status: 'Ön Başvurulu', note: 'CV Değerlendirmesiyle Kabul' },
      'mulakat': { status: 'Randevulu Katılım', note: '15 Dk Birebir İK Görüşmesi' }
    },
    guest: {
      'ana-sahne': { status: 'Ücretsiz · Misafir Kayıt', note: 'QR Yaka Kartı ile Giriş' },
      'teknoloji': { status: 'Ücretsiz · Açık Oturum', note: 'Kontenjan Dahilinde Giriş' },
      'yuvarlak-masa': { status: 'Sınırlı Misafir Kontenjanı', note: 'Özgeçmiş Onaylı Katılım' },
      'mulakat': { status: 'Kariyer Fuarı Erişimi', note: 'Kurumsal Stant Ziyaretleri' }
    },
    corporate: {
      'ana-sahne': { status: 'Kurumsal Akreditasyon', note: 'İK & Yönetici Protokol Girişi' },
      'teknoloji': { status: 'Konuşmacı / Sponsor Alanı', note: 'Teknik Liderlik Oturumu' },
      'yuvarlak-masa': { status: 'Masa Moderasyonu', note: '12 Seçilmiş Aday ile Vaka' },
      'mulakat': { status: 'Özel Mülakat Kabini', note: 'G Blok 1:1 Aday Görüşmeleri' }
    }
  };

  const STAGE_AGENDAS = {
    'ana-sahne': {
      kicker: '1. SAHNE · ANA SAHNE PROGRAMI',
      title: 'Ana Sahne — Liderlik ve İş Dünyasında Dönüşüm',
      items: [
        { time: '09:30 – 10:00', title: 'Açılış Konuşması: Yeni Nesil Kariyer Mimarisi', meta: 'TED Üniversitesi Rektörlüğü & Kariyer Merkezi' },
        { time: '10:00 – 11:00', title: 'Savunma ve Yüksek Teknolojide Yetenek Ekosistemi', meta: 'Ahmet Kaya · Genel Müdür Yardımcısı, ASELSAN' },
        { time: '11:30 – 12:30', title: 'Yönetim Kurulundan Genç Liderlere: Stratejik Karar Alma', meta: 'Zeynep Demirtaş · Yönetim Kurulu Üyesi, Akfen Holding' },
        { time: '14:00 – 15:15', title: 'Panel: Global Şirketlerde İlk 5 Yıl Kariyer İvmesi', meta: 'Coca-Cola İçecek · DenizBank · EY Türkiye İK Liderleri' }
      ]
    },
    'teknoloji': {
      kicker: '2. SAHNE · TEKNOLOJİ & ÜRÜN PROGRAMI',
      title: 'Teknoloji, Yapay Zeka ve Ürün Yönetimi Sahnesi',
      items: [
        { time: '10:30 – 11:30', title: 'Üretken Yapay Zeka Çağında Mühendislik ve Veri Rolleri', meta: 'Mert Özkan · Veri & YZ Direktörü, EY Türkiye' },
        { time: '13:00 – 14:00', title: 'Havacılık ve Savunma Sistemlerinde Sistem Mühendisliği', meta: 'TUSAŞ & FNSS Teknik Liderlik Oturumu' },
        { time: '14:30 – 16:00', title: 'Ürün Yönetimi Vaka Atölyesi: 0’dan Ölçeklemeye', meta: 'Sektör Ürün Direktörleri · Etkileşimli Q&A' }
      ]
    },
    'yuvarlak-masa': {
      kicker: '3–4. SAHNE · YUVARLAK MASA OTURUMLARI',
      title: 'Yuvarlak Masa — C-Level & İK Yöneticileriyle Vaka Çalışması',
      items: [
        { time: '13:00 – 14:15', title: 'Masa A: Finans & Yatırım Bankacılığında Kariyer Yolculuğu', meta: 'DenizBank & GAMA Enerji Yönetici Masası · 12 Kişi' },
        { time: '14:30 – 15:45', title: 'Masa B: FMCG ve Tedarik Zincirinde Liderlik Vaka Analizi', meta: 'Elif Arslan · Coca-Cola İçecek · 12 Kişi' },
        { time: '16:00 – 17:00', title: 'Masa C: Yönetim Danışmanlığı Mülakat Simülasyonu', meta: 'EY Türkiye Danışmanlık Ekibi · 12 Kişi' }
      ]
    },
    'mulakat': {
      kicker: '5–6. ALAN · KARİYER FUARI & 1:1 MÜLAKAT',
      title: '1:1 Hızlı Mülakat, CV Kliniği ve Kurumsal Kariyer Fuarı',
      items: [
        { time: '10:00 – 12:30', title: 'Sabah Seansı: Staj ve MT Programı Ön Mülakatları', meta: 'G Blok 1–12 No’lu Görüşme Kabinleri (15 dk slotlar)' },
        { time: '13:30 – 16:30', title: 'CV & LinkedIn Profil İnceleme Kliniği', meta: '32+ Kurumun İK Uzmanları ile Birebir Geri Bildirim' },
        { time: '16:30 – 17:30', title: 'Serbest Networking & Kurumsal Stant Ziyaretleri', meta: 'G Blok Fuaye Alanı' }
      ]
    }
  };

  const PHONE_SCREENS = {
    occupancy: '' +
      '<div class="phone-stat-banner"><small>ANLIK KAMPÜS YOĞUNLUĞU</small><strong>412 / 600 Kişi</strong></div>' +
      '<div class="phone-list">' +
        '<div class="phone-list-card"><div class="phone-list-row"><span>1. Ana Sahne</span><span>184 / 250</span></div><div class="phone-mini-bar"><div class="phone-mini-fill" style="width:74%"></div></div></div>' +
        '<div class="phone-list-card"><div class="phone-list-row"><span>2. Teknoloji Amfi</span><span>96 / 140</span></div><div class="phone-mini-bar"><div class="phone-mini-fill" style="width:69%"></div></div></div>' +
        '<div class="phone-list-card"><div class="phone-list-row"><span>3–4. Yuvarlak Masa</span><span>42 / 48</span></div><div class="phone-mini-bar"><div class="phone-mini-fill" style="width:88%;background:#d9822b"></div></div></div>' +
        '<div class="phone-list-card"><div class="phone-list-row"><span>5–6. Kariyer Fuarı</span><span>132 / 200</span></div><div class="phone-mini-bar"><div class="phone-mini-fill" style="width:66%"></div></div></div>' +
      '</div>',
    schedule: '' +
      '<div class="phone-stat-banner"><small>SIRADAKİ OTURUMLAR</small><strong>6 Sahne Akışı</strong></div>' +
      '<div class="phone-list">' +
        '<div class="phone-list-card"><div class="phone-list-row"><span>10:00 · Ana Sahne</span><span>ASELSAN</span></div><div class="phone-list-sub">Savunma ve Yüksek Teknolojide Yetenek</div></div>' +
        '<div class="phone-list-card"><div class="phone-list-row"><span>11:30 · Ana Sahne</span><span>Akfen Holding</span></div><div class="phone-list-sub">Yönetim Kurulundan Genç Liderlere</div></div>' +
        '<div class="phone-list-card"><div class="phone-list-row"><span>13:30 · D Blok</span><span>EY Türkiye</span></div><div class="phone-list-sub">Üretken YZ Çağında Mühendislik</div></div>' +
      '</div>',
    pass: '' +
      '<div class="phone-stat-banner"><small>AKREDİTASYON KARTI</small><strong>QR · Ücretsiz</strong></div>' +
      '<div class="phone-list">' +
        '<div class="phone-list-card"><div class="phone-list-row"><span>14:30 · Kabin 04</span><span>TUSAŞ İK</span></div><div class="phone-list-sub">1:1 Staj Ön Mülakatı · G Blok Fuaye</div></div>' +
        '<div class="phone-list-card"><div class="phone-list-row"><span>15:30 · Kütüphane</span><span>Coca-Cola İçecek</span></div><div class="phone-list-sub">Yuvarlak Masa Vaka Oturumu</div></div>' +
        '<div class="phone-list-card"><div class="phone-list-row"><span>Kapı Geçişi</span><span>Onaylı</span></div><div class="phone-list-sub">Tüm 6 Sahne ve Fuar Alanı Erişimi</div></div>' +
      '</div>'
  };

  let activeProfile = 'student';
  let activeTrack = 'day2-summit';

  const eventTabs = document.querySelectorAll('.event-tab');
  const mobileTrackSelect = document.getElementById('mobile-track-select');
  const profileCards = document.querySelectorAll('.select-block');
  const stageCards = document.querySelectorAll('.highlightable-field');
  const langButtons = document.querySelectorAll('.lang-btn');

  const summaryProfileEl = document.getElementById('summary-profile');
  const summaryTrackEl = document.getElementById('summary-track');
  const summaryCountEl = document.getElementById('summary-count');
  const summaryAccessEl = document.getElementById('summary-access');
  const summaryStatusEl = document.getElementById('summary-status');
  const nextPageLabelEl = document.getElementById('next-page-label');
  const activeTrackLabelEl = document.getElementById('active-track-label');

  const modalEl = document.getElementById('ui-modal');
  const modalKickerEl = document.getElementById('modal-kicker');
  const modalTitleEl = document.getElementById('modal-title');
  const modalBodyEl = document.getElementById('modal-body');

  function updateSummaryUI() {
    let selectedCount = 0;
    const accessMap = STAGE_ACCESS_BY_PROFILE[activeProfile] || STAGE_ACCESS_BY_PROFILE.student;

    stageCards.forEach((card) => {
      const stageId = card.dataset.stageId;
      const accessInfo = accessMap[stageId];
      const statusEl = card.querySelector('[data-access-label]');
      const noteEl = card.querySelector('[data-access-note]');

      if (accessInfo && statusEl) statusEl.textContent = accessInfo.status;
      if (accessInfo && noteEl) noteEl.textContent = accessInfo.note;

      if (card.classList.contains('is-selected')) {
        selectedCount += 1;
      }
    });

    const profileCfg = PROFILE_CONFIG[activeProfile];
    summaryProfileEl.textContent = profileCfg.label;
    summaryTrackEl.textContent = TRACK_LABELS[activeTrack] || activeTrack;
    summaryCountEl.textContent = selectedCount === 0 ? 'Seçim Yapılmadı' : selectedCount + ' Sahne';
    summaryAccessEl.textContent = profileCfg.access;
    summaryStatusEl.textContent = selectedCount === 0 ? 'Sahne Seçiniz' : profileCfg.status;
    if (nextPageLabelEl) nextPageLabelEl.textContent = profileCfg.cta;
    activeTrackLabelEl.textContent = 'Gösterilen Akış: ' + (TRACK_LABELS[activeTrack] || '');
  }

  function setTrack(trackKey) {
    activeTrack = trackKey;
    eventTabs.forEach((tab) => {
      const isMatch = tab.dataset.track === trackKey;
      tab.classList.toggle('is-active', isMatch);
      tab.setAttribute('aria-selected', String(isMatch));
    });
    if (mobileTrackSelect) {
      mobileTrackSelect.value = trackKey;
    }
    updateSummaryUI();
  }

  eventTabs.forEach((tab) => tab.addEventListener('click', () => setTrack(tab.dataset.track)));
  if (mobileTrackSelect) mobileTrackSelect.addEventListener('change', (e) => setTrack(e.target.value));

  profileCards.forEach((card) => {
    card.addEventListener('click', () => {
      activeProfile = card.dataset.profile;
      profileCards.forEach((c) => c.classList.toggle('is-active', c === card));
      updateSummaryUI();
    });
  });

  stageCards.forEach((card) => {
    const toggle = () => {
      card.classList.toggle('is-selected');
      updateSummaryUI();
    };
    card.addEventListener('click', toggle);
    card.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        toggle();
      }
    });
  });

  langButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      langButtons.forEach((b) => b.classList.toggle('is-active', b === btn));
    });
  });

  // Mobile Menu Drawer Toggle
  const mobileMenuBtn = document.getElementById('mobile-menu-toggle');
  const mobileDrawer = document.getElementById('mobile-nav-drawer');
  if (mobileMenuBtn && mobileDrawer) {
    mobileMenuBtn.addEventListener('click', () => {
      const willOpen = mobileDrawer.hidden;
      mobileDrawer.hidden = !willOpen;
      mobileMenuBtn.setAttribute('aria-expanded', String(willOpen));
    });
    mobileDrawer.querySelectorAll('a, button').forEach((el) => {
      el.addEventListener('click', () => {
        mobileDrawer.hidden = true;
        mobileMenuBtn.setAttribute('aria-expanded', 'false');
      });
    });
  }

  // Campus Zone Map Interactive Focus
  const blueZoneEl = document.getElementById('map-zone-blue');
  const greenZoneEl = document.getElementById('map-zone-green');
  let focusedZone = null;

  document.querySelectorAll('[data-zone]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const target = btn.dataset.zone;
      focusedZone = focusedZone === target ? null : target;
      if (blueZoneEl && greenZoneEl) {
        blueZoneEl.classList.toggle('is-dimmed', focusedZone === 'green');
        greenZoneEl.classList.toggle('is-dimmed', focusedZone === 'blue');
      }
    });
  });

  // Mobile App Screen Tabs
  const phoneScreenEl = document.getElementById('phone-screen-body');
  const appTabs = document.querySelectorAll('[data-app-tab]');

  function setPhoneScreen(key) {
    if (phoneScreenEl && PHONE_SCREENS[key]) {
      phoneScreenEl.innerHTML = PHONE_SCREENS[key];
    }
    appTabs.forEach((t) => {
      const match = t.dataset.appTab === key;
      t.classList.toggle('is-active', match);
      t.setAttribute('aria-selected', String(match));
    });
  }

  appTabs.forEach((tab) => {
    tab.addEventListener('click', () => setPhoneScreen(tab.dataset.appTab));
  });
  setPhoneScreen('occupancy');

  // FAQ Accordion
  document.querySelectorAll('.faq-trigger').forEach((trigger) => {
    trigger.addEventListener('click', () => {
      const item = trigger.closest('.faq-item');
      const isOpen = item.classList.toggle('is-open');
      trigger.setAttribute('aria-expanded', String(isOpen));
      const icon = trigger.querySelector('.faq-icon');
      if (icon) icon.textContent = isOpen ? '−' : '+';
    });
  });

  // Agenda & Preview Modal
  function openModal(kicker, title, htmlContent) {
    modalKickerEl.textContent = kicker;
    modalTitleEl.textContent = title;
    modalBodyEl.innerHTML = htmlContent;
    modalEl.hidden = false;
  }

  function closeModal() {
    modalEl.hidden = true;
  }

  document.querySelectorAll('[data-modal-stage]').forEach((trigger) => {
    const handler = () => {
      const data = STAGE_AGENDAS[trigger.dataset.modalStage];
      if (!data) return;
      const listHtml = '<ul class="agenda-list">' + data.items.map((item) => (
        '<li class="agenda-item">' +
          '<span class="agenda-time">' + item.time + '</span>' +
          '<div class="agenda-detail"><h4>' + item.title + '</h4><p>' + item.meta + '</p></div>' +
        '</li>'
      )).join('') + '</ul>';
      openModal(data.kicker, data.title, listHtml);
    };
    trigger.addEventListener('click', handler);
    if (trigger.tagName !== 'BUTTON') {
      trigger.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handler();
        }
      });
    }
  });

  function openLoginModal() {
    openModal(
      'KATILIMCI & KURUM GİRİŞİ (UI TASLAĞI)',
      'SubmitTED Hesap & İşveren Portalı',
      '<p style="margin:0;font-size:14px;color:#4f5961;">TEDÜ öğrencisi (@tedu.edu.tr), mezun, misafir katılımcı ve kurumsal İK temsilcisi giriş akışı sonraki geliştirme fazında aktif edilecektir.</p>'
    );
  }

  const loginBtn = document.getElementById('open-login-preview');
  const mobileLoginBtn = document.getElementById('mobile-login-btn');
  if (loginBtn) loginBtn.addEventListener('click', openLoginModal);
  if (mobileLoginBtn) mobileLoginBtn.addEventListener('click', openLoginModal);

  function openCorporateInviteModal() {
    openModal(
      'KURUMSAL DAVET DOSYASI (ÖNİZLEME)',
      'TED Üniversitesi İşveren & Kurumsal Katılım Talebi',
      '<p style="margin:0 0 14px;font-size:14px;color:#4f5961;">Kurumunuz adına stant, 1:1 mülakat kabini, yuvarlak masa moderasyonu veya sahne konuşmacısı katılımı için iletişim bilgilerinizi bırakabileceğiniz form adımı sonraki fazda bağlanacaktır.</p>' +
      '<div style="display:grid;gap:10px;border-top:1px solid #dde1e4;padding-top:14px;">' +
        '<div style="font-size:13px;"><strong>Hedeflenen Alanlar:</strong> G Blok Fuaye Stant · 1:1 Mülakat Kabini · Yuvarlak Masa</div>' +
        '<div style="font-size:13px;"><strong>Doğrudan İletişim:</strong> kariyer@tedu.edu.tr · TEDÜ Kariyer Merkezi</div>' +
      '</div>'
    );
  }

  const corpInviteBtn = document.getElementById('open-corp-invite-btn');
  if (corpInviteBtn) corpInviteBtn.addEventListener('click', openCorporateInviteModal);

  const applyCodeBtn = document.getElementById('apply-code-btn');
  const inviteInput = document.getElementById('invite-code-input');
  const inviteFeedback = document.getElementById('invite-feedback');
  if (applyCodeBtn && inviteInput && inviteFeedback) {
    applyCodeBtn.addEventListener('click', () => {
      const val = inviteInput.value.trim();
      inviteFeedback.textContent = val
        ? '"' + val.toUpperCase() + '" kodu arayüz taslağında kaydedildi (doğrulama sonraki fazda aktif olacaktır).'
        : 'Lütfen geçerli bir davet veya kurum referans kodu giriniz.';
    });
  }

  const nextPageBtn = document.getElementById('next-page-btn');
  if (nextPageBtn) {
    nextPageBtn.addEventListener('click', () => {
      if (activeProfile === 'corporate') {
        openCorporateInviteModal();
        return;
      }
      const api = window.SubmitTEDTelemetry;
      const existing = api ? api.getSnapshot().attendee : null;
      if (existing) {
        openModal(
          'KAYITLI KATILIMCI PROFİLİ AKTİF',
          'Konum QR Check-in ve Zirve Pasaportuna Hazırsınız',
          `<p style="margin:0 0 12px;font-size:14px;color:#4f5961;">Kayıtlı profiliniz bulundu: <strong>${existing.name}</strong> (${existing.department}). Kampüsteki herhangi bir oda, masa veya Zone girişindeki QR kodunu telefonunuzla okutarak hemen giriş yapabilirsiniz.</p>` +
          `<div style="display:flex;gap:10px;flex-wrap:wrap;">` +
            `<a href="checkin.html" class="telemetry-link-btn is-primary" style="text-decoration:none;">QR Check-in &amp; Pasaportu Aç →</a>` +
            `<a href="dashboard.html" class="telemetry-link-btn" style="text-decoration:none;background:#182024;">Canlı Doluluk Dashboard →</a>` +
          `</div>`
        );
        return;
      }

      openModal(
        'ÜCRETSİZ ÖN KAYIT VE PASAPORT',
        PROFILE_CONFIG[activeProfile].label + ' Kaydı',
        `<form id="home-reg-form" style="display:grid;gap:10px;">` +
          `<p style="margin:0 0 4px;font-size:13.5px;color:#4f5961;">Bilgilerinizi bir kez kaydedin; gün içinde okuttuğunuz her Zone, 1:1 mülakat kabini ve yuvarlak masa QR'ı dijital pasaportunuza otomatik işlensin.</p>` +
          `<input type="text" id="home-reg-name" placeholder="Adınız Soyadınız" required style="padding:10px 12px;border:1px solid #d3d9de;border-radius:2px;">` +
          `<input type="email" id="home-reg-email" placeholder="E-posta Adresiniz (@tedu.edu.tr)" required style="padding:10px 12px;border:1px solid #d3d9de;border-radius:2px;">` +
          `<input type="text" id="home-reg-dept" placeholder="Fakülte / Bölüm / Kurum" required style="padding:10px 12px;border:1px solid #d3d9de;border-radius:2px;">` +
          `<button type="submit" style="border:none;background:#5fa832;color:#fff;padding:12px 16px;font-weight:700;cursor:pointer;border-radius:2px;">KAYDI TAMAMLA VE PASAPORT OLUŞTUR →</button>` +
        `</form>`
      );

      const form = document.getElementById('home-reg-form');
      if (form && api) {
        form.addEventListener('submit', (ev) => {
          ev.preventDefault();
          const rec = api.registerAttendee({
            name: document.getElementById('home-reg-name').value,
            email: document.getElementById('home-reg-email').value,
            department: document.getElementById('home-reg-dept').value,
            profile: activeProfile
          });
          modalBodyEl.innerHTML =
            `<p style="margin:0 0 12px;font-size:14px;color:#182024;">Kaydınız tamamlandı: <strong>${rec.name}</strong> (Kod: <code>${rec.id}</code>).</p>` +
            `<p style="margin:0 0 14px;font-size:13.5px;color:#4f5961;">Artık kampüsteki oda, masa ve Zone kapılarındaki QR kodlarını okutarak tek dokunuşla giriş yapabilir, dijital katılım sertifikanızı toplayabilirsiniz.</p>` +
            `<a href="checkin.html" class="telemetry-link-btn is-primary" style="text-decoration:none;display:inline-flex;">Zirve Pasaportu &amp; QR Check-in’i Aç →</a>`;
        });
      }
    });
  }

  document.getElementById('modal-close-btn').addEventListener('click', closeModal);
  document.getElementById('modal-ok-btn').addEventListener('click', closeModal);
  modalEl.addEventListener('click', (e) => {
    if (e.target === modalEl) closeModal();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !modalEl.hidden) closeModal();
  });

  // Gentle Scroll-Reveal Choreography
  const revealEls = document.querySelectorAll('.reveal-up');
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12 });
    revealEls.forEach((el) => observer.observe(el));
  } else {
    revealEls.forEach((el) => el.classList.add('is-visible'));
  }

  // Show back-to-top button only after scrolling past hero
  const backToTopBtn = document.querySelector('.back-to-top-btn');
  if (backToTopBtn) {
    const syncScrollBtn = () => {
      backToTopBtn.classList.toggle('is-visible', window.scrollY > 360);
    };
    window.addEventListener('scroll', syncScrollBtn, { passive: true });
    syncScrollBtn();
  }

  // Scroll-Triggered Video Splash Curtain
  const curtainEl = document.getElementById('intro-curtain');
  if (curtainEl) {
    const alreadySeen = sessionStorage.getItem('submitted_intro_v2_seen') === '1' || Boolean(window.location.hash);
    if (alreadySeen) {
      curtainEl.classList.add('is-dismissed');
      curtainEl.setAttribute('aria-hidden', 'true');
    } else {
      document.body.classList.add('has-intro-lock');
      let touchStartY = null;

      const dismissCurtain = () => {
        if (curtainEl.classList.contains('is-dismissed')) return;
        curtainEl.classList.add('is-dismissed');
        curtainEl.setAttribute('aria-hidden', 'true');
        document.body.classList.remove('has-intro-lock');
        sessionStorage.setItem('submitted_intro_v2_seen', '1');
        window.removeEventListener('wheel', onWheel);
        window.removeEventListener('touchstart', onTouchStart);
        window.removeEventListener('touchmove', onTouchMove);
        window.removeEventListener('keydown', onKey);
      };

      const onWheel = (e) => {
        if (e.deltaY > 10) dismissCurtain();
      };
      const onTouchStart = (e) => {
        if (e.touches && e.touches[0]) touchStartY = e.touches[0].clientY;
      };
      const onTouchMove = (e) => {
        if (touchStartY !== null && e.touches && e.touches[0] && touchStartY - e.touches[0].clientY > 22) {
          dismissCurtain();
        }
      };
      const onKey = (e) => {
        if (['ArrowDown', 'PageDown', ' ', 'Escape'].includes(e.key)) {
          e.preventDefault();
          dismissCurtain();
        }
      };

      window.addEventListener('wheel', onWheel, { passive: true });
      window.addEventListener('touchstart', onTouchStart, { passive: true });
      window.addEventListener('touchmove', onTouchMove, { passive: true });
      window.addEventListener('keydown', onKey);
      document.getElementById('intro-enter-btn')?.addEventListener('click', dismissCurtain);
      document.getElementById('intro-skip-btn')?.addEventListener('click', dismissCurtain);
    }
  }

  // Live 6-Zone Telemetry Strip Sync on Home Page
  const miniZonesEl = document.getElementById('home-mini-zones');
  const homeRouteBadgeEl = document.getElementById('home-routing-badge');
  const homeRouteTitleEl = document.getElementById('home-routing-title');
  if (window.SubmitTEDTelemetry && miniZonesEl) {
    window.SubmitTEDTelemetry.subscribe((snap) => {
      if (snap.routing) {
        const tz = snap.zonesById[snap.routing.targetZoneId];
        if (homeRouteBadgeEl) homeRouteBadgeEl.textContent = snap.routing.badge;
        if (homeRouteTitleEl) homeRouteTitleEl.textContent = `${snap.routing.title} → ${tz ? tz.name : ''} (${tz ? tz.building : ''})`;
      }
      miniZonesEl.innerHTML = snap.zones.map((z) => (
        `<button type="button" class="mini-zone-cell" style="--zc:${z.color}" data-home-zone="${z.id}">` +
          `<small>${z.campusSide}</small>` +
          `<div class="mini-zone-row"><span>${z.shortName}</span><span>%${z.pct}</span></div>` +
          `<div class="mini-zone-bar"><div style="width:${z.pct}%"></div></div>` +
        `</button>`
      )).join('');

      miniZonesEl.querySelectorAll('[data-home-zone]').forEach((btn) => {
        btn.addEventListener('click', () => {
          document.dispatchEvent(new CustomEvent('summit-scene-pick', { detail: { key: btn.dataset.homeZone, focus: true } }));
        });
      });
    });
  }

  updateSummaryUI();
})();
