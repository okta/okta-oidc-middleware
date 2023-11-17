#!/bin/bash

# Install required node version
export NVM_DIR="/root/.nvm"
setup_service node v16.16.0

npm install -g yarn
export PATH="$PATH:$(npm config get prefix)"

# Add yarn to the $PATH so npm cli commands do not fail
export PATH="${PATH}:$(yarn global bin)"

cd ${OKTA_HOME}/${REPO}

if ! yarn install ; then
  echo "yarn install failed! Exiting..."
  exit ${FAILED_SETUP}
fi

export TEST_SUITE_TYPE="junit"
export TEST_RESULT_FILE_DIR="${REPO}/reports/unit"

# Run unit tests on multiple node versions

create_log_group "Node 14"
nvm install 14
echo "Testing with Node 14"
echo $(node --version)
# Run jest with "ci" flag
if ! yarn test:unit --ci; then
  echo "unit node 14 failed! Exiting..."
  exit ${TEST_FAILURE}
fi
finish_log_group $?

create_log_group "Node 16"
nvm install 16
echo "Testing with Node 16"
echo $(node --version)
# Run jest with "ci" flag
if ! yarn test:unit --ci; then
  echo "unit node 16 failed! Exiting..."
  exit ${TEST_FAILURE}
fi
finish_log_group $?

create_log_group "Node 18"
nvm install 18
echo "Testing with Node 18"
echo $(node --version)
# Run jest with "ci" flag
if ! yarn test:unit --ci; then
  echo "unit node 18 failed! Exiting..."
  exit ${TEST_FAILURE}
fi
finish_log_group $?

create_log_group "Node 20"
nvm install 20
echo "Testing with Node 20"
echo $(node --version)
# Run jest with "ci" flag
if ! yarn test:unit --ci; then
  echo "unit node 20 failed! Exiting..."
  exit ${TEST_FAILURE}
fi
finish_log_group $?

echo ${TEST_SUITE_TYPE} > ${TEST_SUITE_TYPE_FILE}
echo ${TEST_RESULT_FILE_DIR} > ${TEST_RESULT_FILE_DIR_FILE}
exit ${PUBLISH_TYPE_AND_RESULT_DIR}
