module.exports = {
  apps: [
    {
      name: "showpls-backend",
      script: "dist/apps/api/main.js",
      instances: "max",
      exec_mode: "cluster", 
      watch: false, 
      max_memory_restart: "1G", 
      env_file: ".env"
    }
  ]
};
