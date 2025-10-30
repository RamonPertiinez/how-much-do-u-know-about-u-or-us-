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
  const START_SECONDS = 30; // temporitzador (opcional)
  let remaining = START_SECONDS;
  let timerId = null;

  // --- Nivells (rutes relatives des de js/game2/index.html → ../../assets/video/game2/...)
  // També afegim la imatge de "reveal correcte" (rutes: ../../assets/images/game2/...)
  const LEVELS = [
    // Nivell 0: reveal.mp4 — Estanys Pirineus
    {
      src: '../../assets/video/game2/reveal.mp4',
      options: [
        'Estany de Sant Maurici',
        'Estany Llong',
        'Estany de Cavallers',
        'Estany de Subenuix',
        'Estany Gento',
        'Estany de Baborte',
        'Estany de Certascan',
        'Estany de Gerber',
        'Estany de Mar',
        'Estany Negre de Cabanes' // ✅ correcta
      ],
      correct: 'Estany Negre de Cabanes',
      img: '../../assets/images/game2/correctreveal.jpg'
    },

    // Nivell 1: reveal2.mp4 — Indonèsia
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
      correct: 'Theodor at Labuan Bajo',
      img: '../../assets/images/game2/correctreveal2.jpeg'
    },

    // Nivell 2: reveal3.mp4 — neu
    {
      src: '../../assets/video/game2/reveal3.mp4',
      options: ['La Masella', 'Espot', 'Banhèras de Luishon', 'La Molina'],
      correct: 'Banhèras de Luishon',
      img: '../../assets/images/game2/correctreveal3.jpeg'
    },

    // Nivell 3: reveal4.mp4 — Tenerife
    {
      src: '../../assets/video/game2/reveal4.mp4',
      options: [
        'Mirador de Humboldt, La Orotava',
        'Playa de Benijo, Anaga',
        'Punta de Teno, Buenavista del Norte',
        'Playa de los Guíos, Acantilado de los Gigantes'
      ],
      correct: 'Playa de los Guíos, Acantilado de los Gigantes',
      img: '../../assets/images/game2/correctreveal4.jpeg'
    },

    // Nivell 4: reveal5.mp4 — ciutat europea
    {
      src: '../../assets/video/game2/reveal5.mp4',
      options: ['Àmsterdam', 'Budapest', 'Andorra', 'Siurana'],
      correct: 'Budapest',
      img: '../../assets/images/game2/correctreveal5.jpeg'
    },

    // Nivell 5: reveal6.mp4 — estadi
    {
      src: '../../assets/video/game2/reveal6.mp4',
      options: ['Allianz Stadium', 'Municipal de les Comes', 'Camp Nou', 'Camp Municipal de Poboleda'],
      correct: 'Allianz Stadium',
      img: '../../assets/images/game2/correctreveal6.jpeg'
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
    // cache-bust per evitar que GitHub Pages/navegador serveixi una versió antiga
    const busted = `${src}?v=${Date.now()}`;
    els.clip.src = busted;
    els.clip.load();
  }

  function clearAfter() {
    if (!els.after) return;
    els.after.innerHTML = '';
    els.after.classList.add('hidden');
  }

  // Ara NOMÉS afegim botons (no esborrem res) — així no desapareix la targeta amb la imatge
  function showAfterButtons(buttons = []) {
    if (!els.after) return;
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

  // ====== Desplegable sota el VÍDEO amb la imatge de la resposta correcta ======
  function showCorrectReveal(L) {
    if (!L?.img || !els.clip) return;

    // Crear contenidor collapsible
    const wrap = document.createElement('section');
    wrap.className = 'reveal-collapsible';

    const toggle = document.createElement('button');
    toggle.type = 'button';
    toggle.className = 'reveal-toggle';
    toggle.textContent = 'Veure la resposta correcta';

    const body = document.createElement('div');
    body.className = 'reveal-body';

    const card = document.createElement('div');
    card.className = 'reveal-card';

    const img = document.createElement('img');
    img.alt = 'Resposta correcta';
    img.loading = 'lazy';
    img.src = `${L.img}?v=${Date.now()}`;
    img.onerror = () => {
      // Traça mínima d’error
      console.warn('No s\'ha pogut carregar la imatge:', img.src);
    };

    const cap = document.createElement('div');
    cap.className = 'cap';
    cap.innerHTML = `<strong>Resposta correcta</strong><br>${L.correct}`;

    card.appendChild(img);
    card.appendChild(cap);
    body.appendChild(card);
    wrap.appendChild(toggle);
    wrap.appendChild(body);

    // Inserim el desplegable JUST després del vídeo
    const videoEl = els.clip;
    videoEl.insertAdjacentElement('afterend', wrap);

    // Comportament de desplegable amb animació
    let open = false;
    const setOpen = (v) => {
      open = v;
      wrap.classList.toggle('open', open);
      if (open) {
        body.style.maxHeight = body.scrollHeight + 'px';
      } else {
        body.style.maxHeight = '0px';
      }
    };
    toggle.addEventListener('click', () => setOpen(!open));

    // Obrim automàticament després de l'encert i fem scroll
    setTimeout(() => {
      setOpen(true);
      wrap.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 50);
  }

  function loadLevel(i) {
    level = i;
    answered = false;
    stopTimer();
    setTime(START_SECONDS);
    msg('');
    clearAfter();

    // Eliminar possibles desplegables d’un nivell anterior
    document.querySelectorAll('.reveal-collapsible').forEach(n => n.remove());

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

      // 1) Inserim el desplegable sota el vídeo
      showCorrectReveal(L);
      // 2) Llavors afegim botons (quedaran DESPRÉS del desplegable, obligant a baixar)
      const isLast = level >= LEVELS.length - 1;
      showAfterButtons([
        {
          text: isLast ? 'Acabar' : 'Següent',
          id: 'btnNext',
          onClick: () => {
            clearAfter();
            loadLevel(isLast ? 0 : level + 1);
            if (isLast) {
              msg('🎉 Has completat tots els nivells del Joc 2!', 'ok');
              showAfterButtons([
                { text: 'Tornar als jocs', onClick: () => location.replace('../../index.html#hub') },
                { text: 'Repetir Joc 2', onClick: () => loadLevel(0) }
              ]);
            }
          }
        },
        {
          text: 'Repetir aquest nivell',
          onClick: () => { clearAfter(); loadLevel(level); }
        }
      ]);
    } else {
      msg(`❌ Incorrecte. La bona era: ${L?.correct || '—'}.`, 'err');
      showAfterButtons([
        { text: 'Torna-ho a provar', onClick: () => { clearAfter(); loadLevel(level); } },
        { text: 'Passar al següent', onClick: () => { clearAfter(); loadLevel(level + 1); } }
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
      // Eliminar desplegable si es reprodueix de nou
      document.querySelectorAll('.reveal-collapsible').forEach(n => n.remove());
    } catch {}
  });

  // --- Init ---
  loadLevel(0);
})();
