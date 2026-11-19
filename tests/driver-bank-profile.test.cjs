const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const jsx = (type, props) => ({ type, props });
const all = node => !node || typeof node !== 'object' ? [] : Array.isArray(node) ? node.flatMap(all) : [node, ...all(node.props?.children)];
function fixture(bankError = null) {
  const state = [], refs = [], writes = [], invalidations = [];
  let index = 0, refIndex = 0;
  const user = { id: 7, fullName: 'Nguyễn Văn An', email: null };
  const exports = {};
  let mutation;
  const mocks = {
    'react/jsx-runtime': { jsx, jsxs: jsx, Fragment: 'Fragment' },
    react: {
      useState: initial => { const i = index++; if (!(i in state)) state[i] = initial; return [state[i], value => state[i] = value]; },
      useRef: initial => { const i = refIndex++; return refs[i] ??= { current: initial }; },
    },
    'react-native': { StyleSheet: { create: value => value } },
    'expo-router': { useRouter: () => ({ canGoBack: () => true, back() {} }) },
    '@/components/DriverPage': { DriverPage: 'Page' },
    '@/lib/api': { request() {} },
    '@/lib/store': { useSessionStore: { getState: () => ({ user, setUser() {} }) } },
    '@/lib/driverApi': { driverApi: { profile() {} } },
    '../api': { updateDriverIdentity: async body => { writes.push(body); return body; } },
    '@datxe/shared': { AUTH_FULL_NAME_MAX_LENGTH: 120, getAuthFullNameValidationError: name => name.trim() ? null : 'Thiếu họ tên' },
    '@datxe/ui': { Button: 'Button', Card: 'Card', PaperTextInput: 'Input', SectionHeading: 'Heading', Typography: 'Text', useThemeColors: () => ({}) },
    '@tanstack/react-query': {
      useQuery: ({ queryKey }) => queryKey.includes('session') ? { data: user } : { data: { id: 7, bank_name: null, bank_account_number: null }, isError: Boolean(bankError), error: bankError },
      useQueryClient: () => ({ setQueryData() {}, invalidateQueries: async value => invalidations.push(value.queryKey) }),
      useMutation: options => { mutation = options; return { mutate: value => options.mutationFn(value), isPending: false }; },
    },
  };
  vm.runInNewContext(ts.transpileModule(fs.readFileSync('apps/driver/src/features/profile/screens/EditDriverProfileScreen.tsx', 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX },
  }).outputText, { exports, require: name => { if (!(name in mocks)) throw Error(name); return mocks[name]; } });
  const render = () => { index = 0; refIndex = 0; return all(exports.default()); };
  return { render, writes, invalidations, saved: async () => mutation.onSuccess({ fullName: user.fullName, email: null }, { id: 7 }) };
}
test('driver can save bank information without license data and account leading zeroes survive', async () => {
  const f = fixture();
  let nodes = f.render();
  nodes.find(n => n.props?.label === 'Tên ngân hàng').props.onChangeText(' Vietcombank ');
  nodes = f.render();
  assert.equal(nodes.find(n => n.props?.label === 'Lưu thông tin').props.disabled, true);
  nodes.find(n => n.props?.label === 'Số tài khoản').props.onChangeText(' 00123456789 ');
  nodes = f.render();
  const save = nodes.find(n => n.props?.label === 'Lưu thông tin');
  assert.equal(save.props.disabled, false);
  await save.props.onPress();
  assert.equal(f.writes[0].bankName, 'Vietcombank');
  assert.equal(f.writes[0].bankAccountNumber, '00123456789');
  assert.equal('license_number' in f.writes[0], false);
  await f.saved();
  assert.equal(f.invalidations[0][0], 'driver');
});
test('failed bank profile load cannot render an empty editable form that overwrites bank details', () => {
  const nodes = fixture(new Error('Không tải được hồ sơ')).render();
  assert.equal(nodes.some(n => n.props?.label === 'Lưu thông tin'), false);
  assert.match(nodes.find(n => n.type === 'Page').props.error, /Không tải được/);
});
