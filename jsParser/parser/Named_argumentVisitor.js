const modelicaVisitor = require('../antlrFiles/modelicaVisitor').modelicaVisitor;
const Named_argument = require('../domain/Named_argument');

const Function_argumentVisitor = require('./Function_argumentVisitor');

class Named_argumentVisitor {
    constructor() {
        modelicaVisitor.call(this);
        return this;
    }
    visitNamed_argument(ctx) {
        var identifier = ctx.IDENT()? ctx.IDENT().getText(): "";
        var value = null;

        if (ctx.function_argument()) {
            var named_argumentsVisitor = new Named_argumentsVisitor();
            named_arguments = named_argumentsVisitor.visitNamed_arguments(ctx.named_arguments());
        }
        if (ctx.function_argument()) {
            var function_argumentVisitor = new Function_argumentVisitor.Function_argumentVisitor();
            value = function_argumentVisitor.visitFunction_argument(ctx.function_argument());
        }

        return new Named_argument.Named_argument(identifier, value);
    }
};

Named_argumentVisitor.prototype = Object.create(modelicaVisitor.prototype);

exports.visitNamed_argument = this.visitNamed_argument;
exports.Named_argumentVisitor = Named_argumentVisitor;