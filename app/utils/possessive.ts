export function possessive(string: string) {
  if (!string) return string;
  let lastChar = string.at(-1);
  if (!lastChar) return string;
  let ending = lastChar === "s" ? "'" : "'s";
  return string + ending;
}
