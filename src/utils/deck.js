// Suítes usadas internamente no jogo
// S = ♠ spades, H = ♥ hearts, C = ♣ clubs, D = ♦ diamonds
export const SUITS = ["S", "H", "C", "D"];
export const RANKS = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"];



const SUIT_TO_NAME = {
  S: "spades",
  H: "hearts",
  C: "clubs",
  D: "diamonds",
};

const RANK_TO_NAME = {
  A: "ace",
  J: "jack",
  Q: "queen",
  K: "king",
  "2": "2",
  "3": "3",
  "4": "4",
  "5": "5",
  "6": "6",
  "7": "7",
  "8": "8",
  "9": "9",
  "10": "10",
};


export function loadCards(scene) {
  // Faces das cartas
  for (const suit of SUITS) {
    for (const rank of RANKS) {
      const assetName = cardAssetName(rank, suit);
      scene.load.image(assetName, `/card_pngs/card_faces/${assetName}.png`);
    }
  }

  scene.load.image("joker", `/card_pngs/card_faces/joker.png`);

  // Backs
  scene.load.image("card_back_1", `/card_pngs/card_backs/card_back_1.png`);
  scene.load.image("card_back_2", `/card_pngs/card_backs/card_back_2.png`);
  scene.load.image("card_back_3", `/card_pngs/card_backs/card_back_3.png`);
}


export function cardAssetName(rank, suit) {
  const r = RANK_TO_NAME[rank];
  const s = SUIT_TO_NAME[suit];
  return `${r}_of_${s}`;
}


export function createDeck() {
  const deck = [];

  for (const suit of SUITS) {
    for (const rank of RANKS) {
      deck.push({
        id: `${rank}${suit}`,               // ex: "AS", "10H", "KD"
        rank,
        suit,
        asset: cardAssetName(rank, suit),   // ex: "ace_of_spades"
      });
    }
  }

  return deck;
}


export function shuffle(deck) {
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return deck;
}



export function draw(deck) {
  return deck.pop(); // remove e retorna a última carta
}
