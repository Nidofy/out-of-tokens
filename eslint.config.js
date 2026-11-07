import ts from 'typescript-eslint';
export default ts.config({ignores:['apps/desktop/target/**','apps/desktop/gen/**','**/dist/**','apps/dsh/types/**','apps/dsh/src/vendor/**']}, ...ts.configs.recommended, {
 files:['packages/oot-core/src/**/*.ts'],
 rules:{'no-restricted-globals':['error','window','document','fetch','Date','process'], 'no-restricted-properties':['error',{object:'Math',property:'random'}], 'no-restricted-imports':['error',{patterns:['node:*','oot-*']}]}
});
