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
  constructor() {
    this.username = $('#okta-signin-username, [name="identifier"]');
    this.password = $('#okta-signin-password, [name="credentials.passcode"]');
    this.submit = $('#okta-signin-submit, [data-type="save"]');
  }

  async waitUntilVisible() {
    await browser.wait(EC.presenceOf(this.submit), 5000, 'wait for submit btn');
  }

  async signIn({username, password}) {
    await this.username.clear();
    await this.password.clear();
    await this.username.sendKeys(username);
    await this.password.sendKeys(password);
    await this.submit.click();
  }
}
