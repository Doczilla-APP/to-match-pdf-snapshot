const fs = require('node:fs')
const packageJson = require('package.json')

exports.preTagGeneration = (tag) => {
  const packageJson = require('./package.json')
  packageJson.version = tag

  fs.writeFileSync('./package.json', JSON.stringify(packageJson))

  return tag
}
