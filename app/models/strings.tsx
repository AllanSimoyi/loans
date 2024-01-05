export function pad(n: string, width: number, z = '0') {
  if (n.length >= width) {
    return n;
  }
  return new Array(width - n.length + 1).join(z) + n;
}

export function capitalize(s: string) {
  if (s && s.length) {
    return s[0].toUpperCase() + s.slice(1);
  }
  return '';
}
