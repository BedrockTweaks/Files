import typescriptEslint from "@typescript-eslint/eslint-plugin";
import minecraftLinting from "eslint-plugin-minecraft-linting";
import stylistic from "@stylistic/eslint-plugin";
import tsParser from "@typescript-eslint/parser";
import path from "node:path";
import {
	fileURLToPath
}
	from "node:url";
import js from "@eslint/js";
import {
	FlatCompat
}
	from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const compat = new FlatCompat({
	baseDirectory: __dirname,
	recommendedConfig: js.configs.recommended,
	allConfig: js.configs.all
});

export default [
	...compat.extends("eslint:recommended", "plugin:@typescript-eslint/recommended"),
	{
		files: ["**/*.ts"],

		plugins: {
			"@typescript-eslint": typescriptEslint,
			"minecraft-linting": minecraftLinting,
			"@stylistic": stylistic,
		},

		languageOptions: {
			parser: tsParser,
			ecmaVersion: "latest",
			sourceType: "module",

			parserOptions: {
				project: "tsconfig.json",
				tsconfigRootDir: ".",
			},
		},

		rules: {
			"no-unused-expressions": "off",
			"@typescript-eslint/no-unused-expressions": "off",
			"@typescript-eslint/explicit-member-accessibility": ["error",
				{
					accessibility: "no-public",
				}
			],

			"@typescript-eslint/no-restricted-types": [
				"error",
				{
					"types": {
						"Object": {
							"message": "Avoid using the `Object` type. Did you mean `object`?"
						},
						"Function": {
							"message": "Avoid using the `Function` type. Prefer a specific function type, like `() => void`."
						},
						"Boolean": {
							"message": "Avoid using the `Boolean` type. Did you mean `boolean`?"
						},
						"Number": {
							"message": "Avoid using the `Number` type. Did you mean `number`?"
						},
						"String": {
							"message": "Avoid using the `String` type. Did you mean `string`?"
						},
						"Symbol": {
							"message": "Avoid using the `Symbol` type. Did you mean `symbol`?"
						}
					}
				}
			],
			"@typescript-eslint/no-wrapper-object-types": "error",
			"@typescript-eslint/no-unsafe-function-type": "error",
			"@typescript-eslint/no-empty-object-type": ["error",
				{
					allowInterfaces: 'always'
				}
			],
			"@typescript-eslint/ban-ts-comment": ["error",
				{
					'ts-expect-error': 'allow-with-description'
				}
			],

			"@typescript-eslint/consistent-type-assertions": "error",
			"@typescript-eslint/dot-notation": "error",

			"@typescript-eslint/member-ordering": ["error",
				{
					default: [
						"private-field",
						"protected-field",
						"public-field",
						"constructor",
						"public-method",
						"protected-method",
						"private-method",
					],
				}
			],

			"@typescript-eslint/naming-convention": ["error",
				{
					selector: "default",
					format: ["camelCase"],
				},
				{
					selector: "default",
					modifiers: ["unused"],

					filter: {
						regex: "^(_|_.*_?)$",
						match: true,
					},

					format: null,
				},
				{
					selector: "variable",
					format: ["camelCase"],
				},
				{
					selector: "variable",
					modifiers: ["const"],
					format: ["camelCase", "UPPER_CASE", "PascalCase"],
				},
				{
					selector: ["enum", "enumMember", "function"],
					format: ["camelCase", "UPPER_CASE", "PascalCase"],
				},
				{
					selector: ["property", "parameterProperty", "accessor"],
					modifiers: ["private"],
					format: ["camelCase"],
					leadingUnderscore: "require",
				},
				{
					selector: ["property", "parameterProperty", "accessor"],
					modifiers: ["private", "readonly"],
					format: ["UPPER_CASE", "camelCase"],
					leadingUnderscore: "allow",
				},
				{
					selector: ["property"],
					modifiers: ["readonly"],
					format: ["camelCase", "UPPER_CASE"],
				},
				{
					selector: ["objectLiteralProperty", "typeProperty"],
					format: ["camelCase", "snake_case", "UPPER_CASE"],
				},
				{
					selector: "typeLike",
					format: ["PascalCase"],
				}
			],

			"@typescript-eslint/explicit-function-return-type": ["error",
				{
					allowExpressions: true,
				}
			],

			"@typescript-eslint/no-unnecessary-type-assertion": "error",
			"@typescript-eslint/default-param-last": "warn",
			"@typescript-eslint/no-explicit-any": "warn",
			"@typescript-eslint/no-unnecessary-boolean-literal-compare": "warn",
			"@typescript-eslint/prefer-enum-initializers": "warn",

			"@typescript-eslint/unbound-method": ["error",
				{
					ignoreStatic: true,
				}
			],

			eqeqeq: ["error", "always",
				{
					null: "ignore",
				}
			],

			"object-shorthand": "error",

			"@typescript-eslint/no-unused-vars": ["error",
				{
					argsIgnorePattern: "^(_|_.*_?)$",
				}
			],

			"arrow-body-style": "warn",
			curly: ["warn", "multi-line", "consistent"],
			"@typescript-eslint/array-type": "warn",
			"@typescript-eslint/prefer-optional-chain": "warn",
			"@typescript-eslint/prefer-reduce-type-parameter": "warn",
			"@stylistic/array-bracket-newline": "off",
			"@stylistic/array-bracket-spacing": ["warn"],
			"@stylistic/array-element-newline": "off",
			"@stylistic/arrow-parens": ["warn", "as-needed"],
			"@stylistic/arrow-spacing": ["warn"],
			"@stylistic/block-spacing": ["warn", "always"],

			"@stylistic/brace-style": ["warn", "1tbs",
				{
					allowSingleLine: true,
				}
			],

			"@stylistic/comma-dangle": ["warn",
				{
					arrays: "always-multiline",
					objects: "always-multiline",
					imports: "never",
					exports: "never",
					functions: "always-multiline",
					enums: "never",
					generics: "never",
					tuples: "always-multiline",
				}
			],

			"@stylistic/comma-spacing": ["warn",
				{
					before: false,
					after: true,
				}
			],

			"@stylistic/computed-property-spacing": ["warn"],
			"@stylistic/dot-location": ["warn", "property"],
			"@stylistic/eol-last": ["warn"],
			"@stylistic/func-call-spacing": ["warn", "never"],
			"@stylistic/function-call-argument-newline": ["warn", "consistent"],
			"@stylistic/function-paren-newline": ["warn", "consistent"],
			"@stylistic/generator-star-spacing": "off",
			"@stylistic/implicit-arrow-linebreak": ["warn", "beside"],
			"@stylistic/indent": ["warn", "tab"],
			"@stylistic/jsx-quotes": "off",

			"@stylistic/key-spacing": ["warn",
				{
					beforeColon: false,
					afterColon: true,
					mode: "strict",
				}
			],

			"@stylistic/keyword-spacing": ["warn"],
			"@stylistic/linebreak-style": ["warn", "windows"],

			"@stylistic/lines-around-comment": ["warn",
				{
					afterBlockComment: false,
					beforeLineComment: false,
					afterLineComment: false,
					allowBlockStart: true,
					allowClassStart: true,
					allowObjectStart: true,
					allowArrayStart: true,
				}
			],

			"@stylistic/lines-between-class-members": ["warn", "always",
				{
					exceptAfterSingleLine: true,
					exceptAfterOverload: false,
				}
			],

			"@stylistic/max-len": "off",
			"@stylistic/max-statements-per-line": "off",
			"@stylistic/multiline-ternary": "off",
			"@stylistic/new-parens": ["warn"],
			"@stylistic/newline-per-chained-call": "off",
			"@stylistic/no-confusing-arrow": "off",
			"@stylistic/no-extra-parens": ["warn"],
			"@stylistic/no-extra-semi": ["warn"],
			"@stylistic/no-floating-decimal": ["warn"],
			"@stylistic/no-mixed-operators": "off",
			"@stylistic/no-mixed-spaces-and-tabs": ["warn"],
			"@stylistic/no-multi-spaces": ["warn"],

			"@stylistic/no-multiple-empty-lines": ["warn",
				{
					max: 1,
				}
			],

			"@stylistic/no-tabs": ["off"],
			"@stylistic/no-trailing-spaces": ["warn"],
			"@stylistic/no-whitespace-before-property": ["warn"],
			"@stylistic/nonblock-statement-body-position": "off",

			"@stylistic/object-curly-newline": ["warn",
				{
					multiline: true,
				}
			],

			"@stylistic/object-curly-spacing": ["warn", "always"],
			"@stylistic/object-property-newline": "off",
			"@stylistic/one-var-declaration-per-line": "off",
			"@stylistic/operator-linebreak": "off",
			"@stylistic/padded-blocks": ["warn", "never"],

			"@stylistic/padding-line-between-statements": ["warn",
				{
					blankLine: "always",
					prev: "*",
					next: "return",
				}
			],

			"@stylistic/quote-props": ["warn", "as-needed"],

			"@stylistic/quotes": ["warn", "single",
				{
					avoidEscape: true,
					allowTemplateLiterals: true,
				}
			],

			"@stylistic/rest-spread-spacing": ["warn", "never"],
			"@stylistic/semi": ["warn", "always"],
			"@stylistic/semi-spacing": ["warn"],
			"@stylistic/semi-style": ["warn", "last"],
			"@stylistic/space-before-blocks": ["warn"],
			"@stylistic/space-before-function-paren": ["warn", "never"],
			"@stylistic/space-in-parens": ["warn", "never"],
			"@stylistic/space-infix-ops": "warn",
			"@stylistic/space-unary-ops": "off",
			"@stylistic/spaced-comment": ["warn", "always"],
			"@stylistic/switch-colon-spacing": ["warn"],
			"@stylistic/template-curly-spacing": ["warn"],
			"@stylistic/template-tag-spacing": "off",
			"@stylistic/wrap-iife": "off",
			"@stylistic/wrap-regex": "off",
			"@stylistic/yield-star-spacing": "off",
			"@stylistic/member-delimiter-style": ["warn"],
			"@stylistic/type-annotation-spacing": "warn",
			"@stylistic/jsx-child-element-spacing": "off",
			"@stylistic/jsx-closing-bracket-location": "off",
			"@stylistic/jsx-closing-tag-location": "off",
			"@stylistic/jsx-curly-brace-presence": "off",
			"@stylistic/jsx-curly-newline": "off",
			"@stylistic/jsx-curly-spacing": "off",
			"@stylistic/jsx-equals-spacing": "off",
			"@stylistic/jsx-first-prop-new-line": "off",
			"@stylistic/jsx-indent": "off",
			"@stylistic/jsx-indent-props": "off",
			"@stylistic/jsx-max-props-per-line": "off",
			"@stylistic/jsx-newline": "off",
			"@stylistic/jsx-one-expression-per-line": "off",
			"@stylistic/jsx-props-no-multi-spaces": "off",
			"@stylistic/jsx-self-closing-comp": "off",
			"@stylistic/jsx-sort-props": "off",
			"@stylistic/jsx-tag-spacing": "off",
			"@stylistic/jsx-wrap-multilines": "off",
		},
	}
];
