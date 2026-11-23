const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
const vm = require('node:vm');

for (const app of ['customer', 'driver']) {
  test(`${app}: registration rejects re-entry before render and retains draft after failure`, async () => {
    const calls = [];
    const routes = [];
    let rejectRequest;
    let resolveRequest;
    const user = { phoneNumber: '+84900000001', displayName: '', email: '', providerData: [] };
    const shared = {
      AuthApiError: class extends Error {}, translate: x => x,
      getFirebaseUser: () => user, resolveVerifiedPhoneNumber: phone => phone,
      getAuthFullNameValidationError: name => name.trim() ? null : 'Thiếu tên',
      registerWithBackend: (role, name) => {
        calls.push({role, name});
        return new Promise((resolve, reject) => {resolveRequest = resolve; rejectRequest = reject;});
      },
    };
    const exports = {};
    const source = fs.readFileSync(`apps/${app}/src/features/auth/hooks/useRegister.ts`, 'utf8');
    vm.runInNewContext(ts.transpileModule(source, {
      compilerOptions: { module: ts.ModuleKind.CommonJS },
    }).outputText, { exports, require: id => {
      if (id === '@datxe/shared') return shared;
      if (id === 'react') return {
        useRef: current => ({current}), useEffect() {},
        useState: value => [typeof value === 'function' ? value() : value, () => {}],
      };
      if (id === 'expo-router') return {
        useRouter: () => ({replace: route => routes.push(route)}),
        useLocalSearchParams: () => ({}),
      };
      if (id === '../components/RegisterScreenParts') return {
        getSignInMethod: () => 'phone', isPastIsoDate: () => true, getErrorMessage: e => e.message,
      };
      if (id === '../api') return {
        getCustomerProfile: async () => ({}), updateCustomerProfile: async () => {},
      };
      throw new Error(id);
    }});
    const form = exports.useRegister();
    // Invalid input must not lock a future valid attempt.
    await form.submit();
    assert.equal(calls.length, 0);
    form.setFullName('Nguyễn Văn An');
    const first = form.submit();
    await form.submit();
    assert.equal(calls.length, 1);
    rejectRequest(new Error('Mất kết nối'));
    await first;
    assert.equal(routes.length, 0);
    const retry = form.submit();
    await form.submit();
    assert.equal(calls.length, 2);
    assert.equal(calls[1].name, 'Nguyễn Văn An');
    resolveRequest();
    await retry;
    assert.equal(routes.length, 1);
  });
}
