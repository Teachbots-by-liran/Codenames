// Mulberry32 — fast, high-quality 32-bit seeded PRNG
function createRNG(seed) {
  let s = (seed >>> 0) || 1;
  return function () {
    s += 0x6D2B79F5;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = t + Math.imul(t ^ (t >>> 7), 61 | t) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffle(arr, rng) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// seedStr is a base-36 string. wordList is an array of uppercase strings.
// firstTeam is 'red' or 'blue'.
// Returns array of 25 card objects: { word, type, revealed }
function generateGame(seedStr, wordList, firstTeam) {
  const seed = parseInt(seedStr, 36);
  const rng = createRNG(seed);

  const words = shuffle(wordList, rng).slice(0, 25);

  const secondTeam = firstTeam === 'red' ? 'blue' : 'red';
  const types = [
    ...Array(9).fill(firstTeam),
    ...Array(8).fill(secondTeam),
    ...Array(7).fill('neutral'),
    'assassin',
  ];

  const shuffledTypes = shuffle(types, rng);

  return words.map((word, i) => ({ word, type: shuffledTypes[i], revealed: false }));
}

function generateSeed() {
  const n = Math.floor(Math.random() * 0xFFFFFF) + 1;
  return n.toString(36).toUpperCase().padStart(5, '0');
}
