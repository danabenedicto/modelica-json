// const fs = require('fs')
var logger = require('winston')
const pa = require('../lib/parser.js')
const ut = require('../lib/util.js')

/** Get the JSON property `p` from the json data `o`
  * If the property does not exist, the function returns null
  */
const getProperty = (p, o) =>
  p.reduce((xs, x) =>
    (xs && xs[x]) ? xs[x] : null, o)

/**
 * Get the simplified json (not raw) representation for the model
 * 
 * @param model raw-json output from the Java-Antlr parsing
 * @param parseMode parsing mode, "cdl" or "modelica"
 */
function simplifyModelicaJSON (model, parseMode) {
  const within = model.within
  const finalDef = model.final_class_definitions
  const claDefArr = []
  finalDef.forEach(function (obj) {
    const final = obj.is_final ? true : undefined
    const claDef = classDefinition(obj.class_definition)
    claDefArr.push(Object.assign({'final': final}, claDef))
  })
  return Object.assign(
    {'within': within},
    {'class_definition': claDefArr},
    {'modelicaFile': model.modelicaFile},
    {'fullMoFilePath': model.fullMoFilePath},
    {'checksum': model.checksum})
}

function classDefinition (claDef) {
  const encapsulated = claDef.encapsulated
  const class_prefixes = claDef.class_prefixes
  const class_specifier = classSpecifier(claDef.class_specifier)
  return Object.assign(
    {'encapsulated': encapsulated ? encapsulated : undefined},
    {'class_prefixes': class_prefixes},
    {'class_specifier': class_specifier}
  )
}

/**
 * Get the simplified json representation for the class_specifier object
 * 
 * @param claSpe class_specifier value
 */
function classSpecifier (claSpe) {
  const longClass = claSpe.long_class_specifier
  const shortClass = claSpe.short_class_specifier
  const derClass = claSpe.der_class_specifier
  return longClass ? (Object.assign({'long_class_specifier': longClassSpecifier(longClass)}))
                   : (shortClass ? (Object.assign({'short_class_specifier': shortClassSpecifier(shortClass)}))
                                 : (Object.assign({'der_class_specifier': derClassSpecifier(derClass)})))
}

/**
 * Get the simplified json representation for the long_class_specifier object
 * 
 * @param lonClaSpe long_class_specifier value
 */
function longClassSpecifier (lonClaSpe) {
  const ident = lonClaSpe.identifier
  const desStr = trimDesString(lonClaSpe.string_comment)
  const comp = composition(lonClaSpe.composition)
  const ext = lonClaSpe.is_extends
  const claMod = lonClaSpe.class_modification
  const claModObj = claMod ? classModification(claMod) : undefined
  return Object.assign(
    {'identifier': ident},
    {'description_string': desStr},
    {'composition': !ut.isEmptyObject(comp) ? comp : undefined},
    {'extends': ext ? ext : undefined},
    {'class_modification': claModObj})
}

/**
 * Get the simplified json representation for the composition object
 * 
 * @param com composition value
 */
function composition (com) {
  const eleLisObj = com.element_list
  const eleLis = !ut.isEmptyObject(eleLisObj) ? elementList(com.element_list) : undefined
  const eleSecObj = com.element_sections
  const eleSec = (eleSecObj.length > 0) ? elementSections(com.element_sections) : undefined
  const extCom = com.external_composition
  const extComObj = extCom ? externalComposition(extCom) : undefined
  const ann = com.annotation ? com.annotation.class_modification : null
  const annObj = ann ? classModification(ann) : undefined
  return Object.assign(
    {'element_list': eleLis},
    {'element_sections': eleSec},
    {'external_composition': extComObj},
    {'annotation': (annObj === '()') ? undefined : annObj})
}

/**
 * Get the simplified json representation for the element_list object
 * 
 * @param eleLis element_list value
 */
function elementList (eleLis) {
  const ele = eleLis.elements
  const eleArr = []
  for (var i = 0; i < ele.length; i++) {
    const obj = ele[i]
    const impCla = obj.import_clause
    const extCla = obj.extends_clause
    const redeclare = obj.redeclare
    const final = obj.is_final
    const inner = obj.inner
    const outer = obj.outer
    const replaceable = obj.replaceable
    const conCla = obj.constraining_clause
    const claDef = obj.class_definition
    const comCla = obj.component_clause
    const des = obj.comment
    const desObj = des ? description(des) : undefined
    eleArr.push(Object.assign(
      {'import_clause': impCla ? importClause(impCla) : undefined},
      {'extends_clause': extCla ? extendsClause(extCla): undefined},
      {'redeclare': redeclare ? redeclare : undefined},
      {'final': final ? final : undefined},
      {'innner': inner ? inner : undefined},
      {'outer': outer ? outer : undefined},
      {'replaceable': replaceable ? replaceable : undefined},
      {'constraining_clause': conCla ? constrainingClause(conCla) : undefined},
      {'class_definition': claDef ? classDefinition(claDef) : undefined},
      {'component_clause': comCla ? componentClause(comCla) : undefined},
      {'description': !ut.isEmptyObject(desObj) ? desObj : undefined}))
  }
  return eleArr
}

/**
 * Get the simplified json representation for the import_clause object
 * 
 * @param impCla import_clause value
 */
function importClause (impCla) {
  const identifier = impCla.identifier
  const name = impCla.name
  const dotSta = impCla.dot_star
  const impLis = impCla.import_list
  const comment = impCla.comment
  const desObj = comment ? description(comment) : undefined
  return Object.assign(
    {'identifier': identifier},
    {'name': name ? nameString(name) : undefined},
    {'dot_star': dotSta ? '.*' : undefined},
    {'import_list': impLis ? importList(impLis) : undefined},
    {'description': !ut.isEmptyObject(desObj) ? desObj : undefined}
  )
}

