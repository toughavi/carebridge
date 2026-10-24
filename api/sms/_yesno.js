// Understands YES / NO replies in the languages families are likely to text in.
const YES = ['yes', 'y', 'yeah', 'yep', 'yup', 'ok', 'okay', 'sure', 'i will', "i'll", 'i can', 'can do', 'haan', 'han', 'ha', 'ji', 'हाँ', 'हां', 'जी', '是', '好', '可以', '行', 'ஆம்', 'சரி', 'ஆமாம்', 'ਹਾਂ', 'ਜੀ', 'si', 'sí', 'claro', 'có', 'vâng', 'được', '1', '👍'];
const NO = ['no', 'n', 'nope', "can't", 'cant', 'cannot', 'not', 'sorry', 'nahi', 'nahin', 'नहीं', 'नही', '不', '不行', '不能', 'இல்லை', 'முடியாது', 'ਨਹੀਂ', 'không', 'ko', '2', '👎'];
export function yesNo(text) {
  const s = String(text || '').trim().toLowerCase().replace(/[.!?,;:]+$/g, '');
  if (!s) return null;
  const starts = (w) => s === w || s.startsWith(w + ' ') || s.startsWith(w + ',') || s.startsWith(w + '!') || s.startsWith(w + '.') || (/[^\x00-\x7F]/.test(w) && s.startsWith(w));
  // Check NO first so "no, sorry" or "can't" never reads as yes.
  if (NO.some(starts) || /\b(can'?t|cannot|won'?t|not available|busy)\b/.test(s)) return 'no';
  if (YES.some(starts) || /\b(i'?ll drive|i can drive|count me in)\b/.test(s)) return 'yes';
  return null;
}
