import en from './en.json';
export type Language='vi'|'en';
let language:Language='vi';
const listeners=new Set<()=>void>();
export const getLanguage=()=>language;
export const getLocale=()=>language==='en'?'en-US':'vi-VN';
export function setLanguage(next:Language){if(next===language)return;language=next;listeners.forEach(listener=>listener());}
export function subscribeLanguage(listener:()=>void){listeners.add(listener);return()=>{listeners.delete(listener);};}
const catalog:Record<string,string>=en;
const normalize=(value:string)=>value.replace(/&amp;/g,'&').replace(/\s+/g,' ').trim();
const normalized=new Map(Object.entries(catalog).map(([key,value])=>[normalize(key),value]));
const escape=(value:string)=>value.replace(/[.*+?^$()|[\]\\]/g,'\\$&');
const patterns=Object.entries(catalog).filter(([key])=>/\{\d+\}/.test(key)).sort((a,b)=>b[0].replace(/\{\d+\}/g,'').length-a[0].replace(/\{\d+\}/g,'').length).map(([key,value])=>{const keys:string[]=[];let source='',last=0;for(const match of key.matchAll(/\{(\d+)\}/g)){source+=escape(key.slice(last,match.index))+'(.*?)';keys.push(match[1]);last=match.index!+match[0].length;}source+=escape(key.slice(last));return {regex:new RegExp('^'+source+'$'),keys,value};});
export function translate<T>(input:T,params?:Record<string,unknown>):T {
 if(typeof input!=='string')return input;
 let value:string=input;
 if(language==='en'){
   value=catalog[input]??normalized.get(normalize(input))??input;
   if(value===input&&!params){for(const pattern of patterns){const match=input.match(pattern.regex);if(match){value=pattern.value.replace(/\{(\d+)\}/g,(_,key)=>match[pattern.keys.indexOf(key)+1]??'');break;}}}
 }
 if(params)value=value.replace(/\{(\d+)\}/g,(_,key)=>String(params[key]??''));
 return value as T;
}