/**
 * Get the string of the import_list object
 * 
 * @param impLis import_list value
 */
function importList (impLis) {
  const ideLis = impLis.identifier_list
  return ideLis.join(',')
}

/**
 * Get the simplified json representation for the description object
 * 
 * @param des description value
 */
function description (des) {
  const strDes = trimDesString(des.string_comment)
  const ann = des.annotation ? des.annotation.class_modification : null
  const annotation = ann ? classModification(ann) : undefined
  return Object.assign(
    {'description_string': strDes},
    {'annotation': (annotation === '()') ? undefined : annotation}
  )
}

function trimDesString (strCom) {
  const str = (strCom === '') ? undefined : strCom
  const triStr = str ? str.trim() : undefined
  return triStr ? triStr.substr(1,triStr.length-2) : undefined
}


/**
 * Get the simplified json representation for the extends_clause object
 * 
 * @param extCla extends_clause value
 */
function extendsClause (extCla) {
  const name = extCla.name
  const claMod = extCla.class_modification
  const ann = extCla.annotation ? extCla.annotation.class_modification : null
  const annotation = ann ? classModification(ann) : undefined
  return Object.assign(
    {'name': name ? nameString(name) : undefined},
    {'class_modification': claMod ? classModification(claMod) : undefined},
    {'annotation': (annotation === '()') ? undefined : annotation}
  )
}

/**
 * Get the simplified json representation for the constraining_clause object
 * 
 * @param conCla constraining_clause value
 */
function constrainingClause (conCla) {
  const name = conCla.name
  const claMod = conCla.class_modification
  return Object.assign(
    {'name': name ? nameString(name) : undefined},
    {'class_modification': claMod ? classModification(claMod) : undefined}
  )
}

/**
 * Get the simplified json representation for the component_clause object
 * 
 * @param comCla component_clause value
 */
function componentClause (comCla) {
  const prefix = comCla.type_prefix
  const typSpe = comCla.type_specifier
  const arrSub = comCla.array_subscripts
  const comLis = comCla.component_list
  return Object.assign(
    {'type_prefix': prefix},
    {'type_specifier': typeSpecifier(typSpe)},
    {'array_subscripts': arrSub ? arraySubscripts(arrSub) : undefined},
    {'component_list': comLis ? componentList(comLis) : undefined}
  )
}

function typeSpecifier (typSpe) {
  const name = typSpe.name
  return nameString(name)
}

/**
 * Get the simplified json representation for the array_subscripts object
 * 
 * @param arrSub array_subscripts value
 */
function arraySubscripts (arrSub) {
  const eleArr = []
  arrSub.subscripts.forEach (function (obj) {
    const exp = obj.expression
    const colOp = obj.colon_op
    eleArr.push(Object.assign(
      {'colon_op': colOp ? colOp : undefined},
      {'expression': exp ? expression(exp) : undefined}
    ))
  })
  return eleArr
}

/**
 * Get the simplified json representation for the expression object
 * 
 * @param expObj expression value
 */
function expression (expObj) {
  const simExp = expObj.simple_expression
  const ifExp = expObj.if_expression
  const ifExpObj = ifExp ? ifExpression(ifExp) : undefined
  return Object.assign(
    {'simple_expression': simExp ? simpleExpression(simExp) : undefined},
    {'if_expression': !ut.isEmptyObject(ifExpObj) ? ifExpObj : undefined}
  )
}

/**
 * Get the simplified json representation for the if_expression object
 * 
 * @param ifExp if_expression value
 */
function ifExpression (ifExp) {
  const ifEls = ifExp.if_elseif
  const elsExp = ifExp.else_expression
  const ifElsArr = []
  ifEls.forEach(function (obj) {
    const con = obj.condition
    const then = obj.then
    ifElsArr.push(Object.assign(
      {'condition': con ? expression(con) : undefined},
      {'then': then ? expression(then) : undefined}
    ))
  })
  return Object.assign(
    {'if_elseif': (ifElsArr.length > 0) ? ifElsArr : undefined},
    {'else_expression': elsExp ? expression(elsExp) : undefined}
  )
}

/**
 * Get the simplified json representation for the component_list object
 * 
 * @param comLis component_list value
 */
function componentList (comLis) {
  const compList = comLis.component_declaration_list
  const decLisArr = []
  compList.forEach(function (obj) {
    const dec = obj.declaration
    const conAtt = obj.condition_attribute
    const com = obj.comment
    const comObj = com ? description(com) : undefined
    decLisArr.push(Object.assign(
      {'declaration': dec ? declaration(dec) : undefined},
      {'condition_attribute': conAtt ? expression(conAtt.expression) : undefined},
      {'description': !ut.isEmptyObject(comObj) ? comObj : undefined}
    ))
  })
  return decLisArr
}

/**
 * Get the simplified json representation for the declaration object
 * 
 * @param dec declaration value
 */
function declaration (dec) {
  const ident = dec.identifier
  const arrSub = dec.array_subscripts
  const mod = dec.modification
  return Object.assign(
    {'identifier': ident},
    {'array_subscripts': arrSub ? arraySubscripts(arrSub) : undefined},
    {'modification': mod ? modification(mod) : undefined}
  )
}

/**
 * Get the simplified json representation for the modification object
 * 
 * @param mod modification value
 */
