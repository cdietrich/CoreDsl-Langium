grammar CoreDsl

///////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////// Top Level Definitions ////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////

entry DescriptionContent: (imports+=Import)* definitions+=(InstructionSet | CoreDef)+;
Import: 'import' importURI=STRING;

InstructionSet : 'InstructionSet' name=ID ( 'extends' superType=[InstructionSet] )? '{' ISA '}';
CoreDef: 'Core' name=ID ( 'provides' providedInstructionSets+=[InstructionSet] (',' providedInstructionSets+=[InstructionSet])*)? '{' ISA '}';

fragment ISA:
	('architectural_state' '{' (declarations+=DeclarationStatement | assignments+=ExpressionStatement | types+=UserTypeDeclaration)+ '}') &
	('functions' '{' functions+=FunctionDefinition+ '}') &
	('instructions' commonInstructionAttributes+=Attribute* '{' instructions+=Instruction+ '}');

FunctionDefinition:
    extern?='extern'
    returnType=TypeSpecifier name=ID
    '(' (parameters+=ParameterDeclaration (',' parameters+=ParameterDeclaration)*)? ')'
    attributes+=Attribute* ';'
    |
    returnType=TypeSpecifier name=ID
    '(' (parameters+=ParameterDeclaration (',' parameters+=ParameterDeclaration)*)? ')'
    attributes+=Attribute* body=CompoundStatement;

Instruction:
	name=ID attributes+=Attribute* '{' 
		('encoding' ':' encoding=Encoding ';')
		('assembly' ':' assembly=STRING ';')?
		('behavior' ':' behavior=Statement)
	'}';

Encoding: fields+=EncodingField ('::' fields+=EncodingField)*;
EncodingField: BitValue | BitField;
BitValue: value=INTEGER;
BitField: name=ID LEFT_BR startIndex=IntegerConstant ':' endIndex=IntegerConstant RIGHT_BR;

////////////////////////////////////////////////////////////////////////////
//////////////////////////////// Statements ////////////////////////////////
////////////////////////////////////////////////////////////////////////////

Statement:
	EmptyStatement
	| SpawnStatement
	| CompoundStatement
	| ExpressionStatement
	| DeclarationStatement
	| IfStatement
	| SwitchStatement
	| ContinueStatement
	| BreakStatement
	| ReturnStatement
	| LoopStatement;

EmptyStatement: {infer EmptyStatement} ';';
SpawnStatement: 'spawn' body=Statement;
CompoundStatement: {infer CompoundStatement} '{' statements+=Statement* '}';
ExpressionStatement: expression=AssignmentExpression ';';
DeclarationStatement: declaration=MultiInitDeclaration ';';

//////////////////////////////// Flow Control ////////////////////////////////

IfStatement:
	'if' '(' condition=Expression ')' thenBody=Statement (=> 'else' elseBody=Statement)?;

SwitchStatement:
	'switch' '(' condition=Expression ')' '{' sections+=SwitchSection* '}';

SwitchSection:
	{infer CaseSection} 'case' condition=Expression ':' body+=Statement* |
	{infer DefaultSection} 'default' ':' body+=Statement*;

ContinueStatement: {infer ContinueStatement} 'continue' ';';
BreakStatement: {infer BreakStatement} 'break' ';';
ReturnStatement infers ReturnStatement: {infer ReturnStatement} 'return' value=ConditionalExpression? ';';

//////////////////////////////// Loops ////////////////////////////////

LoopStatement: WhileLoop | ForLoop | DoLoop;

WhileLoop:
	'while' '(' condition=Expression ')' body=Statement;

ForLoop:
	'for' '('
	(startDeclaration=MultiInitDeclaration | startExpression=AssignmentExpression?) ';'
	(condition=Expression?) ';'
	(loopExpressions+=AssignmentExpression (',' loopExpressions+=AssignmentExpression)*)?
	')' body=Statement;

DoLoop:
	'do' body=Statement 'while' '(' condition=Expression ')' ';';

//////////////////////////////////////////////////////////////////////////////
//////////////////////////////// Declarations ////////////////////////////////
//////////////////////////////////////////////////////////////////////////////
	
ParameterDeclaration infers Declaration: Declaration<false, false>;
MultiInitDeclaration infers Declaration: Declaration<true, true>;
MultiDeclaration infers Declaration: Declaration<true, false>;

Declaration<allowMultiple, allowInit>:
	(storage+=StorageClassSpecifier | qualifiers+=TypeQualifier | attributes+=Attribute)*
	type=TypeSpecifier (declarators+=Declarator<allowInit> (<allowMultiple> ',' declarators+=Declarator<allowInit>)*)?;

Declarator<allowInit>:
	alias?='&'?
	name=ID
	(LEFT_BR dimensions+=Expression RIGHT_BR)*
	attributes+=Attribute*
	(<allowInit> t_equals='=' initializer=Initializer)?;

type NamedEntity = FunctionDefinition | Declarator | BitField;
    
Initializer: ExpressionInitializer | ListInitializer;
ExpressionInitializer: value=Expression;
ListInitializer: '{' initializers+=Initializer (',' initializers+=Initializer)* ','? '}';

