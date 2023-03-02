#!/bin/bash -xe

source ${OKTA_HOME}/${REPO}/scripts/setup.sh

export TEST_SUITE_TYPE="checkstyle"
export TEST_RESULT_FILE_DIR="${REPO}/reports"

if ! yarn lint:report; then
  echo "lint failed! Exiting..."
  exit ${TEST_FAILURE}
fi

if ! yarn test:types; then
  echo "test types failed! Exiting..."
  exit ${TEST_FAILURE}
fi

echo ${TEST_SUITE_TYPE} > ${TEST_SUITE_TYPE_FILE}
echo ${TEST_RESULT_FILE_DIR} > ${TEST_RESULT_FILE_DIR_FILE}
exit ${PUBLISH_TYPE_AND_RESULT_DIR_BUT_SUCCEED_IF_NO_RESULTS}