function modification (mod) {
  const claMod = mod.class_modification
  const equ = mod.equal
  const colEqu = mod.colon_equal
  const exp = mod.expression
  return Object.assign(
    {'class_modification': claMod ? classModification(claMod) : undefined},
    {'equal': equ ? equ : undefined},
    {'colon_equal': colEqu ? colEqu : undefined},
    {'expression': exp ? expression(exp) : undefined}
  )
}

/**
 * Get the simplified json representation for the class_modification object
 * 
 * @param claMod class_modification value
 */
function classModification (claMod) {
  const argLis = claMod.argument_list
  if (argLis) {
    const claModArr = []
    const args = argLis.arguments
    args.forEach(function (ele) {
      const eleModRep = ele.element_modification_or_replaceable
      const eleRed = ele.element_redeclaration
      claModArr.push(Object.assign(
        {'element_modification_or_replaceable': eleModRep ? elementModificationReplaceable(eleModRep) : undefined},
        {'element_redeclaration': eleRed ? elementRedeclaration(eleRed) : undefined}
      ))
    })
    return claModArr
  } else {
    return '()'
  }
}

/**
 * Get the simplified json representation for the element_modification_or_replaceable object
 * 
 * @param eleModRep element_modification_or_replaceable value
 */
function elementModificationReplaceable (eleModRep) {
  const each = eleModRep.each
  const final = eleModRep.is_final
  const eleMod = eleModRep.element_modification
  const eleRep = eleModRep.element_replaceable
  return Object.assign(
    {'each': each ? each : undefined},
    {'final': final ? final : undefined},
    {'element_modification': eleMod ? elementModification(eleMod) : undefined},
    {'element_replaceable': eleRep ? elementReplaceable(eleRep) : undefined}
  )
}

/**
 * Get the simplified json representation for the element_modification object
 * 
 * @param eleMod element_modification value
 */
function elementModification (eleMod) {
  const name = eleMod.name ? nameString(eleMod.name) : undefined
  const mod = eleMod.modification
  const desStr = trimDesString(eleMod.string_comment)
  return Object.assign(
    {'name': name},
    {'modification': mod ? modification(mod) : undefined},
    {'description_string': desStr}
  )
}

/**
 * Get the simplified json representation for the element_replaceable object
 * 
 * @param eleRep element_replaceable value
 */
function elementReplaceable (eleRep) {
  const shoClaDef = eleRep.short_class_definition
  const comCla1 = eleRep.component_clause1
  const conCla = eleRep.constraining_clause
  return Object.assign(
    {'short_class_definition': shoClaDef ? shortClassDefinition(shoClaDef) : undefined},
    {'component_clause1': comCla1 ? componentClause1(comCla1) : undefined},
    {'constraining_clause': conCla ? constrainingClause(conCla) : undefined}
  )
}

/**
 * Get the simplified json representation for the short_class_definition object
 * 
 * @param shoClaDef short_class_definition value
 */
function shortClassDefinition (shoClaDef) {
  const claPre = shoClaDef.class_prefixes
  const shoClaSpe = shoClaDef.short_class_specifier
  return Object.assign(
    {'class_prefixes': claPre},
    {'short_class_specifier': shortClassSpecifier(shoClaSpe)}
  )
}

/**
 * Get the simplified json representation for the component_clause1 object
 * 
 * @param comCla1 component_clause1 value
 */
function componentClause1 (comCla1) {
  const typPre = comCla1.type_prefix
  const typSpe = comCla1.type_specifier
  const comDec1 = comCla1.component_declaration1
  return Object.assign(
    {'type_prefix': typPre},
    {'type_specifier': typeSpecifier(typSpe)},
    {'component_declaration1': componentDeclaration1(comDec1)}
  )
}

/**
 * Get the simplified json representation for the component_declaration1 object
 * 
 * @param comDec1 component_declaration1 value
 */
function componentDeclaration1 (comDec1) {
  const dec = comDec1.declaration
  const des = comDec1.comment
  const desObj = des ? description(des) : undefined
  return Object.assign(
    {'declaration': declaration(dec)},
    {'description': !ut.isEmptyObject(desObj) ? desObj : undefined}
  )
}

/**
 * Get the simplified json representation for the component_declaration1 object
 * 
 * @param comDec1 component_declaration1 value
 */
function elementRedeclaration (eleRed) {
  const each = eleRed.each
  const final = eleRed.is_final
  const shoClaDef = eleRed.short_class_definition
  const comCla1 = eleRed.component_clause1
  const eleRep = eleRed.element_replaceable
  return Object.assign(
    {'each': each ? each : undefined},
    {'final': final ? final :undefined},
    {'short_class_definition': shoClaDef ? shortClassDefinition(shoClaDef) : undefined},
    {'component_clause1': comCla1 ? componentClause1(comCla1) : undefined},
    {'element_replaceable': eleRep ? elementReplaceable(eleRep) : undefined}
  )
}

/**
 * Get the simplified json representation for the element_sections object
 * 
 * @param eleSec element_sections value
 */
function elementSections (eleSec) {
  const secArr = []
  eleSec.forEach(function (obj) {
    const pubEle = obj.public_element_list
    const proEle = obj.protected_element_list
    const equSec = obj.equation_section
    const algSec = obj.algorithm_section
    secArr.push(Object.assign(
      {'public_element_list': pubEle ? elementList(pubEle) : undefined},
      {'protected_element_list': proEle ? elementList(proEle) : undefined},
      {'equation_section': equSec ? equationSection(equSec) : undefined},
      {'algorithm_section': algSec ? algorithmSection(algSec) : undefined}
    ))
  })
  return secArr
}

