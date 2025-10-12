(() => {
  // ---------- Elements ----------
  const qs = (s, r = document) => r.querySelector(s);

  const $play    = qs('#gaPlay');
  const $pause   = qs('#gaPause');
  const $now     = qs('#gaNow');
  const $msg     = qs('#gaMsg');
  const $reset   = qs('#gaReset');
  const $choices = qs('#gaChoices');
  const $pfill   = qs('#gaProgressFill');

  // ---------- UI helpers ----------
  const log = (...a) => console.log('[GA]', ...a);
  const setMsg = (text, type = '') => {
    $msg.textContent = text || '';
    $msg.className = `ga-msg ${type}`;
  };
  const fmt = (sec) => {
    const s = Math.max(0, Math.floor(sec));
    const m = Math.floor(s / 60);
    const r = s % 60;
    return `${String(m).padStart(2,'0')}:${String(r).padStart(2,'0')}`;
  };
  const setTime = (sec) => ($now.textContent = fmt(sec));

  // ---------- Base path robust ----------
  const computeBasePath = () => {
    const hasBase = !!document.querySelector('base[href]');
    if (hasBase) return new URL('.', document.baseURI).pathname;
    const parts = location.pathname.split('/').filter(Boolean);
    return parts.length ? `/${parts[0]}/` : '/';
  };
  const basePath = computeBasePath();

  // ---------- Tracks ----------
  // Assegura't que existeixen aquests fitxers a assets/audio/game1/
  const TRACKS = [
    {
      // 1) Ginestà
      file: 'assets/audio/game1/track1.mp3',
      artist: 'Ginestà',
      options: ['Un piset amb tu', 'T’estimo molt', 'Ulls d’avellana'],
      correctIndex: 2
    },
    {
      // 2) Manel
      file: 'assets/audio/game1/track2.mp3',
      artist: 'Manel',
      options: ['Els guapos són els raros', 'En la que el Bernat se’t troba', 'Teresa Rampell'],
      correctIndex: 0
    },
    {
      // 3) Oques Grasses
      file: 'assets/audio/game1/track3.mp3',
      artist: 'Oques Grasses',
      options: ['La gent que estimo', 'Sort de tu', 'De bonesh'],
      correctIndex: 2
    },
    {
      // 4) The Tyets
      file: 'assets/audio/game1/track4.mp3',
      artist: 'The Tyets',
      options: ['Tàndem', 'Camil·la', 'Sushi Poke'],
      correctIndex: 1
    },
    {
      // 5) Txarango
      file: 'assets/audio/game1/track5.mp3',
      artist: 'Txarango',
      options: ['La dansa del vestit', 'Músic de carrer', 'Som persones'],
      correctIndex: 2
    },
  ];

  // ---------- Estat ----------
  let current = 0;        // índex de pista
  let audioEl = null;     // objecte Audio
  let timeId  = null;     // interval per actualitzar el comptador

  // ---------- Helpers ----------
  const buildUrl = (rel) => {
    if (document.querySelector('base[href]')) {
      return new URL(rel.replace(/^\/+/, ''), document.baseURI).href;
    }
    return `${basePath}${rel.replace(/^\/+/, '')}`;
  };

  const attachAudioEvents = (a) => {
    a.addEventListener('timeupdate', () => setTime(a.currentTime));
    a.addEventListener('ended', () => {
      // S'ha acabat la cançó: demanem resposta
      setMsg('🎧 Ha acabat el fragment. Tria la resposta!', 'info');
    });
    a.addEventListener('error', () => setMsg('No s’ha pogut carregar l’àudio.', 'err'));
    a.addEventListener('play', () => setMsg(`▶️ Reproduint — ${TRACKS[current].artist}`, 'info'));
    a.addEventListener('pause', () => setMsg('⏸️ Pausa', 'info'));
  };

  const stopTimers = () => {
    if (timeId) { clearInterval(timeId); timeId = null; }
  };

  const stopPlayback = () => {
    stopTimers();
    if (audioEl) { try { audioEl.pause(); } catch {} }
  };

  const updateProgress = () => {
    const pct = Math.round((current / TRACKS.length) * 100);
    if ($pfill) $pfill.style.width = `${pct}%`;
  };

  const renderChoices = () => {
    const t = TRACKS[current];
    if (!$choices || !t) return;
    $choices.innerHTML = '';
    t.options.forEach((label, i) => {
      const btn = document.createElement('button');
      btn.className = 'ga-choice';
      btn.type = 'button';
      btn.textContent = label;
      btn.addEventListener('click', () => onChoose(i));
      $choices.appendChild(btn);
    });
  };

  const loadTrack = () => {
    // prepara la pista actual
    stopPlayback();
    setTime(0);
    const t = TRACKS[current];
    if (!t) return;

    const url = buildUrl(t.file);
    audioEl = new Audio(url);
    audioEl.preload = 'auto';
    attachAudioEvents(audioEl);
    renderChoices();
    updateProgress();
  };

  const play = async () => {
    if (!audioEl) loadTrack();
    try {
      await audioEl.play();
    } catch (e) {
      setMsg('No s’ha pogut iniciar la reproducció. Torna-ho a provar.', 'err');
      log(e);
    }
  };

  const pause = () => {
    if (audioEl) { try { audioEl.pause(); } catch {} }
  };

  const goToNext = () => {
    current += 1;
    updateProgress();
    if (current >= TRACKS.length) {
      setMsg('🎉 Has completat el joc d’àudio!', 'ok');
      // inhabilita controls
      $play?.setAttribute('disabled','disabled');
      $pause?.setAttribute('disabled','disabled');
      [...$choices.querySelectorAll('button')].forEach(b => b.setAttribute('disabled','disabled'));
      return;
    }
    loadTrack();
    // autoplay de la següent pista
    play();
  };

  const resetGame = () => {
    stopPlayback();
    current = 0;
    setTime(0);
    setMsg('');
    $play?.removeAttribute('disabled');
    $pause?.removeAttribute('disabled');
    loadTrack();
  };

  const onChoose = (idx) => {
    const t = TRACKS[current];
    if (!t) return;
    stopPlayback();
    if (idx === t.correctIndex) {
      setMsg('✅ Correcte! Següent pista…', 'ok');
      setTimeout(goToNext, 400);
    } else {
      setMsg('❌ Incorrecte! Reinicio el joc.', 'err');
      resetGame();
    }
  };

  // ---------- Esdeveniments ----------
  $play?.addEventListener('click', play);
  $pause?.addEventListener('click', pause);
  $reset?.addEventListener('click', resetGame);

  // ---------- Init ----------
  setTime(0);
  loadTrack();
})();
