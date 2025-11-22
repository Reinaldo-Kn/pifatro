// src/utils/uiManager.js

export class UIManager {
  constructor(scene) {
    this.scene = scene;
    this.baseLifeKey = 'heart_3';
    this.coinText = null; // Referência para atualizar o texto depois
  }

  // ============================================================
  // CRIA MONTE DE COMPRA CENTRAL
  // ============================================================
  createDrawPile(onClick) {
    const deckX = this.scene.cameras.main.centerX;
    const deckY = this.scene.cameras.main.centerY - 20;

    this.drawPile = this.scene.add.image(deckX, deckY, "card_back_3")
      .setScale(1.2)
      .setInteractive({ cursor: "pointer" });

    this.drawPile.on("pointerdown", onClick);

    return this.drawPile;
  }

  // ============================================================
  // CRIA PLACEHOLDERS SUPERIORES
  // ============================================================
  createPlaceholders(playerHandLength) {
    const scale = 1.2;
    const cardWidth = 57 * scale;
    const cardHeight = 79 * scale;
    const spacing = 120;
    const startX = this.scene.scale.width / 2 - ((playerHandLength - 1) * spacing) / 2;
    const topY = 120;

    this.placeholders = [];

    // três slots brancos
    for (let i = 0; i < 3; i++) {
      const slot = this.scene.add.image(
        startX + i * spacing,
        topY,
        "jokerSlot"
      ).setDisplaySize(cardWidth, cardHeight);

      this.placeholders.push(slot);
    }

    // slot vermelho (descarte)
    const lastCardX = startX + (playerHandLength - 1) * spacing;

    this.discardSlot = this.scene.add.image(
      lastCardX,
      topY,
      "discardSlotImage"
    ).setDisplaySize(cardWidth, cardHeight);

    return { placeholders: this.placeholders, discardSlot: this.discardSlot };
  }

  // ============================================================
  // CRIA DISPLAY DE MOEDAS (ABAIXO DO PRIMEIRO SLOT)
  // ============================================================
  createCoinDisplay(initialCoins) {
    // Segurança: só cria se os slots já existirem
    if (!this.placeholders || this.placeholders.length === 0) return;

    // Pega a posição do primeiro slot (o mais a esquerda, índice 0)
    const targetSlot = this.placeholders[0];
    
    // Define a posição um pouco abaixo do slot
    const paddingY = 75; // Distância para baixo
    const x = targetSlot.x;
    const y = targetSlot.y + paddingY;

    // 1. Ícone da Gema
    this.scene.add.image(x - 25, y, "coin_icon")
        .setScale(0.5) // Ajuste o tamanho da gema aqui
        .setDepth(10);

    // 2. Texto do Valor (Dourado)
    this.coinText = this.scene.add.text(x + 5, y, `${initialCoins}`, {
        fontSize: '24px',
        fontFamily: 'Arial', // Ou a fonte do seu jogo
        fontStyle: 'bold',
        fill: '#FFD700',     // <-- Cor GOLD (Dourado)
        stroke: '#000000',   // Borda preta para dar contraste
        strokeThickness: 2
    }).setOrigin(0, 0.5).setDepth(10); // Alinhado à esquerda verticalmente centralizado
  }

  // ============================================================
  // ATUALIZA O VALOR DAS MOEDAS
  // ============================================================
  updateCoins(amount) {
      if (this.coinText) {
          this.coinText.setText(`${amount}`);
          
          // Efeito visual simples de "pulse" quando ganha moedas
          this.scene.tweens.add({
              targets: this.coinText,
              scale: 1.2,
              duration: 100,
              yoyo: true
          });
      }
  }

  // ============================================================
  // CRIA SPRITE DO DESCARTE
  // ============================================================
  createDiscardSprite(discardSlot) {
    this.discardSprite = this.scene.add.image(
      discardSlot.x,
      discardSlot.y,
      "card_back_1"
    )
      .setScale(1.2)
      .setVisible(false);

    return this.discardSprite;
  }

  // ============================================================
  // CRIA BARRA DE VIDA
  createLifeBar(initialLives) {
    const x = this.scene.scale.width / 2;
    const y = 80; 

    const lifeSprite = this.scene.add.image(x, y, `heart_${initialLives}`)
      .setScale(0.8) 
      .setDepth(10); 
      
    return lifeSprite;
  }
}