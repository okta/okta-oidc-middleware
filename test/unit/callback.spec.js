

const nock = require('nock');
const request = require('supertest');
const express = require('express');
const session = require('express-session');
const uuid = require('uuid');
const cookieParser = require('cookie-parser');
const OpenIdClient = require('openid-client');
const OpenIDConnectStrategy = OpenIdClient.Strategy;

const { ExpressOIDC } = require('../../index.js');

describe('callback', () => {
  const issuer = 'https://foo';
  const tokenPath = '/oauth2/v1/token';
  const authorizePath = '/oauth2/v1/authorize';
  const tokenEndpoint = `${issuer}${tokenPath}`;
  const authorizationEndpoint = `${issuer}${authorizePath}`;
  const idToken = 'a-fake-id-token';
  const sessionKey = 'foo';
  const minimumConfig = { 
    client_id: 'foo',
    client_secret: 'foo',
    issuer: 'https://foo',
    appBaseUrl: 'https://app.foo',
    sessionKey
  };

  let app;
  let agent;
  let oidc;
  let nonce;
  let state;
  let mocks;
  let interceptors;

  beforeEach(() => {
    app = null;
    agent = null;
    oidc = null;
    nonce = null;
    state = null;
    mocks = {
      wellKnown: null,
      token: null
    };
    interceptors = {
      token: null
    }
  });

  afterEach(function() {
    if(!nock.isDone()) {
      nock.cleanAll();
      throw new Error('Not all nock interceptors were used!');
    }
  });

  function mockValidate(client) {
    mocks.validateIdToken = jest.spyOn(client, 'validateIdToken').mockImplementation(function() {
      return Promise.resolve();
    });
  }
  function mockAuthorizationUrl(client) {
    const origMethod = client.constructor.prototype.authorizationUrl;
    mocks.authorizationUrl = jest.spyOn(client, 'authorizationUrl').mockImplementation(function(params) {
      params.state = 'STATE';
      return origMethod.call(this, params);
    });
  }
  function mockAuthenticate() {
    const origMethod = OpenIDConnectStrategy.prototype.authenticate;
    mocks.authenticate = jest.spyOn(OpenIDConnectStrategy.prototype, 'authenticate').mockImplementation(function () {
      mockValidate(this._client);
      mockAuthorizationUrl(this._client);
      return origMethod.apply(this, arguments);
    });
  }
  function mockWellKnown() {
    const response = {
      issuer,
      token_endpoint: tokenEndpoint,
      authorization_endpoint: authorizationEndpoint,
    };

    mocks.wellKnown = jest.fn().mockImplementation(function(/* uri, requestBody */) {
      return [
        200,
        JSON.stringify(response)
      ];
    });
  
    nock(issuer)
    .get('/.well-known/openid-configuration')
    .reply(mocks.wellKnown);
  }

  function mockToken(handlerFn) {
    const response = {
      id_token: idToken
    };
    mocks.token = handlerFn || jest.fn(async function(uri, requestBody, cb) {
      return cb(null, [
        200,
        JSON.stringify(response)
      ]);
    });

    interceptors.token = nock(issuer)
    .post(tokenPath)
    .reply(mocks.token);
  }

  async function bootstrap(config = {}) {
    mockWellKnown();
    mockAuthenticate();

    app = express();
    oidc = new ExpressOIDC({
      ...minimumConfig,
      ...config
    });

    app.use(cookieParser());
    app.use(session({
      secret: 'this-should-be-very-random',
      resave: true,
      saveUninitialized: false
    }));
    app.use(oidc.router);
    agent = request.agent(app);

    await setSession();
  }

  function setSession() {
    nonce = uuid.v4();
    state = uuid.v4();

    app.get('/set-session', (req, res) => {
      req.session[sessionKey] = {
        nonce,
        state
      };
      res.send('OK');
    });

    return new Promise((resolve, reject) => {
      agent
      .get('/set-session')
      .expect(200)
      .end(function(err){
        if (err) return reject(err);
        resolve()
      });
    });
  }

  it('handles a login callback', async () => {
    await bootstrap({
      routes: {
        login: {
          path: '/login'
        },
        loginCallback: {
          path: '/login/callback'
        }
      }
    });
    mockToken();
    return new Promise((resolve, reject) => {
      agent
        .get('/login/callback')
        .query({ state, code: 'foo' })
        .set('Accept', 'application/json')
        .expect(302)
        .end(function(err, res){
          if (err) return reject(err);
          expect(res.headers.location).toBe('/');
          expect(mocks.authenticate).toHaveBeenCalledWith(expect.any(Object), expect.any(Object));
          expect(mocks.validateIdToken).toHaveBeenCalledWith({ id_token: idToken }, nonce, 'token', undefined);
          resolve()
        });
    });
  });

  it('performs a login redirect', async () => {
    await bootstrap({
      routes: {
        login: {
          path: '/login'
        },
        loginCallback: {
          path: '/login/callback'
        }
      }
    });
    mockToken();
    return new Promise((resolve, reject) => {
      agent
        .get('/login')
        .expect(302)
        .end(function(err, res){
          if (err) return reject(err);
          expect(res.headers.location).toBe('https://foo/oauth2/v1/authorize?client_id=foo&scope=openid&response_type=code&redirect_uri=https%3A%2F%2Fapp.foo%2Flogin%2Fcallback&state=STATE');
          nock.cleanAll();
          resolve()
        });
    });
  });

  it('respects the "timeout" option when making a call to /token', async () => {
    jest.useFakeTimers();
    const timeout = 30000; // should be greater than test timeout
    await bootstrap({
      timeout: 30000
    });
    // eslint-disable-next-line no-unused-vars
    mockToken(jest.fn(async function(uri, requestBody, cb) {
      // never call the cb. this request will timeout.
      // advance clock beyond timeout threshold.
      jest.advanceTimersByTime(timeout + 1000);
    }));
    return new Promise((resolve, reject) => {
      agent
        .get('/authorization-code/callback')
        .query({ state, code: 'foo' })
        .set('Accept', 'application/json')
        .expect(401)
        .end(function(err, res){
          if (err) return reject(err);
          expect(res.text).toContain('TimeoutError: Timeout awaiting');
          expect(res.text).toContain('for ' + timeout + 'ms');
          expect(nock.pendingMocks()).toHaveLength(1);
          expect(nock.pendingMocks()[0]).toBe('POST https://foo:443/oauth2/v1/token');
          nock.cleanAll();
          resolve()
        });
    });  
  })


});