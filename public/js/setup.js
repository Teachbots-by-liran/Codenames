const srcRadios    = document.querySelectorAll('input[name="word-source"]');
const customArea   = document.getElementById('custom-area');
const customInput  = document.getElementById('custom-words');
const wordHint     = document.getElementById('word-hint');
const errorMsg     = document.getElementById('error-msg');
const startBtn     = document.getElementById('start-btn');

// Restore saved custom words from a previous session
const saved = localStorage.getItem('codenames_custom_words');
if (saved) customInput.value = saved;

srcRadios.forEach(r => r.addEventListener('change', () => {
  customArea.style.display = r.value === 'custom' ? 'block' : 'none';
  errorMsg.textContent = '';
}));

customInput.addEventListener('input', updateHint);

function parseCustomWords(text) {
  return [...new Set(
    text.split(/[\n,]+/)
        .map(w => w.trim().toUpperCase())
        .filter(w => w.length > 0)
  )];
}

function updateHint() {
  const words = parseCustomWords(customInput.value);
  const n = words.length;
  wordHint.textContent = `${n} word${n !== 1 ? 's' : ''} — ${n >= 25 ? 'ready!' : `need at least ${25 - n} more`}`;
  wordHint.className = 'word-hint ' + (n >= 25 ? 'ok' : 'warn');
}

if (saved) updateHint();

startBtn.addEventListener('click', () => {
  errorMsg.textContent = '';

  const source    = [...srcRadios].find(r => r.checked)?.value || 'builtin';
  const firstTeam = document.querySelector('input[name="first-team"]:checked')?.value || 'red';

  let wordList = WORDS;

  if (source === 'custom') {
    const words = parseCustomWords(customInput.value);
    if (words.length < 25) {
      errorMsg.textContent = `Need at least 25 words — you have ${words.length}.`;
      return;
    }
    localStorage.setItem('codenames_custom_words', customInput.value);
    wordList = words;
  }

  const seed = generateSeed();

  localStorage.setItem('codenames_pending', JSON.stringify({
    seed,
    firstTeam,
    wordList: wordList === WORDS ? null : wordList,
  }));

  window.location.href = '/';
});
