module.exports = grammar({
  name: 'd',

  extras: $ => [
    $.whitespace,
    $.comment,
  ],

  word: $ => $.identifier,

  rules: {
    // ========================================================================
    // Source file
    // ========================================================================

    // https://dlang.org/spec/lex.html#SourceFile
    source_file: $ =>
      seq(
        optional($.byte_order_mark),
        optional($.shebang),
        optional($.module),
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
    whitespace: $ =>
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
        seq('//', /(\\(.|\r?\n)|[^\\\n])*/)
      ),

    // ========================================================================
    // Module
    // ========================================================================

    // https://dlang.org/spec/grammar.html#Module
    module: $ =>
      seq(
        optional($.module_declaration),
        $._decl_defs,
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

    // ========================================================================
    // Declarations
    // ========================================================================

    // https://dlang.org/spec/grammar.html#DeclDefs
    _decl_defs: $ =>
      repeat1(
        $._decl_def,
      ),

    // https://dlang.org/spec/grammar.html#DeclDef
    _decl_def: $ =>
        // TODO: Add other declarations
        $.empty_declaration,

    // https://dlang.org/spec/grammar.html#EmptyDeclaration
    empty_declaration: $ =>
        ';',

    // ========================================================================
    // Attributes
    // ========================================================================

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

  }
});

function sep1(rule, separator) {
  return seq(rule, repeat(seq(separator, rule)))
}
