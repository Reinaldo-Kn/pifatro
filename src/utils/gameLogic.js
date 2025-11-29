// src/utils/gameLogic.js

import { draw, RANKS } from "./deck.js";

export function createHand(deck, numberOfCards = 2) {
    const hand = [];

    for (let i = 0; i < numberOfCards; i++) {
        hand.push(draw(deck));
    }

    return hand;
}

export const gameState = {
    currentDrawnCard: null,
    currentLives: 3,
    currentCoins: 0, 
};

export function drawFromDeck(deck) {
    if (deck.length === 0) return null;

    const card = draw(deck);
    gameState.currentDrawnCard = card;
    return card;
}

export function discardDrawnCard() {
    gameState.currentDrawnCard = null;
}

export function swapHandCards(hand, indexA, indexB) {
    if (
        indexA < 0 || indexA >= hand.length ||
        indexB < 0 || indexB >= hand.length
    ) {
        return false; 
    }

    const temp = hand[indexA];
    hand[indexA] = hand[indexB];
    hand[indexB] = temp;

    return true;
}

export function checkPifeCombination(selectedCards) {
    if (selectedCards.length !== 3) return null;

    const ranks = selectedCards.map(c => c.rank);
    const suits = selectedCards.map(c => c.suit);
    const uniqueSuits = new Set(suits).size;
    const isSameSuit = uniqueSuits === 1;

    //  Checa Trinca 
    const isTrinca = new Set(ranks).size === 1;

    if (isTrinca) {
        return { type: 'Trinca', livesRestored: 1, coins: 50 };
    }

   
    const rankIndices = ranks
        .map(r => RANKS.indexOf(r))
        .sort((a, b) => a - b);
    
    const isConsecutive = rankIndices[1] === rankIndices[0] + 1 && 
                          rankIndices[2] === rankIndices[1] + 1;

    if (isConsecutive) {
        // Checa Sequência + Mesmo Naipe
        if (isSameSuit) {
            return { type: 'SequenciaColorida', livesRestored: 2, coins: 200 };
        } else {
            return { type: 'Sequencia', livesRestored: 1, coins: 100 };
        }
    }

    return null; // Nenhuma combinação válida
}