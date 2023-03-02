/*!
 * Copyright (c) 2017-Present, Okta, Inc. and/or its affiliates. All rights reserved.
 * The Okta software accompanied by this notice is provided pursuant to the Apache License, Version 2.0 (the "License.")
 *
 * You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0.
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *
 * See the License for the specific language governing permissions and limitations under the License.
 */

import { EventEmitter } from 'events';
import { RequestHandler, ErrorRequestHandler, Router } from 'express';
import { UserinfoResponse, TokenSet } from 'openid-client';


declare global {
  namespace Express {
    interface Request {
      /**
       * This provides information about the authenticated user and contains the requested tokens
       * 
       * @example
       * ```javascript
       * app.get('/', (req, res) => {
       *   if (req.userContext) {
       *     const tokenSet = req.userContext.tokens;
       *     const userinfo = req.userContext.userinfo;
       * 
       *     console.log(`Access Token: ${tokenSet.access_token}`);
       *     console.log(`Id Token: ${tokenSet.id_token}`);
       *     console.log(`Claims: ${tokenSet.claims}`);
       *     console.log(`Userinfo Response: ${userinfo}`);
       * 
       *     res.send(`Hi ${userinfo.sub}!`);
       *   } else {
       *     res.send('Hi!');
       *   }
       * });
       * ```
       */
      userContext?: {
        /**
         * The response from the `/userinfo` endpoint of the authorization server
         */
        userinfo: UserinfoResponse,
        /**
         * TokenSet object containing the `accessToken`, `idToken`, and/or `refreshToken` 
         *  requested from the authorization server.
         */
        tokens: TokenSet,
      }
    }
  }
}


export class ExpressOIDC extends EventEmitter {

  constructor(options: ExpressOIDC.ConfigurationOptions);

  /**
   * Middleware to protect your routes. 
   * If not authenticated, this will redirect to the login route and trigger the authentication flow. 
   * If the request prefers JSON then a 401 error response will be sent.
   * 
   * @param options Options
   * 
   * @example
   * ```javascript
   * app.get('/protected', oidc.ensureAuthenticated(), (req, res) => {
   *   res.send('Protected stuff');
   * });
   * ```
   */
  ensureAuthenticated(options?: ExpressOIDC.AuthenticationOptions): RequestHandler;

  /**
   * Request handler that will force a logout of the user from Okta and the local session.
   * Because logout involves redirecting to Okta and then to the logout callback URI, 
   *  the body of this route will never directly execute (`next` will not be called).
   * It is recommended to not perform logout on GET queries 
   *  as it is prone to attacks and/or prefetching misadventures.
   * 
   * @example
   * ```javascript
   * app.post('/forces-logout', oidc.forceLogoutAndRevoke(), (req, res) => {
   *   // Nothing here will execute, after the redirects the user will end up 
   *   //  wherever the `routes.logoutCallback.path` specifies (default `/`)
   * });
   * ```
   */
  forceLogoutAndRevoke(): RequestHandler;

  /**
   * Router that should be added to your express app to attach the login, callback and logout routes.
   * 
   * The router is required in order for `ensureAuthenticated`, `isAuthenticated`, and `forceLogoutAndRevoke` 
   *  to work and adds the following routes:
   * - `/login` - redirects to the Okta sign-in page by default
   * - `/authorization-code/callback` - processes the OIDC response, then attaches userinfo to the session
   * - `/logout` - revokes any known Okta access/refresh tokens, then redirects to the Okta logout endpoint 
   *    which then redirects back to a callback url for logout specified in your Okta settings
   * 
   * @example
   * ```javascript
   * app.use(oidc.router);
   * ```
   */
  readonly router: Router;

  /**
   * This is triggered if an error occurs:
   * - while ExpressOIDC is trying to start
   * - if an error occurs while calling the Okta `/revoke` service endpoint on the users tokens while logging out
   * - if the state value for a logout does not match the current session
   */
  on(event: 'error', handler: (err: Error | ExpressOIDC.OIDCMiddlewareError) => void): this;

  /**
   * The middleware must retrieve some information about your client before starting the server. 
   * You **must** wait until ExpressOIDC is ready to start your server.
   * 
   * @example
   * ```javascript
   * oidc.on('ready', () => {
   *   app.listen(3000, () => console.log('app started'));
   * });
   * ```
   */
  on(event: 'ready', handler: () => void): this;
}


export namespace ExpressOIDC {
  type LoginCallbackHandler = RequestHandler | ErrorRequestHandler;

  type LoginViewHandler = RequestHandler;

  class OIDCMiddlewareError extends Error {
    constructor(type: string, message: string);
    name: 'OIDCMiddlewareError';
    errorCode: 'INTERNAL';
    errorLink: 'INTERNAL';
    errorId: 'INTERNAL';
    type: string;
    message: string;
    errorSummary: string;
    errorCauses: [];
  }

  interface AuthenticationOptions {
    /**
     * Use to redirect the user to a specific URI on your site after a successful authentication callback.
     */
    redirectTo?: string;

    /**
     * Use to append `login_hint` query parameter to URL when redirecting to Okta-hosted sign in page.
     */
    loginHint?: string;
  }

