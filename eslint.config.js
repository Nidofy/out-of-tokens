import ts from 'typescript-eslint';
export default ts.config({ignores:['**/dist/**']}, ...ts.configs.recommended, {
 files:['packages/oot-core/src/**/*.ts'],
 rules:{'no-restricted-globals':['error','window','document','fetch','Date','process'], 'no-restricted-properties':['error',{object:'Math',property:'random'}], 'no-restricted-imports':['error',{patterns:['node:*','oot-*']}]}
});
