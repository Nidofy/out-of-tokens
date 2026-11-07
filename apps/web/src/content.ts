import {validateContent} from 'oot-content/browser';
import versions from '../../../content/campaign/versions-m2.json';
import commissions from '../../../content/campaign/commissions-m5.json';
import events from '../../../content/campaign/events-m5.json';
import campaign from '../../../content/campaign/m5.json';
import balance from '../../../content/balance/standard.json';
export const content=validateContent({version:'m5-4',versions,commissions,events,campaign,balance});
