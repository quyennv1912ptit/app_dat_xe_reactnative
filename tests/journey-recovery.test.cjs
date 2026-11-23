const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
const vm = require('node:vm');
const tick = () => new Promise(resolve => setImmediate(resolve));
function load(file, requireMock) {
  const exports = {};
  vm.runInNewContext(ts.transpileModule(fs.readFileSync(file, 'utf8'), {
    compilerOptions: {module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX},
  }).outputText, {exports, require: requireMock, URLSearchParams});
  return exports;
}
for (const app of ['customer', 'driver']) {
  test(`${app} support pagination exposes the next page and prevents concurrent fetches`, () => {
    let calls = 0;
    const query = {data: {pages: [[{id: 1}], [{id: 1}, {id: 2}]]}, hasNextPage: true,
      isFetchingNextPage: false, fetchNextPage: () => {calls++;}};
    const {useTickets} = load(`apps/${app}/src/lib/useTickets.ts`, id => {
      if (id === '@datxe/shared') return {createTicketApi: () => ({})};
      if (id === '@tanstack/react-query') return {useInfiniteQuery: () => query};
      if (id === './api') return {};
      if (id === './store') return {useSessionStore: select => select({user: {id: 5}})};
      if (id === './useRefreshOnFocus') return {useRefreshOnFocus() {}};
      throw Error(id);
    });
    const result = useTickets();
    assert.equal(result.items.length, 2);
    assert.equal(result.hasNext, true);
    result.loadMore();
    assert.equal(calls, 1);
    query.isFetchingNextPage = true;
    result.loadMore();
    assert.equal(calls, 1);
  });
}
test('support history sends the oldest visible message as a cursor and retains the array contract', async () => {
  const {createTicketApi} = load('packages/shared/src/api/tickets.ts', () => {});
  const received = [{id: 4}, {id: 5}];
  const paths = [];
  const api = createTicketApi(async path => {
    paths.push(path);
    return received;
  });
  assert.equal(await api.messages(42), received);
  assert.equal(await api.messages(42, 6), received);
  assert.deepEqual(paths, ['/tickets/42/messages', '/tickets/42/messages?beforeId=6']);
});
for (const accept of [true, false]) {
  test(`startup location explanation requests OS permission only after acceptance=${accept}`, async () => {
    let effect, buttons, requests = 0;
    const api = load('packages/ui/src/useStartupLocationPermission.ts', id => {
      if (id === 'react') return {useEffect: fn => {effect = fn;}};
      if (id === 'react-native') return {
        Platform: {OS: 'android'}, Alert: {alert: (_title, _body, actions) => {buttons = actions;}},
        AppState: {currentState: 'active', addEventListener: () => ({remove() {}})},
      };
      throw Error(id);
    });
    const permission = {granted: false, canAskAgain: true, status: 'undetermined'};
    api.useStartupLocationPermission(true, {
      getForegroundPermissionsAsync: async () => permission,
      requestForegroundPermissionsAsync: async () => {requests++; return {...permission, granted: true};},
    }, 'Vị trí giúp chọn điểm đón.');
    const cleanup = effect();
    await tick();
    assert.equal(requests, 0);
    assert.equal(buttons.length, 2);
    buttons[accept ? 1 : 0].onPress();
    await tick();
    assert.equal(requests, accept ? 1 : 0);
    cleanup();
  });
}
test('startup location does not prompt again after denial and ignores a stale permission response', async () => {
  for (const stale of [false, true]) {
    let effect, resolvePermission, prompts = 0;
    const api = load('packages/ui/src/useStartupLocationPermission.ts', id => id === 'react'
      ? {useEffect: fn => {effect = fn;}}
      : {Platform: {OS: 'android'}, Alert: {alert: () => {prompts++;}},
        AppState: {currentState: 'active', addEventListener: () => ({remove() {}})}});
    api.useStartupLocationPermission(true, {
      getForegroundPermissionsAsync: () => new Promise(resolve => {resolvePermission = resolve;}),
      requestForegroundPermissionsAsync: () => assert.fail('unexpected OS prompt'),
    }, 'Vị trí');
    const cleanup = effect();
    if (stale) cleanup();
    resolvePermission({granted: false, canAskAgain: stale, status: stale ? 'undetermined' : 'denied'});
    await tick();
    assert.equal(prompts, 0);
    cleanup();
  }
});
const jsx = (type, props) => ({type, props});
const all = n => Array.isArray(n) ? n.flatMap(all) : n && typeof n === 'object'
  ? [n, ...all(n.props?.children)] : [];
