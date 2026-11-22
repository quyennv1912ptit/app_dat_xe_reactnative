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
    exports,
    Promise,
    Date,
    Set,
    Map,
    Error,
    Object,
    console,
    URLSearchParams,
    require: name => {
      if (name in mocks) return mocks[name];
      throw Error(name);
    },
  });
  return exports;
}

const existsError = Object.assign(new Error('account exists'), {
  code: 'auth/account-exists-with-different-credential',
  email: 'user@example.com',
});

function harness() {
  const state = {
    methods: ['google.com'],
    facebookConflict: true,
    googleResult: { type: 'success', data: { idToken: 'google-id' } },
    linked: [],
    googleSignInCalls: 0,
    facebookSignInCalls: 0,
  };
  const firebase = {
    getAuth: () => ({}),
    signInWithCredential: async (_auth, credential) => {
      if (credential.provider === 'facebook') {
        state.facebookSignInCalls += 1;
        if (state.facebookConflict) throw existsError;
      }
      return { user: { uid: 'uid-1', providerData: [{ providerId: `${credential.provider}.com` }] } };
    },
    fetchSignInMethodsForEmail: async () => {
      if (state.methods instanceof Error) throw state.methods;
      return state.methods;
    },
    linkWithCredential: async (user, credential) => {
      state.linked.push({ user, credential });
      return { user };
    },
    GoogleAuthProvider: { credential: idToken => ({ provider: 'google', idToken }) },
    FacebookAuthProvider: { credential: token => ({ provider: 'facebook', token }) },
    PhoneAuthProvider: {},
  };
  const mocks = {
    '@react-native-firebase/auth': firebase,
    '@react-native-google-signin/google-signin': {
      GoogleSignin: {
        configure() {},
        hasPlayServices: async () => {},
        signIn: async () => {
          state.googleSignInCalls += 1;
          return state.googleResult;
        },
      },
    },
    'react-native': { Platform: { OS: 'android', select: options => ('android' in options ? options.android : options.default) } },
    './config': { getAuthConfig: () => ({ googleWebClientId: 'web-client', facebookAppId: 'app', facebookClientToken: 'token' }) },
    '../notifications/push': { runPushSignOutCleanup: async () => {} },
    'react-native-fbsdk-next': {
      LoginManager: { logInWithPermissions: async () => ({ isCancelled: false }) },
      AccessToken: { getCurrentAccessToken: async () => ({ accessToken: 'fb-token' }) },
    },
  };
  const auth = load('packages/shared/src/firebase/authService.ts', mocks);
  return { auth, state };
}

test('Facebook trùng email Google: tự chuyển sang Google và liên kết Facebook sau khi thành công', async () => {
  const { auth, state } = harness();
  const user = await auth.signInWithFacebook();
  assert.equal(user.uid, 'uid-1');
  assert.equal(state.googleSignInCalls, 1, 'phải mở luồng đăng nhập Google ngay');
  assert.equal(state.linked.length, 1, 'phải liên kết credential Facebook vào tài khoản Google');
  assert.equal(state.linked[0].credential.provider, 'facebook');
});

test('Người dùng hủy luồng Google được chuyển tới: báo hủy, không hiện lỗi trùng email', async () => {
  const { auth, state } = harness();
  state.googleResult = { type: 'cancelled' };
  await assert.rejects(auth.signInWithFacebook(), error => {
    assert.equal(error.name, 'AuthCancelledError');
    return true;
  });
});

test('Email đã đăng ký bằng số điện thoại: không tự chuyển, hướng dẫn dùng số điện thoại', async () => {
  const { auth, state } = harness();
  state.methods = ['phone'];
  await assert.rejects(auth.signInWithFacebook(), error => {
    assert.equal(error.code, 'ACCOUNT_EXISTS_OTHER_PROVIDER');
    assert.match(error.message, /số điện thoại/);
    return true;
  });
  assert.equal(state.googleSignInCalls, 0);
});

test('Không xác định được phương thức: báo email đã dùng phương thức khác', async () => {
  const { auth, state } = harness();
  state.methods = [];
  await assert.rejects(auth.signInWithFacebook(), error => {
    assert.equal(error.code, 'ACCOUNT_EXISTS_OTHER_PROVIDER');
    assert.match(error.message, /phương thức đăng nhập khác/);
    return true;
  });
});

test('Đăng nhập Facebook bình thường: không mở Google, không liên kết thừa', async () => {
  const { auth, state } = harness();
  state.facebookConflict = false;
  await auth.signInWithFacebook();
  assert.equal(state.googleSignInCalls, 0);
  assert.equal(state.linked.length, 0);
});

test('chỉ coi số điện thoại Firebase là đã xác minh khi đúng định dạng Việt Nam', () => {
  const { auth } = harness();
  assert.equal(auth.resolveVerifiedPhoneNumber('+8466666666'), '');
  assert.equal(auth.resolveVerifiedPhoneNumber(''), '');
  assert.equal(auth.resolveVerifiedPhoneNumber(null), '');
  assert.equal(auth.resolveVerifiedPhoneNumber('0912345678'), '+84912345678');
  assert.equal(auth.resolveVerifiedPhoneNumber('+84912345678'), '+84912345678');
});