#!/bin/bash

source ${OKTA_HOME}/${REPO}/scripts/setup.sh

export TEST_SUITE_TYPE="junit"
export TEST_RESULT_FILE_DIR="${REPO}/reports/unit"
echo ${TEST_SUITE_TYPE} > ${TEST_SUITE_TYPE_FILE}
echo ${TEST_RESULT_FILE_DIR} > ${TEST_RESULT_FILE_DIR_FILE}

# Run unit tests on multiple node versions

create_log_group "Node 20"
nvm install --silent 20
echo "Testing with Node 20"
echo $(node --version)
# Run jest with "ci" flag
if ! yarn test:unit --ci; then
  echo "unit node 20 failed! Exiting..."
  exit ${TEST_FAILURE}
fi
finish_log_group $?

create_log_group "Node 22"
nvm install --silent 22
echo "Testing with Node 22"
echo $(node --version)
# Run jest with "ci" flag
if ! yarn test:unit --ci; then
  echo "unit node 22 failed! Exiting..."
  exit ${TEST_FAILURE}
fi
finish_log_group $?

create_log_group "Node 24"
nvm install --silent 24
echo "Testing with Node 24"
echo $(node --version)
# Run jest with "ci" flag
if ! yarn test:unit --ci; then
  echo "unit node 24 failed! Exiting..."
  exit ${TEST_FAILURE}
fi
finish_log_group $?

create_log_group "Node 26"
nvm install --silent 26
echo "Testing with Node 26"
echo $(node --version)
# Run jest with "ci" flag
if ! yarn test:unit --ci; then
  echo "unit node 26 failed! Exiting..."
  exit ${TEST_FAILURE}
fi
finish_log_group $?

exit ${PUBLISH_TYPE_AND_RESULT_DIR}
