import { createPool, migrate } from './core/db.js';
import { createStripe } from './core/billing.js';
import { baseUrlFromEnv } from './core/core-routes.js';
import { sendEmail } from './core/email.js';
import { signId } from './core/tokens.js';
import { createApp } from './app.js';

const port = Number(process.env.PORT || 3000);
const baseUrl = baseUrlFromEnv(port);
const pool = createPool();
await migrate(pool);
const stripe = createStripe();

const app = createApp({ pool, stripe, baseUrl, onPaid: (id) => sendWelcome(id).catch((e) => console.error('welcome email', e.message)) });
app.listen(port, () => console.log(`daily-puzzle on ${port} base=${baseUrl} stripe=${Boolean(stripe)}`));

// Welcome email with a magic link so Plus works on every device.
export async function sendWelcome(subscriberId) {
  const { rows } = await pool.query('SELECT email FROM subscribers WHERE id = $1', [subscriberId]);
  if (!rows[0]) return;
  const link = `${baseUrl}/unlock/${signId(subscriberId)}`;
  await sendEmail({ to: rows[0].email, subject: 'Welcome to Sorted Plus',
    html: `<p>The Sorted archive is yours. Open it on any device with this link:</p><p><a href="${link}">${link}</a></p><p>Manage or cancel: ${baseUrl}/manage/${signId(subscriberId)}</p>`,
    text: `Open the archive on any device: ${link}` });
}
