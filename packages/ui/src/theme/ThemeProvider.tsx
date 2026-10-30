import { createContext, useContext, useMemo, type ReactNode } from 'react';
import { colors } from './colors';
import { useColorScheme } from 'react-native';
export type ThemeMode = 'system' | 'light' | 'dark';
const light = { background:'#f7f9fb', surface:'#ffffff', card:'#ffffff', text:'#182230', textSecondary:'#667085', border:'#e4e7ec', primary:'#004ac6', danger:'#ba1a1a' };
const dark = { background:'#0D121B', surface:'#141D2B', card:'#1B2738', text:'#EAF0FA', textSecondary:'#A7B5CC', border:'#304058', primary:'#9DBEFF', danger:'#FFB4AB' };
const Context = createContext({ tokens:light, dark:false });
export function ThemeProvider({ mode, children }: { mode:ThemeMode; children:ReactNode }) {

 const system = useColorScheme(); const isDark = mode === 'dark' || (mode === 'system' && system === 'dark');
 return <Context.Provider value={{ tokens:isDark ? dark : light, dark:isDark }}>{children}</Context.Provider>;
}
export const useTheme = () => useContext(Context);

const darkColors = {
 ...colors,
 background:dark.background, surface:dark.background, surfaceDim:dark.background,
 surfaceBright:'#25344A', surfaceContainerLowest:dark.surface,
 surfaceContainerLow:dark.card, surfaceContainer:'#202E42', surfaceContainerHigh:'#26364D', surfaceContainerHighest:'#30425B', surfaceVariant:'#26364D',
 onSurface:dark.text,onBackground:dark.text,onSurfaceVariant:dark.textSecondary,
 outline:'#7788A2',outlineVariant:dark.border, primary:dark.primary, primaryContainer:'#285CC4', onPrimary:'#FFFFFF',onPrimaryContainer:'#FFFFFF',
 primarySoft:'#172C4C',primaryFixed:'#213C63',primaryFixedDim:'#365784',primaryFixedTint:'#172C4C',primaryFixedTintSoft:'#14243C',onPrimaryFixed:'#D8E7FF',onPrimaryFixedVariant:'#BDD4FF',
 secondary:'#B9C7E0',secondaryContainer:'#2B3C56',onSecondaryContainer:'#D5E3FA',secondaryFixed:'#243651',secondaryFixedDim:'#3A506F',onSecondaryFixed:'#EAF0FA',onSecondaryFixedVariant:'#BDCCE3',
 tertiary:'#F3C16C',tertiaryContainer:'#69491D',onTertiaryContainer:'#FFE4B9',tertiaryFixed:'#3B2D1E',tertiaryFixedDim:'#79572C',onTertiaryFixed:'#FFE4B9',onTertiaryFixedVariant:'#F3C16C',
 error:dark.danger,errorContainer:'#442526',onErrorContainer:'#FFDAD6',success:'#6DDBA5',successStrong:'#6DDBA5',successContainer:'#16392D',onSuccessContainer:'#A4F1C8',
 inverseSurface:'#DAE3F1',inverseOnSurface:'#192332',
 surface80:'rgba(13,18,27,0.8)',surface85:'rgba(13,18,27,0.85)',surface20:'rgba(13,18,27,0.2)',surfaceContainerLowest95:'rgba(20,29,43,0.95)',surfaceContainerLowest90:'rgba(20,29,43,0.9)',
 primary10:'rgba(157,190,255,0.10)',primary15:'rgba(157,190,255,0.15)',primaryFixed50:'#1C3354',primaryFixed40:'#1B304E',primaryFixed30:'#172A45',primaryFixed20:'#16243A',
 secondaryFixed40:'#22324A',secondaryFixed50:'#273851',secondaryContainer40:'#22324A',tertiaryFixed40:'#3B2D1E',surfaceContainerLow50:'#182436',surfaceContainerHigh60:'#24334A',surfaceContainerHighest60:'#2D3E55',
 cardShadow:'rgba(0,0,0,0.20)',cardShadowStrong:'rgba(0,0,0,0.32)',headerShadow:'rgba(0,0,0,0.12)',navShadow:'rgba(0,0,0,0.22)',
};
export function useThemeColors(): { [K in keyof typeof colors]: string } { const {dark}=useTheme(); return dark ? darkColors : colors; }

// Convert legacy styles once per theme, keeping light layouts and native map colors intact.
export function resolveThemeColor(value:string, property:string, isDark:boolean):string {
 if(!isDark)return value;
 const lower=value.toLowerCase();
 const entries=Object.entries(colors);
 const token=entries.find(([key,color])=>color.toLowerCase()===lower && !['onPrimary','onSecondary','onTertiary','onError'].includes(key));
 if(token && token[0] in darkColors) {
   if(property==='backgroundColor' && token[0]==='primary')return darkColors.primaryContainer;
   if(lower==='#ffffff')return property==='backgroundColor'?dark.surface:property.toLowerCase().includes('border')?dark.border:value;
   return darkColors[token[0] as keyof typeof darkColors];
 }
 if(['#fff','#ffffff'].includes(lower))return property==='backgroundColor'?dark.surface:property.toLowerCase().includes('border')?dark.border:value;
 if(['#f5f7fa','#f9fafb','#f8fafc','#f2f4f7','#f3f4f6','#f5f5f5'].includes(lower))return property==='backgroundColor'?dark.background:dark.text;
 if(['#182230','#101828','#111827','#1d2939','#344054','#475467','#0f172a','#1f2937'].includes(lower))return property==='backgroundColor'?dark.card:dark.text;
 if(['#667085','#64748b','#6b7280','#98a2b3','#94a3b8'].includes(lower))return dark.textSecondary;
 if(['#eaecf0','#e4e7ec','#e5e7eb','#d0d5dd','#cbd5e1'].includes(lower))return dark.border;
 if(['#edf6ff','#eff6ff','#eff8ff','#e0f2fe','#dbeafe','#e9f0f3'].includes(lower))return '#172C4C';
 if(['#ecfdf3','#ecfdf5','#f0fdf4','#dcfce7','#d1fadf'].includes(lower))return '#16392D';
 if(['#fef3f2','#fef2f2','#fee4e2','#fee2e2'].includes(lower))return '#442526';
 if(['#fffaeb','#fffbeb','#fef3c7'].includes(lower))return '#3B2D1E';
 if(['#b42318','#d92d20','#f04438','#dc2626'].includes(lower))return property==='backgroundColor'?value:dark.danger;
 if(['#039855','#027a48','#15803d','#12b76a'].includes(lower))return property==='backgroundColor'?value:'#6DDBA5';
 return value;
}
export function useThemeColor(){const {dark}=useTheme();return useMemo(()=>(value:string,property='color')=>resolveThemeColor(value,property,dark),[dark]);}
export function useThemedStyles<T extends Record<string,object>>(base:T):T {
 const {dark}=useTheme();
 return useMemo(()=>{
  if(!dark)return base;
  return Object.fromEntries(Object.entries(base).map(([key,style])=>[key,Object.fromEntries(Object.entries(style).map(([property,value])=>[property,typeof value==='string' && /color$/i.test(property)?resolveThemeColor(value,property,true):value]))])) as T;
 },[base,dark]);
}