Attribute:
	LEFT_BR LEFT_BR type=ID
	('=' parameters+=Expression | '(' parameters+=Expression (',' parameters+=Expression)* ')')?
	RIGHT_BR RIGHT_BR;

//////////////////////////////// Type Declarations ////////////////////////////////

UserTypeDeclaration: StructTypeDeclaration | UnionTypeDeclaration | EnumTypeDeclaration;

StructTypeDeclaration: 'struct' name=ID CompositeTypeDeclaration;
UnionTypeDeclaration: 'union' name=ID CompositeTypeDeclaration;
EnumTypeDeclaration: 'enum' name=ID '{' members+=EnumMemberDeclaration (',' members+=EnumMemberDeclaration)* ','? '}';

EnumMemberDeclaration: name=ID ('=' value=Expression)?;

fragment CompositeTypeDeclaration: '{' (members+=MultiDeclaration ';')* '}';

//////////////////////////////// Type Specifiers ////////////////////////////////

TypeSpecifier: VoidTypeSpecifier | PrimitiveTypeSpecifier | UserTypeSpecifier;

PrimitiveTypeSpecifier: IntegerTypeSpecifier | FloatTypeSpecifier | BoolTypeSpecifier;

IntegerTypeSpecifier: shorthand=IntegerSizeShorthand | signedness=IntegerSignedness (shorthand=IntegerSizeShorthand | '<' size=PrimaryExpression '>');
FloatTypeSpecifier: shorthand=FloatSizeShorthand;
BoolTypeSpecifier: {infer BoolTypeSpecifier} 'bool';
VoidTypeSpecifier: {infer VoidTypeSpecifier} 'void';

UserTypeSpecifier: StructTypeSpecifier | UnionTypeSpecifier | EnumTypeSpecifier;
	
StructTypeSpecifier: 'struct' target=[StructTypeDeclaration];
UnionTypeSpecifier: 'union' target=[UnionTypeDeclaration];
EnumTypeSpecifier: 'enum' target=[EnumTypeDeclaration];

/////////////////////////////////////////////////////////////////////////////
//////////////////////////////// Expressions ////////////////////////////////
/////////////////////////////////////////////////////////////////////////////

Expression: AssignmentExpression;

AssignmentExpression infers Expression:
	ConditionalExpression
	({infer AssignmentExpression.target=current}
		operator=('=' | '*=' | '/=' | '%=' | '+=' | '-=' | '<<=' | '>>=' | '&=' | '^=' | '|=')
		value=AssignmentExpression
	)?;

ConditionalExpression infers Expression:
	ConcatenationExpression
	({infer ConditionalExpression.condition=current}
		'?' thenExpression=AssignmentExpression
		':' elseExpression=ConditionalExpression
	)?;

ConcatenationExpression infers Expression:
	LogicalOrExpression
	({infer ConcatenationExpression.parts+=current}
		('::' parts+=LogicalOrExpression)+
	)?;

LogicalOrExpression infers Expression: LogicalAndExpression ({infer InfixExpression.left=current} operator='||' right=LogicalAndExpression)*;
LogicalAndExpression infers Expression: InclusiveOrExpression ({infer InfixExpression.left=current} operator='&&' right=InclusiveOrExpression)*;
InclusiveOrExpression infers Expression: ExclusiveOrExpression ({infer InfixExpression.left=current} operator='|' right=ExclusiveOrExpression)*;
ExclusiveOrExpression infers Expression: AndExpression ({infer InfixExpression.left=current} operator='^' right=AndExpression)*;
AndExpression infers Expression: EqualityExpression ({infer InfixExpression.left=current} operator='&' right=EqualityExpression)*;
EqualityExpression infers Expression: RelationalExpression ({infer InfixExpression.left=current} operator=('=='|'!=') right=RelationalExpression)*;
RelationalExpression infers Expression: ShiftExpression ({infer InfixExpression.left=current} operator=('<'|'>'|'<='|'>=') right=ShiftExpression)*;
ShiftExpression infers Expression: AdditiveExpression ({infer InfixExpression.left=current} operator=('<<'|'>>') right=AdditiveExpression)*;
AdditiveExpression infers Expression: MultiplicativeExpression ({infer InfixExpression.left=current} operator=('+'|'-') right=MultiplicativeExpression)*;
MultiplicativeExpression infers Expression: CastExpression ({infer InfixExpression.left=current} operator=('*' | '/' | '%') right=CastExpression)*;

CastExpression infers Expression:
	PrefixExpression
	| {infer CastExpression} '(' targetType=TypeSpecifier ')' operand=CastExpression
	| {infer CastExpression} '(' signedness=IntegerSignedness ')' operand=CastExpression;

PrefixExpression infers Expression:
	PostfixExpression
	| {infer PrefixExpression} operator=('++' | '--') operand=PrefixExpression
	| {infer PrefixExpression} operator=('+' | '-' | '~' | '!') operand=PrefixExpression
    ;

