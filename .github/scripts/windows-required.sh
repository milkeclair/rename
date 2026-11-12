#!/bin/bash

set -euo pipefail

# 文書・Release手順だけの差分でWindowsを省略する。判定できない場合は全検証する。
# 引数: イベント名、比較元SHA、実行SHA、Releaseバージョン。標準出力: true/false。
windows_required() {
  local event_name="${1:-}"
  local base_commit="${2:-}"
  local head_commit="${3:-}"
  local release_version="${4:-}"

  if [[ -n "$release_version" || ( "$event_name" != push && "$event_name" != pull_request ) ]]; then
    echo true
    return
  fi

  local changed_files
  if ! changed_files=$(git -c core.quotePath=true diff --no-renames --name-only "$base_commit" "$head_commit" -- 2>/dev/null); then
    echo true
    return
  fi

  local file
  while IFS= read -r file; do
    case "$file" in
      ''|README.md|build/README.md|docs/*|.github/workflows/release.yml) ;;
      *) echo true; return ;;
    esac
  done <<< "$changed_files"
  echo false
}

windows_required "$@"