  interface ConfigurationOptions {
    /**
     * The base scheme, host, and port (if not 80/443) of your app, not including any path
     * 
     * @example 'https://{yourDomain}' or 'http://localhost:8080', not 'http://localhost:8080/'
     */
    appBaseUrl: string;

    /**
     * The OIDC issuer
     *
     * @example 'https://{yourOktaDomain}/oauth2/default'
     */
    issuer: string;

    /**
     * This client id of OIDC app in your Okta Org
     */
    client_id: string;

    /**
     * This client secret of OIDC app in your Okta Org
     */
    client_secret: string;

    /**
     * The URI for your app that Okta will redirect users to after sign in to create the local session
     * 
     * Unless your redirect is to a different application, it is recommended to NOT set this parameter 
     *  and instead set `routes.loginCallback.path` (if different than the default of `/authorization-code/callback`) 
     *  so that the callback will be handled by this module. 
     * After the callback has been handled, this module will redirect to the route 
     *  defined by `routes.loginCallback.afterCallback` (defaults to `/`). 
     * Your application should handle this route.
     * 
     * @default `${appBaseUrl}${routes.loginCallback.path}`
     */
    loginRedirectUri?: string;

    /**
     * The URI for your app that Okta will redirect users to after sign out.
     * 
     * Unless your redirect is to a different application, it is recommended to NOT set this parameter 
     *  and instead set `routes.logoutCallback.path` (if different than the default of `/`) 
     *  so that the callback will map to a route handled by your application.
     * 
     * @default `${appBaseUrl}${routes.logoutCallback.path}`
     */
    logoutRedirectUri?: string;

    /**
     * The scopes that will determine the claims on the tokens
     * 
     * Defaults to `openid`, which will only return the `sub` claim. 
     * 
     * To obtain more information about the user, use `openid profile`
     * For a list of scopes and claims, please see 
     *  [Scope-dependent claims](https://developer.okta.com/standards/OIDC/index.html#scope-dependent-claims-not-always-returned) 
     *  for more information.
     * 
     * @default 'openid'
     * @example 'openid profile'
     */
    scope?: string;

    /**
     * The OIDC response type
     * 
     * @default 'code'
     */
    response_type?: string;

    /**
     * The maximum difference allowed between your server's clock and Okta's in seconds.
     * 
     * Setting this to 0 is not recommended, because it increases the likelihood 
     *  that valid jwts will fail verification due to `nbf` and `exp` issues.
     * 
     * @default 120
     */
    maxClockSkew?: number;

    /**
     * The HTTP max timeout for any requests to the issuer
     * 
     * If a timeout exception occurs you can catch it with the `oidc.on('error', fn)` handler.
     * 
     * @default 10000
     */
    timeout?: number;

    /**
     * The property in your session which is used for storing information 
     *  for the purpose of consuming the authentication response.
     * 
     * @default `oidc:${issuer}`
     */
    sessionKey?: string;

    /**
     * Testing overrides for disabling configuration validation
     */
    testing?: {
      disableHttpsCheck?: boolean;
    };

    /**
     * Configuration of the generated routes
     */
    routes?: {
      login?: {
        /**
         * The URI that redirects the user to the Okta authorize endpoint
         * 
         * @default '/login'
         */
        path?: string;

        /**
         * Use this option to intercept the login page request and render your own custom page
         * 
         * @example
         * ```javascript
         * const oidc = new ExpressOIDC({
         *   routes: {
         *     login: {
         *       viewHandler: (req, res, next) => {
         *         const baseUrl = url.parse(baseConfig.issuer).protocol + '//' + url.parse(baseConfig.issuer).host;
         *         // You must create this view for your application and use the Okta Sign-In Widget
         *         res.render('login', {
         *           csrfToken: req.csrfToken(),
         *           baseUrl: baseUrl
         *         });
         *       }
         *     }
         *   }
         * });
         * ```
         */
        viewHandler?: LoginViewHandler;
      };

      loginCallback?: {
        /**
         * The URI that this library will host the login callback handler on.
         * Must match a value from the Login Redirect Uri list from the Okta console for this application.
         * 
         * @default '/authorization-code/callback'
         */
        path?: string;

        /**
         * Where the user is redirected to after a successful authentication callback, 
         *  if no `redirectTo` value was specified by `oidc.ensureAuthenticated()`
         * 
         * @default '/'
         */
        afterCallback?: string;

        /**
         * Where the user is redirected to after authentication failure.
         * Defaults to a page which just shows error message.
         */
        failureRedirect?: string;

        /**
         * A function that is called after a successful authentication callback, 
         *  but before the final redirect within your application.
         * Useful for requirements such as conditional post-authentication redirects, 
         *  or sending data to logging systems.
         */
        handler?: LoginCallbackHandler;
      };

      logout?: {
        /**
         * The URI that redirects the user to the Okta logout endpoint
         * 
         * @default '/logout'
         */
        path?: string;
      };

      logoutCallback?: {
        /**
         * Where the user is redirected to after a successful logout callback, 
         *  if no `redirectTo` value was specified by `oidc.forceLogoutAndRevoke()`.
         * 
         * Must match a value from the Logout Redirect Uri list from the Okta console for this application.
         * 
         * @default '/'
         */
        path?: string;
      };

    };
  }
}
