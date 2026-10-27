const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const ts=require('typescript');
const axios=require('axios');
const path=require('node:path');
class AuthApiError extends Error {constructor(message,code){super(message);this.code=code;}}
function setup(adapter, user={getIdToken:async force=>force?'fresh-token':'initial-token'}) {
  let unauthorized=0;
  const exports={};
  const source=fs.readFileSync(path.join(__dirname,'../packages/shared/src/api/client.ts'),'utf8');
  const compiled=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,esModuleInterop:true}}).outputText;
  vm.runInNewContext(compiled,{exports,require:name=>name==='axios'?{...axios,default:undefined,create:options=>axios.create({...options,adapter})}:name.includes('authService')?{AuthApiError,getFirebaseUser:()=>user}:require(name)});
  const request=exports.createApiClient('https://example.test/api','CUSTOMER',()=>unauthorized++);
  return {request,unauthorized:()=>unauthorized};
}
function response(config,data,status=200){return {config,data,status,statusText:String(status),headers:{}};}
function rejected(config,status){return new axios.AxiosError('HTTP '+status,'ERR_BAD_REQUEST',config,{},response(config,{success:false,error:{message:'Unauthorized'}},status));}
test('Firebase token, role, idempotency header and JSON body reach the adapter',async()=>{
  const {request}=setup(async config=>{
    assert.equal(config.headers.Authorization,'Bearer initial-token');
    assert.equal(config.headers['X-Role'],'CUSTOMER');
    assert.equal(config.headers['Idempotency-Key'],'booking-1');
    assert.equal(config.data,'{"vehicleId":7}');
    return response(config,{success:true,data:{id:4}});
  });
  assert.equal((await request('/customer/rides',{method:'POST',body:{vehicleId:7},headers:{'Idempotency-Key':'booking-1'}})).id,4);
});
test('401 refreshes Firebase token once and retries the original request',async()=>{
  let calls=0,token='expired',refreshes=0;
  const {request}=setup(async config=>{
    calls++;if(calls===1)throw rejected(config,401);
    assert.equal(config.headers.Authorization,'Bearer fresh');
    return response(config,{success:true,data:42});
  },{getIdToken:async force=>{if(force){refreshes++;token='fresh';}return token;}});
  assert.equal(await request('/customer/profile'),42);assert.equal(calls,2);assert.equal(refreshes,1);
});
test('persistent 401 ends the session without an infinite retry',async()=>{
  let calls=0;const state=setup(async config=>{calls++;throw rejected(config,401);});
  await assert.rejects(state.request('/customer/profile'),error=>error.code==='HTTP_401');
  assert.equal(calls,2);assert.equal(state.unauthorized(),1);
});
test('failed refresh ends the session',async()=>{
  const state=setup(async config=>{throw rejected(config,401);},{getIdToken:async force=>{if(force)throw Error('expired');return 'old';}});
  await assert.rejects(state.request('/customer/profile'),error=>error.code==='HTTP_401');assert.equal(state.unauthorized(),1);
});
test('a nullable active trip is accepted only for allowNull requests',async()=>{
  const {request}=setup(async config=>response(config,{success:true,data:null}));
  assert.equal(await request('/customer/rides/active',{allowNull:true}),null);
  await assert.rejects(request('/customer/profile'),error=>error.code==='INVALID_SERVER_RESPONSE');
});
test('malformed successful response cannot leak into screen data',async()=>{
  const {request}=setup(async config=>response(config,'not-an-envelope'));
  await assert.rejects(request('/customer/profile'),error=>error.code==='INVALID_SERVER_RESPONSE');
});
test('network failure becomes a consistent app error',async()=>{
  const {request}=setup(async config=>{throw new axios.AxiosError('offline','ERR_NETWORK',config);});
  await assert.rejects(request('/customer/profile'),error=>error.code==='NETWORK_ERROR');
});
test('missing user never sends a request',async()=>{
  let sent=false;const {request}=setup(async()=>{sent=true;},null);
  await assert.rejects(request('/customer/profile'),error=>error.code==='NO_AUTH_USER');assert.equal(sent,false);
});
