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

const EC = require("wdio-wait-for");

module.exports = class OktaSignInPage {
  constructor() {}

  get username() {
    return $('#okta-signin-username, [name="identifier"]');
  }

  get password() {
    return $('#okta-signin-password, [name="credentials.passcode"]');
  }

  get submit() {
    return $('#okta-signin-submit, [data-type="save"]');
  }

  async waitUntilVisible() {
    await browser.waitUntil(EC.presenceOf(await this.submit), {
      timeout: 5000,
      timeoutMsg: 'wait for submit btn'
    });
  }

  async signIn({username, password}) {
    await (await this.username).setValue(username);
    await (await this.password).setValue(password);
    await (await this.submit).click();
  }
}
