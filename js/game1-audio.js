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
  // - Si hi ha <base>, fem servir document.baseURI
  // - Altrament, detectem el primer segment del path (GitHub Pages de projectes)
  const computeBasePath = () => {
    const hasBase = !!document.querySelector('base[href]');
    if (hasBase) return new URL('.', document.baseURI).pathname;
    const parts = location.pathname.split('/').filter(Boolean);
    return parts.length ? `/${parts[0]}/` : '/';
  };
  const basePath = computeBasePath();
  log('basePath:', basePath);

  // ---------- Tracks del joc ----------
  // Mantén rutes RELATIVES (sense barra inicial).
  const TRACKS = [
    {
      file: 'assets/audio/game1/track1.mp3',
      artist: 'Ginestà',
      options: ['Un piset amb tu', 'T’estimo molt', 'Ulls d’avellana'],
      correctIndex: 2
    },
    // Si vols afegir més cançons, afegeix-les aquí amb el mateix format.
  ];

  // ---------- Estat ----------
  let current = 0;
  let audioEl = null;
  let countdownId = null;

  // ---------- Helpers URL ----------
  const buildUrl = (rel) => {
    // Si hi ha <base>, new URL() ja ho resol bé
    if (document.querySelector('base[href]')) {
      return new URL(rel.replace(/^\/+/, ''), document.baseURI).href;
    }
    // Fallback: concatenar basePath + rel net
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

  const resetGame = () => {
    stopPlayback();
    current = 0;
    setTimer(10);
    setMsg('');
    updateProgress();
    renderChoices();
  };

  const updateProgress = () => {
    // Exemple simple: percentatge segons quantes cançons hauries passat (pots ajustar-ho si afegeixes més)
    const pct = Math.floor((current / TRACKS.length) * 100);
    if ($pfill) $pfill.style.width = `${pct}%`;
  };

  // ---------- UI: opcions ----------
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

  const onChoose = (idx) => {
    const t = TRACKS[current];
    if (!t) return;
    stopPlayback();
    if (idx === t.correctIndex) {
      setMsg('✅ Correcte! Seguim…', 'ok');
      current = Math.min(current + 1, TRACKS.length); // avança
      updateProgress();
      if (current >= TRACKS.length) {
        setMsg('🎉 Has completat el joc d’àudio!', 'ok');
      } else {
        renderChoices();
      }
    } else {
      setMsg('❌ Incorrecte! Reinicio el joc.', 'err');
      resetGame();
    }
  };

  // ---------- Reproducció 10 segons ----------
  const play10s = async () => {
    stopPlayback();
    const t = TRACKS[current];
    if (!t) {
      setMsg('No queda cap pista per reproduir.', 'err');
      return;
    }

    const url = buildUrl(t.file);
    log('URL pista:', url);

    setMsg('Comprovant fitxer…');
    const ok = await headCheck(url);
    if (!ok) {
      setMsg('No s’ha trobat l’MP3 (404). Revisa el nom del repo o la ruta.', 'err');
      log('Recorda: amb repo "how-much-do-u-know-about-u-or-us--main", la URL ha de començar per /how-much-do-u-know-about-u-or-us--main/');
      return;
    }

    setMsg('Carregant i reproduint 10s…');

    // Usa <audio> invisible via JS per evitar problemes d’autoplay (cal clic previ)
    audioEl = new Audio(url);
    audioEl.preload = 'auto';

    // Logs útils
    audioEl.addEventListener('canplay', () => log('canplay'));
    audioEl.addEventListener('play',    () => log('play'));
    audioEl.addEventListener('error',   () => log('error event'));

    try {
      await audioEl.play(); // això requereix el clic de l’usuari (ja el tenim amb el botó)
    } catch (e) {
      setMsg('No s’ha pogut iniciar la reproducció. Torna-ho a provar després del clic.', 'err');
      log('play() error', e);
      return;
    }

    // Countdown de 10→0 i pausa
    let remain = 10;
    setTimer(remain);
    countdownId = setInterval(() => {
      remain -= 1;
      setTimer(remain);
      if (remain <= 0) {
        clearInterval(countdownId);
        countdownId = null;
        try { audioEl.pause(); } catch {}
        setMsg('⏱️ Temps esgotat. Tria la resposta!', 'info');
      }
    }, 1000);
  };

  // ---------- Esdeveniments ----------
  $play?.addEventListener('click', play10s);
  $reset?.addEventListener('click', resetGame);

  // Inicialitza UI
  setTimer(10);
  updateProgress();
  renderChoices();
})();
