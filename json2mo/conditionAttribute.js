function parse (content, rawJson = false) {
  const expressionParser = require('./expression')

  var moOutput = ''
  moOutput += '\n\tif '
  if (rawJson) {
    if (content.expression != null) {
      moOutput += expressionParser.parse(content.expression, rawJson)
    }
  } else {
    var expression = content
    if (expression != null) {
      moOutput += expressionParser.parse(expression, rawJson)
    }
  }
  return moOutput
}

module.exports = {parse}
