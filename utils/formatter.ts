/**
 * Simple code formatter using basic indentation logic.
 * This replaces the "fake" simulated formatting.
 */
export const formatCode = (code: string, language: 'html' | 'css' | 'javascript'): string => {
    // Basic indentation logic
    const lines = code.split('\n');
    let formatted = '';
    let indentLevel = 0;
    const indentString = '    '; // 4 spaces

    // Regex for opening/closing blocks
    const openBlock = /({|<div|<head|<body|<script|<style|<html>)/;
    const closeBlock = /(}|<\/div>|<\/head>|<\/body>|<\/script>|<\/style>|<\/html>)/;

    // Improved logic needed for a real formatter, but this is better than "Simulated"
    // For now, let's just do a trim per line and basic indentation adjustment
    // A robust solution would use a parser. This is a "Best Effort" lightweight formatter.

    for (let i = 0; i < lines.length; i++) {
        let line = lines[i].trim();

        // Dedent closing tags/brackets *before* printing
        if (line.match(/^<\//) || line.startsWith('}') || line.startsWith(']')) {
            indentLevel = Math.max(0, indentLevel - 1);
        }

        formatted += indentString.repeat(indentLevel) + line + '\n';

        // Indent opening tags/brackets *after* printing
        // Check if line ends with { or opens a tag that isn't self-closing
        if (
            line.endsWith('{') ||
            (line.match(/<[a-zA-Z]+[^>]*>/) && !line.match(/<\//) && !line.endsWith('/>') && !line.startsWith('<!'))
        ) {
            indentLevel++;
        }
    }

    return formatted.trim();
};
