/**
 * Shared Question Normalization and Selection Utilities
 * Unified contract for Practice Sets, Assessments, and Contests.
 */

export function normalizeOptions(options, format) {
  if (format === "TRUE_FALSE") {
    if (!options || (Array.isArray(options) && options.length === 0)) {
      return [
        { id: "true", text: "True" },
        { id: "false", text: "False" }
      ];
    }
  }

  if (!options) return [];

  if (Array.isArray(options)) {
    return options.map((opt, idx) => {
      if (typeof opt === "string") {
        return { id: String(idx + 1), text: opt };
      }
      if (typeof opt === "object" && opt !== null) {
        return {
          id: String(opt.id || opt.key || opt.optionId || opt.value || idx + 1),
          text: String(opt.text || opt.label || opt.statement || opt.value || opt.id || "")
        };
      }
      return { id: String(idx + 1), text: String(opt) };
    });
  }

  if (typeof options === "object" && options !== null) {
    return Object.entries(options).map(([key, val]) => ({
      id: key,
      text: typeof val === "object" && val !== null ? String(val.text || val.label || key) : String(val)
    }));
  }

  return [];
}

export function isOptionSelected(optId, vId, format, responses) {
  const resp = responses?.[vId];
  if (!resp) return false;

  if (format === "MULTIPLE_CHOICE") {
    const list = Array.isArray(resp.optionIds)
      ? resp.optionIds
      : Array.isArray(resp.selectedOptionIds)
      ? resp.selectedOptionIds
      : Array.isArray(resp)
      ? resp
      : [];
    return list.map(String).includes(String(optId));
  }

  if (format === "TRUE_FALSE") {
    if (resp.value !== undefined) {
      return (
        (String(optId).toLowerCase() === "true" && resp.value === true) ||
        (String(optId).toLowerCase() === "false" && resp.value === false)
      );
    }
    const val = resp.optionId || resp.selectedOptionId || resp.answer || resp;
    return String(val).toLowerCase() === String(optId).toLowerCase();
  }

  const selectedId =
    resp.optionId || resp.selectedOptionId || resp.id || (typeof resp === "string" ? resp : null);
  return String(selectedId) === String(optId);
}

export function extractQuestionDetails(q) {
  if (!q) return null;

  const version = q.questionVersion || q;
  const questionMeta = q.questionVersion?.question || q.question || q;
  const format = version.format || questionMeta.format || q.format || "SINGLE_CHOICE";

  return {
    id: q.id,
    questionVersionId: q.questionVersionId || version.id || q.id,
    title: version.title || q.title || "",
    statement: version.statement || q.statement || "",
    options: normalizeOptions(version.options || q.options, format),
    format,
    type: version.type || questionMeta.type || q.section || "APTITUDE",
    section: q.section || version.type || questionMeta.type || "APTITUDE",
    marks: Number(q.marks || version.marks || 1),
    negativeMarks: Number(q.negativeMarks || version.negativeMarks || 0),
    codingProblem: version.codingProblem || q.codingProblem || null,
    response: q.response || null,
    latestSubmission: q.latestSubmission || null
  };
}

export function isQuestionAnswered(q, responses) {
  if (!q) return false;
  const vId = q.questionVersionId || q.questionVersion?.id || q.id;
  const resp = responses?.[vId];
  if (!resp) return false;
  if (resp.submissionId) return true;
  if (resp.optionId || resp.selectedOptionId) return true;
  if (Array.isArray(resp.optionIds) && resp.optionIds.length > 0) return true;
  if (Array.isArray(resp.selectedOptionIds) && resp.selectedOptionIds.length > 0) return true;
  if (resp.value !== undefined && resp.value !== null && String(resp.value).trim() !== "") return true;
  if (typeof resp === "string" && resp.trim() !== "") return true;
  return false;
}
