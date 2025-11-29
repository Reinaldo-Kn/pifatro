// src/utils/cardActions.js

import { drawFromDeck, discardDrawnCard, gameState, checkPifeCombination } from "./gameLogic.js";
import { applyCardFlip } from "./animations.js";

export class CardActions {
    constructor(scene) {
        this.scene = scene;
        this.drawnSprite = null;
        this.gameState = scene.gameState;
        
        // preenchidas pelo MainScene
        this.onPifeSuccess = null;
        this.onCardReplaced = null;
        this.onCoinsUpdated = null;
    }

  
    addCoins(amount) {
            this.gameState.currentCoins += amount;
            
            console.log(`+${amount} Moedas! Total: ${this.gameState.currentCoins}`);

            if (this.onCoinsUpdated) {
                this.onCoinsUpdated(this.gameState.currentCoins);
            }
        }


    applyPifeBonus(bonus) {
        const { livesRestored, coins } = bonus;
        const maxLives = 3;

        // Ganha Moedas
        this.addCoins(coins);

        //Restaura Vida (limitada a maxLives)
        let newLives = this.gameState.currentLives + livesRestored;
        newLives = Math.min(newLives, maxLives);

        if (newLives > this.gameState.currentLives) {
            this.gameState.currentLives = newLives;

            // Atualiza a imagem do coração 
            const newLifeKey = `heart_${this.gameState.currentLives}`;

            if (this.scene.lifeSprite) {
                this.scene.lifeSprite.setTexture(newLifeKey);
                // cura do coração
                this.scene.tweens.add({
                    targets: this.scene.lifeSprite,
                    scale: 1.2,
                    duration: 200,
                    yoyo: true,
                    ease: 'Bounce.easeOut',
                    onComplete: () => {
                        this.scene.lifeSprite.setScale(0.8); 
                    }
                });
            }
        }
    }


    animatePifeSuccess(sprites) {
        // Animação de sucesso 
        sprites.forEach((sprite) => {
            this.scene.tweens.add({
                targets: sprite,
                y: sprite.y - 100, // Sobem
                angle: 360,      // Giram
                scale: 1.5,
                alpha: 0,
                duration: 600,
                ease: 'Sine.easeIn',
                onComplete: () => {
                    sprite.destroy(); 
                }
            });
        });
    }


checkAndApplyPife(selectedCardsData, selectedSprites) {
        const bonus = checkPifeCombination(selectedCardsData);

        if (bonus) {
            console.log("PIFE VÁLIDO!", bonus);
            
            
            this.scene.input.enabled = false;

            this.scene.tweens.add({
                targets: selectedSprites,
                y: '-=100',        // Sobe as cartas
                scale: 1.5,        // Aumenta o tamanho
                alpha: 0,          // Desaparece gradualmente
                angle: 360,        // Gira
                duration: 600,     
                ease: 'Back.easeIn',
                onComplete: () => {
                    // Restaura input
                    this.scene.input.enabled = true;

                    // Aplica moedas e vidas
                    this.applyPifeBonus(bonus);

                    if (this.onPifeSuccess) {
                        this.onPifeSuccess(selectedCardsData);
                    }
                }
            });
            
            
            selectedSprites.forEach(s => s.setTint(0xFFD700)); 

        } else {
            console.log("Combinação Inválida");
            
            // Animação de erro 
            this.scene.tweens.add({
                targets: selectedSprites,
                x: '+=10',
                yoyo: true,
                repeat: 3,
                duration: 50,
                onComplete: () => {
                
                    selectedSprites.forEach(s => {
                        s.setTint(0xFFFFFF);
                        this.scene.tweens.add({ targets: s, y: s.input.hitArea.centerY ? this.scene.scale.height - 180 : s.y, duration: 200 });
                    });
                }
            });
        
        }
    }

    decreaseLife() {
        this.gameState.currentLives -= 1;

        const newLifeKey = `heart_${this.gameState.currentLives}`;
        
        if (this.scene.lifeSprite) {
            
     
            if (this.gameState.currentLives >= 0) {
                this.scene.lifeSprite.setTexture(newLifeKey);
            }
            
            // Animação de dano
            this.scene.tweens.add({
                targets: this.scene.lifeSprite,
                scale: 0.9,
                duration: 150,
                yoyo: true,
                ease: 'Sine.easeIn',
                onComplete: () => {
                
                    this.scene.lifeSprite.setScale(0.8); 
                }
            });
        }

    
        if (this.gameState.currentLives < 0) {
            this.handleGameOver();
            return true; // Jogo acabou
        }
        return false; // Jogo continua
    }

  
    drawCard(deck, onCardDrawn) {
        if (gameState.currentDrawnCard) return;

        const card = drawFromDeck(deck);
        if (!card) return;

        const pointer = this.scene.input.activePointer;

        // cria carta com o verso
        this.drawnSprite = this.scene.add.image(pointer.x, pointer.y, "card_back_3")
            .setScale(1.3);

        // flip para mostrar a face
        applyCardFlip(this.scene, this.drawnSprite, card.asset);

        // seguir o mouse
        this.scene.input.on("pointermove", p => {
            if (this.drawnSprite) {
                this.drawnSprite.x = p.x;
                this.drawnSprite.y = p.y;
            }
        });

        if (onCardDrawn) onCardDrawn();
    }


