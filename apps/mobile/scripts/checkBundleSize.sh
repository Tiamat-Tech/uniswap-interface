#!/bin/bash
# Measured on the PR's merge with main, so main-side growth can move this.
# Bumped 32.5 -> 33.0 for the @uniswap/client-data-api 0.0.217 -> 0.0.227 upgrade (added generated
# proto code); the bundle grew ~8KB over the old cap, well under the 0.5MB "check with the team" bar.
# Lowered 34.0 -> 33.5 after the Tamagui-bearing ui/src internals came out: the bundle measures
# 33.2725 MB, which left more than MAX_BUFFER of slack and so tripped the ratchet below.
MAX_SIZE=33.5
MAX_BUFFER=0.5

# Check OS type and use appropriate stat command
if [[ $OSTYPE == "darwin"* ]]; then
  # MacOS
  BUNDLE_SIZE=$(stat -f %z ios/main.jsbundle | awk '{print $1/1024/1024}')
else
  # Linux and others
  BUNDLE_SIZE=$(stat --format=%s ios/main.jsbundle | awk '{print $1/1024/1024}')
fi

if (($(echo "$BUNDLE_SIZE > $MAX_SIZE" | bc -l))); then
  echo "Bundle size ($BUNDLE_SIZE MB) exceeds limit ($MAX_SIZE MB). If you are adding new dependencies or files and see an increase of the bundle size by > 0.5MB, please check with the team. Otherwise you can bump the max size in the script by 0.5MB."
  exit 1
elif (($(echo "$BUNDLE_SIZE + $MAX_BUFFER < $MAX_SIZE" | bc -l))); then
  echo "Bundle size ($BUNDLE_SIZE MB) has too much buffer (Max buffer is $MAX_BUFFER MB)! Please bump down the limit to be within $MAX_BUFFER of the current bundle size to ensure we retain our bundle size gains!"
  exit 1
else
  echo "✅ Bundle size ($BUNDLE_SIZE MB) is within limit ($MAX_SIZE MB)"
fi
