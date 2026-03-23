/**
 * parse-test-report.js
 * Compresses verbose test outputs into a concise summary for AI efficiency.
 */
const fs = require("node:fs");

function parseJest(json) {
	const data = JSON.parse(json);
	const summary = {
		total: data.numTotalTests,
		passed: data.numPassedTests,
		failed: data.numFailedTests,
		failures: data.testResults
			.flatMap((tr) => tr.assertionResults)
			.filter((ar) => ar.status === "failed")
			.map((ar) => ({
				name: ar.fullName,
				msg: ar.failureMessages[0]?.split("\n")[0], // Only first line
			})),
	};
	return JSON.stringify(summary, null, 2);
}

const input = fs.readFileSync(0, "utf-8");
console.log(parseJest(input));
