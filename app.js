import { Chess } from './lib/chess.js';

const oyun = new Chess();
const tahta = document.getElementById('tahta');
const durum = document.getElementById('durum');
const yenilenler = document.getElementById('yenilenler');
const terfiPaneli = document.getElementById('terfi');
const onlinePanel = document.getElementById('onlinePanel');          // YENİ
const onlineDurum = document.getElementById('onlineDurum');          // YENİ
const kodGirdisi = document.getElementById('kodGirdisi');            // YENİ

const TASLAR = {
 w: { k: '♔', q: '♕', r: '♖', b: '♗', n: '♘', p: '♙' },
 b: { k: '♚', q: '♛', r: '♜', b: '♝', n: '♞', p: '♟' }
};
const ISIM = { n: 'at', q: 'vezir', r: 'kale', b: 'fil' };
const HARFLER = 'abcdefgh';

// Gösterge için klasik puanlar
const DEGER = { p: 1, n: 3, b: 3, r: 5, q: 9, k: 0 };

// ---------- YAPAY ZEKÂ AYARLARI ----------
const DERINLIK = 3;   // kaç hamle ilerisine bakacak (telefonda yavaşsa 2 yap, hızlıysa 4 dene)

// Yapay zekâ için ince puanlar (1 piyon = 100)
const MATERYAL = { p: 100, n: 320, b: 330, r: 500, q: 900, k: 0 };

// Taşların hangi karede durmasının iyi olduğunu söyleyen tablolar.
// Beyaz gözüyle, ilk satır 8. sıra. Siyah için ters çevrilerek okunur.
const PST = {
  p: [
     0,  0,  0,  0,  0,  0,  0,  0,
    50, 50, 50, 50, 50, 50, 50, 50,
    10, 10, 20, 30, 30, 20, 10, 10,
     5,  5, 10, 25, 25, 10,  5,  5,
     0,  0,  0, 20, 20,  0,  0,  0,
     5, -5,-10,  0,  0,-10, -5,  5,
     5, 10, 10,-20,-20, 10, 10,  5,
     0,  0,  0,  0,  0,  0,  0,  0
  ],
  n: [
   -50,-40,-30,-30,-30,-30,-40,-50,
   -40,-20,  0,  0,  0,  0,-20,-40,
   -30,  0, 10, 15, 15, 10,  0,-30,
   -30,  5, 15, 20, 20, 15,  5,-30,
   -30,  0, 15, 20, 20, 15,  0,-30,
   -30,  5, 10, 15, 15, 10,  5,-30,
   -40,-20,  0,  5,  5,  0,-20,-40,
   -50,-40,-30,-30,-30,-30,-40,-50
  ],
  b: [
   -20,-10,-10,-10,-10,-10,-10,-20,
   -10,  0,  0,  0,  0,  0,  0,-10,
   -10,  0,  5, 10, 10,  5,  0,-10,
   -10,  5,  5, 10, 10,  5,  5,-10,
   -10,  0, 10, 10, 10, 10,  0,-10,
   -10, 10, 10, 10, 10, 10, 10,-10,
   -10,  5,  0,  0,  0,  0,  5,-10,
   -20,-10,-10,-10,-10,-10,-10,-20
  ],
  r: [
     0,  0,  0,  0,  0,  0,  0,  0,
     5, 10, 10, 10, 10, 10, 10,  5,
    -5,  0,  0,  0,  0,  0,  0, -5,
    -5,  0,  0,  0,  0,  0,  0, -5,
    -5,  0,  0,  0,  0,  0,  0, -5,
    -5,  0,  0,  0,  0,  0,  0, -5,
    -5,  0,  0,  0,  0,  0,  0, -5,
     0,  0,  0,  5,  5,  0,  0,  0
  ],
  q: [
   -20,-10,-10, -5, -5,-10,-10,-20,
   -10,  0,  0,  0,  0,  0,  0,-10,
   -10,  0,  5,  5,  5,  5,  0,-10,
    -5,  0,  5,  5,  5,  5,  0, -5,
     0,  0,  5,  5,  5,  5,  0, -5,
   -10,  5,  5,  5,  5,  5,  0,-10,
   -10,  0,  5,  0,  0,  0,  0,-10,
   -20,-10,-10, -5, -5,-10,-10,-20
  ],
  k: [
   -30,-40,-40,-50,-50,-40,-40,-30,
   -30,-40,-40,-50,-50,-40,-40,-30,
   -30,-40,-40,-50,-50,-40,-40,-30,
   -30,-40,-40,-50,-50,-40,-40,-30,
   -20,-30,-30,-40,-40,-30,-30,-20,
   -10,-20,-20,-20,-20,-20,-20,-10,
    20, 20,  0,  0,  0,  0, 20, 20,
    20, 30, 10,  0,  0, 10, 30, 20
  ]
};

