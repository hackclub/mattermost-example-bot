import express from 'express';
import morgan from 'morgan';
import axios from 'axios';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Load env in this order: workspace root .env, then mmbot/.env (local overrides)
try {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  const projectRoot = path.resolve(__dirname, '..', '..');
  const rootEnv = path.join(projectRoot, '.env');
  if (fs.existsSync(rootEnv)) {
    dotenv.config({ path: rootEnv });
  }
} catch (_) {
  // ignore
}
dotenv.config();

const PORT = process.env.PORT || 3000;
const MM_BASE_URL = process.env.MM_BASE_URL || 'http://localhost:8065';
const MM_TOKEN = process.env.MM_TOKEN; // personal access token
const SLASH_COMMAND_TOKEN = process.env.SLASH_COMMAND_TOKEN; // optional verify token

if (!MM_TOKEN) {
  console.error('Missing MM_TOKEN in .env');
  process.exit(1);
}

const app = express();
app.use(morgan('dev'));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Health
app.get('/health', (req, res) => res.json({ ok: true }));

// Slash command endpoint (POST from Mattermost). Configure Command Request URL to /cmd
app.post('/cmd', async (req, res) => {
  try {
    // Mattermost sends application/x-www-form-urlencoded
    const {
      token, // optional validation token configured on slash command
      command,
      text,
      channel_id: channelId,
      user_id: userId,
      team_id: teamId
    } = req.body;

    if (SLASH_COMMAND_TOKEN && token !== SLASH_COMMAND_TOKEN) {
      return res.status(401).send('invalid token');
    }

    if (command !== '/example') {
      return res.status(200).json({ response_type: 'ephemeral', text: 'Unknown command' });
    }

    // Immediately acknowledge the slash command to avoid timeouts
    res.status(200).json({ response_type: 'ephemeral', text: 'Working on it…' });

    // Post a message in the channel as the bot
    await axios.post(
      `${MM_BASE_URL}/api/v4/posts`,
      { channel_id: channelId, message: 'Hello from mmbot! 👋' },
      { headers: { Authorization: `Bearer ${MM_TOKEN}` } }
    );
  } catch (err) {
    console.error('Error handling /cmd:', err.response?.data || err.message);
    if (!res.headersSent) {
      res.status(500).send('error');
    }
  }
});

app.listen(PORT, () => {
  console.log(`mmbot listening on http://localhost:${PORT}`);
});
