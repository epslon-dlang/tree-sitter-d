module.exports = grammar({
  name: 'd',

  extras: $ => [
    $._whitespace,
    $.line_comment,
    $.block_comment,
  ],

  word: $ => $.identifier,

  conflicts: $ => [
    [$.module_attributes, $._attribute],
  ],

  supertypes: $ => [
    $._attribute,
    $._declaration,
  ],

  rules: {
    // ========================================================================
    // Source file
    // ========================================================================

    // https://dlang.org/spec/lex.html#SourceFile
    // First node is called module for convenience
    module: $ =>
      seq(
        optional(
          choice(
            $.byte_order_mark,
            $.shebang,
          ),
        ),
        optional($._module),
      ),

    // https://dlang.org/spec/lex.html#ByteOrderMark
    byte_order_mark: $ =>
      token(
        '\uFEFF'
      ),

    // https://dlang.org/spec/lex.html#Shebang
    shebang: $ =>
      token(
        seq(
          /#!.*/,
          '\n',
        )
      ),

    // ========================================================================
    // Principal lexer tokens
    // ========================================================================

    // https://dlang.org/spec/lex.html#Identifier
    identifier: $ => /[_\p{XID_Start}][_\p{XID_Continue}]*/,

    // https://dlang.org/spec/lex.html#WhiteSpace
    _whitespace: $ =>
      token(
        /[\s\f\uFEFF\u2060\u200B]|\\\r?\n/
      ),

    // https://dlang.org/spec/lex.html#Comment
    comment: $ =>
      choice(
        $.block_comment,
        $.line_comment,
        // TODO: Support nested comments
      ),

    // https://dlang.org/spec/lex.html#BlockComment
    block_comment: $ =>
      token(
        seq(
          '/*',
          /[^*]*\*+([^/*][^*]*\*+)*/,
          '/'
        )
      ),

    // https://dlang.org/spec/lex.html#LineComment
    line_comment: $ =>
      token(
        seq('//', /(\\(.|\r?\n)|[^\\\n])*/),
      ),

    // ========================================================================
    // Module
    // ========================================================================

    // https://dlang.org/spec/grammar.html#Module
    _module: $ =>
      choice(
        $.module_declaration,
        seq(
          optional($.module_declaration),
          repeat1($._decl_def),
        ),
      ),

    // https://dlang.org/spec/grammar.html#ModuleDeclaration
    module_declaration: $ =>
      seq(
        field('attributes', optional($.module_attributes)),
        'module',
        field('name', $.module_fully_qualified_name),
        ';'
      ),

    // https://dlang.org/spec/grammar.html#ModuleFullyQualifiedName
    module_fully_qualified_name: $ =>
      sep1(
        $.identifier,
        '.',
      ),

    // https://dlang.org/spec/grammar.html#ImportList
    import_list: $ =>
      seq(
        repeat(
          seq(
            $.import,
            ',',
          ),
        ),
        choice(
          $.import,
          $.import_bindings,
        ),
      ),

    // https://dlang.org/spec/grammar.html#Import
    import: $ =>
      seq(
        optional(seq(field('alias', $.identifier), '=')),
        field('module', $.module_fully_qualified_name),
      ),

    // https://dlang.org/spec/module.html#ImportBindings
    import_bindings: $ =>
      seq(
        $.import,
        ':',
        $._import_bind_list,
      ),

    // https://dlang.org/spec/module.html#ImportBindList
    _import_bind_list: $ =>
      seq(
        repeat(
          seq($.import_bind, ','),
        ),
        $.import_bind,
      ),

    // https://dlang.org/spec/module.html#ImportBind
    import_bind: $ =>
      seq(
        $.identifier, optional(seq('=', $.identifier)),
      ),


    // ========================================================================
    // Declarations
    // ========================================================================

    // https://dlang.org/spec/grammar.html#DeclDef
    _decl_def: $ =>
        // TODO: Add other declarations
        choice(
          $.attribute_specifier,
          $._declaration,
          $.empty_declaration,
        ),

    // https://dlang.org/spec/grammar.html#EmptyDeclaration
    empty_declaration: $ =>
        ';',

    // https://dlang.org/spec/declaration.html#Declaration
    _declaration: $ =>
      choice(
        $.import_declaration,
      ),

    // https://dlang.org/spec/grammar.html#ImportDeclaration
    import_declaration: $ =>
      seq(
        optional('static'),
        'import',
        field('imports', $.import_list),
        ';',
      ),

    // https://dlang.org/spec/attribute.html#DeclarationBlock
    _declaration_block: $ =>
      choice(
        $._decl_def,
        $.declaration_block,
      ),

    declaration_block: $ =>
      seq(
        '{',
        repeat($._decl_def),
        '}',
      ),

    // ========================================================================
    // Attributes
    // ========================================================================

    // https://dlang.org/spec/attribute.html#AttributeSpecifier
    attribute_specifier: $ =>
      seq(
        $._attribute,
        choice(
          ':',
          $._declaration_block,
        ),
      ),

    _attribute: $ =>
      choice(
        $.deprecated_attribute,
        $.visibility_attribute,
      ),

    // https://dlang.org/spec/grammar.html#ModuleAttributes
    module_attributes: $ =>
      // TODO: Add user defined attributes
      repeat1(
        $.deprecated_attribute,
      ),

    // https://dlang.org/spec/grammar.html#DeprecatedAttribute
    deprecated_attribute: $ =>
      // TODO: Add assign expression
      'deprecated',

    // https://dlang.org/spec/attribute.html#VisibilityAttribute
    visibility_attribute: $ =>
      // TODO: Implement package visibility attribute
      choice(
        'private',
        'protected',
        'public',
        'export',
      ),

    // ========================================================================
    // Types
    // ========================================================================

    // https://dlang.org/spec/type.html#Type
    type: $ =>
      seq(
        field('qualifiers', repeat($.type_qualifier)),
        $._basic_type,
        field('suffixes', repeat($.type_suffix)),
      ),

    // https://dlang.org/spec/type.html#TypeCtor
    type_qualifier: $ =>
      choice(
        'const',
        'immutable',
        'inout',
        'shared',
      ),

    type_suffix: $ =>
      // TODO: Add all the suffixes
      choice(
        '*',
        seq('[', ']'),
      ),

    // https://dlang.org/spec/type.html#BasicType
    _basic_type: $ =>
      // TODO: Add all basic types
      choice(
        $.vector_type,
        $.fundamental_type,
      ),

    // https://dlang.org/spec/type.html#FundamentalType
    fundamental_type: $ =>
      choice(
        'bool',
        'byte',
        'ubyte',
        'short',
        'ushort',
        'int',
        'uint',
        'long',
        'ulong',
        'cent',
        'ucent',
        'char',
        'wchar',
        'dchar',
        'float',
        'double',
        'real',
        'ifloat',
        'idouble',
        'ireal',
        'cfloat',
        'cdouble',
        'creal',
        'void',
      ),

    // https://dlang.org/spec/type.html#Vector
    vector_type: $ =>
      seq(
        '__vector',
        '(',
        field('base', $.type),
        ')',
      ),
  }
});

function sep1(rule, separator) {
  return seq(rule, repeat(seq(separator, rule)))
}
