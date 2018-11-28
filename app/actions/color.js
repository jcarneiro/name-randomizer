/* eslint no-bitwise: 0 */
/* eslint no-param-reassign: 0 */
/* eslint no-cond-assign: 0 */
export function alterColor(col, amt) {
  let usePound = false;

  if (col[0] === '#') {
    col = col.slice(1);
    usePound = true;
  }

  const num = parseInt(col, 16);

  let r = (num >> 16) + amt;

  if (r > 255) r = 255;
  else if (r < 0) r = 0;

  let b = ((num >> 8) & 0x00ff) + amt;

  if (b > 255) b = 255;
  else if (b < 0) b = 0;

  let g = (num & 0x0000ff) + amt;

  if (g > 255) g = 255;
  else if (g < 0) g = 0;

  return (usePound ? '#' : '') + (g | (b << 8) | (r << 16)).toString(16);
}

function componentFromStr(numStr, percent) {
  const num = Math.max(0, parseInt(numStr, 10));
  return percent
    ? Math.floor((255 * Math.min(100, num)) / 100)
    : Math.min(255, num);
}

export function rgbToHex(rgb) {
  const rgbRegex = /^rgb\(\s*(-?\d+)(%?)\s*,\s*(-?\d+)(%?)\s*,\s*(-?\d+)(%?)\s*\)$/;
  let result;

  let r;

  let g;

  let b;

  let hex = '';
  if ((result = rgbRegex.exec(rgb))) {
    r = componentFromStr(result[1], result[2]);
    g = componentFromStr(result[3], result[4]);
    b = componentFromStr(result[5], result[6]);

    hex = `#${(0x1000000 + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
  }
  return hex;
}
