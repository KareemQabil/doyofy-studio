import { OrbitArtwork } from '../../features/orbit/OrbitArtwork';
import { themeById } from '../../domain/themes';
import { useReviewSettings } from '../../app/review';
/** Decorative material art; real invitation contents are always rendered above it. */
export function ThemeArtwork({ className = '', eager = false }: { className?: string; eager?: boolean }) {
  const {theme}=useReviewSettings();
  if(theme==='orbit')return <OrbitArtwork className={`theme-artwork ${className}`}/>;
  return <img className={`theme-artwork ${className}`} src={themeById(theme).artwork} alt="" aria-hidden="true" loading={eager?'eager':'lazy'} decoding="async"/>;
}
