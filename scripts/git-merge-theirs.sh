#!/bin/sh
# git merge driver that prefers "theirs" (incoming) during merges.
# Called with: %O %A %B
if [ -z "$3" ]; then
  echo "git-merge-theirs: missing 'their' file parameter" >&2
  exit 1
fi
cat "$3" > "$2"
exit 0
