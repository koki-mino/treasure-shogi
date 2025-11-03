// ====== ゲーム設定 ======
const BOARD_SIZE = 5;

// ステージ定義（piece に使う駒を指定）
const STAGES = [
  // 金（既存）
  { name: "1-金", piece: "gold",  start: [4, 2], goal: [0, 2], blocks: [],                     moves: 5 },
  { name: "2-金", piece: "gold",  start: [4, 4], goal: [0, 0], blocks: [[2,2],[2,3],[1,3]],     moves: 7 },

  // 銀
  { name: "3-銀", piece: "silver",start: [4, 2], goal: [0, 2], blocks: [[2,1],[2,2],[2,3]],     moves: 6 },

  // 歩
  { name: "4-歩", piece: "pawn",  start: [4, 2], goal: [0, 2], blocks: [[1,2],[2,2],[3,2]],     moves: 6 },

  // 桂（※将棋と同じ２マス前ジャンプ。盤外に出やすいので配置は中央寄り推奨）
  { name: "5-桂", piece: "knight",start: [4, 2], goal: [0, 2], blocks: [[2,1],[2,3]],           moves: 6 },

  // 香（前方向にまっすぐ何マスでも。岩で止まる）
  { name: "6-香", piece: "lance", start: [4, 2], goal: [0, 2], blocks: [[2,2]],                 moves: 4 },

  // 飛（上下左右に何マスでも）
  { name: "7-飛", piece: "rook",  start: [4, 2], goal: [0, 2], blocks: [[3,2],[2,2]],           moves: 5 },

  // 角（斜めに何マスでも）
  { name: "8-角", piece: "bishop",start: [4, 2], goal: [0, 2], blocks: [[3,3],[2,2],[3,1]],     moves: 6 },
];

// 駒ごとの表示名と画像キー
const PIECES = {
  gold:   { label: "金", assetKey: "kinchan"  },
  silver: { label: "銀", assetKey: "ginchan"  },
  pawn:   { label: "歩", assetKey: "fukun"    },
  knight: { label: "桂", assetKey: "keichan"  },
  lance:  { label: "香", assetKey: "kyokun"   },
  rook:   { label: "飛", assetKey: "hishakun" },
  bishop: { label: "角", assetKey: "kakusan"  },
};

// 画像アセット & プリロード
const ASSETS = {
  kinchan:  "./img/kinchan.png",
  treasure: "./img/treasure.png",
  rock:     "./img/rock.png",
  ginchan:   "./img/kinchan.png",
  fukun:     "./img/kinchan.png",
  keichan:   "./img/kinchan.png",
  kyokun:    "./img/kinchan.png",
  hishakun:  "./img/kinchan.png",
  kakusan:   "./img/kinchan.png",
};

function preloadImages(paths) {
  return Promise.all(
    paths.map(src => new Promise(res => {
      const img = new Image();
      img.onload = res;
      img.onerror = res;
      img.src = src;
    }))
  );
}

// ====== 状態 ======
let currentStageIndex = 0;
let playerPos = [0,0]; // [row, col]
let movesLeft = 0;
let reachableCells = []; // [[r,c], ...]

// DOM取得
const boardEl = document.getElementById("board");
const movesLeftEl = document.getElementById("movesLeft");
const stageNameEl = document.getElementById("stageName");
const restartBtn = document.getElementById("restartBtn");

const popupEl = document.getElementById("popup");
const popupEmojiEl = document.getElementById("popupEmoji");
const popupMsgEl = document.getElementById("popupMessage");
const popupCloseBtn = document.getElementById("popupCloseBtn");

// ====== 初期化 / ステージ読み込み ======
function loadStage(index) {
  currentStageIndex = index;
  const stage = STAGES[currentStageIndex];

  playerPos = [...stage.start];
  movesLeft = stage.moves;
  reachableCells = [];

  // UI反映
  movesLeftEl.textContent = movesLeft;
  stageNameEl.textContent = stage.name;

  drawBoard();
  calcReachables();
  drawBoard(); // 到達可能マスを反映
}

