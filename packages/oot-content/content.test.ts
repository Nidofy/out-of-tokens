import { test, expect } from 'vitest';
import { loadContent, validateContent } from './src/index.js';
test('four versions and strict declarative content', () => { const c = loadContent(); expect(c.versions).toHaveLength(4); expect(() => validateContent({ ...c, versions: [...c.versions, c.versions[0]] })).toThrow(); expect(() => validateContent({ ...c, commissions: [{ ...c.commissions[0], delivery: 'sla' }] })).toThrow(); expect(() => validateContent({ ...c, events: [{ ...c.events[0], choices: [] }] })).toThrow(); });
