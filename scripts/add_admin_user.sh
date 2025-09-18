#!/usr/bin/env bash
set -euo pipefail

EMAIL="orpheus@hackclub.com"
USERNAME="orpheus"
PASSWORD="password"
CONTAINER="mm-app"
SOCKET="/var/tmp/mattermost_local.socket"

if ! docker ps --format '{{.Names}}' | grep -qx "$CONTAINER"; then
  echo "Mattermost container '$CONTAINER' is not running. Start the stack first." >&2
  exit 1
fi

printf "Waiting for local mode"; for i in $(seq 1 60); do if docker exec "$CONTAINER" test -S "$SOCKET"; then echo " - ready"; break; fi; printf "."; sleep 2; done

mm() { docker exec -e MMCTL_LOCAL_SOCKET_PATH="$SOCKET" "$CONTAINER" mmctl --local "$@"; }

# Ensure there's at least one sysadmin (in case the target is the only one)
if ! mm user search tmpadmin@example.com >/dev/null 2>&1; then
  mm user create --email tmpadmin@example.com --username tmpadmin --password Password123! --system-admin --email-verified true || true
fi

# Delete target user if exists (try by username and email)
mm user delete "$USERNAME" --confirm || true
mm user delete "$EMAIL" --confirm || true

# Recreate as system admin with given password
mm user create --email "$EMAIL" --username "$USERNAME" --password "$PASSWORD" --system-admin --email-verified true

# Verify and show summary
mm user search "$EMAIL"

# Cleanup temp admin if we created it
if mm user search tmpadmin@example.com | grep -q tmpadmin@example.com; then
  mm user delete tmpadmin@example.com --confirm || true
fi