// ====== 盤の描画 ======
function drawBoard() {
  boardEl.innerHTML = "";

  const stage = STAGES[currentStageIndex];
  const goalPos = stage.goal;
  const blocks = stage.blocks.map(pair => pair.join(","));

  for (let r = 0; r < BOARD_SIZE; r++) {
    for (let c = 0; c < BOARD_SIZE; c++) {

      const isPlayer = (playerPos[0] === r && playerPos[1] === c);
      const isGoal   = (goalPos[0] === r && goalPos[1] === c);
      const isBlock  = blocks.includes([r,c].join(","));

      const canMoveHere = reachableCells.some(rc => rc[0] === r && rc[1] === c);

      const cell = document.createElement("button");
      cell.setAttribute("data-r", r);
      cell.setAttribute("data-c", c);

      let classList =
        "relative aspect-square w-full rounded-2xl flex items-center justify-center " +
        "ring-1 ring-gray-300 bg-gradient-to-br from-white to-gray-50 " +
        "text-[10px] font-semibold text-gray-700 shadow-inner active:scale-95 transition";

      if (isGoal) {
        classList += " bg-yellow-100 ring-yellow-400 text-yellow-700";
      }
      if (isBlock) {
        classList += " bg-gray-300 ring-gray-400 text-gray-600 cell-disabled";
      }
      if (isPlayer) {
        // ... drawBoard() の中、isPlayer の描画分岐を置き換え
if (isPlayer) {
  const stage = STAGES[currentStageIndex];
  const pieceInfo = PIECES[stage.piece] || PIECES.gold;
  const assetKey  = pieceInfo.assetKey;
  const imgSrc    = ASSETS[assetKey] || ASSETS.kinchan;
  const label     = pieceInfo.label;

  cell.innerHTML = `
    <figure class="flex flex-col items-center leading-none">
      <img src="${imgSrc}" alt="${label}"
           width="64" height="64"
           class="w-12 h-12 object-contain drop-shadow img-pop"
           loading="eager" decoding="async" draggable="false">
      <figcaption class="text-[9px] text-gray-700 font-normal mt-0.5">${label}ちゃん</figcaption>
    </figure>
  `;
}

      if (!isPlayer && !isBlock && canMoveHere) {
        classList += " cell-reachable";
      }

      if (isPlayer) {
        cell.innerHTML = `
          <figure class="flex flex-col items-center leading-none">
            <img src="${ASSETS.kinchan}" alt="きんちゃん"
                 width="64" height="64"
                 class="w-12 h-12 object-contain drop-shadow"
                 loading="eager" decoding="async" draggable="false">
            <figcaption class="text-[9px] text-gray-700 font-normal mt-0.5">きんちゃん</figcaption>
          </figure>
        `;
      } else if (isGoal) {
        cell.innerHTML = `
          <figure class="flex flex-col items-center leading-none">
            <img src="${ASSETS.treasure}" alt="おたから"
                 width="64" height="64"
                 class="w-12 h-12 object-contain"
                 loading="eager" decoding="async" draggable="false">
            <figcaption class="text-[9px] text-yellow-700 font-normal mt-0.5">おたから</figcaption>
          </figure>
        `;
      } else if (isBlock) {
        cell.innerHTML = `
          <figure class="flex flex-col items-center leading-none opacity-80">
            <img src="${ASSETS.rock}" alt="とおれない岩"
                 width="64" height="64"
                 class="w-12 h-12 object-contain"
                 loading="eager" decoding="async" draggable="false">
            <figcaption class="text-[9px] text-gray-600 font-normal mt-0.5">とおれない</figcaption>
          </figure>
        `;
      } else {
        cell.innerHTML = `<div class="text-[9px] text-gray-400 font-normal leading-none">${r},${c}</div>`;
      }

      if (!isBlock && !isPlayer && canMoveHere) {
        cell.addEventListener("click", () => movePlayerTo(r,c));
      } else {
        cell.disabled = true;
      }

      cell.className = classList;
      boardEl.appendChild(cell);
    }
  }
}

// ====== きんちゃんの動ける方向（“金”のイメージ） ======
function calcReachables() {
  const stage  = STAGES[currentStageIndex];
  const piece  = stage.piece;                 // ← 駒の種類
  const blocks = new Set(stage.blocks.map(p => p.join(",")));

  reachableCells = [];

  // 盤内 & ブロックでない を共通チェック
  const canPut = (r,c) =>
    r >= 0 && r < BOARD_SIZE && c >= 0 && c < BOARD_SIZE && !blocks.has([r,c].join(","));

  const r = playerPos[0], c = playerPos[1];

  // 1) 1マス系（金・銀・歩）
  if (piece === "gold") {
    const deltas = [[-1,0],[1,0],[0,-1],[0,1],[-1,-1],[-1,1]]; // 金：前・後・左右・斜め前
    for (const [dr,dc] of deltas) { const nr=r+dr, nc=c+dc; if (canPut(nr,nc)) reachableCells.push([nr,nc]); }
    return;
  }
  if (piece === "silver") {
    const deltas = [[-1,0],[-1,-1],[-1,1],[1,-1],[1,1]]; // 銀：前・斜め前・斜め後
    for (const [dr,dc] of deltas) { const nr=r+dr, nc=c+dc; if (canPut(nr,nc)) reachableCells.push([nr,nc]); }
    return;
  }
  if (piece === "pawn") {
    const nr = r-1, nc = c;                     // 歩：前に1
    if (canPut(nr,nc)) reachableCells.push([nr,nc]);
    return;
  }

  // 2) ジャンプ系（桂）
  if (piece === "knight") {
    // 桂：前前左／前前右（先手前提で上方向）
    const jumps = [[-2,-1],[-2,1]];
    for (const [dr,dc] of jumps) { const nr=r+dr, nc=c+dc; if (canPut(nr,nc)) reachableCells.push([nr,nc]); }
    return;
  }

  // 3) 直線スライド系（香・飛・角）
  const pushRay = (dr,dc) => {
    let nr = r+dr, nc = c+dc;
    while (canPut(nr,nc)) {
      reachableCells.push([nr,nc]);
      // 次マスへ（ブロックは手前で止まる）
      nr += dr; nc += dc;
    }
  };

  if (piece === "lance") {        // 香：前方向にまっすぐ
    pushRay(-1,0);
    return;
  }

  if (piece === "rook") {         // 飛：上下左右
    pushRay(-1,0); pushRay(1,0); pushRay(0,-1); pushRay(0,1);
    return;
  }

  if (piece === "bishop") {       // 角：斜め
    pushRay(-1,-1); pushRay(-1,1); pushRay(1,-1); pushRay(1,1);
    return;
  }
}

// ====== プレイヤー移動 ======
function movePlayerTo(r,c) {
  if (movesLeft <= 0) return;
  if (!reachableCells.some(rc => rc[0] === r && rc[1] === c)) return;

  playerPos = [r,c];
  movesLeft -= 1;
  movesLeftEl.textContent = movesLeft;

  const stage = STAGES[currentStageIndex];
  if (playerPos[0] === stage.goal[0] && playerPos[1] === stage.goal[1]) {
    showPopup(true);
    return;
  }
  if (movesLeft === 0) {
    showPopup(false);
    return;
  }

  calcReachables();
  drawBoard();
}

// ====== ポップアップ ======
function showPopup(isWin) {
  if (isWin) {
    popupEmojiEl.textContent = "🎉";
    popupMsgEl.textContent = "クリア！ おたからゲット！";
  } else {
    popupEmojiEl.textContent = "💦";
    popupMsgEl.textContent = "ざんねん… もういっかい やってみよう！";
  }
  popupEl.classList.remove("hidden","opacity-0");
  popupEl.classList.add("flex");
}

function closePopupAndNext() {
  popupEl.classList.add("hidden");
  popupEl.classList.remove("flex");

  const stage = STAGES[currentStageIndex];
  const isWin = (playerPos[0] === stage.goal[0] && playerPos[1] === stage.goal[1]);

  if (isWin) {
    const nextIndex = currentStageIndex + 1;
    if (nextIndex < STAGES.length) {
      loadStage(nextIndex);
    } else {
      loadStage(0);
    }
  } else {
    loadStage(currentStageIndex);
  }
}

// ====== リスタート ======
function restartGame() {
  loadStage(currentStageIndex);
}

// ====== イベント登録 ======
restartBtn.addEventListener("click", restartGame);
popupCloseBtn.addEventListener("click", closePopupAndNext);

// ====== 起動（画像を読んでから開始） ======
(async () => {
  await preloadImages(Object.values(ASSETS));
  loadStage(0);
})();
