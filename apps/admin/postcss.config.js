const path = require('path')

// Resolve packages from the monorepo root since admin has no local node_modules
const rootModules = path.resolve(__dirname, '../../node_modules')

module.exports = {
  plugins: {
    [path.join(rootModules, 'tailwindcss')]: {},
    [path.join(rootModules, 'autoprefixer')]: {},
  },
}
