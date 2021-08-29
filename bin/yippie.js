var _ = Object.create;
var p = Object.defineProperty,
  b = Object.defineProperties,
  A = Object.getOwnPropertyDescriptor,
  R = Object.getOwnPropertyDescriptors,
  $ = Object.getOwnPropertyNames,
  f = Object.getOwnPropertySymbols,
  j = Object.getPrototypeOf,
  I = Object.prototype.hasOwnProperty,
  z = Object.prototype.propertyIsEnumerable;
var P = (o, e, s) => (e in o ? p(o, e, { enumerable: !0, configurable: !0, writable: !0, value: s }) : (o[e] = s)),
  y = (o, e) => {
    for (var s in e || (e = {})) I.call(e, s) && P(o, s, e[s]);
    if (f) for (var s of f(e)) z.call(e, s) && P(o, s, e[s]);
    return o;
  },
  w = (o, e) => b(o, R(e)),
  B = (o) => p(o, '__esModule', { value: !0 });
var k = (o, e, s) => {
    if ((e && typeof e == 'object') || typeof e == 'function')
      for (let t of $(e))
        !I.call(o, t) && t !== 'default' && p(o, t, { get: () => e[t], enumerable: !(s = A(e, t)) || s.enumerable });
    return o;
  },
  n = (o) =>
    k(
      B(
        p(
          o != null ? _(j(o)) : {},
          'default',
          o && o.__esModule && 'default' in o ? { get: () => o.default, enumerable: !0 } : { value: o, enumerable: !0 }
        )
      ),
      o
    );
var d = n(require('path')),
  E = n(require('dotenv')),
  S = n(require('fs')),
  i = n(require('aws-sdk')),
  r = n(require('amazon-cognito-identity-js')),
  m = n(require('command-line-args')),
  U = n(require('command-line-usage')),
  h = n(require('adm-zip')),
  g = [
    { name: 'folder', alias: 'f', type: String, defaultOption: !0, description: 'Folder to deploy.' },
    { name: 'username', alias: 'u', type: String, description: 'Your yippie cloud username.' },
    { name: 'password', alias: 'p', type: String, description: 'Your yippie cloud password.' },
    { name: 'help', alias: 'h', type: Boolean, description: 'Display this usage guide.' },
    { name: 'verbose', alias: 'v', type: Boolean, description: 'Enable verbose outputs.' },
  ],
  v = (0, m.default)(g);
if (v.help) {
  let o = (0, U.default)([
    { header: 'Usage', content: 'yippie example' },
    { header: 'Options', optionList: g },
    { content: 'Project home: {underline https://www.yippie.cloud}' },
  ]);
  console.log(o);
}
var { folder: l, verbose: x = !1 } = (0, m.default)(g),
  J = '5brts50g06t59npkbv8t3r2tva',
  D = 'yippiecloud-artifacts',
  L = 'eu-central-1',
  K = 'eu-central-1:b149ff98-8ae0-4157-b245-de1a8f8c2461',
  O = 'eu-central-1_zHXNt56dU',
  M = 'yippiecloud-artifact-deployment-function';
(0, E.config)();
var a = 'mike.bild@gmail.com',
  N = process.env.YIPPIE_PASSWORD || v.password;
a || (console.error('Username is missing'), process.exit(1));
N || (console.error('Password is missing'), process.exit(1));
var W = new r.CognitoUserPool({ ClientId: J, UserPoolId: O }),
  Z = new r.CognitoUser({ Pool: W, Username: a }),
  G = new r.AuthenticationDetails({ Username: a, Password: N });
Z.authenticateUser(G, {
  onFailure: (o) => {
    console.error(o.message);
  },
  onSuccess: (o) => {
    i.default.config.update({
      maxRetries: 0,
      httpOptions: { timeout: 6e6, connectTimeout: 6e6 },
      region: L,
      credentials: new i.default.CognitoIdentityCredentials({
        IdentityPoolId: K,
        Logins: { [`cognito-idp.${L}.amazonaws.com/${O}`]: o.getIdToken().getJwtToken() },
      }),
    }),
      i.default.config.credentials.refresh(async (e) => {
        if (e) return console.error(e.message);
        console.log('Login successfully!');
        let s = new i.default.S3(),
          t = new i.default.Lambda();
        try {
          console.log('Zipping file(s) ...');
          let c = new h.default();
          c.addLocalFolder((0, d.join)(process.cwd(), l)),
            console.log('Uploading file ...'),
            await s.upload({ Bucket: D, Key: `${a}/${l}.zip`, Body: c.toBuffer() }).promise(),
            console.log('Deploying project (up to 5 minutes) ...');
          let T = (0, S.readFileSync)((0, d.join)(process.cwd(), `.${l}.yippie.json`)),
            C = JSON.parse(T.toString()),
            { LogResult: Y, Payload: F } = await t
              .invoke({
                FunctionName: M,
                LogType: 'Tail',
                Payload: JSON.stringify(w(y({}, C), { username: a, bucketName: D, zipFileName: `${l}.zip` })),
              })
              .promise();
          x && console.log(Buffer.from(Y, 'base64').toString('utf-8')), console.log('Done!');
          let u = JSON.parse(F.toString());
          console.log(`Project ID: ${u.projectId}`), console.log(`Production URL: ${u.productionUrl}`);
        } catch (c) {
          console.error(c.message), process.exit(1);
        }
      });
  },
});
