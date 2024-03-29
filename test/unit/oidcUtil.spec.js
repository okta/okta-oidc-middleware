const passport = require('passport');
const OpenIdClient = require('openid-client');
const oidcUtil = require('../../src/oidcUtil.js');

jest.mock('negotiator', function () {
  return function () {
      return {
        mediaType: function () {
          return 'text/html';
        }
      }
    }
});

function createMockOpenIdClient(config={}) {
  const Issuer = OpenIdClient.Issuer;

  const defaultConfig = {
    issuer: 'https://foo',
    token_endpoint: 'https://foo/token',
    userinfo_endpoint: 'https://foo/userinfo'
  };
  const issuer = new Issuer({
    ...defaultConfig,
    ...config
  });
  const client = new issuer.Client({
    client_id: 'foo',
    client_secret: 'foo',
  });

  client.callback = jest.fn(() => ({
    access_token: 'token_value'
  }));

  client.userinfo = jest.fn(() => ({
    cid: '123'
  }));

  return client;
}

function createMockRedirectRequest() {
  const request = jest.mock();
  request.method = 'GET';
  request.url = 'http://foo/authorization-code/callback?code=foo';
  request.session = {
    'oidc:foo': {
      response_type: 'code',
    },
  };
  return request;
}

describe('oidcUtil', function () {
  describe('Passport strategy setup', function () {
    beforeEach(function () {
      jest.clearAllMocks();
    });

    it('includes verification function which tolerates authentication repsonses w/o userInfo', function (next) {
      const passportStrategySetter = jest.spyOn(passport, 'use').mockImplementation(() => {});

      const context = {
        options: {
          scope: ['openid']
        },
        client: createMockOpenIdClient({
          userinfo_endpoint: undefined
        })
      };
      oidcUtil.bootstrapPassportStrategy(context);
      const passportStrategy = passportStrategySetter.mock.calls[0][1];

      passportStrategy.success = function (response) {
        expect(response.userinfo).toBe(undefined);
        expect(response.tokens).toEqual({access_token: 'token_value'});
        next();
      }
      passportStrategy.error = function(error) {
        expect(error).toEqual(undefined);
      };
      passportStrategy.authenticate(createMockRedirectRequest());
    });

    it('includes verification function which returns userinfo whenever it is available', function (next) {
      const passportStrategySetter = jest.spyOn(passport, 'use').mockImplementation(() => {});
      const context = {
        options: {
          scope: ['openid', 'profile']
        },
        client: createMockOpenIdClient()
      };

      oidcUtil.bootstrapPassportStrategy(context);
      const passportStrategy = passportStrategySetter.mock.calls[0][1];

      passportStrategy.success = function (response) {
        expect(response.userinfo).toEqual({cid: '123'});
        expect(response.tokens).toEqual({access_token: 'token_value'});
        next();
      };
      passportStrategy.error = function(error) {
        expect(error).toEqual(undefined);
      };
      passportStrategy.authenticate(createMockRedirectRequest());
    });
  });

  describe('ensureAuthenticated', () => {
    it('appends known options to redirect URL', () => {
      const requestHandler = oidcUtil.ensureAuthenticated({}, {
        redirectTo: '/login',
        loginHint: 'username@org.org'
      });
      let req = jest.mock();
      let res = {
        redirect: jest.fn()
      };
      requestHandler(req, res, () => {});
      expect(res.redirect).toBeCalledWith('/login?login_hint=username%40org.org');
    });

    it('appends `appBaseUrl` option to redirect URL', () => {
      const options = {
        appBaseUrl: 'http://localhost:56789',
        routes: {
          login: {
            path: '/foo'
          }
        }
      };

      const context = {
        options,
        client: createMockOpenIdClient()
      };

      const requestHandler = oidcUtil.ensureAuthenticated(context);
      let req = jest.mock();
      let res = {
        redirect: jest.fn()
      };
      requestHandler(req, res, () => {});
      expect(res.redirect).toBeCalledWith('http://localhost:56789/foo');
    });

    it('strips leading slashes to prevent open redirects', () => {
      // see OKTA-499372
      const requestHandler = oidcUtil.ensureAuthenticated({}, {
        redirectTo: '/login'
      });
      const req = {
        session: {},
        url: '//okta.com'
      };
      const res = {
        redirect: jest.fn()
      };
      requestHandler(req, res, () => {});
      expect(res.redirect).toHaveBeenCalledWith('/login');
      expect(req.session.returnTo).toBe('/okta.com');
    });
  });
})
