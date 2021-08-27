#!/bin/bash -xe

PACKAGES=(
  "./packages/oidc-middleware"
)

for PACKAGE in "${PACKAGES[@]}"
do
    pushd $PACKAGE
    yarn test
    if [ $? -ne 0 ]; then
        echo "------- [ERROR] Test failures in $PACKAGE -------"
        exit 1
    fi
    popd
done