/**
 * Get the simplified json representation for the element_section object
 * 
 * @param eleSec element_section value
 */
function equationSection (equSec) {
  const ini = equSec.initial
  const equLis = equSec.equations
  const equArr = []
  equLis.forEach(function (obj) {
    equArr.push(equation(obj))
  })
  return Object.assign(
    {'initial': ini ? ini : undefined},
    {'equation': equArr}
  )
}

/**
 * Get the simplified json representation for the equation object
 * 
 * @param equ equation value
 */
function equation (equ) {
  const assEqu = equ.assignment_equation
  const ifEqu = equ.if_equation
  const forEqu = equ.for_equation
  const conCla = equ.connect_clause
  const wheEqu = equ.when_equation
  const funCalEqu = equ.function_call_equation
  const des = equ.comment
  const desObj = des ? description(des) : undefined
  return Object.assign(
    {'assignment_equation': (assEqu && !ut.isEmptyObject(assEqu)) ? assignmentEquation(assEqu) : undefined},
    {'if_equation': ifEqu ? ifEquation(ifEqu) : undefined},
    {'for_equation': forEqu ? forEquation(forEqu) : undefined},
    {'connect_clause': conCla ? connectClause(conCla) : undefined},
    {'when_equation': wheEqu ? whenEquation(wheEqu) : undefined},
    {'function_call_equation': (funCalEqu && !ut.isEmptyObject(funCalEqu)) ? functionCallEquation(funCalEqu) : undefined},
    {'description': !ut.isEmptyObject(desObj) ? desObj : undefined}
  )
}

/**
 * Get the simplified json representation for the assigment_equation object
 * 
 * @param assEqu assigment_equation value
 */
function assignmentEquation (assEqu) {
  const simExp = assEqu.lhs
  const exp = assEqu.rhs
  return Object.assign(
    {'lhs': simExp ? simpleExpression(simExp) : undefined},
    {'rhs': exp ? expression(exp) : undefined}
  )
}

/**
 * Get the simplified json representation for the if_equation object
 * 
 * @param ifEqu if_equation value
 */
function ifEquation (ifEqu) {
  const ifEls = ifEqu.if_elseif
  const elsEqu = ifEqu.else_expression
  const ifElsArr = []
  ifEls.forEach(function (obj) {
    const theEquArr = []
    const theEqu = obj.then
    theEqu.forEach(function (ele) {
      theEquArr.push(Object.assign(
        {'equation': equation(ele)}
      ))
    })
    ifElsArr.push(Object.assign(
      {'condition': obj.condition ? expression(obj.condition) : undefined},
      {'then': theEquArr}
    ))
  })
  const elsArr = []
  if (elsEqu) {
    elsEqu.forEach(function (obj) {
      elsArr.push(equation(obj))
    })
  }
  return Object.assign(
    {'if_elseif': ifElsArr},
    {'else_equation': elsEqu ? elsArr : undefined}
  )
}

/**
 * Get the simplified json representation for the for_equation object
 * 
 * @param forEqu for_equation value
 */
function forEquation (forEqu) {
  const forInd = forEqu.for_indices
  const looEqu = forEqu.loop_equations
  const looEquArr = []
  looEqu.forEach(function (obj) {
    looEquArr.push(equation(obj))
  })
  return Object.assign(
    {'for_indices': forIndices(forInd)},
    {'loop_equations': looEquArr}
  )
}

/**
 * Get the simplified json representation for the connect_clause object
 * 
 * @param conCla connect_clause value
 */
function connectClause (conCla) {
  return Object.assign(
    {'from': componentReference(conCla.from)},
    {'to': componentReference(conCla.to)}
  )
}

/**
 * Get the simplified json representation for the component_reference object
 * 
 * @param comRef component_reference value
 */
function componentReference (comRef) {
  const comPar = comRef.component_reference_parts
  const parArr = []
  comPar.forEach(function (obj) {
    const arrSub = obj.array_subscripts
    parArr.push(Object.assign(
      {'dot_op': obj.dot_op},
      {'identifier': obj.identifier},
      {'array_subscripts': arrSub ? arraySubscripts(arrSub) : undefined}
    ))
  })
  return parArr
}

/**
 * Get the simplified json representation for the when_equation object
 * 
 * @param wheEqus when_equation value
 */
function whenEquation (wheEqus) {
  const wheEqu = wheEqus.when_elsewhen
  const wheEquArr = []
  wheEqu.forEach(function (obj) {
    const con = obj.condition
    const the = obj.then
    const theArr = []
    the.forEach(function (ele) {
      theArr.push(equation(ele))
    })
    wheEquArr.push(Object.assign(
      {'condition': con ? expression(con) : undefined},
      {'then': theArr}
    ))
  })
  return wheEquArr
}

/**
 * Get the simplified json representation for the function_call_equation object
 * 
 * @param funCalEqu function_call_equation value
 */
function functionCallEquation (funCalEqu) {
  const name = funCalEqu.function_name
  const funCalArg = funCalEqu.function_call_args
  return Object.assign(
    {'function_name': name ? nameString(name) : undefined},
    {'function_call_args': funCalArg ? functionCallArgs(funCalArg) : undefined}
  )
}

/**
 * Get the simplified json representation for the function_call_args object
 * 
 * @param funCalArg function_call_args value
 */
function functionCallArgs (funCalArg) {
  const funArgs = funCalArg.function_arguments
  return funArgs ? functionArguments(funArgs) : undefined
}

/**
 * Get the simplified json representation for the function_arguments object
 * 
 * @param funArgs function_arguments value
 */
