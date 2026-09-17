#!/usr/bin/env bash
set -euo pipefail

project_root="$(cd "$(dirname "$0")/.." && pwd)"
source_root="$project_root/vendor/Nuked-OPN2"
output_dir="$project_root/public/audio"

if ! command -v emcc >/dev/null 2>&1; then
  echo "error: emcc was not found. Install or activate Emscripten." >&2
  exit 1
fi

mkdir -p "$output_dir"

emcc \
  "$project_root/wasm/opn2_adapter.c" \
  "$source_root/ym3438.c" \
  -I"$source_root" \
  -O3 \
  -s WASM=1 \
  -s SINGLE_FILE=1 \
  -s MODULARIZE=1 \
  -s EXPORT_ES6=1 \
  -s ENVIRONMENT=web,worker,node \
  -s ALLOW_MEMORY_GROWTH=0 \
  -s INITIAL_MEMORY=16777216 \
  -s FILESYSTEM=0 \
  -s EXPORTED_FUNCTIONS='["_opnz_init","_opnz_reset","_opnz_write","_opnz_render","_opnz_buffer_ptr","_opnz_native_rate"]' \
  -s EXPORTED_RUNTIME_METHODS='["HEAP16"]' \
  -o "$output_dir/nuked-opn2.js"

echo "Built public/audio/nuked-opn2.js"
