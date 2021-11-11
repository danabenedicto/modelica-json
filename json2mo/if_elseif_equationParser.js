function parse(content, rawJson=false) {
    const expressionParser = require('./expressionParser');
    const equationParser = require('./equationParser');
    
    var moOutput = "";
    
    if (content.condition != null) {
        moOutput+=expressionParser.parse(content.condition, rawJson);
    } 
    
    var then_equations = content.then;
    if (then_equations != null) {
        thenOutput= "";
        then_equations.forEach(then_equation => {
            thenOutput+=equationParser.parser(then_equation, rawJson);
            thenOutput+=";\n"
        });
        if (thenOutput != "") {
            moOutput+="then \n";
            moOutput+=thenOutput
        }
    }
    return moOutput;
}

module.exports = {parse};