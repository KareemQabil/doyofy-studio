/**
 * Entry. Two views:
 *   (default)                 the customer wizard — choose 3D/2D · animated/static, card, setting, details, share
 *   ?view=invite[&i=<config>] the invitation itself (what guests open). Without `i` it shows the canonical
 *                             default (Wine & Gold + Candlelit Hall); with `i` it shows the encoded design.
 * Invitation-view URL options (QA / authoring): ?card= &scene= &start=intro|card|pages|rsvp|done
 *   &quality=high|balanced|low &renderer=auto|three|dom &motion=reduced|full &author=1
 */
import './cards/index.js';
import './scenes/index.js';
import './pages/index.js';
import './audio/index.js';
import './modules.js';
import { sampleInvitation } from './data/invitation.js';
import { Studio } from './studio/Studio.js';
import { Wizard } from './wizard/Wizard.js';
import { decodeConfig } from './wizard/config.js';

const params = new URLSearchParams(location.search);
const app = document.getElementById('app');

if (params.get('view') === 'invite' || params.has('i')) {
  const cfg = params.has('i') ? decodeConfig(params.get('i')) : null;
  window.__studio = new Studio(app, cfg
    ? { invitation: cfg.invitation, card: cfg.card, scene: cfg.scene, experience: cfg.experience, showSwitcher: params.has('author'), params }
    : { invitation: sampleInvitation, card: 'wine', scene: 'candlelit', params });
} else {
  window.__wizard = new Wizard(app, { assetBase: 'assets/' });
}
