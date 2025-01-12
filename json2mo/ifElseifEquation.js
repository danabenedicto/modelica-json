function parse (content, rawJson = false) {
  const expressionParser = require('./expression')
  const equationParser = require('./equation')

  var moOutput = ''

  if (content.condition != null) {
    moOutput += expressionParser.parse(content.condition, rawJson)
  }

  var thenEquations = content.then
  var thenOutput = ''
  if (thenEquations != null) {
    thenOutput = ''
    thenEquations.forEach(ele => {
      thenOutput += equationParser.parse(ele, rawJson)
      thenOutput += ';\n'
    })
    if (thenOutput !== '') {
      moOutput += ' then \n'
      moOutput += thenOutput
    }
  }
  return moOutput
}

module.exports = {parse}
