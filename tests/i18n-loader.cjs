const fs=require('node:fs'),vm=require('node:vm'),ts=require('typescript');
const exports_={};
vm.runInNewContext(ts.transpileModule(fs.readFileSync('packages/shared/src/i18n/index.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,esModuleInterop:true}}).outputText,{exports:exports_,require:n=>n==='./en.json'?require('../packages/shared/src/i18n/en.json'):require(n)});
module.exports=exports_;
