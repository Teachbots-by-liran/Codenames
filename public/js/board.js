let state = null;

// ── Persistence ──────────────────────────────────────────────────
function saveState() {
  localStorage.setItem('codenames_state', JSON.stringify(state));
}

// ── Boot ─────────────────────────────────────────────────────────
async function init() {
  const raw = localStorage.getItem('codenames_pending');

  if (raw) {
    localStorage.removeItem('codenames_pending');
    const cfg = JSON.parse(raw);
    const wordList = cfg.wordList || WORDS;

    state = {
      seed:        cfg.seed,
      firstTeam:   cfg.firstTeam,
      wordList:    cfg.wordList || null,   // null = built-in; encoded in QR URL for spymasters
      cards:       generateGame(cfg.seed, wordList, cfg.firstTeam),
      currentTurn: cfg.firstTeam,
      gameOver:    false,
      winner:      null,
      winReason:   null,
    };
    saveState();
    renderBoard();
    await openQRModal();

  } else {
    const saved = localStorage.getItem('codenames_state');
    if (saved) {
      state = JSON.parse(saved);
      renderBoard();
    } else {
      window.location.href = '/setup';
    }
  }
}

// ── Render board ─────────────────────────────────────────────────
function renderBoard() {
  const board = document.getElementById('board');
  board.innerHTML = '';

  state.cards.forEach((card, i) => {
    const el = document.createElement('div');
    el.className = 'card' + (card.revealed ? ' revealed ' + card.type : '');
    el.textContent = card.word;
    if (!state.gameOver && !card.revealed) {
      el.addEventListener('click', () => revealCard(i));
    }
    board.appendChild(el);
  });

  updateScores();
  updateTurnLabel();
}

function updateScores() {
  const redLeft  = state.cards.filter(c => c.type === 'red'  && !c.revealed).length;
  const blueLeft = state.cards.filter(c => c.type === 'blue' && !c.revealed).length;
  document.getElementById('red-count').textContent  = redLeft;
  document.getElementById('blue-count').textContent = blueLeft;
}

function updateTurnLabel() {
  const el = document.getElementById('turn-label');
  if (state.gameOver) {
    el.textContent = '';
    el.className = 'done';
  } else {
    el.textContent = state.currentTurn.toUpperCase() + "'S TURN";
    el.className = state.currentTurn;
  }
}

// ── Reveal logic ─────────────────────────────────────────────────
function revealCard(index) {
  const card = state.cards[index];
  if (card.revealed || state.gameOver) return;

  card.revealed = true;
  const current = state.currentTurn;

  if (card.type === 'assassin') {
    state.gameOver  = true;
    state.winner    = current === 'red' ? 'blue' : 'red';
    state.winReason = 'assassin';

  } else {
    // Check if whoever owns this card just won
    const owner     = card.type;   // 'red' | 'blue' | 'neutral'
    const remaining = owner !== 'neutral'
      ? state.cards.filter(c => c.type === owner && !c.revealed).length
      : 1;

    if (owner !== 'neutral' && remaining === 0) {
      state.gameOver  = true;
      state.winner    = owner;
      state.winReason = 'all_revealed';
    }

    // Wrong team's card or neutral → end turn (if game still on)
    if (!state.gameOver && owner !== current) {
      state.currentTurn = current === 'red' ? 'blue' : 'red';
    }
  }

  saveState();
  renderBoard();

  if (state.gameOver) setTimeout(showGameOver, 700);
}

function endTurn() {
  if (state.gameOver) return;
  state.currentTurn = state.currentTurn === 'red' ? 'blue' : 'red';
  saveState();
  updateTurnLabel();
}

// ── Game-over overlay ─────────────────────────────────────────────
function showGameOver() {
  const title = document.getElementById('gameover-title');
  const sub   = document.getElementById('gameover-sub');

  title.textContent = state.winner.toUpperCase() + ' WINS!';
  title.className   = 'gameover-title ' + state.winner;

  sub.textContent = state.winReason === 'assassin'
    ? 'The Assassin was revealed — ' + (state.winner === 'red' ? 'Blue' : 'Red') + ' loses!'
    : 'All words found!';

  document.getElementById('gameover-modal').classList.add('active');
}

// ── QR modal ──────────────────────────────────────────────────────
async function openQRModal() {
  // Determine the base URL spymasters should use.
  // On a local network we switch to the LAN IP so phones can reach the server.
  // On a cloud host the private container IP would be wrong, so we keep origin.
  const isPrivate = ip =>
    /^(10\.|172\.(1[6-9]|2[0-9]|3[01])\.|192\.168\.|127\.)/.test(ip);

  let baseUrl = window.location.origin;
  try {
    const res  = await fetch('/api/info');
    const info = await res.json();
    if (info.ip && isPrivate(info.ip)) {
      baseUrl = `http://${info.ip}:${info.port}`;
    }
  } catch (_) {}

  const seed = state.seed;
  // Encode firstTeam and any custom word list directly in the URL so spymaster
  // devices need no server-side state (works on Vercel and other stateless hosts).
  const wordsParam = state.wordList
    ? '&words=' + encodeURIComponent(state.wordList.join(','))
    : '';
  const common   = `seed=${seed}&first=${state.firstTeam}${wordsParam}`;
  const redUrl   = `${baseUrl}/spymaster?${common}&team=red`;
  const blueUrl  = `${baseUrl}/spymaster?${common}&team=blue`;

  document.getElementById('url-red').textContent  = redUrl;
  document.getElementById('url-blue').textContent = blueUrl;

  // Clear previous QR codes then regenerate
  const qrRedEl  = document.getElementById('qr-red');
  const qrBlueEl = document.getElementById('qr-blue');
  qrRedEl.innerHTML  = '';
  qrBlueEl.innerHTML = '';

  try {
    new QRCode(qrRedEl,  { text: redUrl,  width: 180, height: 180, correctLevel: QRCode.CorrectLevel.M });
    new QRCode(qrBlueEl, { text: blueUrl, width: 180, height: 180, correctLevel: QRCode.CorrectLevel.M });
  } catch (_) {
    // QRCode library failed (no CDN?) — URL text is still shown as fallback
  }

  document.getElementById('qr-modal').classList.add('active');
}

// ── Event listeners ───────────────────────────────────────────────
document.getElementById('end-turn-btn').addEventListener('click', endTurn);

document.getElementById('new-game-btn').addEventListener('click', () => {
  window.location.href = '/setup';
});

document.getElementById('show-qr-btn').addEventListener('click', () => {
  if (state) openQRModal();
});

document.getElementById('close-qr-btn').addEventListener('click', () => {
  document.getElementById('qr-modal').classList.remove('active');
});

document.getElementById('gameover-new-btn').addEventListener('click', () => {
  window.location.href = '/setup';
});

// ── Start ─────────────────────────────────────────────────────────
init();
