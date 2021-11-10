function parse(content, rawJson=false) {
    const util = require('util');
    const class_modificationParser = require('./class_modificationParser');

    var moOutput = "";
    moOutput+="\tannotation ";
    if (rawJson) {
        if (content.class_modification != null) {
            moOutput+=class_modificationParser.parse(content.class_modification, rawJson);
        }
    } else {
        var class_modification = content;
        moOutput+=class_modificationParser.parse(class_modification, rawJson);
    }
    moOutput+="\n"
    return moOutput;
}

module.exports = {parse};