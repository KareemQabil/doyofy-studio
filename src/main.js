/**
 * The standalone invitation (what a self-contained guest link opens):
 *   ?i=<config>                 the encoded design (src/data/invite-link.js); the RSVP is a demo on this device
 *   ?view=invite                the sample invitation (QA)
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
import { decodeConfig } from './data/invite-link.js';
import { DemoRSVPAdapter } from './engine/rsvp.js';

const params = new URLSearchParams(location.search);
const app = document.getElementById('app');
const cfg = params.has('i') ? decodeConfig(params.get('i')) : null;
window.__studio = new Studio(app, cfg
  // a self-contained link has no organizer data behind it on this device: the reply is a demo, and the done screen says so
  ? { invitation: cfg.invitation, card: cfg.card, scene: cfg.scene, experience: cfg.experience, showSwitcher: params.has('author'), params, rsvp: new DemoRSVPAdapter(), guest: cfg.guest ?? null }
  : { invitation: sampleInvitation, card: 'kit-rose-garden', scene: 'silk', params });
