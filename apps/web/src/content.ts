import { validateContent } from 'oot-content/browser';
import versions from '../../../content/campaign/versions-m1.json';
import extraEvents from '../../../content/campaign/events-m1.json';
import campaign from '../../../content/campaign/m1.json';
import commissions from '../../../content/commissions/initial.json';
import events from '../../../content/events/initial.json';
import balance from '../../../content/balance/standard.json';
export const content = validateContent({ version: 'm1-1', versions, commissions, events: [...events,...extraEvents], balance, campaign });
