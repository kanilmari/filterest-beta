// lang_value_reader.js
// Reads localized values from multilingual field payloads.
// Bridges raw database cell values and column metadata with the frontend's chosen-language rendering.
// Exists to centralize multilingual value extraction instead of duplicating JSON parsing heuristics.

/**
 * Extract a single language value from a raw cell value.
 * @param {*} rawVal           — raw value (may be JSON string or plain text)
 * @param {string} chosenLang  — ISO 639-1 language code, default 'en'
 * @param {boolean|null} isMultilingual — metadata flag from system_column_details;
 *                              true  = always treat as multilingual JSON,
 *                              false = never treat as multilingual,
 *                              null/undefined = fall back to heuristic detection.
 * @returns {string}
 */
export function extractLangValue(rawVal, chosenLang = 'en', isMultilingual = null) {
    if (rawVal == null) return '';
    const str = String(rawVal).trim();

    if (!(str.startsWith('{') && str.endsWith('}'))) {
        return str;
    }
    try {
        const parsed = JSON.parse(str);
        if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
            // Looks like a lang object: all keys are short (2-5 char) language codes
            // and all values are strings. Skip objects that don't match this pattern
            // when isMultilingual is explicitly false.
            const keys = Object.keys(parsed);
            const looksLikeLangObj = keys.length > 0
                && keys.every(k => /^[a-z]{2,5}$/.test(k))
                && keys.every(k => typeof parsed[k] === 'string');

            if (isMultilingual === false && !looksLikeLangObj) {
                return str;
            }

            if (typeof parsed[chosenLang] === 'string') {
                return String(parsed[chosenLang]);
            }
            const firstKey = keys.find(k => typeof parsed[k] === 'string');
            if (firstKey) return String(parsed[firstKey]);
        }
    } catch (_e) {
        // fall through on parse error
    }
    return str;
}
