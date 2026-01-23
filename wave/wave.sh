#!/bin/bash
# Wave Live Coding Launcher
# Runs Wave with Bun + JACK audio backend

# Check if bun is available
if ! command -v bun &> /dev/null; then
  echo "Error: Bun is required for Wave (JACK FFI backend)"
  echo ""
  echo "Install Bun: curl -fsSL https://bun.sh/install | bash"
  exit 1
fi

# Run Wave with Bun
bun "$(dirname "$0")/runner.js" "$@"
