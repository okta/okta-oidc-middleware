import { ExpressOIDC } from '../..';
import express, { Express, RequestHandler, ErrorRequestHandler } from 'express';
import {expectType, expectError, expectAssignable, expectNotAssignable} from 'tsd';


// Constructor with required options
expectError(new ExpressOIDC());
expectError(new ExpressOIDC({}));
const minimumConfig: ExpressOIDC.ConfigurationOptions = {
  client_id: 'foo',
  client_secret: 'foo',
  issuer: 'https://okta.foo',
  appBaseUrl: 'https://app.foo',
};
const oidc = new ExpressOIDC(minimumConfig);
expectType<ExpressOIDC>(oidc);

// Constructor with extended options
const extendedConfig: ExpressOIDC.ConfigurationOptions = {
  ...minimumConfig,
  loginRedirectUri: 'http://localhost:8080/authorization-code/callback',
  logoutRedirectUri: 'http://localhost:8080/',
  scope: 'openid profile',
  response_type: 'code',
  maxClockSkew: 120,
  timeout: 10000,
  sessionKey: 'oidc:https://okta.foo',
  testing: {
    disableHttpsCheck: true
  },
};
expectType<ExpressOIDC>(new ExpressOIDC(extendedConfig));

// Constructor with routes
const configWithRoutes: ExpressOIDC.ConfigurationOptions = {
  ...minimumConfig,
  routes: {
    login: {
      path: '/different/login',
      viewHandler: (req, res, _next) => {
        // `req.csrfToken()` is available from 'csurf' package
        res.render('login', {
          csrfToken: req.csrfToken(),
          baseUrl: 'https://okta.foo'
        });
      }
    },
    loginCallback: {
      path: '/different/callback',
      afterCallback: '/profile',
      failureRedirect: '/error',
      handler: ((req, _res, next) => {
        // `req.userContext` is available by using 'passport' with 'openid-client' strategy
        console.log('email: ', req.userContext!.userinfo.email);
        console.log('scope: ', req.userContext!.tokens.scope);
        next();
      }) as RequestHandler,
    },
    logout: {
      path: '/different/logout'
    },
    logoutCallback: {
      path: '/different/logout-callback'
    }
  }
};

// Use router
const app: Express = express();
app.use(oidc.router);

// Ready event handler
oidc.on('ready', () => {
  app.listen(3000, () => console.log('app started'));
});

// Error event handler
oidc.on('error', err => {
  // An error occurred while setting up OIDC, during token revokation, or during post-logout handling
  if (err instanceof ExpressOIDC.OIDCMiddlewareError) {
    console.error(err.type, err.message);
  } else {
    console.error(err.message);
  }
});

// OIDCMiddlewareError
const err = new ExpressOIDC.OIDCMiddlewareError('middlewareError', 'Your custom callback handler must request "next"');
expectType<ExpressOIDC.OIDCMiddlewareError>(err);
expectAssignable<Error>(err);
expectType<string>(err.message);
expectType<string>(err.type);
expectType<'OIDCMiddlewareError'>(err.name);

// ensureAuthenticated
app.get('/protected', oidc.ensureAuthenticated(), (_req, res) => {
  res.send('Protected stuff');
});
// ensureAuthenticated with options
app.get('/protected', oidc.ensureAuthenticated({
  redirectTo: '/login',
  loginHint: 'username@org.org'
}), (_req, res) => {
  res.send('Protected stuff');
});

// forceLogoutAndRevoke
app.post('/forces-logout', oidc.forceLogoutAndRevoke());

// `req.userContext` is available by using 'passport' with 'openid-client' strategy
app.get('/', (req, res) => {
  if (req.userContext) {
    res.send(`Hello ${req.userContext.userinfo.sub}!`);
  } else {
    res.send('Hello World!');
  }
});
