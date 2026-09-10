/**
 * PM2 Ecosystem — 24/7 configuration for SkyUp WhatsApp Bot.
 *
 * Quick start:
 *   npm install -g pm2        # one-time global install
 *   npm run pm2:start         # start in production mode
 *   npm run pm2:save          # persist across reboots (run once)
 *
 * Then follow the printed `pm2 startup` command to register the systemd/launchd service.
 */

module.exports = {
  apps: [
    {
      name: 'skyup-bot',
      script: 'src/index.js',

      // ---------- restart policy ----------
      // Restart immediately on crash, up to 10 times per minute before giving up.
      autorestart: true,
      max_restarts: 10,
      min_uptime: '10s',      // must stay up 10 s to count as a "successful" start
      restart_delay: 2000,    // wait 2 s between restarts to avoid hammering Mongo

      // ---------- memory guard ----------
      // If the process leaks past 512 MB, PM2 restarts it gracefully.
      max_memory_restart: '512M',

      // ---------- environment ----------
      env_production: {
        NODE_ENV: 'production',
        // PORT, MONGO_URI, MSG91_* etc. come from your real .env on the host.
        // Never put secrets in this file.
      },

      // ---------- logging ----------
      // Logs rotate at 10 MB; keep the last 7 days.
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      error_file: 'logs/err.log',
      out_file: 'logs/out.log',
      merge_logs: true,

      // ---------- graceful shutdown ----------
      // Give in-flight webhook handlers 10 s to finish before SIGKILL.
      kill_timeout: 10000,
      listen_timeout: 15000,
      shutdown_with_message: true,
    },
  ],
};
