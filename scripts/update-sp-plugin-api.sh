#!/bin/sh
# Copy Super Productivity's plugin API types at the given commit into
# packages/sp-plugin-api/src. Usage: scripts/update-sp-plugin-api.sh <commit>
set -eu

commit=${1:?usage: $0 <commit>}
root=$(cd "$(dirname "$0")/.." && pwd)
tmp=$(mktemp -d)
trap 'rm -rf "$tmp"' EXIT

git -C "$tmp" init -q
git -C "$tmp" remote add origin https://github.com/johannesjo/super-productivity.git
git -C "$tmp" fetch -q --depth 1 origin "$commit"
for f in types.ts issue-provider-types.ts global.ts index.ts; do
  git -C "$tmp" show "FETCH_HEAD:packages/plugin-api/src/$f" > "$root/packages/sp-plugin-api/src/$f"
done
git -C "$tmp" show FETCH_HEAD:LICENSE > "$root/packages/sp-plugin-api/LICENSE"
echo "Copied plugin API types of $commit. Update the commit in packages/sp-plugin-api/README.md."
