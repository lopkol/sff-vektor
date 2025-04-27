export function guessAuthorSortName(name: string) {
  const hunChars = /[áéíóúöüőű]/i;
  const isHun = hunChars.test(name);
  const names = name.split(" ");
  const lastName = isHun ? names[0] : names[names.length - 1];
  const firstNames = isHun
    ? names.slice(1).join(" ")
    : names.slice(0, names.length - 1).join(" ");
  return `${lastName}, ${firstNames}`;
}
