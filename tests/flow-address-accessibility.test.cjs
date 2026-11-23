const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const jsx = (type, props) => ({type, props});
const nodes = value => Array.isArray(value) ? value.flatMap(nodes)
  : value && typeof value === 'object' ? [value, ...nodes(value.props?.children)] : [];
function load(file) {
  const exports = {};
  const ui = {
    Typography: 'Text', MotionPressable: 'Pressable', Button: 'Button', Card: 'Card',
    typography: {}, useLanguage() {}, useThemeColors: () => ({}), useThemedStyles: () => ({}),
  };
  vm.runInNewContext(ts.transpileModule(fs.readFileSync(file, 'utf8'), {
    compilerOptions: {module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX},
  }).outputText, {exports, require: id => {
    if (id === '@datxe/shared') return {translate: x => x};
    if (id === '@datxe/ui') return ui;
    if (id === 'react/jsx-runtime') return {jsx, jsxs: jsx, Fragment: 'Fragment'};
    if (id === 'react-native') return {
      View: 'View', ScrollView: 'ScrollView', useWindowDimensions: () => ({height: 640}),
      StyleSheet: {create: s => s},
    };
    if (id === '@expo/vector-icons') return {MaterialIcons: 'Icon'};
    if (id === '../store') return {useBookingDraft: () => ({setPlace() {}})};
    if (id === '@/lib/navigation') return {openRideDirections() {}};
    if (id.endsWith('Styles') || id.endsWith('placeStyles')) return {};
    throw new Error(id);
  }});
  return exports;
}
const address = 'Ngách 12, ngõ 345, đường Nguyễn Trãi, phường Văn Quán, Hà Đông, Hà Nội';
for (const component of ['RideRouteBar', 'RouteSummary', 'PlaceRow']) {
  test(`${component}: full Vietnamese address remains visible without line truncation`, () => {
    const C = load(`apps/customer/src/features/booking/components/${component}.tsx`)[component];
    const place = {address, name: 'Nhà'};
    const tree = C({pickup: place, dropoff: place, title: 'Nhà', address});
    const addressNodes = nodes(tree).filter(n => n.type === 'Text' && n.props.children === address);
    assert.ok(addressNodes.length > 0);
    for (const n of addressNodes) assert.equal(n.props.numberOfLines, undefined);
  });
}
test('Driver stop explains missing coordinates next to the disabled directions action', () => {
  const {RideStopCard} = load('apps/driver/src/features/ride/components/RideStopCard.tsx');
  const tree = RideStopCard({phase: 'pickup', ride: {id: 7, pickup: {}, pickupAddress: address}});
  const rendered = nodes(tree);
  assert.equal(rendered.find(n => n.type === 'Button').props.disabled, true);
  assert.ok(rendered.some(n => n.type === 'Text' && String(n.props.children).includes('Chưa có tọa độ')));
});
