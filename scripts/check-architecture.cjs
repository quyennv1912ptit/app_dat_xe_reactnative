const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const root = path.resolve(__dirname,'..');
const walk = p => fs.readdirSync(p,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(path.join(p,e.name)):[path.join(p,e.name)]);
const errors=[];
for(const app of ['customer','driver']) {
  const src=path.join(root,'apps',app,'src');
  for(const file of walk(src).filter(p=>/\.tsx?$/.test(p))) {
    const text=fs.readFileSync(file,'utf8');
    const tree=ts.createSourceFile(file,text,ts.ScriptTarget.Latest,true);
    if(file.includes(path.sep+'app'+path.sep)) {
      if(text.trim().split(/\r?\n/).length>10 || tree.statements.some(s=>!ts.isExportDeclaration(s))) errors.push(`${file}: route phải chỉ re-export, tối đa 10 dòng`);
    }
    const feature=file.match(/[\\/]features[\\/]([^\\/]+)/)?.[1];
    for(const node of tree.statements.filter(ts.isImportDeclaration)) {
      const spec=node.moduleSpecifier.text;
      const resolved=spec.startsWith('@/')?path.join(src,spec.slice(2)):spec.startsWith('.')?path.resolve(path.dirname(file),spec):'';
      const other=resolved.match(/[\\/]features[\\/]([^\\/]+)/)?.[1];
      if(feature && other && feature!==other) errors.push(`${file}: import chéo ${spec}`);
      if(!feature && /[\\/](components|lib)[\\/]/.test(file) && other) errors.push(`${file}: import ngược tầng ${spec}`);
      if(resolved && !['.ts','.tsx','.web.tsx','.native.tsx','/index.ts','/index.tsx',''].some(ext=>fs.existsSync(resolved+ext))) errors.push(`${file}: import không tồn tại ${spec}`);
    }
    if(!file.endsWith(path.join('config','env.ts')) && /process\.env\.EXPO_PUBLIC_/.test(text)) errors.push(`${file}: đọc env ngoài config/env.ts`);
  }
}
for(const file of walk(path.join(root,'packages/shared/src')).filter(p=>/\.tsx?$/.test(p))) if(/@datxe\/ui|from ['"]react['"]|\.tsx$/.test(fs.readFileSync(file,'utf8')) || file.endsWith('.tsx')) errors.push(`${file}: shared chứa UI`);
if(errors.length){console.error(errors.join('\n'));process.exitCode=1;} else console.log('Architecture passed: thin routes, imports, feature boundaries, environment and shared/UI separation.');