PostfixExpression infers Expression:
	PrimaryExpression
	( {infer FunctionCallExpression.target=current} '(' (arguments+=Expression (',' arguments+=Expression)*)? ')'
	| {infer ArrayAccessExpression.target=current} LEFT_BR index=Expression (':' endIndex=Expression)? RIGHT_BR
	| {infer MemberAccessExpression.target=current} operator='.' declarator=[Declarator]
	| {infer MemberAccessExpression.target=current} operator='->' declarator=[Declarator]
	| {infer PostfixExpression.operand=current} operator='++'
	| {infer PostfixExpression.operand=current} operator='--'
	)*;

PrimaryExpression: ParenthesisExpression | EntityReference | IntrinsicExpression | Constant;

ParenthesisExpression: '(' inner=Expression ')';

EntityReference: target=[NamedEntity:ID];

IntrinsicExpression:
	function=('sizeof' | 'bitsizeof' | 'alignof' | 'offsetof')
	'(' (arguments+=(Expression|TypeSpecifier) (',' arguments+=(Expression|TypeSpecifier))*)? ')';
    
//////////////////////////////// Constants ////////////////////////////////

Constant:
	IntegerConstant
	| FloatConstant
	| CharacterConstant
	| BoolConstant
	| StringConstant;

IntegerConstant hidden(WS): value=INTEGER;
FloatConstant hidden(WS): value=FLOAT;
CharacterConstant: value=CHARCONST;
BoolConstant: value=BOOLEAN;
StringConstant: literals+=StringLiteral+;
StringLiteral: value=ENCSTRINGCONST | value=STRING ;

//////////////////////////////////////////////////////////////////////////////
//////////////////////////////// Enumerations ////////////////////////////////
//////////////////////////////////////////////////////////////////////////////

IntegerSignedness returns string : 'signed' | 'unsigned';
IntegerSizeShorthand returns string : 'int' | 'char' | 'short' |  'long';
FloatSizeShorthand returns string : 'float' | 'double';

TypeQualifier returns string: 'const' | 'volatile';
StorageClassSpecifier returns string: 'extern' | 'static' | 'register';

////////////////////////////////////////////////////////////////////////////////
//////////////////////////////// Terminal Rules ////////////////////////////////
////////////////////////////////////////////////////////////////////////////////

// The following 2 rules are needed so that XText does not generate the terminal symbols
// '[[' and ']]', which are always eaten by the lexer so that a[b[3]] is not recognized.
//DoubleLeftBracket returns string hidden(WS, ML_COMMENT, SL_COMMENT): LEFT_BR LEFT_BR;
//DoubleRightBracket returns string hidden(WS, ML_COMMENT, SL_COMMENT): RIGHT_BR RIGHT_BR;

terminal LEFT_BR: '[';

terminal RIGHT_BR: ']';

terminal BOOLEAN returns boolean: 'true' | 'false' ;

terminal FLOAT returns number:  (('0'..'9')+ '.' ('0'..'9')*) (('e' | 'E') ('+' | '-')? ('0'..'9')+)? ('f'|'F'|'l'|'L')?;

terminal INTEGER returns bigint:  (VLOGINT | BINARYINT | HEXADECIMALINT | OCTALINT | DECIMALINT) ('u'|'U')? (('l'|'L') ('l'|'L')?)?;

terminal fragment VLOGINT: ('0'..'9')+ "'" ('b' ('0'..'1')+ | 'o' ('0'..'7')+ | 'd' ('0'..'9')+ | 'h' ('0'..'9'|'a'..'f'|'A'..'F')+); 


terminal fragment BINARYINT:	('0b' | '0B') '0'..'1' (('_')? '0'..'1')*;

terminal fragment OCTALINT:   '0' ('_')? '0'..'7' (('_')? '0'..'7')*;

terminal fragment HEXADECIMALINT:   ('0x'|'0X') ('0'..'9'|'a'..'f'|'A'..'F')  (('_')? ('0'..'9'|'a'..'f'|'A'..'F'))*;

terminal fragment DECIMALINT:   '0' | '1'..'9' (('_')? '0'..'9')*;




terminal CHARCONST:	('u'|'U'|'L')? "'" ( '\\' . /* 'b'|'t'|'n'|'f'|'r'|'u'|'"'|"'"|'\\' */ | /[^\\']/ )* "'";
terminal ENCSTRINGCONST	:	('u8'|'u'|'U'|'L') '"' ( '\\' . /* 'b'|'t'|'n'|'f'|'r'|'u'|'"'|"'"|'\\' */ | /[^\\"]/ )* '"';

 
terminal ID : '^'?('a'..'z'|'A'..'Z'|'_') ('a'..'z'|'A'..'Z'|'_'|'0'..'9')*;

// do we need to override the built-in STRING rule?

hidden terminal WS: /\s+/;
//terminal ID: /[_a-zA-Z][\w_]*/;
terminal INT returns number: /[0-9]+/;
terminal STRING: /"(\\.|[^"\\])*"/;

hidden terminal ML_COMMENT: /\/\*[\s\S]*?\*\//;
hidden terminal SL_COMMENT: /\/\/[^\n\r]*/;
