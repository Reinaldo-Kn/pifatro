// src/scenes/MainScene.js

import { loadCards, createDeck, shuffle,draw } from "../utils/deck.js";
import { createHand, gameState } from "../utils/gameLogic.js";
import { HandManager } from "../utils/handManager.js";
import { CardActions } from "../utils/cardActions.js";
import { UIManager } from "../utils/uiManager.js";
import pbClient from "../utils/pocketbaseClient.js";

export default class MainScene extends Phaser.Scene {
    constructor() {
        super("MainScene");
        this.gameState = gameState;
        this.gameState.currentLives = 3; 
        this.lifeAssetMap = [
            'Type1_Heart_1.0.png', 
            'Type1_Heart_0.5.png', 
            'Type1_Heart_0.25.png', 
            'Type1_Heart_0.0.png', 
        ];
    }

    preload() {
        loadCards(this);
        this.load.image(
            "jokerSlot",
            "gui/Menu Styles/Menu Highlights/Blue/Bl3.png"
        );
        this.load.image(
            "discardSlotImage",
            "gui/Menu Styles/Menu Highlights/Orange/O3.png"
        );
          this.load.image(
            "coin_icon", 
            "gui/GUI Assets/Gems for Status/Gem_Yellow.png"
        );
        this.lifeAssetMap.forEach((asset, index) => {
            // Usa a chave 'heart_0', 'heart_1', 'heart_2', 'heart_3' para referência
            this.load.image(`heart_${3 - index}`, `gui/GUI Assets/Status Bar Hearts/${asset}`);
        });
      
    }

create() {
        this.events.on('playerAuthenticated', async ({ guest } = {}) => {
            if (guest) {
                console.log('Continuing as guest (no remote save).');
                return;
            }

            try {
                const saved = await pbClient.loadGameState();
                if (saved) {
                    // Aplica o estado salvo
                    this.gameState.currentCoins = saved.coins ?? this.gameState.currentCoins;
                    this.gameState.currentLives = saved.lives ?? this.gameState.currentLives;

                    // Se a mão salva existir, use. Caso contrário, mantenha a mão atual.
                    if (Array.isArray(saved.hand) && saved.hand.length > 0) {
                        this.playerHand = saved.hand;
                        if (this.handManager) this.handManager.render(this.playerHand);
                    }

                    // Atualiza elementos da UI
                    if (this.uiManager) this.uiManager.updateCoins(this.gameState.currentCoins);
                    if (this.lifeSprite) this.lifeSprite.setTexture(`heart_${this.gameState.currentLives}`);

                    console.log('Game state loaded from PocketBase.');
                }
            } catch (err) {
                console.warn('Failed to load game state:', err);
            }
        });

        try {
            const currentUser = pbClient.getCurrentUser ? pbClient.getCurrentUser() : null;
            if (!currentUser) this.scene.launch('LoginScene');
        } catch (e) {
            // Se PocketBase não estiver inicializado ou outro erro, lança a cena de login
            try { this.scene.launch('LoginScene'); } catch (err) { /* ignore */ }
        }

        this.handManager = new HandManager(this);
        this.cardActions = new CardActions(this);
        this.uiManager = new UIManager(this);
        this.input.dragDistanceThreshold = 16
        
        // Configura callbacks
        this.cardActions.onPifeSuccess = this.onPifeSuccess.bind(this);
        this.cardActions.onCardReplaced = this.onCardReplaced.bind(this);
        this.cardActions.onCoinsUpdated = (totalCoins) => {
            this.uiManager.updateCoins(totalCoins);
        };

        this.deck = shuffle(createDeck());
        this.playerHand = createHand(this.deck, 9);

    
        this.uiManager.createDrawPile(() => this.onDeckClick());

        const { discardSlot } = this.uiManager.createPlaceholders(this.playerHand.length);
        
        this.uiManager.createCoinDisplay(this.gameState.currentCoins);

        
        this.discardSprite = this.uiManager.createDiscardSprite(discardSlot);
        
        discardSlot.setInteractive();
        discardSlot.on("pointerdown", () => this.onDiscardClick());

        this.handManager.render(this.playerHand);

        this.handManager.enablePifeSelection(this.playerHand); 

      
        this.lifeSprite = this.uiManager.createLifeBar(this.gameState.currentLives);
        try {
            const clamped = Math.max(0, Math.min(3, Number(this.gameState.currentLives) || 0));
            this.lifeSprite.setTexture(`heart_${clamped}`);
            console.log('Life initialized, currentLives=', this.gameState.currentLives, 'spriteKey=', `heart_${clamped}`);
        } catch (e) {
            console.warn('Failed to initialize life sprite texture', e);
        }
        try {
            this.uiManager.createSaveButton(async () => {
                try {
                    const user = pbClient.getCurrentUser();
                    if (!user) {
                        this.uiManager.showSaveFeedback('Login required', false);
                        return;
                    }

                    await pbClient.saveGameState({
                        lives: this.gameState.currentLives,
                        coins: this.gameState.currentCoins,
                        hand: this.playerHand,
                    });

                    this.uiManager.showSaveFeedback('Saved', true);
                } catch (err) {
                    console.warn('Save failed', err);
                        this.uiManager.showSaveFeedback('Save failed', false);
                        try {
                            const errText = typeof err === 'object' ? JSON.stringify(err, Object.getOwnPropertyNames(err), 2) : String(err);
                            if (this.uiManager) this.uiManager.showDebugPanel(errText);
                            console.error('Save error details:', err);
                        } catch (e) { console.error(e); }
                }
            });
        } catch (e) {
        }
    }


    onDeckClick() {
        this.cardActions.drawCard(this.deck, () => {
            this.enableHandClicks();
        });
    }


    enableHandClicks() {
        this.handManager.enableClickToReplace(
            this.playerHand,
            (index, sprite) => {
                this.cardActions.replaceCardInHand(
                    this.playerHand,
                    index,
                    sprite,
                    this.discardSprite,
                    this.handManager.handScale,
                    () => this.onCardReplaced() 
                );
            }
        );
    }
    
 
    onCardReplaced() {
        this.handManager.render(this.playerHand); 
        this.handManager.enablePifeSelection(this.playerHand); 
    }


onPifeSuccess(cardsToRemove) {
        this.playerHand = this.playerHand.filter(handCard => 
            !cardsToRemove.some(removeCard => removeCard.id === handCard.id)
        );

        const cardsToDraw = 3;
        for (let i = 0; i < cardsToDraw; i++) {
            if (this.deck.length > 0) {
                const newCard = draw(this.deck);
                this.playerHand.push(newCard);
            } else {
                console.log("Baralho acabou! Não é possível repor cartas.");
            }
        }

        this.handManager.render(this.playerHand);

        this.handManager.animateCardsEntry(cardsToDraw);

        this.handManager.enablePifeSelection(this.playerHand);
        
        console.log(`Pife realizado! Mão atualizada. Restam ${this.deck.length} cartas no baralho.`);
    }

    onDiscardClick() {
        this.cardActions.discardCard(this.discardSprite);
    }

    update() {}
}