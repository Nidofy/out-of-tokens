import {test,expect} from 'vitest';
import {controllerTracker} from './src/update-observer.js';
test('first install is silent, cross-tab controller replacement is reported',()=>{
 const a={},b={},track=controllerTracker<object>(null);
 expect(track(a)).toBe(false);expect(track(a)).toBe(false);expect(track(b)).toBe(true);
 expect(controllerTracker(a)(b)).toBe(true);
});
