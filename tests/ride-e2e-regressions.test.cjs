const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');

function load(file, mocks = {}) {
  const exports = {};
  vm.runInNewContext(ts.transpileModule(fs.readFileSync(file, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX },
  }).outputText, {
    exports, URLSearchParams,
    require: name => {
      if (name in mocks) return mocks[name];
      throw Error(name);
    },
  });
  return exports;
}

test('customer history keeps status, address search and date range on subsequent pages', async () => {
  const { createCustomerApi } = load('packages/shared/src/api/customer.ts');
  const api = createCustomerApi(async url => new URL(url, 'https://test.invalid').searchParams);
  const params = await api.getCustomerRides(2, 20, 'COMPLETED', {
    q: '  Cầu Giấy ', createdFrom: '2026-11-01T00:00:00Z', createdTo: '2026-11-18T00:00:00Z',
  });
  assert.deepEqual(Object.fromEntries(params), {
    page: '2', size: '20', status: 'COMPLETED', q: 'Cầu Giấy',
    createdFrom: '2026-11-01T00:00:00Z', createdTo: '2026-11-18T00:00:00Z',
  });
});

test('successful cancellation clears the matching active ride before returning home, and a failed cancellation preserves it', async () => {
  const events = [];
  let activeRide = { id: 42, status: 'SEARCHING' };
  let mutation;
  const { useCustomerRideCancellation } = load('apps/customer/src/lib/useCustomerRideCancellation.ts', {
    '@tanstack/react-query': {
      useMutation: options => { mutation = options; return {}; },
      useQueryClient: () => ({
        cancelQueries: async () => { events.push('cancel refetch'); },
        setQueryData: (key, update) => {
          assert.equal(key.join('/'), 'customer/getActiveCustomerRide');
          activeRide = update(activeRide);
        },
        invalidateQueries: () => events.push('invalidate'),
      }),
    },
    'expo-router': { useRouter: () => ({ canDismiss: () => false, dismissAll: () => {}, replace: () => events.push(activeRide?.id ?? 'home without ride') }) },
    react: { useState: value => [value, () => {}], useRef: current => ({ current }) },
    'react-native': { Keyboard: {} },
    './rideNavigation': load('apps/customer/src/lib/rideNavigation.ts'),
    './customerApi': { customerApi: {} },
    './store': { useSessionStore: { getState: () => ({}) } },
  });
  useCustomerRideCancellation(activeRide, () => events.push('refresh'));
  mutation.onError();
  assert.equal(activeRide.id, 42);
  await mutation.onSuccess({}, { id: 42 });
  assert.equal(activeRide, null);
  assert.deepEqual(events, ['refresh', 'cancel refetch', 'home without ride', 'invalidate']);
  activeRide = { id: 43 };
  await mutation.onSuccess({}, { id: 42 });
  assert.equal(activeRide.id, 43);
});

test('driver rating sends only stars and the optional comment to the ride endpoint', async () => {
  const { rateRideCustomer } = load('apps/driver/src/features/ride/api.ts', {
    '@/lib/api': { request: async (url, options) => ({ url, ...options }) },
  });
  const request = await rateRideCustomer(42, 4, '  ');
  assert.equal(request.url, '/driver/rides/42/rating');
  assert.equal(request.method, 'POST');
  assert.equal(request.body.stars, 4);
  assert.equal(request.body.comment, null);
  assert.equal((await rateRideCustomer(42, 5, '  Đúng giờ  ')).body.comment, 'Đúng giờ');
  assert.deepEqual((await rateRideCustomer(42, 5, '  Đúng giờ  ', ['Khách lịch sự'])).body.tags, ['Khách lịch sự']);
});

test('driver can skip, cannot submit twice while sending, and sees server-confirmed ratings as read-only', () => {
  const jsx = (type, props) => ({ type, props });
  const state = [];
  const refs = [];
  let stateIndex = 0;
  let refIndex = 0;
  let submits = 0;
  const { RideCustomerRating } = load('apps/driver/src/features/ride/components/RideCustomerRating.tsx', {
    'react/jsx-runtime': { jsx, jsxs: jsx },
    '@datxe/shared': {},
    '@datxe/ui': {
      Button: 'Button', Card: 'Card', FilterChip: 'FilterChip', MotionPressable: 'Radio', PaperTextInput: 'Input',
      Typography: 'Text', spacing: {}, typography: {}, useThemeColors: () => ({}),
    },
    '@expo/vector-icons': { MaterialIcons: 'Icon' },
    '@tanstack/react-query': {
      useQueryClient: () => ({}),
      useMutation: () => ({ mutate: () => submits++ }),
    },
    react: {
      useState: initial => {
        const i = stateIndex++;
        if (!(i in state)) state[i] = initial;
        return [state[i], value => { state[i] = value; }];
      },
      useRef: current => refs[refIndex++] ??= { current },
    },
    'react-native': { StyleSheet: { create: value => value }, View: 'View' },
    '../api': {},
  });
  const render = (rated, existingRating = null) => {
    stateIndex = 0;
    refIndex = 0;
    return RideCustomerRating({ rideId: 42, rated, existingRating });
  };
  const find = (node, predicate) => {
    if (node == null || typeof node !== 'object') return;
    if (Array.isArray(node)) return node.map(child => find(child, predicate)).find(Boolean);
    if (predicate(node)) return node;
    return find(node.props.children, predicate);
  };
  const button = label => find(render(false), node => node.props.label === label);
  assert.equal(button('Gửi đánh giá').props.disabled, true);
  find(render(false), node => node.props.accessibilityLabel === '5 sao').props.onPress();
  const submit = button('Gửi đánh giá');
  assert.equal(submit.props.disabled, false);
  submit.props.onPress();
  submit.props.onPress();
  assert.equal(submits, 1);
  button('Bỏ qua').props.onPress();
  assert.equal(render(false), null);
  assert.ok(find(render(true), node => node.props.children === 'Đã đánh giá khách hàng'));
  assert.equal(find(render(true), node => node.props.label === 'Gửi đánh giá'), undefined);
  const detailed = render(true, { stars: 4, comment: 'Rất thân thiện', tags: ['Đúng giờ hẹn'] });
  assert.ok(find(detailed, node => node.props.children === 'Đúng giờ hẹn'));
  assert.ok(find(detailed, node => node.props.children === 'Rất thân thiện'));
});

