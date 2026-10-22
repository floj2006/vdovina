/** Блокировка прокрутки со счётчиком: несколько окон не снимают её друг у друга */
let n = 0;
export function lockScroll() {
  n++;
  document.body.classList.add('lock');
  let done = false;
  return () => {
    if (done) return;
    done = true;
    n = Math.max(0, n - 1);
    if (!n) document.body.classList.remove('lock');
  };
}
