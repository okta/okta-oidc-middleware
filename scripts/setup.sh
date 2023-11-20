#!/bin/bash -e

# Install required node version
export NVM_DIR="/root/.nvm"
setup_service node "${1:-v16.16.0}"

# NOTE: designed to run on CentOS
distro=$(awk -F= '$1=="ID" { print $2 ;}' /etc/os-release | tr -d '"')
echo $distro

if [ "$distro" = "centos" ]; then
  # Use the cacert bundled with centos as okta root CA is self-signed and cause issues downloading from yarn
  setup_service yarn 1.21.1 /etc/pki/tls/certs/ca-bundle.crt
  # Add yarn to the $PATH so npm cli commands do not fail
  export PATH="${PATH}:$(yarn global bin)"
elif [ "$distro" = "amzn" ]; then
  npm install -g yarn
  export PATH="$PATH:$(npm config get prefix)/bin"
else
  echo "Unknown OS environment, exiting..."
  exit ${FAILED_SETUP}
fi

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
