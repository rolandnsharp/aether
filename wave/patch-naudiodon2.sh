#!/bin/bash
# Patch naudiodon2 to fix C++ compilation error
# This script adds the missing #include <string> to PaContext.h

PATCH_FILE="node_modules/naudiodon2/src/PaContext.h"

if [ ! -f "$PATCH_FILE" ]; then
  echo "Error: $PATCH_FILE not found"
  echo "Run 'npm install' first"
  exit 1
fi

# Check if already patched
if grep -q "#include <string>" "$PATCH_FILE"; then
  echo "✓ naudiodon2 already patched"
  exit 0
fi

echo "Patching naudiodon2..."

# Create backup
cp "$PATCH_FILE" "$PATCH_FILE.backup"

# Add #include <string> after #include <mutex>
sed -i '/#include <mutex>/a #include <string>' "$PATCH_FILE"

echo "✓ Patch applied successfully"
echo "  Added: #include <string> to $PATCH_FILE"

# Rebuild naudiodon2
echo "Rebuilding naudiodon2..."
npm rebuild naudiodon2

if [ $? -eq 0 ]; then
  echo "✓ naudiodon2 rebuilt successfully"
else
  echo "✗ Rebuild failed"
  echo "Restoring backup..."
  mv "$PATCH_FILE.backup" "$PATCH_FILE"
  exit 1
fi

# Clean up backup
rm -f "$PATCH_FILE.backup"

echo ""
echo "🎵 naudiodon2 is ready to use!"