function functionArguments (funArgs) {
  const namArg = funArgs.named_arguments
  const funArg = funArgs.function_argument
  const forInd = funArgs.for_indices
  const intFunArgs = funArgs.function_arguments
  return Object.assign(
    {'named_arguments': namArg ? namedArguments(namArg) : undefined},
    {'function_argument': funArg ? functionArgument(funArg) : undefined},
    {'for_indices': forInd ? forIndices(forInd) : undefined},
    {'function_arguments': intFunArgs ? functionArguments(intFunArgs) : undefined}
  )
}

/**
 * Get the simplified json representation for the named_arguments object
 * 
 * @param namArg named_arguments value
 */
function namedArguments (namArg) {
  const args = namedArgsArray(namArg)
  const namArgArr = []
  args.forEach(function (obj) {
    const ident = obj.identifier
    const val = obj.value
    namArgArr.push(Object.assign(
      {'identifier': ident},
      {'value': val ? functionArgument(val) : undefined}
    ))
  })
  return namArgArr
}

/**
 * Get the simplified json representation for the function_argument object
 * 
 * @param funArg function_argument value
 */
 function functionArgument (funArg) {
   const name = funArg.function_name
   const namArg = funArg.named_arguments
   const exp = funArg.expression
   return Object.assign(
     {'function_name': name ? nameString(name) : undefined},
     {'named_arguments': namArg ? namedArguments(namArg) : undefined},
     {'expression': exp ? expression(exp) : undefined}
   )
 }

/**
 * Get the simplified json representation for the for_indices object
 * 
 * @param forInd for_indices value
 */
function forIndices (forInd) {
  const indLis = forInd.indices
  const indArr = []
  indLis.forEach(function (obj) {
    const exp = obj.expression
    indArr.push(Object.assign(
      {'identifier': obj.identifier},
      {'expression': exp ? expression(exp) : undefined}
    ))
  })
  return indArr
}

/**
 * Get the simplified json representation for the algorithm_section object
 * 
 * @param algSec algorithm_section value
 */
 function algorithmSection (algSec) {
  const ini = algSec.initial
  const staLis = algSec.statements
  const staArr = []
  staLis.forEach(function (obj) {
    staArr.push(statement(obj))
  })
  return Object.assign(
    {'initial': ini ? ini : undefined},
    {'statement': staArr}
  )
}

/**
 * Get the simplified json representation for the statement object
 * 
 * @param sta statement value
 */
function statement (sta) {
  const assSta = sta.assignment_statement
  const funCalSta = sta.Function_call_statement
  const assWithFunCalSta = sta.b ? sta.b.assignment_with_function_call_statement : undefined
  const ifSta = sta.if_statement
  const forSta = sta.for_statement
  const wheSta = sta.when_statement
  const whiSta = sta.while_statement
  const des = sta.comment
  const desObj = des ? description(des) : undefined
  const isBreak = sta.is_break
  const isReturn = sta.is_return
  return Object.assign(
    {'assignment_statement': assSta ? assignmentStatement(assSta) : undefined},
    {'Function_call_statement': funCalSta ? functionCallStatement(funCalSta) : undefined},
    {'assignment_with_function_call_statement': assWithFunCalSta ? assignmentWithFunctionCallStatement(assWithFunCalSta) : undefined},
    {'break': isBreak ? isBreak : undefined},
    {'return': isReturn ? isReturn : undefined},
    {'if_statement': ifSta ? ifStatement(ifSta) : undefined},
    {'for_statement': forSta ? forStatement(forSta) : undefined},
    {'while_statement': whiSta ? whileStatement(whiSta) : undefined},
    {'when_statement': wheSta ? whenStatement(wheSta) : undefined},
    {'description': !ut.isEmptyObject(desObj) ? desObj : undefined}
  )
}

/**
 * Get the simplified json representation for the assignment_statement object
 * 
 * @param assSta assignment_statement value
 */
function assignmentStatement (assSta) {
  const ident = assSta.identifier
  const val = assSta.value
  return Object.assign(
    {'identifier': ident ? componentReference(ident) : undefined},
    {'value': val ? expression(val) : undefined}
  )
}

/**
 * Get the simplified json representation for the Function_call_statement object
 *
 * @param funCalSta Function_call_statement value
 */
function functionCallStatement (funCalSta) {
  const name = funCalSta.function_name
  const funCalArg = funCalSta.function_call_args
  return Object.assign(
    {'function_name': name ? componentReference(name) : undefined},
    {'function_call_args': funCalArg ? functionCallArgs(funCalArg) : undefined}
  )
}

/**
 * Get the simplified json representation for the assignment_with_function_call_statement object
 *
 * @param assWithFunCalSta assignment_with_function_call_statement value
 */
function assignmentWithFunctionCallStatement (assWithFunCalSta) {
  const outExpLis = assWithFunCalSta.output_expression_list
  const outExpArr = []
  outExpLis.forEach(function (obj) {
    var objExp = obj.expression
    if (objExp) { outExpArr.push(expression(objExp)) }
  })
  const name = assWithFunCalSta.function_name
  const funCalArg = assWithFunCalSta.function_call_args
  return Object.assign(
    {'output_expression_list': outExpArr},
    {'function_name': name ? componentReference(name) : undefined},
    {'function_call_args': funCalArg ? functionCallArgs(funCalArg) : undefined}
  )
}

