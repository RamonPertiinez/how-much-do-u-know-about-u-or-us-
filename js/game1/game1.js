(() => {
  const audio = document.getElementById("audio");
  const btnPlay = document.getElementById("btnPlay");
  const btnPause = document.getElementById("btnPause");
  const btnNext = document.getElementById("btnNext");
  const statusEl = document.getElementById("status");
  const optionsBox = document.getElementById("options");
  const feedback = document.getElementById("feedback");

  // Cada pista: fitxer d'àudio + 3 opcions + índex correcte (0..2)
  // ⚠️ RUTES COHERENTS: des de /docs/js/game1/ -> ../../assets/audio/game1/....
  const TRACKS = [
    {
      file: "../../assets/audio/game1/track1.mp3",
      artist: "Ginestà",
      options: ["Un piset amb tu", "T’estimo molt", "Ulls d’avellana"],
      correctIndex: 2, // <-- LA BONA
    },
    {
      file: "../../assets/audio/game1/track2.mp3",
      artist: "Manel",
      options: ["Els guapos són els raros", "En la que el Bernat se’t troba", "Boomerang"],
      correctIndex: 0, // <-- ajusta segons "LA BONA"
    },
    {
      file: "../../assets/audio/game1/track3.mp3",
      artist: "Oques Grasses",
      options: ["La Gent que Estimo", "Sort de Tu", "De Bonseh"],
      correctIndex: 2,
    },
    {
      file: "../../assets/audio/game1/track4.mp3",
      artist: "The Tyets",
      options: ["Tandem", "Camila", "Sushi Poke"],
      correctIndex: 1,
    },
    {
      file: "../../assets/audio/game1/track5.mp3",
      artist: "Txarango",
      options: ["La Dansa del Vestit", "Music de Carrer", "Som Persones"],
      correctIndex: 2,
    },
    {
      file: "../../assets/audio/game1/track6.mp3",
      artist: "Miki Núñez",
      options: ["Dime Que No Duele", "La Venda", "Celébrate"],
      correctIndex: 2,
    },
    {
      file: "../../assets/audio/game1/track7.mp3",
      artist: "Stay Homas",
      options: ["No Vull Baixar", "Here2Play", "La Platja"],
      correctIndex: 0,
    },
    {
      file: "../../assets/audio/game1/track8.mp3",
      artist: "31 FAM",
      options: ["Sincero", "Valentina", "Nens Del Barri"],
      correctIndex: 1,
    },
    {
      file: "../../assets/audio/game1/track9.mp3",
      artist: "Els Amics de les Arts",
      options: ["Louisiana O Els Camps de Cotó", "No Ho Entens", "Citant Mercè Rodoreda"],
      correctIndex: 1,
    },
    {
      file: "../../assets/audio/game1/track10.mp3",
      artist: "Nil Moliner",
      options: ["Soldadito de Hierro", "Som Ocells", "Tu cuerpo en braille"],
      correctIndex: 0,
    },
    {
      file: "../../assets/audio/game1/track11.mp3",
      artist: "Joan Dausà",
      options: ["Ho Tenim Tot", "La Gran Eufòria", "Reis del Món"],
      correctIndex: 0,
    },
    {
      file: "../../assets/audio/game1/track12.mp3",
      artist: "Els Catarres",
      options: ["Diamants", "Fins que arribi l'alba", "En Peu de Guerra"],
      correctIndex: 2,
    },
    {
      file: "../../assets/audio/game1/track13.mp3",
      artist: "Al·lèrgiques al pol·len",
      options: ["Que sí, que no", "Anestèsia total", "Bombolles"],
      correctIndex: 2,
    },
    {
      file: "../../assets/audio/game1/track14.mp3",
      artist: "Sopa de Cabra",
      options: ["Seguirem Somiant", "Si Et Va Bé", "El Far del Sud"],
      correctIndex: 1,
    },
    {
      file: "../../assets/audio/game1/track15.mp3",
      artist: "La Fúmiga",
      options: ["La Ferida", "Espremedors", "Primera Conjugació"],
      correctIndex: 1,
    },
    {
      file: "../../assets/audio/game1/track16.mp3",
      artist: "Els Pets",
      options: ["Estúpidament Feliç", "Vespre", "Pantalons curts i genolls pelats"],
      correctIndex: 0,
    },
  ];

  let i = 0;          // índex de pista
  let locked = false; // evita clicar múltiples respostes

  const z2 = (n) => n.toString().padStart(2, "0");
  const setStatus = () => {
    statusEl.textContent = `Pista ${i+1}/${TRACKS.length}`;
  };

  const loadTrack = () => {
    const t = TRACKS[i];
    audio.src = t.file;     // 🎯 RUTA BONA
    audio.currentTime = 0;  // arrenca des del principi
    feedback.textContent = "";
    btnPause.disabled = true;
    btnPlay.disabled = false;
    btnNext.disabled = true;
    locked = false;

    // pinta opcions
    optionsBox.innerHTML = "";
    t.options.forEach((txt, idx) => {
      const b = document.createElement("button");
      b.className = "option";
      b.textContent = txt;
      b.addEventListener("click", () => onAnswer(idx));
      optionsBox.appendChild(b);
    });

    setStatus();
  };

  const onAnswer = (idx) => {
    if (locked) return;
    locked = true;

    const t = TRACKS[i];
    const buttons = [...optionsBox.querySelectorAll(".option")];

    // marca visual
    buttons.forEach((b, j) => {
      if (j === t.correctIndex) b.classList.add("correct");
      if (j === idx && j !== t.correctIndex) b.classList.add("wrong");
      b.disabled = true;
    });

    if (idx === t.correctIndex) {
      feedback.textContent = `✅ Correcte! Era ${t.artist} — ${t.options[t.correctIndex]}.`;
    } else {
      feedback.textContent = `❌ Incorrecte. La bona era: ${t.artist} — ${t.options[t.correctIndex]}.`;
    }

    // al final de tot, mostra "Següent" o acaba
    if (i < TRACKS.length - 1) {
      btnNext.disabled = false;
    } else {
      btnNext.textContent = "Acabar i tornar al menú";
      btnNext.disabled = false;
    }
  };

  btnPlay.addEventListener("click", async () => {
    try { await audio.play(); } catch(e) {}
    btnPlay.disabled = true;
    btnPause.disabled = false;
  });

  btnPause.addEventListener("click", () => {
    audio.pause();
    btnPause.disabled = true;
    btnPlay.disabled = false;
  });

  btnNext.addEventListener("click", () => {
    // si és l'última pista → marca DONE i torna al Hub
    if (i >= TRACKS.length - 1) {
      try { localStorage.setItem("game1_done","1"); } catch {}
      window.location.href = "../../index.html#done=game1";
      return;
    }
    i += 1;
    loadTrack();
  });

  // Quan canviem de pista, pausa si cal
  audio.addEventListener("ended", () => {
    // no fem autoplay de respostes; simplement s'acaba l'àudio
  });

  // INIT
  loadTrack();
})();
