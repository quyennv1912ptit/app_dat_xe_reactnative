import { useFocusEffect } from 'expo-router';
import { useCallback } from 'react';
export function useRefreshOnFocus(refetch: () => unknown) { useFocusEffect(useCallback(() => { void refetch(); }, [refetch])); }
