#!/usr/bin/env sh
set -eu

git config core.hooksPath .githooks
git config push.followTags false

echo "Configured repo hooks path to .githooks"
echo "Configured push.followTags=false for this repo"
