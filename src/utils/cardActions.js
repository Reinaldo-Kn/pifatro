// src/utils/cardActions.js

import { drawFromDeck, discardDrawnCard, gameState, checkPifeCombination } from "./gameLogic.js";
import { applyCardFlip } from "./animations.js";

export class CardActions {
    constructor(scene) {
        this.scene = scene;
        this.drawnSprite = null;
        this.gameState = scene.gameState;
        
        // Propriedades que serão preenchidas pelo MainScene
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

    // ============================================================
    // NOVO MÉTODO: Aplica Bônus de Combinação (PIFE)
    // ============================================================
    applyPifeBonus(bonus) {
        const { livesRestored, coins } = bonus;
        const maxLives = 3;

        // 1. Ganha Moedas
        this.addCoins(coins);

        // 2. Restaura Vida (Limitada a maxLives)
        let newLives = this.gameState.currentLives + livesRestored;
        newLives = Math.min(newLives, maxLives);

        if (newLives > this.gameState.currentLives) {
            this.gameState.currentLives = newLives;

            // Atualiza a imagem do coração (a chave é o valor da vida)
            const newLifeKey = `heart_${this.gameState.currentLives}`;

            if (this.scene.lifeSprite) {
                this.scene.lifeSprite.setTexture(newLifeKey);
                // Animação de "cura" no coração
                this.scene.tweens.add({
                    targets: this.scene.lifeSprite,
                    scale: 1.2,
                    duration: 200,
                    yoyo: true,
                    ease: 'Bounce.easeOut',
                    onComplete: () => {
                        this.scene.lifeSprite.setScale(0.8); // Volta para a escala original (0.8 definida no UIManager)
                    }
                });
            }
        }
    }

    // ============================================================
    // NOVO MÉTODO: ANIMAÇÃO DE SUCESSO PIFE (Exemplo)
    // ============================================================
    animatePifeSuccess(sprites) {
        // Animação de sucesso (as cartas sobem, giram e somem)
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
                    sprite.destroy(); // Destruir o sprite após a animação
                }
            });
        });
    }

    // ============================================================
    // NOVO MÉTODO: CHECA E APLICA PIFE (Chamado pelo HandManager)
    // ============================================================
