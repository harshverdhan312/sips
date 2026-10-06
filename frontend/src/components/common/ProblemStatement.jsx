import React, { useMemo } from "react";
import katex from "katex";
import { Terminal, Code2, Sparkles, BookOpen, AlertCircle, Copy, Check } from "lucide-react";

/**
 * Safely render a LaTeX math snippet into HTML using KaTeX.
 * Fallback to plain text on any formatting error.
 */
function renderKaTeX(mathStr, displayMode = false) {
  try {
    return katex.renderToString(mathStr.trim(), {
      displayMode,
      throwOnError: false,
      output: "htmlAndMathml"
    });
  } catch (err) {
    console.warn("KaTeX render error:", err);
    return `<span class="font-mono text-purple-700 font-semibold">${mathStr}</span>`;
  }
}

/**
 * Parse an inline text block and replace $...$ with KaTeX HTML,
 * `code` with styled <code> tags, and **bold** with <strong>.
 */
function parseInlineMathAndMarkdown(text) {
  if (!text) return "";

  // 1. Process math blocks $$...$$ first if present
  let processed = text.replace(/\$\$([\s\S]*?)\$\$/g, (_, math) => {
    return `<div class="my-2 py-1 overflow-x-auto text-center">${renderKaTeX(math, true)}</div>`;
  });

  // 2. Process inline math $...$ (ensure not preceded/followed by numbers like $100 price)
  processed = processed.replace(/\$([^\$\n\r]+?)\$/g, (match, math) => {
    // If it's a plain number without math symbols, still render as clean math or number
    return renderKaTeX(math, false);
  });

  // 3. Process inline code `...`
  processed = processed.replace(/`([^`]+)`/g, '<code class="px-1.5 py-0.5 rounded bg-slate-100 text-indigo-700 font-mono text-[12px]">$1</code>');

  // 4. Process bold **...**
  processed = processed.replace(/\*\*([^*]+)\*\*/g, '<strong class="font-bold text-slate-900">$1</strong>');

  // 5. Process italic *...*
  processed = processed.replace(/\*([^*]+)\*/g, '<em class="italic text-slate-800">$1</em>');

  return processed;
}

/**
 * Splits a full competitive programming statement into structured sections:
 * - description
 * - input (Input Format)
 * - output (Output Format)
 * - examples (Sample Cases)
 * - note (Notes / Explanations)
 */
function parseProblemSections(fullText) {
  if (!fullText) return { description: "", input: null, output: null, examples: null, note: null };

  const raw = fullText.replace(/\r\n/g, "\n");

  // Regex patterns to identify competitive programming dividers
  const inputDivider = /(?:^|\n)-+Input:?-+(?:\n|$)/i;
  const outputDivider = /(?:^|\n)-+Output:?-+(?:\n|$)/i;
  const exampleDivider = /(?:^|\n)-+Examples?:?-+(?:\n|$)/i;
  const noteDivider = /(?:^|\n)-+Notes?:?-+(?:\n|$)/i;

  let hasSections = inputDivider.test(raw) || outputDivider.test(raw) || exampleDivider.test(raw) || noteDivider.test(raw);

  if (!hasSections) {
    return {
      description: raw,
      input: null,
      output: null,
      examples: null,
      note: null
    };
  }

  // Segment the text based on headings
  let text = raw;
  let description = "";
  let input = null;
  let output = null;
  let examples = null;
  let note = null;

  // Extract Note if at the end
  const noteMatch = text.search(noteDivider);
  if (noteMatch !== -1) {
    note = text.slice(noteMatch).replace(noteDivider, "").trim();
    text = text.slice(0, noteMatch);
  }

  // Extract Examples if present
  const exampleMatch = text.search(exampleDivider);
  if (exampleMatch !== -1) {
    examples = text.slice(exampleMatch).replace(exampleDivider, "").trim();
    text = text.slice(0, exampleMatch);
  }

  // Extract Output if present
  const outputMatch = text.search(outputDivider);
  if (outputMatch !== -1) {
    output = text.slice(outputMatch).replace(outputDivider, "").trim();
    text = text.slice(0, outputMatch);
  }

  // Extract Input if present
  const inputMatch = text.search(inputDivider);
  if (inputMatch !== -1) {
    input = text.slice(inputMatch).replace(inputDivider, "").trim();
    description = text.slice(0, inputMatch).trim();
  } else {
    description = text.trim();
  }

  return { description, input, output, examples, note };
}

/**
 * Component to format example blocks (Input/Output sample pairs)
 */
function ExampleSection({ examplesText }) {
  const [copied, setCopied] = React.useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(examplesText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="rounded-xl border border-slate-200/90 bg-slate-50/70 p-4 space-y-2">
      <div className="flex items-center justify-between">
        <h5 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
          <Terminal className="w-3.5 h-3.5 text-indigo-600" />
          Sample Input & Output
        </h5>
        <button
          type="button"
          onClick={handleCopy}
          className="text-xs text-slate-500 hover:text-slate-800 flex items-center gap-1 px-2 py-0.5 rounded hover:bg-slate-200/60 transition-colors"
          title="Copy sample data"
        >
          {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
          <span>{copied ? "Copied" : "Copy"}</span>
        </button>
      </div>
      <pre className="p-3 bg-slate-900 text-slate-100 rounded-lg text-xs font-mono overflow-x-auto whitespace-pre leading-relaxed border border-slate-800">
        {examplesText}
      </pre>
    </div>
  );
}

/**
 * Universal Problem Statement Viewer with Math / LaTeX formatting
 */
export function ProblemStatement({ statement, className = "" }) {
  const parsed = useMemo(() => parseProblemSections(statement), [statement]);

  const renderParagraphs = (rawText) => {
    if (!rawText) return null;
    const paragraphs = rawText.split(/\n\s*\n/);

    return paragraphs.map((para, idx) => {
      const html = parseInlineMathAndMarkdown(para.trim());
      if (!html) return null;

      return (
        <p
          key={idx}
          className="leading-relaxed text-slate-700"
          dangerouslySetInnerHTML={{ __html: html }}
        />
      );
    });
  };

  return (
    <div className={`space-y-4 text-xs sm:text-sm ${className}`}>
      {/* 1. Main Problem Description */}
      {parsed.description && (
        <div className="space-y-2.5">
          {renderParagraphs(parsed.description)}
        </div>
      )}

      {/* 2. Input Specification */}
      {parsed.input && (
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/90 space-y-2">
          <h5 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
            <Terminal className="w-3.5 h-3.5 text-indigo-600" />
            Input Format
          </h5>
          <div className="space-y-2 text-slate-700">
            {renderParagraphs(parsed.input)}
          </div>
        </div>
      )}

      {/* 3. Output Specification */}
      {parsed.output && (
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/90 space-y-2">
          <h5 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
            <Code2 className="w-3.5 h-3.5 text-emerald-600" />
            Output Format
          </h5>
          <div className="space-y-2 text-slate-700">
            {renderParagraphs(parsed.output)}
          </div>
        </div>
      )}

      {/* 4. Examples / Samples */}
      {parsed.examples && (
        <ExampleSection examplesText={parsed.examples} />
      )}

      {/* 5. Notes / Explanations */}
      {parsed.note && (
        <div className="p-4 rounded-xl bg-amber-50/60 border border-amber-200/80 space-y-2">
          <h5 className="text-xs font-bold text-amber-900 uppercase tracking-wider flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-600" />
            Note / Explanation
          </h5>
          <div className="space-y-2 text-amber-950">
            {renderParagraphs(parsed.note)}
          </div>
        </div>
      )}
    </div>
  );
}

export default ProblemStatement;
