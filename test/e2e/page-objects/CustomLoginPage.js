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

const EC = protractor.ExpectedConditions;

module.exports = class OktaSignInPage {
  /* eslint-disable protractor/no-repetitive-selectors */
  constructor() {
    this.username = $('[name=username]');
    this.password = $('[name=password]');
    this.submit = $('#okta-signin-submit');
    this.banner = $('#banner');
    this.pageTitle = $('[data-se=o-form-head]');
    this.usernameLabel = $('[data-se=o-form-label] [for=okta-signin-username]');
    this.passwordLabel = $('[data-se=o-form-label] [for=okta-signin-password]');
  }

  async load() {
    await browser.get('/login');
  }

  async waitUntilVisible() {
    await browser.wait(EC.presenceOf(this.banner), 50000, 'wait for banner');
  }

  async signIn({username, password}) {
    await this.username.sendKeys(username);
    await this.password.sendKeys(password);
    await this.submit.click();
  }
}
