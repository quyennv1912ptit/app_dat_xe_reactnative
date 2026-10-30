import { useSyncExternalStore } from 'react';
import { getLanguage,subscribeLanguage,translate } from '@datxe/shared';
export function useLanguage(){return useSyncExternalStore(subscribeLanguage,getLanguage,getLanguage);}
export function useTranslation(){useLanguage();return translate;}
