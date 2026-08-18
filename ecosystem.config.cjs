require('dotenv').config({
  path: '.env'
});

module.exports = {
  apps: [{
    name: 'sims-sv',
    script: './.build/index.js',
    env: {
      ...process.env,
      NODE_ENV: 'development'
    },
    env_production: {
      NODE_ENV: 'production'
    },
  }],
}
