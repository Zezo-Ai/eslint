/**
 * @fileoverview Tests for NodeEventGenerator.
 * @author Toru Nagashima
 */
"use strict";

//------------------------------------------------------------------------------
// Requirements
//------------------------------------------------------------------------------

const assert = require("node:assert"),
	sinon = require("sinon"),
	espree = require("espree"),
	vk = require("eslint-visitor-keys"),
	Traverser = require("../../../lib/shared/traverser"),
	EventGeneratorTester = require("../../../tools/internal-testers/event-generator-tester"),
	createEmitter = require("../../../lib/linter/safe-emitter"),
	NodeEventGenerator = require("../../../lib/linter/node-event-generator");

//------------------------------------------------------------------------------
// Constants
//------------------------------------------------------------------------------

const ESPREE_CONFIG = {
	ecmaVersion: 6,
	comment: true,
	tokens: true,
	range: true,
	loc: true,
};

const STANDARD_ESQUERY_OPTION = {
	visitorKeys: vk.KEYS,
	fallback: Traverser.getKeys,
};

//------------------------------------------------------------------------------
// Tests
//------------------------------------------------------------------------------

describe("NodeEventGenerator", () => {
	EventGeneratorTester.testEventGeneratorInterface(
		new NodeEventGenerator(createEmitter(), STANDARD_ESQUERY_OPTION),
	);

	describe("entering a single AST node", () => {
		let emitter, generator;

		beforeEach(() => {
			emitter = Object.create(createEmitter(), {
				emit: { value: sinon.spy() },
			});

			["Foo", "Bar", "Foo > Bar", "Foo:exit"].forEach(selector =>
				emitter.on(selector, () => {}),
			);
			generator = new NodeEventGenerator(
				emitter,
				STANDARD_ESQUERY_OPTION,
			);
		});

		it("should generate events for entering AST node.", () => {
			const dummyNode = { type: "Foo", value: 1 };

			generator.enterNode(dummyNode);

			assert(emitter.emit.calledOnce);
			assert(emitter.emit.calledWith("Foo", dummyNode));
		});

		it("should generate events for exiting AST node.", () => {
			const dummyNode = { type: "Foo", value: 1 };

			generator.leaveNode(dummyNode);

			assert(emitter.emit.calledOnce);
			assert(emitter.emit.calledWith("Foo:exit", dummyNode));
		});

		it("should generate events for AST queries", () => {
			const dummyParent = { type: "Foo" };
			const dummyNode = { type: "Bar" };

			generator.enterNode(dummyParent);
			generator.enterNode(dummyNode);

			assert(emitter.emit.calledThrice);
			assert(emitter.emit.calledWith("Foo", dummyParent));
			assert(emitter.emit.calledWith("Foo > Bar", dummyNode));
			assert(emitter.emit.calledWith("Bar", dummyNode));
		});

		it("should use `nodeTypeKey` if provided", () => {
			generator = new NodeEventGenerator(emitter, {
				...STANDARD_ESQUERY_OPTION,
				nodeTypeKey: "kind",
			});

			const dummyNode = { kind: "Foo" };

			generator.enterNode(dummyNode);

			assert(emitter.emit.calledOnce);
			assert(emitter.emit.calledWith("Foo", dummyNode));
		});

		it("should succeed without esqueryOptions", () => {
			generator = new NodeEventGenerator(emitter);

			const dummyNode = { type: "Foo" };

			generator.enterNode(dummyNode);

			assert(emitter.emit.calledOnce);
			assert(emitter.emit.calledWith("Foo", dummyNode));
		});
	});

	describe("traversing the entire AST", () => {
		/**
		 * Gets a list of emitted types/selectors from the generator, in emission order
		 * @param {ASTNode} ast The AST to traverse
		 * @param {Array<string>|Set<string>} possibleQueries Selectors to detect
		 * @returns {Array[]} A list of emissions, in the order that they were emitted. Each emission is a two-element
		 * array where the first element is a string, and the second element is the emitted AST node.
		 */
		function getEmissions(ast, possibleQueries) {
			const emissions = [];
			const emitter = Object.create(createEmitter(), {
				emit: {
					value: (selector, node) => emissions.push([selector, node]),
				},
			});

			possibleQueries.forEach(query => emitter.on(query, () => {}));
			const generator = new NodeEventGenerator(
				emitter,
				STANDARD_ESQUERY_OPTION,
			);

			Traverser.traverse(ast, {
				enter(node) {
					generator.enterNode(node);
				},
				leave(node) {
					generator.leaveNode(node);
				},
			});

			return emissions;
		}

		/**
		 * Creates a test case that asserts a particular sequence of generator emissions
		 * @param {string} sourceText The source text that should be parsed and traversed
		 * @param {string[]} possibleQueries A collection of selectors that rules are listening for
		 * @param {Array[]} expectedEmissions A function that accepts the AST and returns a list of the emissions that the
		 * generator is expected to produce, in order.
		 * Each element of this list is an array where the first element is a selector (string), and the second is an AST node
		 * This should only include emissions that appear in possibleQueries.
		 * @returns {void}
		 */
		function assertEmissions(
			sourceText,
			possibleQueries,
			expectedEmissions,
		) {
			it(possibleQueries.join("; "), () => {
				const ast = espree.parse(sourceText, ESPREE_CONFIG);
				const emissions = getEmissions(ast, possibleQueries).filter(
					emission => possibleQueries.includes(emission[0]),
				);

				assert.deepStrictEqual(emissions, expectedEmissions(ast));
			});
		}

		assertEmissions(
			"foo + bar;",
			[
				"Program",
				"Program:exit",
				"ExpressionStatement",
				"ExpressionStatement:exit",
				"BinaryExpression",
				"BinaryExpression:exit",
				"Identifier",
				"Identifier:exit",
			],
			ast => [
				["Program", ast], // entering program
				["ExpressionStatement", ast.body[0]], // entering 'foo + bar;'
				["BinaryExpression", ast.body[0].expression], // entering 'foo + bar'
				["Identifier", ast.body[0].expression.left], // entering 'foo'
				["Identifier:exit", ast.body[0].expression.left], // exiting 'foo'
				["Identifier", ast.body[0].expression.right], // entering 'bar'
				["Identifier:exit", ast.body[0].expression.right], // exiting 'bar'
				["BinaryExpression:exit", ast.body[0].expression], // exiting 'foo + bar'
				["ExpressionStatement:exit", ast.body[0]], // exiting 'foo + bar;'
				["Program:exit", ast], // exiting program
			],
		);

		assertEmissions(
			"foo + 5",
			[
				"BinaryExpression > Identifier",
				"BinaryExpression",
				"BinaryExpression Literal:exit",
				"BinaryExpression > Identifier:exit",
				"BinaryExpression:exit",
			],
			ast => [
				["BinaryExpression", ast.body[0].expression], // foo + 5
				["BinaryExpression > Identifier", ast.body[0].expression.left], // foo
				[
					"BinaryExpression > Identifier:exit",
					ast.body[0].expression.left,
				], // exiting foo
				["BinaryExpression Literal:exit", ast.body[0].expression.right], // exiting 5
				["BinaryExpression:exit", ast.body[0].expression], // exiting foo + 5
			],
		);

		assertEmissions(
			"foo + 5",
			["BinaryExpression > *[name='foo']"],
			ast => [
				[
					"BinaryExpression > *[name='foo']",
					ast.body[0].expression.left,
				],
			], // entering foo
		);

		assertEmissions("foo", ["*"], ast => [
			["*", ast], // Program
			["*", ast.body[0]], // ExpressionStatement
			["*", ast.body[0].expression], // Identifier
		]);

		assertEmissions("foo", ["*:not(ExpressionStatement)"], ast => [
			["*:not(ExpressionStatement)", ast], // Program
			["*:not(ExpressionStatement)", ast.body[0].expression], // Identifier
		]);

		assertEmissions(
			"foo()",
			["CallExpression[callee.name='foo']"],
			ast => [
				["CallExpression[callee.name='foo']", ast.body[0].expression],
			], // foo()
		);

		assertEmissions(
			"foo()",
			["CallExpression[callee.name='bar']"],
			() => [], // (nothing emitted)
		);

		assertEmissions(
			"foo + bar + baz",
			[":not(*)"],
			() => [], // (nothing emitted)
		);

		assertEmissions(
			"foo + bar + baz",
			[
				":matches(Identifier[name='foo'], Identifier[name='bar'], Identifier[name='baz'])",
			],
			ast => [
				[
					":matches(Identifier[name='foo'], Identifier[name='bar'], Identifier[name='baz'])",
					ast.body[0].expression.left.left,
				], // foo
				[
					":matches(Identifier[name='foo'], Identifier[name='bar'], Identifier[name='baz'])",
					ast.body[0].expression.left.right,
				], // bar
				[
					":matches(Identifier[name='foo'], Identifier[name='bar'], Identifier[name='baz'])",
					ast.body[0].expression.right,
				], // baz
			],
		);

		assertEmissions(
			"foo + 5 + 6",
			["Identifier, Literal[value=5]"],
			ast => [
				[
					"Identifier, Literal[value=5]",
					ast.body[0].expression.left.left,
				], // foo
				[
					"Identifier, Literal[value=5]",
					ast.body[0].expression.left.right,
				], // 5
			],
		);

		assertEmissions(
			"[foo, 5, foo]",
			["Identifier + Literal"],
			ast => [
				["Identifier + Literal", ast.body[0].expression.elements[1]],
			], // 5
		);

		assertEmissions(
			"[foo, {}, 5]",
			["Identifier + Literal", "Identifier ~ Literal"],
			ast => [
				["Identifier ~ Literal", ast.body[0].expression.elements[2]],
			], // 5
		);

		assertEmissions(
			"foo; bar + baz; qux()",
			[":expression", ":statement"],
			ast => [
				[":statement", ast.body[0]],
				[":expression", ast.body[0].expression],
				[":statement", ast.body[1]],
				[":expression", ast.body[1].expression],
				[":expression", ast.body[1].expression.left],
				[":expression", ast.body[1].expression.right],
				[":statement", ast.body[2]],
				[":expression", ast.body[2].expression],
				[":expression", ast.body[2].expression.callee],
			],
		);

		assertEmissions(
			"function foo(){} var x; (function (p){}); () => {};",
			[
				":function",
				"ExpressionStatement > :function",
				"VariableDeclaration, :function[params.length=1]",
			],
			ast => [
				[":function", ast.body[0]], // function foo(){}
				[
					"VariableDeclaration, :function[params.length=1]",
					ast.body[1],
				], // var x;
				[":function", ast.body[2].expression], // function (p){}
				["ExpressionStatement > :function", ast.body[2].expression], // function (p){}
				[
					"VariableDeclaration, :function[params.length=1]",
					ast.body[2].expression,
				], // function (p){}
				[":function", ast.body[3].expression], // () => {}
				["ExpressionStatement > :function", ast.body[3].expression], // () => {}
			],
		);

		assertEmissions(
			"foo;",
			[
				"*",
				":not(*)",
				"Identifier",
				"ExpressionStatement > *",
				"ExpressionStatement > Identifier",
				"ExpressionStatement > [name='foo']",
				"Identifier, ReturnStatement",
				"FooStatement",
				"[name = 'foo']",
				"[name='foo']",
				"[name ='foo']",
				"Identifier[name='foo']",
				"[name='foo'][name.length=3]",
				":not(Program, ExpressionStatement)",
				":not(Program, Identifier) > [name.length=3]",
			],
			ast => [
				["*", ast], // Program
				["*", ast.body[0]], // ExpressionStatement

				// selectors for the 'foo' identifier, in order of increasing specificity
				["*", ast.body[0].expression], // 0 identifiers, 0 pseudoclasses
				["ExpressionStatement > *", ast.body[0].expression], // 0 pseudoclasses, 1 identifier
				["Identifier", ast.body[0].expression], // 0 pseudoclasses, 1 identifier
				[":not(Program, ExpressionStatement)", ast.body[0].expression], // 0 pseudoclasses, 2 identifiers
				["ExpressionStatement > Identifier", ast.body[0].expression], // 0 pseudoclasses, 2 identifiers
				["Identifier, ReturnStatement", ast.body[0].expression], // 0 pseudoclasses, 2 identifiers
				["[name = 'foo']", ast.body[0].expression], // 1 pseudoclass, 0 identifiers
				["[name ='foo']", ast.body[0].expression], // 1 pseudoclass, 0 identifiers
				["[name='foo']", ast.body[0].expression], // 1 pseudoclass, 0 identifiers
				["ExpressionStatement > [name='foo']", ast.body[0].expression], // 1 attribute, 1 identifier
				["Identifier[name='foo']", ast.body[0].expression], // 1 attribute, 1 identifier
				[
					":not(Program, Identifier) > [name.length=3]",
					ast.body[0].expression,
				], // 1 attribute, 2 identifiers
				["[name='foo'][name.length=3]", ast.body[0].expression], // 2 attributes, 0 identifiers
			],
		);

		assertEmissions(
			"foo(); bar; baz;",
			["CallExpression, [name='bar']"],
			ast => [
				["CallExpression, [name='bar']", ast.body[0].expression],
				["CallExpression, [name='bar']", ast.body[1].expression],
			],
		);

		assertEmissions("foo; bar;", ["[name.length=3]:exit"], ast => [
			["[name.length=3]:exit", ast.body[0].expression],
			["[name.length=3]:exit", ast.body[1].expression],
		]);

		// https://github.com/eslint/eslint/issues/14799
		assertEmissions("const {a = 1} = b;", ["Property > .key"], ast => [
			[
				"Property > .key",
				ast.body[0].declarations[0].id.properties[0].key,
			],
		]);
	});

	describe("traversing the entire non-standard AST", () => {
		/**
		 * Gets a list of emitted types/selectors from the generator, in emission order
		 * @param {ASTNode} ast The AST to traverse
		 * @param {Record<string, string[]>} visitorKeys The custom visitor keys.
		 * @param {Array<string>|Set<string>} possibleQueries Selectors to detect
		 * @returns {Array[]} A list of emissions, in the order that they were emitted. Each emission is a two-element
		 * array where the first element is a string, and the second element is the emitted AST node.
		 */
		function getEmissions(ast, visitorKeys, possibleQueries) {
			const emissions = [];
			const emitter = Object.create(createEmitter(), {
				emit: {
					value: (selector, node) => emissions.push([selector, node]),
				},
			});

			possibleQueries.forEach(query => emitter.on(query, () => {}));
			const generator = new NodeEventGenerator(emitter, {
				visitorKeys,
				fallback: Traverser.getKeys,
			});

			Traverser.traverse(ast, {
				visitorKeys,
				enter(node) {
					generator.enterNode(node);
				},
				leave(node) {
					generator.leaveNode(node);
				},
			});

			return emissions;
		}

		/**
		 * Creates a test case that asserts a particular sequence of generator emissions
		 * @param {ASTNode} ast The AST to traverse
		 * @param {Record<string, string[]>} visitorKeys The custom visitor keys.
		 * @param {string[]} possibleQueries A collection of selectors that rules are listening for
		 * @param {Array[]} expectedEmissions A function that accepts the AST and returns a list of the emissions that the
		 * generator is expected to produce, in order.
		 * Each element of this list is an array where the first element is a selector (string), and the second is an AST node
		 * This should only include emissions that appear in possibleQueries.
		 * @returns {void}
		 */
		function assertEmissions(
			ast,
			visitorKeys,
			possibleQueries,
			expectedEmissions,
		) {
			it(possibleQueries.join("; "), () => {
				const emissions = getEmissions(
					ast,
					visitorKeys,
					possibleQueries,
				).filter(emission => possibleQueries.includes(emission[0]));

				assert.deepStrictEqual(emissions, expectedEmissions(ast));
			});
		}

		assertEmissions(
			espree.parse("const foo = [<div/>, <div/>]", {
				...ESPREE_CONFIG,
				ecmaFeatures: { jsx: true },
			}),
			vk.KEYS,
			["* ~ *"],
			ast => [
				["* ~ *", ast.body[0].declarations[0].init.elements[1]], // entering second JSXElement
			],
		);

		assertEmissions(
			{
				// Parse `class A implements B {}` with typescript-eslint.
				type: "Program",
				errors: [],
				comments: [],
				sourceType: "module",
				body: [
					{
						type: "ClassDeclaration",
						id: {
							type: "Identifier",
							name: "A",
						},
						superClass: null,
						implements: [
							{
								type: "ClassImplements",
								id: {
									type: "Identifier",
									name: "B",
								},
								typeParameters: null,
							},
						],
						body: {
							type: "ClassBody",
							body: [],
						},
					},
				],
			},
			vk.unionWith({
				// see https://github.com/typescript-eslint/typescript-eslint/blob/e4d737b47574ff2c53cabab22853035dfe48c1ed/packages/visitor-keys/src/visitor-keys.ts#L27
				ClassDeclaration: [
					"decorators",
					"id",
					"typeParameters",
					"superClass",
					"superTypeParameters",
					"implements",
					"body",
				],
			}),
			[":first-child"],
			ast => [
				[":first-child", ast.body[0]], // entering first ClassDeclaration
				[":first-child", ast.body[0].implements[0]], // entering first ClassImplements
			],
		);
	});

	describe("parsing an invalid selector", () => {
		it("throws a useful error", () => {
			const emitter = createEmitter();

			emitter.on("Foo >", () => {});
			assert.throws(
				() => new NodeEventGenerator(emitter, STANDARD_ESQUERY_OPTION),
				/Syntax error in selector "Foo >" at position 5: Expected " ", "!", .*/u,
			);
		});
	});
});
