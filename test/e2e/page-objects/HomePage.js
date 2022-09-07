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

const constants = require('../util/constants');
const util = require('../util/util');
const EC = require("wdio-wait-for");

module.exports = class HomePage {
  constructor() {}

  get body() {
    return $('body');
  }

  async load() {
    await browser.url(constants.BASE_URI);
  }

  async waitUntilVisible() {
    const url = util.ensureTrailingSlash(constants.BASE_URI);
    await browser.waitUntil(EC.urlIs(url), {
      timeout: 50000,
      timeoutMsg: 'wait for base url'
    });
  }

  async performLogout() { 
    const logoutButton = $('#logout');
    await logoutButton.click();
    await browser.waitUntil(EC.not(EC.presenceOf(logoutButton)), {
      timeout: 5000,
      timeoutMsg: 'wait for logout button to disappear'
    });
  }

  async getBodyText() {
    return (await this.body).getText();
  }
}
