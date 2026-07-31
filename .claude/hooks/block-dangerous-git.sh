#!/bin/bash
input=$(cat)

# Extract command string from JSON if possible
if [[ "$input" =~ \"command\"[[:space:]]*:[[space:]]*\"([^\"]+)\" ]]; then
  cmd="${BASH_REMATCH[1]}"
else
  cmd="$input"
fi

# Clean escaped quotes/characters
cmd=$(echo "$cmd" | sed 's/\\"/"/g')

# Match blocked patterns
if [[ "$cmd" =~ "git push" ]] || \
   [[ "$cmd" =~ "git reset"[[:space:]]+"--hard" ]] || \
   [[ "$cmd" =~ "git clean"[[:space:]]+"-f" ]] || \
   [[ "$cmd" =~ "git branch"[[:space:]]+"-D" ]] || \
   [[ "$cmd" =~ "git checkout"[[:space:]]+"\." ]] || \
   [[ "$cmd" =~ "git restore"[[:space:]]+"\." ]]; then
  echo "BLOCKED: You do not have authority to run dangerous git commands ($cmd)." >&2
  exit 2
fi

exit 0
