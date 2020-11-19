export function Capitalize(word:string): string {
  return word.charAt(0).toUpperCase() + word.slice(1);
}

// LettersOnlyWithDashLowered returns string while removing all
// non letters symbols excepts dash
export function LettersOnlyWithDash(word: string): string {
  return word.toString().replace(/[^a-zA-Z-]+/g, '');
}
