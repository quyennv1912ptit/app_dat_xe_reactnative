const fs=require('node:fs'),path=require('node:path'),ts=require('typescript');
const root=path.resolve(__dirname,'..');
for(const workspace of ['apps/customer','apps/driver','packages/shared','packages/ui']) {
  const dir=path.join(root,workspace),config=ts.readConfigFile(path.join(dir,'tsconfig.json'),ts.sys.readFile);
  const parsed=ts.parseJsonConfigFileContent(config.config,ts.sys,dir);
  const host={getScriptFileNames:()=>parsed.fileNames,getScriptVersion:()=> '0',getScriptSnapshot:p=>fs.existsSync(p)?ts.ScriptSnapshot.fromString(fs.readFileSync(p,'utf8')):undefined,getCurrentDirectory:()=>dir,getCompilationSettings:()=>parsed.options,getDefaultLibFileName:o=>ts.getDefaultLibFilePath(o),fileExists:ts.sys.fileExists,readFile:ts.sys.readFile,readDirectory:ts.sys.readDirectory};
  const service=ts.createLanguageService(host);
  for(const file of parsed.fileNames.filter(p=>p.replaceAll('\\','/').startsWith(dir.replaceAll('\\','/')+'/src/'))) {
    const changes=service.organizeImports({type:'file',fileName:file},{},{});
    for(const change of changes){let s=fs.readFileSync(change.fileName,'utf8');for(const c of change.textChanges.sort((a,b)=>b.span.start-a.span.start))s=s.slice(0,c.span.start)+c.newText+s.slice(c.span.start+c.span.length);fs.writeFileSync(change.fileName,s);}
  }
  service.dispose();console.log('Organized '+workspace);
}
