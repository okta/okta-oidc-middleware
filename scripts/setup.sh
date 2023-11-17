#!/bin/bash -e

# Use the cacert bundled with centos as okta root CA is self-signed and cause issues downloading from yarn
setup_service yarn 1.21.1 /etc/pki/tls/certs/ca-bundle.crt

# Add yarn to the $PATH so npm cli commands do not fail
export PATH="${PATH}:$(yarn global bin)"

# Install required node version
export NVM_DIR="/root/.nvm"
setup_service node v16.16.0

cd ${OKTA_HOME}/${REPO}

# undo permissions change on scripts/publish.sh
git checkout -- scripts

# ensure we're in a branch on the correct sha
git checkout $BRANCH
git reset --hard $SHA

git config --global user.email "oktauploader@okta.com"
git config --global user.name "oktauploader-okta"

if ! yarn install ; then
  echo "yarn install failed! Exiting..."
  exit ${FAILED_SETUP}
fi