function uiMocks(id) {
  if (id === 'react/jsx-runtime') return {jsx, jsxs: jsx};
  if (id === '@datxe/shared') return {translate: x => x};
  if (id === 'react-native') return {View: 'View', FlatList: 'List', RefreshControl: 'Refresh', StyleSheet: {create: x => x}};
  if (id === '@expo/vector-icons') return {MaterialIcons: 'Icon'};
  if (id === 'react-native-paper') return {ActivityIndicator: 'Spinner', Menu: Object.assign('Menu', {Item: 'Item'})};
  if (id.endsWith('ThemeProvider')) return {useThemedStyles: () => new Proxy({}, {get: () => ({})})};
  if (id.endsWith('useLanguage')) return {useLanguage() {}};
  if (id.endsWith('colors')) return {};
  const name = id.split('/').at(-1);
  return {[name]: name === 'MotionPressable' ? 'Pressable' : name, MotionPressable: 'Pressable'};
}
test('support list keeps retry state distinct from empty and exposes the next page action', () => {
  const {TicketList} = load('packages/ui/src/tickets/TicketList.tsx', uiMocks);
  let more = 0;
  const list = all(TicketList({tickets: [], error: 'Mất kết nối', hasNext: true,
    onLoadMore: () => {more++;}})).find(n => n.type === 'List');
  assert.equal(list.props.ListEmptyComponent, undefined);
  list.props.ListFooterComponent.props.onPress();
  assert.equal(more, 1);
});
test('support creation blocks same-frame duplicate sends and retains fields after failure', async () => {
  const values = ['TRIP', '7', 'Thông tin thanh toán chưa đúng', false, ''];
  const changes = [];
  let cursor = 0, rejectRequest, calls = 0;
  const {TicketCreate} = load('packages/ui/src/tickets/TicketCreate.tsx', id => id === 'react'
    ? {useState: () => {const i = cursor++; return [values[i], v => changes.push([i, v])];}, useRef: current => ({current})}
    : uiMocks(id));
  const tree = TicketCreate({onSubmit: () => {calls++; return new Promise((_resolve, reject) => {rejectRequest = reject;});}});
  const button = all(tree).find(n => n.type === 'Button');
  button.props.onPress();
  button.props.onPress();
  assert.equal(calls, 1);
  rejectRequest(Error('Mất mạng'));
  await tick();
  assert.equal(changes.some(([i]) => i === 1 || i === 2), false);
  button.props.onPress();
  assert.equal(calls, 2);
  rejectRequest(Error('Mất mạng'));
  await tick();
});

for (const ticketId of [17, -1]) {
  test(`customer inbox opens support conversation or safe list for ticketId=${ticketId}`, async () => {
    const routes = [];
    const {useNotification} = load('apps/customer/src/features/notifications/hooks/useNotification.ts', id => {
      if (id === '@datxe/shared') return {translate: x => x, positiveId: x => Number.isSafeInteger(x) && x > 0 ? x : null};
      if (id === '@datxe/ui') return {localizedAlert: () => assert.fail('unexpected alert')};
      if (id === 'react') return {useState: x => [x, () => {}]};
      if (id === 'expo-router') return {useRouter: () => ({push: route => routes.push(route)})};
      if (id === '@tanstack/react-query') return {
        useQuery: ({queryKey}) => ({data: queryKey[1] === 'getCustomerNotifications' ? [] : 0}),
        useQueryClient: () => ({}),
      };
      if (id === '@/lib/useRefreshOnFocus') return {useRefreshOnFocus() {}};
      if (id === '@/lib/useScreenFocused') return {useScreenFocused: () => true};
      if (id === '../components/NotificationScreenParts') return {category: () => 'trip'};
      if (id === '../api') return {};
      throw Error(id);
    });
    await useNotification().openNotification({id: 1, readAt: '2026-11-22', type: 'TICKET_REPLY', payload: {ticketId}});
    assert.equal(routes.length, 1);
    if (ticketId > 0) {
      assert.equal(routes[0].pathname, '/tickets/[id]');
      assert.equal(routes[0].params.id, '17');
    } else assert.equal(routes[0], '/tickets');
  });
}

test('support chat retains unsent content while request is pending and allows retry after failure', async () => {
  let cursor = 0, calls = 0, rejectRequest;
  const changes = [];
  const keys = [];
  const values = ['Tôi cần kiểm tra khoản thanh toán', null, false, '', null];
  const {TicketChat} = load('packages/ui/src/tickets/TicketChat.tsx', id => {
    if (id === 'react') return {
      useMemo: fn => fn(), useRef: current => ({current}),
      useState: () => {const i = cursor++; return [values[i], value => changes.push([i, value])];},
    };
    if (id === '../motion') return {useReducedMotion: () => true};
    if (id === '@datxe/shared') return {...uiMocks(id), createTicketMessageId: () => `message-${keys.length + 1}`};
    if (id === 'expo-image') return {Image: 'Image'};
    if (id === 'react-native-paper') return {Appbar: {Header: 'Header', BackAction: 'Back'}, IconButton: 'IconButton'};
    return uiMocks(id);
  });
  const tree = TicketChat({messages: [], currentRole: 'CUSTOMER', ticket: null,
    onSend: ({clientMessageId}) => {
      calls++;
      keys.push(clientMessageId);
      return new Promise((_resolve, reject) => {rejectRequest = reject;});
    }});
  const send = all(tree).find(n => n.type === 'IconButton' && n.props.icon === 'send');
  send.props.onPress();
  send.props.onPress();
  assert.equal(calls, 1);
  assert.equal(changes.some(([i, value]) => i === 0 && value === ''), false);
  rejectRequest(Error('Mất mạng'));
  await tick();
  assert.ok(changes.some(([i, value]) => i === 0 && value === values[0]));
  send.props.onPress();
  assert.equal(calls, 2);
  assert.deepEqual(keys, ['message-1', 'message-1']);
  rejectRequest(Error('Mất mạng'));
  await tick();
});
