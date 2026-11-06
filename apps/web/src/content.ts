import {validateContent} from 'oot-content/browser';
import versions from '../../../content/campaign/versions-m2.json';
import commissions from '../../../content/campaign/commissions-m2.json';
import events from '../../../content/campaign/events-m2.json';
import campaign from '../../../content/campaign/m2.json';
import balance from '../../../content/balance/standard.json';
export const content=validateContent({version:'m2-1',versions,commissions,events,campaign,balance});
