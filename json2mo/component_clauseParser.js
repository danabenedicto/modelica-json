function parse(content, rawJson=false) {
    const type_specifierParser = require('./type_specifierParser');
    const array_subscriptsParser = require('./array_subscriptsParser');
    const component_listParser = require('./component_listParser');
    const util = require('util');
    
    var moOutput = "";
    
    if (content.type_prefix != null) {
        moOutput+=util.format("%s ", content.type_prefix);
    }
    if (rawJson) {
        if (content.type_specifier != null) {
            moOutput+=type_specifierParser.parse(content.type_specifier, rawJson);
        }
    } else {
        if (content.type_specifier != null) {
            moOutput+=util.format("%s ", content.type_specifier);
        }
    }
    
    if (content.array_subscripts != null) {
        moOutput+=array_subscriptsParser.parse(content.array_subscripts, rawJson);
    }
    if (content.component_list != null) {
        moOutput+=component_listParser.parse(content.component_list, rawJson);
    }
    return moOutput;
}

module.exports = {parse};