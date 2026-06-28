const params    = new URLSearchParams(window.location.search);
const seed      = params.get('seed');
const team      = (params.get('team') || 'red').toLowerCase();
const firstTeam = params.get('first') || 'red';
const wordsRaw  = params.get('words');

// Custom words are comma-encoded in the URL; fall back to built-in list.
const wordList = wordsRaw
  ? wordsRaw.split(',').map(w => w.trim().toUpperCase()).filter(Boolean)
  : WORDS;

function init() {
  if (!seed) {
    document.getElementById('spy-content').textContent = 'No game seed in URL.';
    return;
  }

  // Style header for this team
  const header = document.getElementById('spy-header');
  header.textContent = team.toUpperCase() + ' SPYMASTER';
  header.className   = 'spy-header ' + team;
  document.title     = team.charAt(0).toUpperCase() + team.slice(1) + ' Spymaster';

  const cards = generateGame(seed, wordList, firstTeam);

  const board = document.createElement('div');
  board.className = 'spy-board';

  cards.forEach(card => {
    const el = document.createElement('div');
    el.className = 'spy-card ' + card.type;
    el.textContent = card.word;
    board.appendChild(el);
  });

  const content = document.getElementById('spy-content');
  content.className = '';
  content.innerHTML = '';
  content.appendChild(board);
}

init();