    replaceCardInHand(playerHand, index, sprite, discardSprite, handScale, onComplete) {
        if (!gameState.currentDrawnCard) return;

        //  Diminui a vida ao substituir carta.
        if (this.decreaseLife()) {
            this.clearDrawnCard();
            return;
        }

        const newCard = gameState.currentDrawnCard;
        const oldCard = playerHand[index];


        const leftHalf = this.scene.add.image(sprite.x, sprite.y, oldCard.asset)
            .setScale(handScale)
            .setCrop(0, 0, 28, 79)
            .setDepth(301);

        const rightHalf = this.scene.add.image(sprite.x, sprite.y, oldCard.asset)
            .setScale(handScale)
            .setCrop(29, 0, 28, 79)
            .setDepth(301);

        // anima lados se afastando
        this.scene.tweens.add({
            targets: leftHalf,
            x: sprite.x - 40,
            angle: -20,
            duration: 250,
            ease: "Cubic.easeOut"
        });

        this.scene.tweens.add({
            targets: rightHalf,
            x: sprite.x + 40,
            angle: 20,
            duration: 250,
            ease: "Cubic.easeOut"
        });

        // fade out e destruir
        this.scene.tweens.add({
            targets: [leftHalf, rightHalf],
            alpha: 0,
            duration: 200,
            delay: 200,
            onComplete: () => {
                leftHalf.destroy();
                rightHalf.destroy();
            }
        });


        playerHand[index] = newCard;

        discardSprite.setTexture(oldCard.asset);
        discardSprite.setVisible(true);
        discardSprite.setScale(1.2);

        this.scene.tweens.add({
            targets: discardSprite,
            scale: 1.28,
            duration: 120,
            yoyo: true
        });

        this.clearDrawnCard();
        
        if (this.onCardReplaced) this.onCardReplaced();
    }


    discardCard(discardSprite) {
        if (!this.gameState.currentDrawnCard) {
            console.log("Nenhuma carta para descartar. Compre uma do deck primeiro.");
            return;
        }

        if (this.decreaseLife()) {
            this.clearDrawnCard(); 
            return; 
        }

        const card = this.gameState.currentDrawnCard;


        
        discardSprite.setTexture(card.asset);
        discardSprite.setVisible(true);

        this.scene.tweens.add({
            targets: discardSprite,
            scale: 1.28,
            duration: 120,
            yoyo: true
        });

        this.clearDrawnCard();
        
        if (this.onCardReplaced) this.onCardReplaced();
    }

    handleGameOver() {
        console.log("GAME OVER! Sem mais descartes.");

        try {
            if (this.scene.handManager && Array.isArray(this.scene.handManager.handSprites)) {
                this.scene.handManager.handSprites.forEach(s => {
                    try { s.disableInteractive(); } catch (e) { /* ignore */ }
                });
            }
        } catch (e) { /* ignore */ }

        try { this.scene.input.setDefaultCursor('default'); } catch (e) { /* ignore */ }

        const centerX = this.scene.scale.width / 2;
        const centerY = this.scene.scale.height / 2;

        this.scene.add.rectangle(centerX, centerY, 600, 300, 0x000000, 0.7)
            .setDepth(200);

        const msg = this.scene.add.text(centerX, centerY - 36, 'FIM DE JOGO', { 
            fontSize: '48px', 
            fill: '#FF0000', 
            align: 'center' 
        }).setOrigin(0.5).setDepth(201);

        const sub = this.scene.add.text(centerX, centerY + 8, 'Sem mais Vidas', {
            fontSize: '28px',
            fill: '#FFFFFF',
            align: 'center'
        }).setOrigin(0.5).setDepth(201);

        // New Game button
        const btn = this.scene.add.text(centerX, centerY + 80, 'Novo Jogo', {
            fontSize: '24px',
            backgroundColor: '#28a745',
            padding: { x: 12, y: 8 },
            color: '#ffffff',
            fontFamily: 'Arial'
        }).setOrigin(0.5).setDepth(202).setInteractive({ cursor: 'pointer' });

        btn.on('pointerdown', () => {
            // Optional small feedback
            this.scene.tweens.add({ targets: btn, scale: 0.95, duration: 80, yoyo: true });
            try {
                try {
                    if (this.gameState) {
                        this.gameState.currentLives = 3;
                        this.gameState.currentCoins = 0;
                        this.gameState.currentDrawnCard = null;
                    }
                } catch (e) { /* ignore */ }

                this.scene.scene.restart();
            } catch (e) {
                console.error('Failed to restart scene for new game', e);
            }
        });
    }


    clearDrawnCard() {
        discardDrawnCard();

        if (this.drawnSprite) {
            this.drawnSprite.destroy();
            this.drawnSprite = null;
        }
    }
}