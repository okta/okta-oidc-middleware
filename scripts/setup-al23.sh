#!/bin/bash -e

# NOTE: designed to run on Amazon Linux 2023
cat /etc/*release*

# Install required node version
export NVM_DIR="/root/.nvm"
setup_service node "${1:-v16.16.0}"

npm install -g yarn
export PATH="$PATH:$(npm config get prefix)/bin"

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
