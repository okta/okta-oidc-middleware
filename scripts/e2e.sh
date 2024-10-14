#!/bin/bash

source ${OKTA_HOME}/${REPO}/scripts/setup.sh "${NODE_VER:-v16.16.0}"

setup_service java 1.8.222
setup_service google-chrome-stable 89.0.4389.72-1

export TEST_SUITE_TYPE="junit"
export TEST_RESULT_FILE_DIR="${REPO}/reports/e2e"

export SPA_CLIENT_ID=0oa17suj5x9khaVH75d7
export ISSUER=https://javascript-idx-sdk.okta.com/oauth2/default
export CLIENT_ID=0oav2oxnlYjULp0Cy5d6
get_terminus_secret "/" CLIENT_SECRET CLIENT_SECRET
export ORG_OIE_ENABLED=true 
export USERNAME=mary@acme.com
get_terminus_secret "/" PASSWORD PASSWORD

export CI=true
export DBUS_SESSION_BUS_ADDRESS=/dev/null

# Run the tests
if ! yarn test:e2e; then
  echo "e2e tests failed! Exiting..."
  exit ${TEST_FAILURE}
fi

echo ${TEST_SUITE_TYPE} > ${TEST_SUITE_TYPE_FILE}
echo ${TEST_RESULT_FILE_DIR} > ${TEST_RESULT_FILE_DIR_FILE}
exit ${PUBLISH_TYPE_AND_RESULT_DIR}
