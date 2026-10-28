/* Doyofy boot — runs before first paint (kept out of the HTML so the page needs no inline script):
   applies the saved or linked appearance so dark mode never flashes white. */
try {
  var d = document.documentElement;
  var a = (JSON.parse(localStorage.getItem('doyofy:prototype:v1') || '{}').appearance) || 'light';
  var q = new URLSearchParams(location.search).get('appearance');
  if (q === 'light' || q === 'dark' || q === 'system') a = q;
  var k = a === 'dark' || (a === 'system' && matchMedia('(prefers-color-scheme: dark)').matches);
  d.dataset.theme = 'signature';
  d.dataset.appearance = k ? 'dark' : 'light';
  d.style.colorScheme = k ? 'dark' : 'light';
} catch (e) { /* storage blocked: light */ }
