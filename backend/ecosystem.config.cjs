module.exports = {
  apps: [
    {
      name: "fullstack-app-backend",
      script: "dist/server.js",
      instances: 1,
      exec_mode: "fork",
      env: {
        NODE_ENV: "production"
      }
    }
  ]
};
