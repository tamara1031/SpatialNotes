const Parser = require("tree-sitter");
const Typescript = require("tree-sitter-typescript").typescript;
const Go = require("tree-sitter-go");
const fs = require("node:fs");
const path = require("node:path");

const parser = new Parser();

function getSymbols(filePath) {
	const ext = path.extname(filePath);
	if (ext === ".ts" || ext === ".tsx") {
		parser.setLanguage(Typescript);
	} else if (ext === ".go") {
		parser.setLanguage(Go);
	} else {
		return [];
	}

	const code = fs.readFileSync(filePath, "utf8");
	const tree = parser.parse(code);
	const symbols = [];

	// Simple recursive traversal for classes and functions
	function traverse(node) {
		if (
			node.type === "class_declaration" ||
			node.type === "function_declaration" ||
			node.type === "method_declaration" ||
			node.type === "function_definition"
		) {
			const nameNode =
				node.childForFieldName("name") ||
				node.children.find((c) => c.type === "identifier");
			if (nameNode) {
				symbols.push({
					type: node.type,
					name: nameNode.text,
					line: node.startPosition.row + 1,
				});
			}
		}
		for (const child of node.children) {
			traverse(child);
		}
	}

	traverse(tree.rootNode);
	return symbols;
}

const args = process.argv.slice(2);
if (args.length > 0) {
	console.log(JSON.stringify(getSymbols(args[0]), null, 2));
}
