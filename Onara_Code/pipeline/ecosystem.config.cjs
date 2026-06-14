module.exports = {
  apps: [
    {
      name: "onara-pipeline",
      cwd: __dirname,
      script: "cmd.exe",
      args: "/c start_pipeline_pm2.cmd",
      interpreter: "none",
      autorestart: true,
      watch: false,
      min_uptime: "10s",
      max_restarts: 10,
      env: {
        PYTHONUNBUFFERED: "1",
      },
    },
  ],
};
