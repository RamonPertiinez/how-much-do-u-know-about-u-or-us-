(() => {
  // ---------- Elements ----------
  const qs = (s, r = document) => r.querySelector(s);

  const $play    = qs('#gaPlay');
  const $timer   = qs('#gaTimer');
  const $msg     = qs('#gaMsg');
  const $reset   = qs('#gaReset');
  const $choices = qs('#gaChoices');
  const $pfill   = qs('#gaProgressFill');

  // ---------- Logs & UI ----------
  const log = (...a) => console.log('[GA]', ...a);
  const setMsg = (text, type = '') => {
    $msg.textContent = text || '';
    $msg.className = `ga-msg ${type}`;
  };
  const setTimer = (s) => ($timer.textContent = `00:${String(s).padStart(2,'0')}`);

  // ---------- Base path robust ----------
  const computeBasePath = () => {
    const hasBase = !!document.querySelector('base[href]');
    if (hasBase) return new URL('.', document.baseURI).pathname;
    const parts = location.pathname.split('/').filter(Boolean);
    return parts.length ? `/${parts[0]}/` : '/';
  };
  const basePath = computeBasePath();
  log('basePath:', basePath);

  // ⚠️ Suposo que els arxius existeixen així:
// assets/audio/game1/track1.mp3 ... track5.mp3
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
  let current = 0;        // índex de la pista actual
  let audioEl = null;     // objecte <audio> en memòria
  let countdownId = null; // interval del compte enrere

  // ---------- Helpers URL ----------
  const buildUrl = (rel) => {
    if (document.querySelector('base[href]')) {
      return new URL(rel.replace(/^\/+/, ''), document.baseURI).href;
    }
    return `${basePath}${rel.replace(/^\/+/, '')}`;
  };

  const headCheck = async (url) => {
    try {
      const r = await fetch(url, { method: 'HEAD', cache: 'no-store' });
      log('HEAD', r.status, url);
      return r.ok;
    } catch (e) {
      log('HEAD error', e);
      return false;
    }
  };

  const stopPlayback = () => {
    if (audioEl) {
      try { audioEl.pause(); } catch {}
      audioEl = null;
    }
    if (countdownId) {
      clearInterval(countdownId);
      countdownId = null;
    }
    setTimer(10);
  };

  const updateProgress = () => {
    // percentatge segons en quina pista estem (0..len)
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

  const goToNextTrack = () => {
    current += 1;
    updateProgress();
    stopPlayback();          // assegura que no quedi res sonant
    setMsg('');              // neteja missatge
    setTimer(10);            // reseteja el comptador
    if (current >= TRACKS.length) {
      setMsg('🎉 Has completat el joc d’àudio!', 'ok');
      // opcionalment, deshabilita botó de play/choices
      $play?.setAttribute('disabled', 'disabled');
      [...$choices.querySelectorAll('button')].forEach(b => b.setAttribute('disabled','disabled'));
    } else {
      renderChoices();       // pinta les noves opcions de la nova pista
    }
  };

  const onChoose = (idx) => {
    const t = TRACKS[current];
    if (!t) return;

    stopPlayback();

    if (idx === t.correctIndex) {
      setMsg('✅ Correcte! Següent pista…', 'ok');
      // Espera uns ms perquè l’usuària vegi el missatge i canvia de pista
      setTimeout(goToNextTrack, 300);
    } else {
      setMsg('❌ Incorrecte! Reinicio el joc.', 'err');
      resetGame();
    }
  };

  const play10s = async () => {
    stopPlayback();

    const t = TRACKS[current];
    if (!t) {
      setMsg('No queda cap pista per reproduir.', 'err');
      return;
    }

    const url = buildUrl(t.file);
    log(`Pista ${current+1}/${TRACKS.length}:`, t.artist, url);

    setMsg('Comprovant fitxer…');
    const ok = await headCheck(url);
    if (!ok) {
      setMsg('No s’ha trobat l’MP3 (404). Revisa la ruta o el nom del repo.', 'err');
      return;
    }

    setMsg(`Reproduint 10s — ${t.artist}…`);

    audioEl = new Audio(url);
    audioEl.preload = 'auto';

    audioEl.addEventListener('canplay', () => log('canplay'));
    audioEl.addEventListener('play',    () => log('play'));
    audioEl.addEventListener('error',   () => log('error event'));

    try {
      await audioEl.play(); // clic d’usuari garantit pel botó
    } catch (e) {
      setMsg('No s’ha pogut iniciar la reproducció. Torna-ho a provar.', 'err');
      log('play() error', e);
      return;
    }

    // Countdown 10 → 0 i pausa
    let remain = 10;
    setTimer(remain);
    countdownId = setInterval(() => {
      remain -= 1;
      setTimer(remain);
      if (remain <= 0) {
        clearInterval(countdownId);
        countdownId = null;
        try { audioEl.pause(); } catch {}
        setMsg('⏱️ Temps! Tria la resposta.', 'info');
      }
    }, 1000);
  };

  const resetGame = () => {
    stopPlayback();
    current = 0;
    setTimer(10);
    setMsg('');
    $play?.removeAttribute('disabled');
    updateProgress();
    renderChoices();
  };

  // ---------- Esdeveniments ----------
  $play?.addEventListener('click', play10s);
  $reset?.addEventListener('click', resetGame);

  // Inicialitza
  setTimer(10);
  updateProgress();
  renderChoices();
})();
