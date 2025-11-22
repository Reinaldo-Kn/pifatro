// src/scenes/MainScene.js

import { loadCards, createDeck, shuffle,draw } from "../utils/deck.js";
import { createHand, gameState } from "../utils/gameLogic.js";
import { HandManager } from "../utils/handManager.js";
import { CardActions } from "../utils/cardActions.js";
import { UIManager } from "../utils/uiManager.js";

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
            // Usamos a chave 'heart_0', 'heart_1', 'heart_2', 'heart_3' para referência fácil
            this.load.image(`heart_${3 - index}`, `gui/GUI Assets/Status Bar Hearts/${asset}`);
        });
      
    }

create() {
        
        // INICIALIZAR MANAGERS
        // ============================================
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
    }

    // ============================================================
    // COMPRA CARTA DO DECK
    // ============================================================
    onDeckClick() {
        this.cardActions.drawCard(this.deck, () => {
            // Quando a carta é comprada, mudamos para o modo 'clicar para substituir'
            this.enableHandClicks();
        });
    }

    // ============================================================
    // HABILITA CLIQUES PARA SUBSTITUIR CARTA
    // ============================================================
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
                    // 🛑 O callback aqui apenas chama o método que reativa a seleção Pife
                    () => this.onCardReplaced() 
                );
            }
        );
    }
    
    // ============================================================
    // 🛑 NOVO CALLBACK: Chamado após uma carta ser substituída na mão
    // ============================================================
    onCardReplaced() {
        // 1. Re-renderiza a mão (necessário para limpar a carta que foi substituída)
        this.handManager.render(this.playerHand); 
        // 2. Volta para o modo padrão: seleção de Pife (clicar/arrastar)
        this.handManager.enablePifeSelection(this.playerHand); 
    }

    // ============================================================
    // 🛑 NOVO CALLBACK: Chamado após uma combinação de Pife ser bem-sucedida
    // ============================================================
onPifeSuccess(cardsToRemove) {
        // 1. Remove as cartas que formaram o pife da mão do jogador
        // Filtramos a mão para manter apenas as cartas que NÃO estão no pife
        this.playerHand = this.playerHand.filter(handCard => 
            !cardsToRemove.some(removeCard => removeCard.id === handCard.id)
        );

        // 2. Compra 3 novas cartas automaticamente
        const cardsToDraw = 3;
        for (let i = 0; i < cardsToDraw; i++) {
            if (this.deck.length > 0) {
                const newCard = draw(this.deck);
                this.playerHand.push(newCard);
            } else {
                console.log("Baralho acabou! Não é possível repor cartas.");
                // Opcional: Implementar lógica de reembaralhar o descarte
            }
        }

        // 3. Re-renderiza a mão com as novas cartas
        // (Neste momento, as cartas aparecem instantaneamente em suas posições finais)
        this.handManager.render(this.playerHand);

        // 4. Executa a animação de "voo" para as novas cartas entrarem
        // Passamos o número de cartas novas para ele animar apenas as últimas 3
        this.handManager.animateCardsEntry(cardsToDraw);

        // 5. Reativa a interatividade (seleção de pife)
        this.handManager.enablePifeSelection(this.playerHand);
        
        console.log(`Pife realizado! Mão atualizada. Restam ${this.deck.length} cartas no baralho.`);
    }

    // ============================================================
    // DESCARTA CARTA NO SLOT VERMELHO
    // ============================================================
    onDiscardClick() {
        this.cardActions.discardCard(this.discardSprite);
    }

    update() {}
}