// src/utils/handManager.js

import { swapHandCards } from "./gameLogic.js";
import { applyCardHoverAnimation } from "./animations.js";
export class HandManager {
    constructor(scene) {
        this.scene = scene;
        this.handSprites = [];
        this.draggedCardIndex = null;
        this.draggedSprite = null;
        this.originalDragPos = null;
        this.handStartX = 0; 
        this.handSpacing = 0;
        this.handScale = 0;
        this.handY = 0;
        this.selectedSprites = []; 
    }

    render(playerHand) {
        this.handSprites.forEach(s => s.destroy());
        this.handSprites = [];
        this.selectedSprites = [];

        const spacing = 120;
        const scale = 1.2;
        const y = this.scene.scale.height - 180;

        const totalWidth = (playerHand.length - 1) * spacing;
        const startX = this.scene.scale.width / 2 - totalWidth / 2;

        this.handStartX = startX;
        this.handSpacing = spacing;
        this.handScale = scale;
        this.handY = y;

        playerHand.forEach((card, i) => {
            const sprite = this.scene.add.image(startX + i * spacing, y, card.asset)
                .setScale(scale)
                .setInteractive({ draggable: true, cursor: "grab" });

            applyCardHoverAnimation(this.scene, sprite, y, scale);
            
            sprite.lastClickTime = 0;

            this.handSprites.push(sprite);
        });
        
        this.refreshCardDragListeners(playerHand); 
    }

    refreshCardDragListeners(playerHand) {
        this.handSprites.forEach((sprite, i) => {
            this.setupCardDrag(sprite, i, playerHand);
        });
    }

    setupCardDrag(sprite, cardIndex, playerHand) {
        sprite.off("dragstart");
        sprite.off("drag");
        sprite.off("dragend");

        sprite.on("dragstart", (pointer) => {
            if (this.scene.gameState.currentDrawnCard) return;

            // Se começou a arrastar, limpa qualquer seleção visual pendente
            this.selectedSprites.forEach(s => {
                s.setTint(0xFFFFFF);
                this.scene.tweens.add({ targets: s, y: this.handY, duration: 150 });
            });
            this.selectedSprites = [];

            this.draggedCardIndex = cardIndex; 
            this.draggedSprite = sprite;
            this.originalDragPos = { x: sprite.x, y: sprite.y };

            sprite.setDepth(100);
            sprite.setScale(this.handScale * 1.15);
            this.scene.input.setDefaultCursor("grabbing");
        });

        sprite.on("drag", (pointer, dragX, dragY) => {
            if (!this.draggedSprite) return;
            sprite.x = dragX;
            sprite.y = dragY;
        });

        sprite.on("dragend", (pointer) => {
            if (!this.draggedSprite) return;

            const targetIndex = this.getClosestCardIndex(pointer.x);

            if (targetIndex !== null && targetIndex !== this.draggedCardIndex) {
                this.animateSwap(this.draggedCardIndex, targetIndex, playerHand);
            } else {
                this.scene.tweens.add({
                    targets: sprite,
                    x: this.originalDragPos.x,
                    y: this.originalDragPos.y,
                    scale: this.handScale,
                    duration: 200,
                    ease: "Back.easeOut"
                });
            }

            if (targetIndex === null || targetIndex === this.draggedCardIndex) {
                sprite.setScale(this.handScale);
            }

            sprite.setDepth(0);
            this.draggedCardIndex = null;
            this.draggedSprite = null;
            this.originalDragPos = null;
            this.scene.input.setDefaultCursor("default");
            
            this.enablePifeSelection(playerHand);
        });
    }

    getClosestCardIndex(pointerX) {
        let closestIndex = null;
        let minDistance = Infinity;

        this.handSprites.forEach((sprite, i) => {
            const expectedX = this.handStartX + i * this.handSpacing;
            const distance = Math.abs(pointerX - expectedX);

            if (distance < minDistance) {
                minDistance = distance;
                closestIndex = i;
            }
        });

        return minDistance < 60 ? closestIndex : null;
    }

    animateReposition(playerHand) {
        this.handSprites.forEach((sprite, i) => {
            const targetX = this.handStartX + i * this.handSpacing;
            const card = playerHand[i];
            
            this.scene.tweens.add({
                targets: sprite,
                x: targetX,
                y: this.handY,
                scale: this.handScale,
                duration: 300,
                ease: "Back.easeOut",
                onComplete: () => {
                    sprite.setTexture(card.asset);
                }
            });
        });
    }

