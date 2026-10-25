/**
 * FontManager — local faces first, optional remote enhancement.
 *
 * Every family used by a card/pack is declared as { family, google? }. The bundled local
 * face ('Invite Arabic', Noto Sans Arabic) is always available, so Arabic never renders as
 * tofu. When `remote` is enabled, Google Fonts families are added lazily per card.
 * `npm run fonts:localize` downloads them into assets/fonts/ and flips the manifest to local.
 */
const loaded = new Set();

export class FontManager {
  constructor({ remote = true, manifest = null } = {}) {
    this.remote = remote;
    // optional { css: 'fonts/fonts.css', families: { family: 'fonts/file.woff2' } } written by
    // tools/localize-fonts.mjs; `base` is the asset base the paths are relative to.
    this.manifest = manifest;
    this.base = 'assets/';
  }

  async ensure(families = []) {
    const wanted = families.filter((f) => f && f.google && !loaded.has(f.google));
    const localCss = this.manifest?.css;
    if (localCss && wanted.length && !loaded.has('__local_css__')) {
      loaded.add('__local_css__');
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = this.base + localCss; // every weight/subset of every localized family
      document.head.append(link);
    }
    for (const f of wanted) {
      loaded.add(f.google);
      if (localCss && this.manifest.families?.[f.family]) continue; // served by fonts.css
      if (this.remote) {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = `https://fonts.googleapis.com/css2?family=${f.google}&display=swap`;
        document.head.append(link);
      }
    }
    if (document.fonts?.ready) {
      await Promise.race([document.fonts.ready, new Promise((r) => setTimeout(r, 1500))]);
    }
  }
}

/** Font stacks shared by cards and pages. The local Arabic face is the last resort everywhere. */
export const STACK = {
  arDisplay: "'Aref Ruqaa', 'Invite Arabic', serif",
  arNaskh: "'Amiri', 'Invite Arabic', serif",
  arKufi: "'Reem Kufi', 'Invite Arabic', sans-serif",
  arSans: "'IBM Plex Sans Arabic', 'Invite Arabic', system-ui, sans-serif",
  enSerif: "'Cormorant Garamond', 'Invite Arabic', Georgia, serif",
  enDidone: "'Bodoni Moda', 'Invite Arabic', 'Didot', Georgia, serif",
  enScript: "'Great Vibes', 'Invite Arabic', cursive",
  enSans: "'IBM Plex Sans', 'Invite Arabic', system-ui, sans-serif",
};

export const GOOGLE = {
  arefRuqaa: { family: 'Aref Ruqaa', google: 'Aref+Ruqaa:wght@400;700' },
  amiri: { family: 'Amiri', google: 'Amiri:ital,wght@0,400;0,700;1,400' },
  reemKufi: { family: 'Reem Kufi', google: 'Reem+Kufi:wght@400;500;600' },
  plexArabic: { family: 'IBM Plex Sans Arabic', google: 'IBM+Plex+Sans+Arabic:wght@300;400;500' },
  cormorant: { family: 'Cormorant Garamond', google: 'Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;1,400;1,500' },
  bodoni: { family: 'Bodoni Moda', google: 'Bodoni+Moda:ital,opsz,wght@0,6..96,400;0,6..96,500;1,6..96,400' },
  greatVibes: { family: 'Great Vibes', google: 'Great+Vibes' },
  plexSans: { family: 'IBM Plex Sans', google: 'IBM+Plex+Sans:wght@300;400;500' },
};