/**
 * Get the simplified json representation for the if_statement object
 *
 * @param ifSta if_statement value
 */
 function ifStatement (ifSta) {
  const ifEls = ifSta.if_elseif
  const elsSta = ifSta.else_statement
  const ifElsArr = []
  ifEls.forEach(function (obj) {
    const theStaArr = []
    const theSta = obj.then
    theSta.forEach(function (ele) {
      theStaArr.push(statement(ele))
    })
    ifElsArr.push(Object.assign(
      {'condition': obj.condition ? expression(obj.condition) : undefined},
      {'then': theStaArr}
    ))
  })
  const elsArr = []
  if (elsSta && (elsSta.length > 0)) {
    elsSta.forEach(function (obj) {
      elsArr.push(statement(obj))
    })
  }
  return Object.assign(
    {'if_elseif': ifElsArr},
    {'else_statement': (elsArr.length > 0) ? elsArr : undefined}
  )
}

/**
 * Get the simplified json representation for the for_statement object
 *
 * @param forSta for_statement value
 */
 function forStatement (forSta) {
  const forInd = forSta.for_indices
  const looSta = forSta.loop_statements
  const looStaArr = []
  looSta.forEach(function (obj) {
    looStaArr.push(statement(obj))
  })
  return Object.assign(
    {'for_indices': forIndices(forInd)},
    {'loop_statements': looStaArr}
  )
}

/**
 * Get the simplified json representation for the while_statement object
 *
 * @param whiStas while_statement value
 */
function whileStatement (whiSta) {
  const con = whiSta.condition
  const looSta = whiSta.loop_statements
  const staArr = []
  looSta.forEach(function (obj) {
    staArr.push(statement(obj))
  })
  return Object.assign(
    {'condition': con ? expression(con) : undefined},
    {'loop_statement': staArr}
  )
}

/**
 * Get the simplified json representation for the when_statement object
 *
 * @param wheStas when_statement value
 */
 function whenStatement (wheStas) {
  const wheSta = wheStas.when_elsewhen
  const wheStaArr = []
  wheSta.forEach(function (obj) {
    const con = obj.condition
    const the = obj.then
    const theArr = []
    the.forEach(function (ele) {
      theArr.push(statement(ele))
    })
    wheStaArr.push(Object.assign(
      {'condition': con ? expression(con) : undefined},
      {'then': theArr}
    ))
  })
  return wheStaArr
}

/**
 * Get the simplified json representation for the external_composition object
 *
 * @param extCom external_composition value
 */
function externalComposition (extCom) {
  const lanSpe = extCom.language_specification
  const extFunCal = extCom.external_function_call
  const extAnn = extCom.external_annotation ? extCom.external_annotation.class_modification : null
  const annotation = extAnn ? classModification(extAnn) : undefined
  return Object.assign(
    {'language_specification': lanSpe},
    {'external_function_call': extFunCal ? externalFunctionCall(extFunCal) : undefined},
    {'external_annotation': (annotation === '()') ? undefined : annotation}
  )
}

/**
 * Get the simplified json representation for the external_function_call object
 *
 * @param extFunCal external_function_call value
 */
function externalFunctionCall (extFunCal) {
  const comRef = extFunCal.component_reference
  const ident = extFunCal.identifier
  const expLis = extFunCal.expression_list
  const exps = expLis ? expLis.expressions : undefined
  const expArr = []
  if (exps) {
    exps.forEach(function (ele) {
      expArr.push(expression(ele))
    })
  }
  return Object.assign(
    {'component_reference': comRef ? componentReference(comRef) : undefined},
    {'identifier': ident},
    {'expression_list': exps ? expArr : undefined}
  )
}

/**
 * Get the simplified json representation for the short_class_specifier object
 *
 * @param shoClaSpe short_class_specifier value
 */
function shortClassSpecifier (shoClaSpe) {
  const ident = shoClaSpe.identifier
  const val = shoClaSpe.short_class_specifier_value
  return Object.assign(
    {'identifier': ident},
    {'value': val ? shortClassSpecifierValue(val) : undefined}
  )
}

/**
 * Get the simplified json representation for the short_class_specifier_value object
 *
 * @param val short_class_specifier_value value
 */
function shortClassSpecifierValue (val) {
  const basPre = val.base_prefix
  const pre = basPre ? basPre.type_prefix : undefined
  const name = val.name
  const arrSub = val.array_subscripts
  const claMod = val.class_modification
  const des = val.comment
  const desObjEx = des ? description(des) : undefined
  const enuLis = val.enum_list
  const enuArr = []
  if (enuLis && (enuLis.length > 0)) {
    enuLis.forEach(function (obj) {
      const ident = obj.identifier
      const desCri = obj.description
      const desObj = desCri ? description(desCri) : undefined
      enuArr.push(Object.assign(
        {'identifier': ident},
        {'description': !ut.isEmptyObject(desObj) ? desObj : undefined}
      )) 
    })
  }
  return Object.assign(
    {'base_prefix': pre},
    {'name': name ? nameString(name) : undefined},
    {'array_subscripts': arrSub ? arraySubscripts(arrSub) : undefined},
    {'class_modification': claMod ? classModification(claMod) : undefined},
    {'description': !ut.isEmptyObject(desObjEx) ? desObjEx : undefined},
    {'enum_list': (enuArr.length > 0) ? enuArr : undefined}
  )
}

/**
 * Get the simplified json representation for the der_class_specifier object
 *
 * @param derClaSpe der_class_specifier value
 */
function derClassSpecifier (derClaSpe) {
  const ident = derClaSpe.identifier
  const val = derClaSpe.der_class_specifier_value
  var typSpe, typIden, typDes, valObj
  if (val) {
    typSpe = val.type_specifier
    typIden = val.identifiers
    typDes = val.comment ? description(val.comment) : undefined
    valObj = Object.assign(
      {'type_specifier': typSpe},
      {'identifier': typIden},
      {'description': !ut.isEmptyObject(typDes) ? typDes : undefined}
    )
  }
  return Object.assign(
    {'identifier': ident},
    {'value': val ? valObj : undefined}
  )
}

