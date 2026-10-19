import { Chess } from './lib/chess.js';

const oyun = new Chess();
const tahta = document.getElementById('tahta');
const durum = document.getElementById('durum');

const TASLAR = {
  w: { k: '♔', q: '♕', r: '♖', b: '♗', n: '♘', p: '♙' },
  b: { k: '♚', q: '♛', r: '♜', b: '♝', n: '♞', p: '♟' }
};
const HARFLER = 'abcdefgh';

let secili = null;   // dokunduğun taşın karesi, örn. 'e2'
let hedefler = [];   // o taşın gidebileceği kareler, örn. ['e3', 'e4']

// Tahtayı oyunun şu anki durumuna göre baştan çizer
function ciz() {
  tahta.innerHTML = '';
  const dizi = oyun.board();

  for (let satir = 0; satir < 8; satir++) {
    const tr = document.createElement('tr');

    for (let sutun = 0; sutun < 8; sutun++) {
      const td = document.createElement('td');
      const kareAdi = HARFLER[sutun] + (8 - satir);

      td.className = (satir + sutun) % 2 === 0 ? 'b' : 's';
      td.dataset.kare = kareAdi;

      const tas = dizi[satir][sutun];
      if (tas) {
        td.textContent = TASLAR[tas.color][tas.type] + '\uFE0E';
      }

      if (kareAdi === secili) td.classList.add('secili');
      if (hedefler.includes(kareAdi)) td.classList.add('hedef');

      tr.appendChild(td);
    }
    tahta.appendChild(tr);
  }
  durumuYaz();
}

// Bir kareye dokunulunca çalışır
function karaDokun(kare) {
  if (oyun.isGameOver()) return;

  // Taş seçiliyse ve dokunduğun yer yeşil noktalı bir kareyse: hamle yap
  if (secili && hedefler.includes(kare)) {
    oyun.move({ from: secili, to: kare, promotion: 'q' });
    secili = null;
    hedefler = [];
    ciz();
    return;
  }

 
  const tas = oyun.get(kare);
  if (tas && tas.color === oyun.turn()) {
    secili = kare;
    hedefler = oyun.moves({ square: kare, verbose: true }).map(h => h.to);
  } else {
    secili = null;
    hedefler = [];
  }
  ciz();
}


function durumuYaz() {
  let yazi = oyun.turn() === 'w' ? 'Sıra: beyaz' : 'Sıra: siyah';

  if (oyun.isCheckmate()) {
    yazi = 'checkmate' + (oyun.turn() === 'w' ? 'siyah' : 'beyaz');
  } else if (oyun.isStalemate()) {
    yazi = 'Pat, oyun berabere';
  } else if (oyun.isDraw()) {
    yazi = 'berabere';
  } else if (oyun.inCheck()) {
    yazi += ' (check)';
  }
  durum.textContent = yazi;
}


tahta.addEventListener('click', e => {
  const td = e.target.closest('td');
  if (td) karaDokun(td.dataset.kare);
});


document.getElementById('yeni').addEventListener('click', () => {
  oyun.reset();
  secili = null;
  hedefler = [];
  ciz();
});


ciz();