#!/bin/sh

npm install @babel/core @babel/node @babel/preset-env @babel/cli --save-dev
npm run build

# Exit immediately if any subcommand terminated
trap "exit 1" ERR

# This script is used to maintain a git branch which mirrors master in a form that
# allows npm dependencies to use:
#
#     "graphql": "git://github.com/LiUGraphQL/graphql-js.git#npm"
#

# Create empty npm directory
rm -rf npm
git clone -b npm "git@github.com:LiUGraphQL/graphql-js.git" npm

# Remove existing files first
rm -rf npm/**/*
rm -rf npm/*

# Copy over necessary files
cp -r dist/* npm/

# Reference current commit
HEADREV=`git rev-parse HEAD`
echo $HEADREV

# Deploy
cd npm
git add -A .
if git diff --staged --quiet; then
  echo "Nothing to publish"
else
  git commit -a -m "Deploy $HEADREV to NPM branch"
  git push > /dev/null 2>&1
  echo "Pushed"
fi