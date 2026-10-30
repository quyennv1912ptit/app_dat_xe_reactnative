import { StyleSheet } from 'react-native';
import type { useThemeColors } from '@datxe/ui';
export const accountStyles=(c:ReturnType<typeof useThemeColors>)=>StyleSheet.create({
 safe:{flex:1,backgroundColor:c.background},content:{padding:20,gap:20,paddingBottom:32},intro:{fontSize:14,lineHeight:22,color:c.onSurfaceVariant},
 section:{fontSize:11,fontWeight:'700',letterSpacing:1,color:c.onSurfaceVariant},card:{padding:20,borderRadius:20,backgroundColor:c.surfaceContainerLowest,borderWidth:1,borderColor:c.outlineVariant,gap:18},
 row:{flexDirection:'row',alignItems:'center',gap:14},icon:{width:48,height:48,borderRadius:16,backgroundColor:c.primaryFixedTint,alignItems:'center',justifyContent:'center'},title:{fontSize:17,fontWeight:'700',color:c.onSurface},label:{fontSize:14,fontWeight:'600',color:c.onSurface},
 input:{minHeight:52,borderWidth:1,borderColor:c.outlineVariant,borderRadius:14,paddingHorizontal:14,color:c.onSurface,backgroundColor:c.surfaceContainerLow,fontSize:16},field:{gap:8},choices:{flexDirection:'row',gap:10,flexWrap:'wrap'},choice:{paddingVertical:12,paddingHorizontal:18,borderRadius:12,borderWidth:1,borderColor:c.outlineVariant},selected:{backgroundColor:c.primaryFixedTint,borderColor:c.primary},choiceText:{fontSize:14,color:c.onSurface},error:{fontSize:14,lineHeight:21,color:c.error},footer:{padding:20,borderTopWidth:1,borderTopColor:c.outlineVariant,backgroundColor:c.surfaceContainerLowest,gap:10},
});
