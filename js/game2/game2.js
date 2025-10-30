(() => {
  // ====== Joc 2 multi-nivell: "Endevina la foto borrosa" ======
  // Requereix a l'HTML aquests IDs: clip, btnStart, btnPause, time, guess, btnSubmit, feedback, after, btnReplay

  // --- Elements ---
  const els = {
    clip: document.getElementById('clip'),
    btnStart: document.getElementById('btnStart'),
    btnPause: document.getElementById('btnPause'),
    time: document.getElementById('time'),
    guess: document.getElementById('guess'),
    btnSubmit: document.getElementById('btnSubmit'),
    feedback: document.getElementById('feedback'),
    after: document.getElementById('after'),
    btnReplay: document.getElementById('btnReplay'),
  };

  // --- Config ---
  const START_SECONDS = 30; // temporitzador de referència (opcional)
  let remaining = START_SECONDS;
  let timerId = null;

  // --- Nivells (afegeix i edita aquí) ---
  // Rutes relatives des de js/game2/index.html → ../../assets/video/game2/...
  const LEVELS = [
    // Nivell 1: reveal2.mp4 (amb les opcions que m'has passat)
    {
      src: '../../assets/video/game2/reveal2.mp4',
      options: [
        'SURFARIS INN on poppies 2',
        'Theodor at Labuan Bajo', // ✅ correcta
        'Amel House',
        'NeNa Eat & Sleep Kuta',
        'Nucifera Kuta',
        'Korurua Dijiwa Ubud'
      ],
      correct: 'Theodor at Labuan Bajo'
    },

    // Nivell 2: reveal3.mp4 (POSA LES TEVES OPCIONS I LA CORRECTA)
    {
      src: '../../assets/video/game2/reveal3.mp4',
      options: ['La Masella', 'Espot', 'Banhèras de Luishon', 'La Molina'],
      correct: 'Banhèras de Luishon'
    },

    // Nivell 3: reveal4.mp4
    {
      src: '../../assets/video/game2/reveal4.mp4',
      options: ['Mirador de Humboldt, La Orotava', 'Playa de Benijo, Anaga', 'Punta de Teno, Buenavista del Norte', 'Playa de los Guíos, Acantilado de los Gigantes'],
      correct: 'Playa de los Guíos, Acantilado de los Gigantes'
    },

    // Nivell 4: reveal5.mp4
    {
      src: '../../assets/video/game2/reveal5.mp4',
      options: ['Àmsterdam', 'Budapest', 'Andorra', 'Siurana'],
      correct: 'Budapest'
    },

    // Nivell 5: reveal6.mp4
    {
      src: '../../assets/video/game2/reveal6.mp4',
      options: ['Allianz Stadium', 'Municipal de les Comes', 'Camp Nou', 'Camp Municipal de Poboleda'],
      correct: 'Allianz Stadium'
    }
  ];

  let level = 0;
  let answered = false;

  // --- Utils ---
  function fmt(s) {
    s = Math.max(0, Math.floor(s));
    const mm = String(Math.floor(s / 60)).padStart(2, '0');
    const ss = String(s % 60).padStart(2, '0');
    return `${mm}:${ss}`;
  }

  function setTime(s) {
    remaining = s;
    if (els.time) els.time.textContent = fmt(remaining);
  }

  function stopTimer() {
    clearInterval(timerId);
    timerId = null;
  }

  function startTimer() {
    stopTimer();
    timerId = setInterval(() => {
      remaining -= 1;
      setTime(remaining);
      if (remaining <= 0) stopTimer();
    }, 1000);
  }

  function msg(text, cls = '') {
    if (!els.feedback) return;
    els.feedback.textContent = text;
    els.feedback.className = `feedback ${cls}`.trim();
  }

  function lockAnswerUI(lock) {
    if (!els.guess || !els.btnSubmit) return;
    els.guess.disabled = !!lock;
    els.btnSubmit.disabled = !!lock;
  }

  function fillOptions(opts) {
    if (!els.guess) return;
    els.guess.innerHTML = '';
    const placeholder = document.createElement('option');
    placeholder.value = '';
    placeholder.textContent = '— Tria una opció —';
    els.guess.appendChild(placeholder);

    opts.forEach(o => {
      const op = document.createElement('option');
      op.value = o;
      op.textContent = o;
      els.guess.appendChild(op);
    });
  }

  function setVideo(src) {
    if (!els.clip) return;
    els.clip.pause();
    els.clip.currentTime = 0;
    // cache-bust per evitar que GitHub Pages/ navegador serveixi una versió antiga
    const busted = `${src}?v=${Date.now()}`;
    els.clip.src = busted;
    els.clip.load();
  }

  function clearAfter() {
    if (!els.after) return;
    els.after.innerHTML = '';
    els.after.classList.add('hidden');
  }

  function showAfterButtons(buttons = []) {
    if (!els.after) return;
    els.after.innerHTML = '';
    buttons.forEach(({ text, onClick, id }) => {
      const b = document.createElement('button');
      b.className = 'btn';
      b.textContent = text;
      if (id) b.id = id;
      b.addEventListener('click', onClick);
      els.after.appendChild(b);
    });
    els.after.classList.remove('hidden');
  }

  function loadLevel(i) {
    level = i;
    answered = false;
    stopTimer();
    setTime(START_SECONDS);
    msg('');
    clearAfter();

    const L = LEVELS[level];
    if (!L) return showFinal();

    setVideo(L.src);
    fillOptions(L.options);
    lockAnswerUI(false);

    if (els.btnStart) els.btnStart.disabled = false;
    if (els.btnPause) els.btnPause.disabled = true;
  }

  function showFinal() {
    msg('🎉 Has completat tots els nivells del Joc 2!', 'ok');
    showAfterButtons([
      { text: 'Tornar als jocs', onClick: () => location.replace('../../index.html#hub') },
      { text: 'Repetir Joc 2', onClick: () => loadLevel(0) }
    ]);
    lockAnswerUI(true);
  }

  // --- Events ---
  els.btnStart?.addEventListener('click', () => {
    els.clip?.play();
    startTimer();
    if (els.btnStart) els.btnStart.disabled = true;
    if (els.btnPause) els.btnPause.disabled = false;
    lockAnswerUI(false);
  });

  els.btnPause?.addEventListener('click', () => {
    els.clip?.pause();
    stopTimer();
    if (els.btnStart) els.btnStart.disabled = false;
    if (els.btnPause) els.btnPause.disabled = true;
  });

  els.clip?.addEventListener('ended', () => {
    stopTimer();
    if (els.btnStart) els.btnStart.disabled = false;
    if (els.btnPause) els.btnPause.disabled = true;
  });

  els.btnSubmit?.addEventListener('click', (e) => {
    e.preventDefault();
    if (answered) return;

    const choice = (els.guess?.value || '').trim();
    if (!choice) {
      msg('Tria una opció abans d’enviar.', 'warn');
      return;
    }

    answered = true;
    stopTimer();

    const L = LEVELS[level];
    const correct = L && choice === L.correct;

    if (correct) {
      msg('✅ Correcte!', 'ok');

      const isLast = level >= LEVELS.length - 1;
      showAfterButtons([
        {
          text: isLast ? 'Acabar' : 'Següent',
          id: 'btnNext',
          onClick: () => {
            clearAfter();
            if (isLast) showFinal();
            else loadLevel(level + 1);
          }
        },
        {
          text: 'Repetir aquest nivell',
          onClick: () => loadLevel(level)
        }
      ]);
    } else {
      msg(`❌ Incorrecte. La bona era: ${L?.correct || '—'}.`, 'err');
      showAfterButtons([
        { text: 'Torna-ho a provar', onClick: () => loadLevel(level) },
        { text: 'Passar al següent', onClick: () => loadLevel(level + 1) }
      ]);
    }

    lockAnswerUI(true);
  });

  els.btnReplay?.addEventListener('click', () => {
    try {
      els.clip.currentTime = 0;
      els.clip.play();
      setTime(START_SECONDS);
      startTimer();
      msg('');
      clearAfter();
    } catch {}
  });

  // --- Init ---
  loadLevel(0);
})();
