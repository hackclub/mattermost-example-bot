## Mattermost local stack + simple mmbot

This repo brings up a local Mattermost server (Team Edition) with Postgres and a minimal Node/Express bot that responds to the `/example` slash command by posting a message into the invoking channel.

### Prerequisites
- Docker and Docker Compose v2
- Optional: Node 18+ if you want to run the bot locally instead of Docker

### One-time setup
- Check `.env` at the repo root for ports and image versions. Defaults:
  - Mattermost: http://localhost:8065
  - Postgres: 5433 on host
- mmbot image builds from `mmbot/Dockerfile`.

### Start/stop
- Start the full stack in the foreground (non-daemon):
```bash
./scripts/restart_stack.sh
```
Use Ctrl+C to stop.

### Create an admin user (if needed)
If you need a system admin for testing, you can use your preferred method (UI or CLI). If you already have an admin account and a team, you can skip this step.

### Configure the bot
1) Create a Personal Access Token (PAT) for the user the bot will act as (e.g., your admin or a dedicated bot user):
   - In Mattermost UI: Profile menu → Security → Personal Access Tokens → Create New Token
   - Copy the token value

2) Put the token into `mmbot/.env`:
```env
# mmbot/.env
MM_TOKEN=YOUR_PERSONAL_ACCESS_TOKEN
# Default inside compose network; leave as-is
MM_BASE_URL=http://mm-app:8065
PORT=3000
# Optional: set if you add a token to the slash command itself
SLASH_COMMAND_TOKEN=
```

3) Restart the stack (to pick up env changes if it was already running):
```bash
./scripts/restart_stack.sh
```

### Add the slash command in Mattermost
- Team Menu → Integrations → Slash Commands → Add Slash Command
  - Title: Example
  - Command Trigger Word: example
  - Request URL: http://mmbot:3000/cmd
  - Request Method: POST
  - Response Username: (optional)
  - Token: (optional; if set, put the same value in `SLASH_COMMAND_TOKEN` in `mmbot/.env`)

Note: The `Request URL` uses `mmbot` because the Mattermost server and bot run on the same Docker network. The compose file also sets `MM_SERVICESETTINGS_ALLOWEDUNTRUSTEDINTERNALCONNECTIONS` to allow `mmbot`.

### Try it
In any public channel in that team, run:
```text
/example
```
You should see: “Hello from mmbot! 👋” posted by the bot.

### Running the bot locally (optional)
If you prefer to run the bot on your host instead of Docker:
```bash
cd mmbot
cp .env .env.local  # optional backup/edit
# Ensure .env has MM_TOKEN and MM_BASE_URL=http://localhost:8065 if your server is on the host
npm install
npm start
```
Then set the slash command Request URL to `http://host.docker.internal:3000/cmd` if Mattermost runs in Docker, or `http://localhost:3000/cmd` if Mattermost also runs on host.

### Troubleshooting
- Bot prints “Missing MM_TOKEN”: ensure `mmbot/.env` contains `MM_TOKEN` and restart the stack.
- Port conflicts:
  - Mattermost exposes 8065; change `MATTERMOST_HTTP_PORT` in root `.env` if needed.
  - mmbot maps container 3000 → host 3001; change the port mapping in `docker-compose.yml` if needed.
- Health not green: wait a bit after first start; check logs with `docker compose logs mattermost`.

### Repository layout
- `docker-compose.yml` — services: `db`, `mattermost`, `mmbot`
- `mmbot/` — Node/Express bot
  - `Dockerfile`
  - `src/index.js`
  - `.env` (not committed) — holds `MM_TOKEN` and config
- `scripts/`
  - `restart_stack.sh` — down + up (foreground)
