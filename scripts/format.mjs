// Deterministic repository-local formatting using the pinned TypeScript parser.
import ts from 'typescript';
import {readdirSync,readFileSync,writeFileSync} from 'node:fs';
import {join} from 'node:path';
const printer=ts.createPrinter({newLine:ts.NewLineKind.LineFeed});
function visit(dir){
  for(const entry of readdirSync(dir,{withFileTypes:true})){
    if(['dist','node_modules'].includes(entry.name))continue;
    const path=join(dir,entry.name);
    if(entry.isDirectory())visit(path);
    else if(/\.tsx?$/.test(path)){
      const source=readFileSync(path,'utf8');
      writeFileSync(path,printer.printFile(ts.createSourceFile(path,source,ts.ScriptTarget.Latest,true)));
    }
  }
}
visit('packages');visit('apps');
