// ====== ゲーム設定 ======
const BOARD_SIZE = 5;

// ステージ定義
// - start: きんちゃんの開始位置 [row, col]
// - goal: 宝箱の位置 [row, col]
// - blocks: 岩などで入れないマス
// - moves: 制限手数
const STAGES = [
  {
    name: "1",
    start: [4, 2],
    goal:  [0, 2],
    blocks: [],
    moves: 5
  },
  {
    name: "2",
    start: [4, 4],
    goal:  [0, 0],
    blocks: [[2,2],[2,3],[1,3]],
    moves: 7
  }
]; // ← ここでちゃんと閉じる

// 画像アセット & プリロード
const ASSETS = {
  kinchan:  "./img/kinchan.png",
  treasure: "./img/treasure.png",
  rock:     "./img/rock.png",
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
        classList += " bg-amber-200 ring-amber-400 shadow-lg text-gray-900";
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
  const deltas = [
    [-1,  0], // up
    [ 1,  0], // down
    [ 0, -1], // left
    [ 0,  1], // right
    [-1, -1], // up-left
    [-1,  1], // up-right
    // 斜め下は無し
  ];
  const stage = STAGES[currentStageIndex];
  const blocks = stage.blocks.map(pair => pair.join(","));

  reachableCells = [];

  for (const [dr,dc] of deltas) {
    const nr = playerPos[0] + dr;
    const nc = playerPos[1] + dc;
    if (nr < 0 || nr >= BOARD_SIZE || nc < 0 || nc >= BOARD_SIZE) continue;
    if (blocks.includes([nr,nc].join(","))) continue;
    reachableCells.push([nr,nc]);
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
