export function Capitalize(word:string): string {
  return word.charAt(0).toUpperCase() + word.slice(1);
}

// LettersNumbersWithDash returns string while removing all
// non letters symbols excepts dash and numbers
export function LettersNumbersWithDash(word: string): string {
  return word.replace(/[^a-zA-Z0-9-]+/g, '');
}
