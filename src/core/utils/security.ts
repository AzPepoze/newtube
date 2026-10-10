import { createNotification } from "@core/shared/notifications";
import { logger } from "@shared/logger";

export const dangerousPatterns = [
	/eval/i,
	/new function/i,
	/(?<!@)\bimport\b/i,
	/fetch/i,
	/xmlhttprequest/i,
	/xhr/i,
	/<\/?script>/i,
	/document\.createElement\s*\(\s*['"]script['"]\s*\)/i,
	/\.write\s*\(/i,
	/\.execcommand\s*\(/i,
	/\.cookie\s*=/i,
	/localstorage/i,
	/sessionstorage/i,
	/indexeddb/i,
	/opendatabase/i,
	/postmessage/i,
	/sendbeacon/i,
	/importscripts/i,
	/createobjecturl/i,
	/revokeobjecturl/i,
	/webkitrequestfilesystem/i,
	/webkitresolvelocalfilesystemurl/i,
	/showopenfilepicker/i,
	/showsavefilepicker/i,
	/showdirectorypicker/i,
	/new\s+worker\s*\(/i,
	/new\s+sharedworker\s*\(/i,
	/new\s+blob\s*\(/i,
	/url\.createobjecturl\s*\(/i,
	/\.__proto__\s*=/i,
	/\.constructor\s*=/i,
	/javascript:/i,
	/reflect\.(apply|construct|defineproperty|get|set|deleteproperty|ownkeys)/i,
	/globalthis\./i,
	/window\[(["'`"]).*\1\]/i,
	/new\s+eventsource\s*\(/i,
	/webassembly\./i,
	/\.contenteditable\s*=/i,
	/\?callback=/i,
	/new\s+proxy\s*\(/i,
	/function\.prototype\.tostring/i,
	/intl\./i,
	/symbol\./i,
];

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