    animateSwap(indexA, indexB, playerHand) {
        const spriteA = this.handSprites[indexA]; 
        const spriteB = this.handSprites[indexB]; 

        const targetXA = this.handStartX + indexB * this.handSpacing;
        const targetXB = this.handStartX + indexA * this.handSpacing;

        swapHandCards(playerHand, indexA, indexB);
        this.handSprites[indexA] = spriteB;
        this.handSprites[indexB] = spriteA;

        this.scene.tweens.add({
            targets: spriteA,
            x: targetXA,
            y: this.handY,
            scale: this.handScale,
            angle: 0,
            duration: 350,
            ease: "Back.easeOut",
            onComplete: () => {
                this.refreshCardDragListeners(playerHand);
            }
        });

        this.scene.tweens.add({
            targets: spriteB,
            y: this.handY - 30, 
            scale: this.handScale * 1.05,
            duration: 150,
            ease: "Cubic.easeOut",
            onComplete: () => {
                this.scene.tweens.add({
                    targets: spriteB,
                    x: targetXB,
                    y: this.handY,
                    scale: this.handScale,
                    duration: 250,
                    ease: "Back.easeOut"
                });
            }
        });
    }

    enableClickToReplace(playerHand, onCardReplaced) {
        this.selectedSprites.forEach(s => s.setTint(0xFFFFFF));
        this.selectedSprites = [];

        this.handSprites.forEach((sprite, index) => {
            sprite.removeAllListeners(); 
            sprite.setInteractive({ cursor: "pointer" });
            
            sprite.on("pointerdown", () => {
                onCardReplaced(index, sprite);
            });
        });
    }
    

enablePifeSelection(playerHand) {
        this.handSprites.forEach((sprite, index) => {
            // Remove listeners antigos para limpar a memória e evitar conflitos
            sprite.removeAllListeners("pointerdown");
            sprite.removeAllListeners("pointerover");
            sprite.removeAllListeners("pointerout");
            
            sprite.setInteractive({ cursor: "pointer" });

            // --- 1. EVENTO DE CLIQUE (SELEÇÃO) ---
            sprite.on("pointerdown", () => {
                if (this.scene.gameState.currentDrawnCard) return; // Bloqueia se estiver trocando carta

                const indexInSelected = this.selectedSprites.indexOf(sprite);
                
                // A. Se já está selecionada -> Desseleciona
                if (indexInSelected > -1) {
                    this.selectedSprites.splice(indexInSelected, 1);
                    
                    this.scene.tweens.add({ 
                        targets: sprite, 
                        y: this.handY, // Volta para baixo
                        duration: 150 
                    });
                    sprite.setTint(0xFFFFFF);
                } 
                else {
                    if (this.selectedSprites.length < 3) {
                        this.selectedSprites.push(sprite);
                        
                        this.scene.tweens.add({ 
                            targets: sprite, 
                            y: this.handY - 30, // Sobe
                            duration: 150 
                        });
                        sprite.setTint(0xDDDDDD); // Leve destaque visual
                    }
                }

                // C. Checa se completou 3 cartas para Pife
                if (this.selectedSprites.length === 3) {
                    const selectedCardData = this.selectedSprites.map(s => {
                        const originalIndex = this.handSprites.indexOf(s);
                        return playerHand[originalIndex];
                    });

                    this.scene.cardActions.checkAndApplyPife(selectedCardData, this.selectedSprites);

                    // Se não consumiu as cartas (falha no pife), limpa a seleção visual
                    if (this.selectedSprites.length === 3) { 
                        this.selectedSprites.forEach(s => {
                            if(s.scene) {
                                this.scene.tweens.add({ targets: s, y: this.handY, duration: 150 });
                                s.setTint(0xFFFFFF);
                            }
                        });
                        this.selectedSprites = [];
                    }
                }
            });

            sprite.on("pointerover", () => {
                this.scene.tweens.add({
                    targets: sprite,
                    scale: this.handScale * 1.1, // Aumenta 10%
                    duration: 100
                });
                sprite.setDepth(100); 
            });

            sprite.on("pointerout", () => {
                // Verifica se esta carta específica está selecionada
                const isSelected = this.selectedSprites.includes(sprite);
                
                // Se selecionada, o Y base é -30. Se não, é o Y normal.
                const targetY = isSelected ? (this.handY - 30) : this.handY;

                this.scene.tweens.add({
                    targets: sprite,
                    scale: this.handScale, 
                    y: targetY,            
                    duration: 100
                });
                
                sprite.setDepth(0);
            });
        });
        
        // Reativa o Drag and Drop
        this.refreshCardDragListeners(playerHand);
    }
    animateCardsEntry(newCardsCount) {
        const totalCards = this.handSprites.length;
        const newSprites = this.handSprites.slice(totalCards - newCardsCount);

        const deckX = this.scene.cameras.main.centerX;
        const deckY = this.scene.cameras.main.centerY - 20;

        newSprites.forEach((sprite, index) => {
            const finalX = sprite.x;
            const finalY = sprite.y;

            sprite.setPosition(deckX, deckY);
            sprite.setScale(0); // Começa pequena
            sprite.setVisible(true);

            this.scene.tweens.add({
                targets: sprite,
                x: finalX,
                y: finalY,
                scale: this.handScale, 
                angle: 360, 
                duration: 500,
                delay: index * 100, 
                ease: 'Power2',
                onComplete: () => {
                }
            });
        });
    }
}