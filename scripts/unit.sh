#!/bin/bash

source ${OKTA_HOME}/${REPO}/scripts/setup.sh

export TEST_SUITE_TYPE="junit"
export TEST_RESULT_FILE_DIR="${REPO}/reports/unit"

# Run unit tests on multiple node versions

create_log_group "Node 14"
nvm install --silent 14
echo "Testing with Node 14"
echo $(node --version)
# Run jest with "ci" flag
if ! yarn test:unit --ci; then
  echo "unit node 14 failed! Exiting..."
  exit ${TEST_FAILURE}
fi
finish_log_group $?

create_log_group "Node 16"
nvm install --silent 16
echo "Testing with Node 16"
echo $(node --version)
# Run jest with "ci" flag
if ! yarn test:unit --ci; then
  echo "unit node 16 failed! Exiting..."
  exit ${TEST_FAILURE}
fi
finish_log_group $?

create_log_group "Node 18"
nvm install --silent 18
echo "Testing with Node 18"
echo $(node --version)
# Run jest with "ci" flag
if ! yarn test:unit --ci; then
  echo "unit node 18 failed! Exiting..."
  exit ${TEST_FAILURE}
fi
finish_log_group $?

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

echo ${TEST_SUITE_TYPE} > ${TEST_SUITE_TYPE_FILE}
echo ${TEST_RESULT_FILE_DIR} > ${TEST_RESULT_FILE_DIR_FILE}
exit ${PUBLISH_TYPE_AND_RESULT_DIR}
