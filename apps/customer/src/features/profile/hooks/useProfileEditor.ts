import { useMutation,useQuery,useQueryClient } from '@tanstack/react-query';
import { getCustomerProfile,updateCustomerProfile } from '../api';
import { profileUpdate,cashPaymentUpdate,type ProfileDraft } from '../profileForm';
export function useProfileEditor(){
 const client=useQueryClient();
 const query=useQuery({queryKey:['customer','getCustomerProfile'],queryFn:getCustomerProfile});
 const save=useMutation({mutationFn:async(draft:ProfileDraft|'CASH')=>{const latest=await getCustomerProfile();return updateCustomerProfile(draft==='CASH'?cashPaymentUpdate(latest):profileUpdate(draft,latest));},onSuccess:profile=>{client.setQueryData(['customer','getCustomerProfile'],profile);}});
 return {query,save};
}