const { ridePresentation } = load('apps/driver/src/features/ride/ridePresentation.ts');
const plan = (status, reports = [], synchronized = true) =>
  ridePresentation({ status, handoverReports: reports }, synchronized);

test('each active stage has only its own driving, handover and cancellation actions', () => {
  const expected = [
    ['DRIVER_ASSIGNED', 'start-arriving', 'pickup', true],
    ['DRIVER_ARRIVING', 'arrived', 'pickup', true],
    ['DRIVER_ARRIVED', 'pickup', undefined, true],
    ['VEHICLE_HANDOVER', undefined, undefined, true],
    ['IN_PROGRESS', 'arrive-destination', 'dropoff', false],
    ['ARRIVED_DESTINATION', 'dropoff', undefined, false],
    ['VEHICLE_RETURNED', undefined, undefined, false],
  ];
  for (const [status, action, navigation, cancel] of expected) {
    const phase = plan(status);
    assert.equal(phase.action?.endpoint ?? phase.action?.stop, action, status);
    assert.equal(phase.navigation, navigation, status);
    assert.equal(phase.canCancel, cancel, status);
    assert.ok(phase.handovers.every(item => !item.report));
  }
  for (const status of ['PENDING', 'SEARCHING', 'COMPLETED', 'CANCELLED', 'NO_DRIVER_FOUND', 'EXPIRED', 'FAILED_SYSTEM', 'constructor']) {
    assert.equal(plan(status), null, status);
  }
  assert.equal(ridePresentation(null), null);
  assert.equal(ridePresentation(undefined), null);
});

test('pickup and return actions require the respective customer confirmation', () => {
  const pickup = { phase: 'PICKUP', confirmedByCustomer: false };
  const dropoff = { phase: 'DROPOFF', confirmedByCustomer: false };
  assert.match(plan('VEHICLE_HANDOVER', [pickup]).notice, /Chờ khách.*nhận xe/);
  assert.equal(plan('VEHICLE_HANDOVER', [pickup]).action, undefined);
  assert.equal(plan('VEHICLE_HANDOVER', [dropoff]).action, undefined);
  assert.equal(plan('VEHICLE_HANDOVER', [{ ...pickup, confirmedByCustomer: true }]).action.endpoint, 'start');
  assert.match(plan('VEHICLE_RETURNED', [pickup, dropoff]).notice, /Chờ khách.*trả xe/);
  assert.equal(plan('VEHICLE_RETURNED', [pickup, dropoff]).action, undefined);
  assert.equal(plan('VEHICLE_RETURNED', [pickup, { ...dropoff, confirmedByCustomer: true }]).action.endpoint, 'complete');

  const correction = { ...dropoff, correctionReason: 'Ảnh mờ' };
  const phase = plan('VEHICLE_RETURNED', [pickup, correction]);
  assert.equal(phase.action.kind, 'inspection');
  assert.equal(phase.action.stop, 'dropoff');
  assert.equal(phase.handovers.find(item => item.stop === 'pickup').editable, false);
});

test('failed or paused synchronization preserves report context and suppresses actions until recovery', () => {
  const pickup = { phase: 'PICKUP', confirmedByCustomer: true };
  for (const status of ['DRIVER_ASSIGNED', 'DRIVER_ARRIVING', 'DRIVER_ARRIVED', 'VEHICLE_HANDOVER', 'IN_PROGRESS', 'ARRIVED_DESTINATION', 'VEHICLE_RETURNED']) {
    const stale = plan(status, [pickup], false);
    assert.equal(stale.action, undefined);
    assert.equal(stale.navigation, undefined);
    assert.equal(stale.canCancel, false);
    assert.ok(stale.handovers.every(item => !item.editable));
    assert.equal(stale.handovers[0].report, pickup);
  }
  assert.equal(plan('VEHICLE_HANDOVER', [pickup], true).action.endpoint, 'start');
});
