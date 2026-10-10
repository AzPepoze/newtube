import { createNotification } from "@core/shared/notifications";
import { logger } from "@shared/logger";
import { dangerousPatterns } from "./dangerousPatterns";

export { dangerousPatterns };

export function isSafeCode(code: string, codeName: string): boolean {
	if (!code) return false;
	const loweredCaseCode = code.toLowerCase();

	for (const pattern of dangerousPatterns) {
		if (pattern.test(loweredCaseCode)) {
			const match = loweredCaseCode.match(pattern);
			if (match) {
				const matchIndex = match.index;

				const beforeMatch = loweredCaseCode.slice(0, matchIndex);
				const lineNumber = beforeMatch.split("\n").length;
				const charPosition = matchIndex - beforeMatch.lastIndexOf("\n");

				const codeLines = loweredCaseCode.split("\n");
				const errorLine = codeLines[lineNumber - 1];

				const isComment = errorLine.replaceAll(" ", "").replaceAll("\t", "").startsWith("//");
				if (isComment) {
					continue;
				}

				const startContext = Math.max(0, charPosition - 15);
				const endContext = Math.min(errorLine.length, charPosition + match[0].length + 15);
				const contextSnippet = errorLine.slice(startContext, endContext);

				createNotification({
					icon: "block",
					iconColor: "#888888",
					title: "StyleShift - Error",
					content: `"${match[0]}" is not allowed.\nFound at line: ${lineNumber}, character: ${charPosition}\nFrom: ${codeName}\n\n${contextSnippet}`,
					timeout: 0,
				});

				logger.warn("security", match, pattern);
			}
			return false;
		}
	}

	return true;
}