checkAndApplyPife(selectedCardsData, selectedSprites) {
        const bonus = checkPifeCombination(selectedCardsData);

        if (bonus) {
            console.log("PIFE VÁLIDO!", bonus);
            
            // Desativa interação para não bugar durante a animação
            this.scene.input.enabled = false;

            // --- ANIMAÇÃO DE SUCESSO (PIFE) ---
            this.scene.tweens.add({
                targets: selectedSprites,
                y: '-=100',        // Sobe as cartas
                scale: 1.5,        // Aumenta o tamanho
                alpha: 0,          // Desaparece gradualmente
                angle: 360,        // Gira
                duration: 600,     // Duração da animação
                ease: 'Back.easeIn',
                onComplete: () => {
                    // Restaura input
                    this.scene.input.enabled = true;

                    // Aplica bônus (Moedas/Vidas)
                    this.applyPifeBonus(bonus);

                    // Chama o callback na MainScene para remover e comprar novas
                    if (this.onPifeSuccess) {
                        this.onPifeSuccess(selectedCardsData);
                    }
                }
            });
            
            // Efeito visual extra: Tint Dourado (se quiser)
            selectedSprites.forEach(s => s.setTint(0xFFD700)); 

        } else {
            console.log("Combinação Inválida");
            
            // Animação de erro (tremida lateral)
            this.scene.tweens.add({
                targets: selectedSprites,
                x: '+=10',
                yoyo: true,
                repeat: 3,
                duration: 50,
                onComplete: () => {
                    // Retorna as cartas para posição original e remove tint
                    selectedSprites.forEach(s => {
                        s.setTint(0xFFFFFF);
                        this.scene.tweens.add({ targets: s, y: s.input.hitArea.centerY ? this.scene.scale.height - 180 : s.y, duration: 200 });
                    });
                }
            });
            // Limpa a seleção visual no HandManager (será tratado lá se necessário, 
            // mas o ideal é o HandManager limpar se a gente retornar false aqui, 
            // mas como estamos lidando com animação assíncrona, deixamos o visual tratar)
        }
    }
    // ============================================================
    // NOVO MÉTODO: Diminui a Vida e Checa Fim de Jogo
    // ============================================================
    decreaseLife() {
        this.gameState.currentLives -= 1;

        const newLifeKey = `heart_${this.gameState.currentLives}`;
        
        if (this.scene.lifeSprite) {
            
            // 🛑 CORRIGIDO: Só atualiza a textura se a vida for >= 0.
            if (this.gameState.currentLives >= 0) {
                this.scene.lifeSprite.setTexture(newLifeKey);
            }
            
            // Animação de dano/perda de vida no coração
            this.scene.tweens.add({
                targets: this.scene.lifeSprite,
                scale: 0.9,
                duration: 150,
                yoyo: true,
                ease: 'Sine.easeIn',
                onComplete: () => {
                    // Volta para a escala original (0.8 definida no UIManager)
                    this.scene.lifeSprite.setScale(0.8); 
                }
            });
        }

        // Checagem de Fim de Jogo
        if (this.gameState.currentLives < 0) {
            this.handleGameOver();
            return true; // Jogo acabou
        }
        return false; // Jogo continua
    }

    // ============================================================
    // COMPRA CARTA DO DECK
    // ============================================================
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

    // ============================================================
    // SUBSTITUI CARTA NA MÃO (Com Perda de Vida)
    // ============================================================
    replaceCardInHand(playerHand, index, sprite, discardSprite, handScale, onComplete) {
        if (!gameState.currentDrawnCard) return;

        // 🛑 Diminui a vida ao substituir carta.
        if (this.decreaseLife()) {
            // Se o jogo acabou (vidas < 0), limpamos a carta e interrompemos a troca
            this.clearDrawnCard();
            return;
        }

        const newCard = gameState.currentDrawnCard;
        const oldCard = playerHand[index];

        // ============================================
        // ANIMAÇÃO "CORTANDO AO MEIO"
        // ============================================
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

        // ============================================
        // APLICAR NOVA CARTA
        // ============================================
        playerHand[index] = newCard;

        // ============================================
        // MOSTRAR NO DESCARTE
        // ============================================
        discardSprite.setTexture(oldCard.asset);
        discardSprite.setVisible(true);
        discardSprite.setScale(1.2);

        this.scene.tweens.add({
            targets: discardSprite,
            scale: 1.28,
            duration: 120,
            yoyo: true
        });

        // ============================================
        // LIMPAR ESTADO
        // ============================================
        this.clearDrawnCard();
        
        // 🛑 CORREÇÃO/ADAPTAÇÃO: Chama o callback do MainScene para reativar o modo Pife
        if (this.onCardReplaced) this.onCardReplaced();
    }

    // ============================================================
    // DESCARTA CARTA NO SLOT VERMELHO (Com Perda de Vida)
    // ============================================================
    discardCard(discardSprite) {
        // 1. Checa se há carta para descarte
        if (!this.gameState.currentDrawnCard) {
            console.log("Nenhuma carta para descartar. Compre uma do deck primeiro.");
            return;
        }

        // 🛑 Diminui a vida ao descartar carta diretamente.
        if (this.decreaseLife()) {
            this.clearDrawnCard(); 
            return; 
        }

        const card = this.gameState.currentDrawnCard;

        // ============================================
        // LÓGICA DE DESCARTE VISUAL (MANTIDA)
        // ============================================
        
        // Configura a carta comprada (currentDrawnCard) para ser o descarte visível
        discardSprite.setTexture(card.asset);
        discardSprite.setVisible(true);

        // Animação de "pop" do descarte
        this.scene.tweens.add({
            targets: discardSprite,
            scale: 1.28,
            duration: 120,
            yoyo: true
        });

        // Finaliza o descarte da carta arrastada
        this.clearDrawnCard();
        
        // 🛑 NOVO: Retorna ao modo de seleção Pife após o descarte, pois o turno termina
        if (this.onCardReplaced) this.onCardReplaced();
    }

    // ============================================================
    // LÓGICA DE FIM DE JOGO
    // ============================================================
    handleGameOver() {
        console.log("GAME OVER! Sem mais descartes.");

        // Desabilita todas as interações da cena para parar o jogo
        this.scene.input.enabled = false; 

        // Cria uma tela de Fim de Jogo (exemplo simples)
        const centerX = this.scene.scale.width / 2;
        const centerY = this.scene.scale.height / 2;

        this.scene.add.rectangle(centerX, centerY, 600, 300, 0x000000, 0.7)
            .setDepth(200);

        this.scene.add.text(centerX, centerY, 'FIM DE JOGO\nSem mais Vidas', { 
            fontSize: '48px', 
            fill: '#FF0000', 
            align: 'center' 
        }).setOrigin(0.5).setDepth(201);
    }


    // ============================================================
    // LIMPA CARTA COMPRADA
    // ============================================================
    clearDrawnCard() {
        discardDrawnCard();

        if (this.drawnSprite) {
            this.drawnSprite.destroy();
            this.drawnSprite = null;
        }
    }
}