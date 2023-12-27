const fs = require('node:fs')

exports.preTagGeneration = (tag) => {
  const packageJson = require('./package.json')
  packageJson.version = tag

  fs.writeFileSync('./package.json', packageJson)

  return tag
}