/**
 * Get the string of simple expression
 *
 * @param sim_exp simple expression object
 */
function simpleExpression (sim_exp) {
  const logExp1 = logicalExpression(sim_exp.logical_expression1)
  const logExp2 = sim_exp.logical_expression2
    ? (':' + logicalExpression(sim_exp.logical_expression2))
    : ''
  const logExp3 = sim_exp.logical_expression3
    ? (':' + logicalExpression(sim_exp.logical_expression3))
    : ''
  return (logExp1 + logExp2 + logExp3)
}

/** Get the string of logical epxression
  * 
  * @param log_exp logical_expression object
  */
function logicalExpression (log_exp) {
  const termList = log_exp.logical_term_list
  const termArray = []
  for (var i = 0; i < termList.length; i++) {
    const factorList = termList[i].logical_factor_list
    const factor = []
    for (var j = 0; j < factorList.length; j++) {
      factor.push(logicalFactor(factorList[j]))
    }
    termArray.push(factor.join(' and '))
  }
  return termArray.join(' or ')
}

/**
 * Get the string of logical factor
 *
 * @param log_fac logical_factor object
 */
function logicalFactor (log_fac) {
  const relStr = relation(log_fac.relation)
  return (log_fac.not) ? ('not ' + relStr) : relStr
}

/**
 * Get the string of relation
 *
 * @param rel relation object
 */
function relation (rel) {
  const ariExp1 = arithmeticExpression(rel.arithmetic_expression1)
  const relOp = rel.rel_op
  if (relOp) {
    const ariExp2 = arithmeticExpression(rel.arithmetic_expression2)
    return (ariExp1 + ' ' + relOp + ' ' + ariExp2)
  } else {
    return ariExp1
  }
}

/**
 * Get the string of arithmetic_expression
 *
 * @param ari_exp arithmetic_expression object
 */
function arithmeticExpression (ari_exp) {
  const termList = ari_exp.arithmetic_term_list
  const termArray = []
  for (var i = 0; i < termList.length; i++) {
    const addOp = termList[i].add_op
    const term = termString(termList[i].term)
    const termEle = addOp ? (addOp + term) : term
    termArray.push(termEle)
  }
  return termArray.join(' ')
}

/**
 * Get the string of term
 *
 * @param ter term object
 */
function termString (ter) {
  const factor = ter.factors
  const mulOps = ter.mul_ops
  var temp
  if (mulOps) {
    temp = factorString(factor[0])
    for (var i = 0; i < mulOps.length; i++) {
      temp = temp + mulOps[i] + factorString(factor[i+1])
    }
  }
  return temp
}

/**
 * Get the string of factor
 *
 * @param fac factor object
 */
function factorString (fac) {
  const pri1Str = primary(fac.primary1)
  const op = fac.op
  if (op && op !== '') {
    return (pri1Str + op + primary(fac.primary2))
  } else {
    return pri1Str
  }
}

/**
 * Get the string of primary
 *
 * @param pri primary object
 */
function primary (pri) {
  const unsNum = pri.unsigned_number
  const priStr = pri.primary_string
  const isFalse = pri.is_false
  const isTrue = pri.is_true
  const funCalPri = pri.function_call_primary
  const comRef = pri.component_reference
  const outExpLis = pri.output_expression_list
  const expLis = pri.expression_lists
  const funArg = pri.function_arguments
  const end = pri.end
  if (unsNum === 0) {
    return '0'
  } else if (unsNum) {
    return unsNum.toString()
  } else if (priStr) {
    return priStr
  } else if (isFalse) {
    return 'false'
  } else if (isTrue) {
    return 'true'
  } else if (funCalPri && funCalPri.function_call_args) {
    return funCalPriString(funCalPri)
  } else if (comRef) {
    return comRefString(comRef)
  } else if (outExpLis) {
    return ('(' + outExpLisString(outExpLis) + ')')
  } else if (expLis && (expLis.length > 0)) {
    return ('[' + expLisString(expLis) + ']')
  } else if (funArg) {
    return ('{' + funArgsString(funArg) + '}')
  } else if (end) {
    return 'end'
  }
}

/**
 * Get the string of function_call_primary
 *
 * @param funCalPri function_call_primary object
 */
function funCalPriString (funCalPri) {
  const funCalArg = funCalPri.function_call_args
  const name = funCalPri.function_name
  const der = funCalPri.der
  const initial = funCalPri.initial
  var pre
  if (name) {
    pre = nameString(name)
  } else if (der) {
    pre = 'der'
  } else if (initial) {
    pre = 'initial'
  }
  return (pre + funCalArgString(funCalArg))
}

/**
 * Get the string of name
 *
 * @param name name object
 */
function nameString (name) {
  const nameList = name.name_parts
  var nameString = ''
  for (var i = 0; i < nameList.length; i++) {
    const dot_op = nameList[i].dot_op
    const dot = dot_op ? '.' : ''
    const ident = nameList[i].identifier
    nameString = nameString + dot + ident
  }
  return nameString
}

/**
 * Get the string of function_call_args
 *
 * @param funCalArg function_call_args object
 */
function funCalArgString (funCalArg) {
  const funArg = funCalArg.function_arguments
  return funArg ? ('(' + funArgsString(funArg) + ')') : '()'
}

/**
 * Get the string of component_reference
 *
 * @param comRef component_reference object
 */