const INSAN = 'w';     // yapay zekâya karşı oynarken sen beyazsın

let mod = 'ai';      // 'ai' = yapay zekâya karşı, 'iki' = iki kişilik, 'online' = internetten
let secili = null;   // dokunduğun taşın karesi, örn. 'e2'
let hedefler = [];   // o taşın gidebileceği kareler, örn. ['e3', 'e4']
let bekleyenTerfi = null;   // terfi seçimi beklenirken { from, to }

// YENİ: online mod için
let peer = null;        // PeerJS ile kayıt olduğumuz "rehber" kaydı
let baglanti = null;    // rakiple doğrudan hat (bağlıysa dolu, değilse null)
let renkim = 'w';       // online oynarken benim rengim: kuran beyaz, katılan siyah

// ---------- ÇİZİM ----------

function ciz() {
  tahta.innerHTML = '';
  const dizi = oyun.board();
  const cevir = mod === 'online' && renkim === 'b';   // YENİ: siyah oynayan tahtayı ters görür

  for (let r = 0; r < 8; r++) {
    const tr = document.createElement('tr');

    for (let c = 0; c < 8; c++) {
      const satir = cevir ? 7 - r : r;       // ekrandaki konumdan gerçek konuma
      const sutun = cevir ? 7 - c : c;

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
  yenilenleriYaz();
}

function durumuYaz() {
  let yazi = oyun.turn() === 'w' ? 'beyaz' : 'siyah';
  if (mod === 'ai' && oyun.turn() !== INSAN) yazi += ' (yapay zekâ)';
  if (mod === 'online') yazi += oyun.turn() === renkim ? ' (sen)' : ' (rakip)';   // YENİ

  if (oyun.isCheckmate()) {
    yazi = 'checkmate' + (oyun.turn() === 'w' ? 'siyah' : 'beyaz');
  } else if (oyun.isStalemate()) {
    yazi = 'pat';
  } else if (oyun.isDraw()) {
    yazi = 'Oyun berabere';
  } else if (oyun.inCheck()) {
    yazi += ' (check)';
  }
  durum.textContent = yazi;
}

// ---------- YENİLEN TAŞLAR GÖSTERGESİ ----------

function yenilenleriYaz() {
  const yenen = { w: [], b: [] };   // w: beyazın yediği taşlar, b: siyahın yediği taşlar

  for (const h of oyun.history({ verbose: true })) {
    if (h.captured) yenen[h.color].push(h.captured);
  }

  const toplam = { w: 0, b: 0 };
  const yazi = { w: '', b: '' };

  for (const renk of ['w', 'b']) {
    const karsi = renk === 'w' ? 'b' : 'w';
    yenen[renk].sort((x, y) => DEGER[y] - DEGER[x]);
    toplam[renk] = yenen[renk].reduce((t, tas) => t + DEGER[tas], 0);
    yazi[renk] = yenen[renk].map(tas => TASLAR[karsi][tas] + '\uFE0E').join('');
  }

  const fark = toplam.w - toplam.b;
  let ozet = 'puan eşit';
  if (fark > 0) ozet = 'beyaz ' + fark + ' puan önde';
  if (fark < 0) ozet = 'siyah ' + (-fark) + ' puan önde';

  yenilenler.textContent =
    'beyaz: ' + yazi.w + ' (' + toplam.w + ')\n' +
    'siyah: ' + yazi.b + ' (' + toplam.b + ')\n' +
    ozet;
}

// ---------- DOKUNMA ----------

function karaDokun(kare) {
  if (oyun.isGameOver()) return;
  if (bekleyenTerfi) return;                            // terfi seçilirken tahta kilitli
  if (mod === 'ai' && oyun.turn() !== INSAN) return;    // yapay zekâ düşünürken dokunamazsın
  if (mod === 'online' && (!baglanti || oyun.turn() !== renkim)) return;   // YENİ: bağlı değilsen ya da sıra rakipteyse dokunamazsın

  // Taş seçiliyse ve dokunduğun yer yeşil noktalı bir kareyse: hamle yap
  if (secili && hedefler.includes(kare)) {
    const adaylar = oyun.moves({ square: secili, verbose: true }).filter(h => h.to === kare);

    if (adaylar[0].promotion) {            // piyon son sıraya ulaşıyorsa: önce sor
      bekleyenTerfi = { from: secili, to: kare };
      terfiPaneliAc();
      return;
    }
    hamleYap(secili, kare);
    return;
  }

  // Değilse: sırası gelen tarafın taşına mı dokundun?
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

function hamleYap(kaynak, hedef, terfi) {
  oyun.move({ from: kaynak, to: hedef, promotion: terfi });
  secili = null;
  hedefler = [];
  bekleyenTerfi = null;
  terfiPaneli.classList.remove('acik');
  ciz();
  if (mod === 'online' && baglanti) {                                   // YENİ: hamleyi rakibe yolla
    baglanti.send({ tip: 'hamle', from: kaynak, to: hedef, promotion: terfi });
  }
  if (mod === 'ai') aiOyna();
}

// ---------- PİYON TERFİSİ ----------

function terfiPaneliAc() {
  const renk = oyun.turn();
  terfiPaneli.querySelectorAll('button').forEach(b => {
    b.textContent = TASLAR[renk][b.dataset.tas] + '\uFE0E ' + ISIM[b.dataset.tas];
  });
  terfiPaneli.classList.add('acik');
}

terfiPaneli.addEventListener('click', e => {
  const b = e.target.closest('button');
  if (b && bekleyenTerfi) {
    hamleYap(bekleyenTerfi.from, bekleyenTerfi.to, b.dataset.tas);
  }
});

// ---------- YAPAY ZEKÂ ----------

// Tahtanın puanı: pozitif = beyaz önde, negatif = siyah önde
function degerlendir() {
  const dizi = oyun.board();
  let puan = 0;

  for (let s = 0; s < 8; s++) {
    for (let c = 0; c < 8; c++) {
      const tas = dizi[s][c];
      if (!tas) continue;

      if (tas.color === 'w') {
        puan += MATERYAL[tas.type] + PST[tas.type][s * 8 + c];
      } else {
        puan -= MATERYAL[tas.type] + PST[tas.type][(7 - s) * 8 + c];
      }
    }
  }
  return puan;
}

// Mat olan tarafın puanı. Daha erken mat, daha büyük puan (derinlik büyükse mat erken gelmiştir)
function matPuani(sirasiGelenBeyazMi, derinlik) {
  return sirasiGelenBeyazMi ? -100000 - derinlik : 100000 + derinlik;
}

// İyi görünen hamleleri öne al: alfa-beta bu sayede çok daha hızlı budar
function hamleSirala(hamleler) {
  const skor = h =>
    (h.captured ? 10 * MATERYAL[h.captured] - MATERYAL[h.piece] : 0) +
    (h.promotion === 'q' ? 800 : 0);
  return hamleler.sort((a, b) => skor(b) - skor(a));
}

function karistir(liste) {
  for (let i = liste.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [liste[i], liste[j]] = [liste[j], liste[i]];
  }
  return liste;
}

function dene(h) {
  oyun.move({ from: h.from, to: h.to, promotion: h.promotion });
}

function minimax(derinlik, alfa, beta, beyazMi) {
  if (derinlik === 0) {
    return oyun.isCheckmate() ? matPuani(beyazMi, 0) : degerlendir();
  }

  const hamleler = hamleSirala(oyun.moves({ verbose: true }));
  if (hamleler.length === 0) {
    return oyun.inCheck() ? matPuani(beyazMi, derinlik) : 0;   // mat ya da pat
  }

  if (beyazMi) {
    let en = -Infinity;
    for (const h of hamleler) {
      dene(h);
      en = Math.max(en, minimax(derinlik - 1, alfa, beta, false));
      oyun.undo();
      alfa = Math.max(alfa, en);
      if (alfa >= beta) break;     // budama
    }
    return en;
  }

  let en = Infinity;
  for (const h of hamleler) {
    dene(h);
    en = Math.min(en, minimax(derinlik - 1, alfa, beta, true));
    oyun.undo();
    beta = Math.min(beta, en);
    if (alfa >= beta) break;       // budama
  }
  return en;
}

function aiHamleSec() {
  const hamleler = hamleSirala(karistir(oyun.moves({ verbose: true })));
  const beyazMi = oyun.turn() === 'w';
  let enIyi = null;
  let alfa = -Infinity;
  let beta = Infinity;

  for (const h of hamleler) {
    dene(h);
    const puan = minimax(DERINLIK - 1, alfa, beta, !beyazMi);
    oyun.undo();

    if (beyazMi && puan > alfa) { alfa = puan; enIyi = h; }
    if (!beyazMi && puan < beta) { beta = puan; enIyi = h; }
  }
  return enIyi;
}

function aiOyna() {
  setTimeout(() => {
    if (mod !== 'ai' || oyun.isGameOver() || oyun.turn() === INSAN) return;
    const hamle = aiHamleSec();
    if (hamle) dene(hamle);
    ciz();
  }, 400);
}

// ---------- YENİ: ONLINE MOD ----------

// Karışması kolay harfleri (0, O, 1, I) kodda kullanmıyoruz
const KOD_HARFLERI = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

function rastgeleKod() {
  let kod = '';
  for (let i = 0; i < 5; i++) {
    kod += KOD_HARFLERI[Math.floor(Math.random() * KOD_HARFLERI.length)];
  }
  return kod;
}

// Açık bağlantı ve kayıt varsa kapat
function onlineKapat() {
  if (baglanti) { baglanti.close(); baglanti = null; }
  if (peer) { peer.destroy(); peer = null; }
}

function hataYaz(err) {
  if (err.type === 'peer-unavailable') {
    onlineDurum.textContent = 'Bu kodla açık bir oyun bulunamadı. Kodu kontrol et.';
  } else if (err.type === 'unavailable-id') {
    onlineDurum.textContent = 'Kod çakıştı, "Oyun kur"a tekrar bas.';
  } else {
    onlineDurum.textContent = 'Bağlantı hatası (' + err.type + '). İnternetini kontrol edip tekrar dene.';
  }
}

function onlineKur() {
  if (typeof Peer === 'undefined') {
    onlineDurum.textContent = 'PeerJS yüklenemedi (lib/peerjs.min.js dosyasını kontrol et).';
    return;
  }
  onlineKapat();
  mod = 'online';
  renkim = 'w';
  yeniOyun();

  const kod = rastgeleKod();
  onlineDurum.textContent = 'Kod oluşturuluyor...';
  peer = new Peer('satranc-' + kod);

  peer.on('open', () => {
    onlineDurum.textContent = 'Oyun kodu: ' + kod + '  (arkadaşın bu kodu girsin, sen beyazsın)';
  });
  peer.on('connection', c => {
    if (baglanti) { c.close(); return; }    // zaten biri bağlı, üçüncü kişiyi alma
    baglantiyiHazirla(c);
  });
  peer.on('error', hataYaz);
}

function onlineKatil() {
  if (typeof Peer === 'undefined') {
    onlineDurum.textContent = 'PeerJS yüklenemedi (lib/peerjs.min.js dosyasını kontrol et).';
    return;
  }
  const kod = kodGirdisi.value.trim().toUpperCase();
  if (kod.length !== 5) {
    onlineDurum.textContent = 'Kod 5 karakter olmalı.';
    return;
  }
  onlineKapat();
  mod = 'online';
  renkim = 'b';
  yeniOyun();

  onlineDurum.textContent = 'Bağlanılıyor...';
  peer = new Peer();

  peer.on('open', () => {
    baglantiyiHazirla(peer.connect('satranc-' + kod, { reliable: true }));
  });
  peer.on('error', hataYaz);
}

function baglantiyiHazirla(c) {
  c.on('open', () => {
    baglanti = c;
    yeniOyun();
    onlineDurum.textContent = 'Bağlandı! Sen ' + (renkim === 'w' ? 'beyazsın' : 'siyahsın') + '.';
  });
  c.on('data', mesajAl);
  c.on('close', () => {
    baglanti = null;
    onlineDurum.textContent = 'Rakip ayrıldı ya da bağlantı koptu. Yeni oyun kurabilirsin.';
  });
}

// Rakipten gelen mesajı işle
function mesajAl(veri) {
  if (!veri || typeof veri !== 'object') return;

  if (veri.tip === 'hamle') {
    if (oyun.turn() === renkim) return;      // sıra bende, rakip hamle yollayamaz: yok say
    try {
      oyun.move({ from: veri.from, to: veri.to, promotion: veri.promotion });
    } catch (e) {
      return;                                // yasadışı hamle: hakem reddetti
    }
    secili = null;
    hedefler = [];
    ciz();
  } else if (veri.tip === 'yeni') {
    yeniOyun();
  }
}

// ---------- MOD VE DÜĞMELER ----------

function butonlariBoya() {
  document.getElementById('modAi').classList.toggle('aktif', mod === 'ai');
  document.getElementById('modIki').classList.toggle('aktif', mod === 'iki');
  document.getElementById('modOnline').classList.toggle('aktif', mod === 'online');
  onlinePanel.classList.toggle('acik', mod === 'online');
}

function yeniOyun() {
  oyun.reset();
  secili = null;
  hedefler = [];
  bekleyenTerfi = null;
  terfiPaneli.classList.remove('acik');
  butonlariBoya();
  ciz();
}

document.getElementById('modAi').addEventListener('click', () => {
  onlineKapat();
  mod = 'ai';
  yeniOyun();
});

document.getElementById('modIki').addEventListener('click', () => {
  onlineKapat();
  mod = 'iki';
  yeniOyun();
});

document.getElementById('modOnline').addEventListener('click', () => {
  onlineKapat();
  mod = 'online';
  renkim = 'w';
  onlineDurum.textContent = '"Oyun kur"a bas ya da arkadaşının kodunu yazıp "Katıl"a bas.';
  yeniOyun();
});

document.getElementById('onlineKur').addEventListener('click', onlineKur);
document.getElementById('onlineKatil').addEventListener('click', onlineKatil);

document.getElementById('yeni').addEventListener('click', () => {
  if (mod === 'online') {
    if (!baglanti) return;
    if (!confirm('Oyun iki taraf için de sıfırlanacak. Emin misin?')) return;
    baglanti.send({ tip: 'yeni' });
  }
  yeniOyun();
});

tahta.addEventListener('click', e => {
  const td = e.target.closest('td');
  if (td) karaDokun(td.dataset.kare);
});

yeniOyun();