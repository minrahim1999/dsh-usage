#!/bin/sh
set -eu
cd "$(dirname "$0")/.."
export ELECTRON_RUN_AS_NODE=1
exec '/Applications/DeepSeek Harness.app/Contents/MacOS/DeepSeek Harness' --experimental-vm-modules --test test/installed.test.mjs test/native-render.test.mjs
