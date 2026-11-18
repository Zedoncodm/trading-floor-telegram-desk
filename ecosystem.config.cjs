module.exports = {
  apps: [
    {
      name: "trading-desk",
      script: "src/main.ts",
      interpreter: "node",
      node_args: "--env-file=.env",
      args: "--console",
      cwd: __dirname,
      autorestart: true,
      max_restarts: 20,
      restart_delay: 3000,
      env: {
        NODE_ENV: "production",
      },
    },
    {
      name: "trading-desk-tunnel",
      script: "scripts/start-tunnel.mjs",
      interpreter: "node",
      node_args: "--env-file=.env",
      cwd: __dirname,
      autorestart: true,
      max_restarts: 20,
      restart_delay: 5000,
    },
  ],
};
