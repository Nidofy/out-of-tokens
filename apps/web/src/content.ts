import { validateContent, contentVersion } from 'oot-content/browser';
import versions from '../../../content/versions/initial.json';
import commissions from '../../../content/commissions/initial.json';
import events from '../../../content/events/initial.json';
import balance from '../../../content/balance/standard.json';
export const content = validateContent({ version: contentVersion, versions, commissions, events, balance });
