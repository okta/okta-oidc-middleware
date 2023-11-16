#!/bin/bash -x

source ${OKTA_HOME}/${REPO}/scripts/setup.sh

export TEST_SUITE_TYPE="junit"
export TEST_RESULT_FILE_DIR="${REPO}/reports/unit"

# Run unit tests on multiple node versions

nvm install 14
# Run jest with "ci" flag
if ! yarn test:unit --ci; then
  echo "unit failed! Exiting..."
  exit ${TEST_FAILURE}
fi

nvm install 16
# Run jest with "ci" flag
if ! yarn test:unit --ci; then
  echo "unit failed! Exiting..."
  exit ${TEST_FAILURE}
fi

nvm install 18
# Run jest with "ci" flag
if ! yarn test:unit --ci; then
  echo "unit failed! Exiting..."
  exit ${TEST_FAILURE}
fi

nvm install 20
# Run jest with "ci" flag
if ! yarn test:unit --ci; then
  echo "unit failed! Exiting..."
  exit ${TEST_FAILURE}
fi

echo ${TEST_SUITE_TYPE} > ${TEST_SUITE_TYPE_FILE}
echo ${TEST_RESULT_FILE_DIR} > ${TEST_RESULT_FILE_DIR_FILE}
exit ${PUBLISH_TYPE_AND_RESULT_DIR}
