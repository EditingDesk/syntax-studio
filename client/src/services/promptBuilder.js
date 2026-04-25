export function buildPrompt(template, userAdjustments = "") {
  return template + "\n" + userAdjustments;
}