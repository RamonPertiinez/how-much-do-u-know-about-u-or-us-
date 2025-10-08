// --- RIDDLE UI logic (mostra la pista de la foto i comprova la resposta) ---
function setupRiddleUI(){
  const btnShow = document.getElementById('btnShowRiddle');
  const riddleBox = document.getElementById('riddleBox');
  const riddleText = document.getElementById('riddleText');
  const riddleAnswer = document.getElementById('riddleAnswer');
  const riddleSubmit = document.getElementById('riddleSubmit');
  const riddleHintBtn = document.getElementById('riddleHint');
  const riddleMsg = document.getElementById('riddleMsg');
  const passwordInput = document.getElementById('password');

  // Si no hi ha gateRiddle definit, no mostrem res
  if(!state.config || !state.config.gateRiddle) return;

  const r = state.config.gateRiddle;

  // 👇 AQUESTA ÉS LA LÍNIA IMPORTANT
  // Si existeix text dins config.json, el mostra. Si no, deixa el contingut HTML del index.html.
  if (r.text) { riddleText.textContent = r.text; }

  // Mostrar/ocultar pista
  btnShow.addEventListener('click', ()=>{
    riddleBox.style.display = riddleBox.style.display === 'none' ? 'block' : 'none';
    riddleMsg.textContent = '';
  });

  // Mostrar pista secundària (hint)
  riddleHintBtn.addEventListener('click', ()=>{
    riddleMsg.textContent = r.hint || 'Pista no disponible.';
  });

  // Comprovar resposta
  riddleSubmit.addEventListener('click', ()=>{
    const val = (riddleAnswer.value || '').toString().normalize('NFD').replace(/\p{Diacritic}/gu,'').trim().toLowerCase();
    const ok = Array.isArray(r.accept) && r.accept
      .map(a=>a.toString().normalize('NFD').replace(/\p{Diacritic}/gu,'').trim().toLowerCase())
      .includes(val);

    if(ok){
      riddleMsg.textContent = 'Correcte! Has descobert la pista. 🔓';
      riddleMsg.style.color = '';
      // Si està configurat per revelar la contrasenya
      if(r.onCorrect === 'revealPassword' && state.config.auth && state.config.auth.password){
        passwordInput.value = state.config.auth.password;
        document.querySelector('#loginForm button[type="submit"]').focus();
      }
    } else {
      riddleMsg.textContent = 'No exactament... prova un altre cop o demana una pista.';
      riddleMsg.style.color = 'var(--err)';
    }
  });
}
