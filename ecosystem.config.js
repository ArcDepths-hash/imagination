module.exports = {
  apps: [
    {
      name: 'main-bot',
      script: 'bot.js',
      autorestart: true,
      max_memory_restart: '1G',
      env: { NODE_ENV: 'production' }
    },
    {
      name: 'prefix-bot',
      script: 'prefix.js',
      autorestart: true,
      max_memory_restart: '1G',
      env: { NODE_ENV: 'production' }
    },
    {
      name: 'moderation-bot',
      script: 'moderation.js',
      autorestart: true,
      max_memory_restart: '1G',
      env: { NODE_ENV: 'production' }
    },
    {
      name: 'rankup-bot',
      script: 'rankup.js',
      autorestart: true,
      max_memory_restart: '1G',
      env: { NODE_ENV: 'production' }
    },
    // 🛠️ ADDED STAFF MODULE WORKER
    {
      name: 'staff-bot',
      script: 'staff.js',
      autorestart: true,
      max_memory_restart: '1G',
      env: { NODE_ENV: 'production' }
    }
  ]
};