function comRefString (comRef) {
  const comRefPar = comRef.component_reference_parts
  var comString = ''
  for (var i = 0; i < comRefPar.length; i++) {
    const ithCom = comRefPar[i]
    const dot_op = ithCom.dot_op ? '.' : ''
    const ident = ithCom.identifier
    const identStr = ident ? ident : ''
    const arrSub = ithCom.array_subscripts
    const arrSubStr = arrSub ? arrSubString(arrSub) : ''
    comString += (dot_op + identStr + arrSubStr)
  }
  return comString
}

/**
 * Get the string of array_subscripts
 *
 * @param arrSub array_subscripts object
 */
 function arrSubString (arrSub) {
  const sub = arrSub.subscripts
  const subEle = []
  for (var i = 0; i < sub.length; i++) {
    const ithSub = sub[i]
    const exp = ithSub.expression
    const colOp = ithSub.colon_op
    const ithSubString = colOp ? ':' : expressionString(exp)
    subEle.push(ithSubString)
  }
  return ('[' + subEle.join(',') + ']')
}

/**
 * Get the string of function_arguments
 *
 * @param funArgObj function_arguments object
 */
function funArgsString (funArgObj) {
  const namedArg = funArgObj.named_arguments
  const funArg = funArgObj.function_argument
  const forInd = funArgObj.for_indices
  const funArgs = funArgObj.function_arguments
  if (namedArg) {
    return namedArgsString(namedArg)
  } else {
    if (funArgs) {
      return (funArgString(funArg) + ',' + funArgsString(funArgs))
    } else if (forInd) {
      return (funArgString(funArg) + ' for ' + forIndString(forInd))
    } else {
      return funArgString(funArg)
    }
  }
}

/**
 * Get the string of function_argument
 *
 * @param funArgObj function_argument object
 */
function funArgString (funArgObj) {
  const funName = funArgObj.function_name
  const namArgs = funArgObj.named_arguments
  const expStr = funArgObj.expression
  if (funName) {
    var namedArgString = namArgs ? ('(' + namedArgsString(namArgs) + ')') : '()'
    return 'function ' + nameString(funName) + namedArgString
  } else {
    return expressionString(expStr)
  }
}

/**
 * Get the string of named_arguments
 *
 * @param namArgs named_arguments object
 */
function namedArgsString (namArgs) {
  var namArgsArr = namedArgsArray(namArgs)
  if (namArgsArr.length > 1) {
    var namArr = []
    for (var i = 0; i < namArgsArr.length; i++) {
      var ident = namArgsArr[i].identifier
      var value = funArgString(namArgsArr[i].value)
      namArr.push(ident + '=' + value)
    }
    return namArr.join(',')
  } else {
    return (namArgsArr[0].identifier + '=' + funArgString(namArgsArr[0].value))
  }
}

/**
 * Recursively get the array of named_arguments
 *
 * @param namArgs named_arguments object
 */
function namedArgsArray (namArgs) {
  var out = []
  out.push(namArgs.named_argument)
  var namArgsInt = namArgs.named_arguments
  if (namArgsInt) {
    var intArr = namedArgsArray(namArgsInt)
    Array.prototype.push.apply(out, intArr)
  }
  return out
}

/**
 * Get the string of output_expression_list
 *
 * @param outExpLis output_expression_list object
 */
function outExpLisString (outExpLis) {
  const expList = outExpLis.output_expressions
  const arr = []
  for (var i = 0; i < expList.length; i++) {
    arr.push(expressionString(expList[i]))
  }
  return arr.join(',')
}

/**
 * Get the string of expression_lists
 *
 * @param expLists expression_lists object
 */
function expLisString (expLists) {
  const expString = []
  for (var i = 0; i < expLists.length; i++) {
    const ithList = expLists[i]
    const ithListEle = ithList.expressions
    const arr = []
    for (var j = 0; j < ithListEle.length; j++) {
      arr.push(expressionString(ithListEle[j]))
    }
    const ithListString = arr.join(',')
    expString.push(ithListString)
  }
  return expString.join(';')
}

/**
 * Get the string of for_indices
 *
 * @param forInd for_indices object
 */
function forIndString (forInd) {
  const ind = forInd.indices
  const indEle = []
  for (var i = 0; i < ind.length; i++) {
    const ithInd = ind[i]
    const ident = ithInd.identifier
    const exp = ithInd.expression
    const ithIndString = exp ? (ident + ' in ' + expressionString(exp)) : ident
    indEle.push(ithIndString) 
  }
  return indEle.join(',')
}

/**
 * Get the string of expression
 *
 * @param exp expression object
 */
function expressionString (exp) {
  const simExp = exp.simple_expression
  const ifExp = exp.if_expression
  return simExp ? simpleExpression(simExp) : ifExpString(ifExp)
}

/**
 * Get the string of if_expression
 *
 * @param ifExp if_expression object
 */
function ifExpString (ifExp) {
  const ifElse = ifExp.if_elseif
  const elsExp = ifExp.else_expression
  var ifExpString = 'if ' + expressionString(ifElse[0].condition) + ' then ' + expressionString(ifElse[0].then)
  if (ifElse.length > 1) {
    for (var i = 1; i < ifElse.length; i++) {
      const ithEle = ifElse[i]
      const elseifString = ' elseif ' + expressionString(ithEle.condition) + ' then ' + expressionString(ithEle.then)
      ifExpString = ifExpString + elseifString
    }
  }
  return (ifExpString + ' else ' + expressionString(elsExp))
}

module.exports.getProperty = getProperty
module.exports.simplifyModelicaJSON = simplifyModelicaJSON
