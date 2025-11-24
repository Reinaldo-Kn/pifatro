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
    // clamp initialLives between 0 and 3 to avoid missing texture keys
    const clamped = Math.max(0, Math.min(3, Number(initialLives) || 0));
    const lifeSprite = this.scene.add.image(x, y, `heart_${clamped}`)
      .setScale(0.8) 
      .setDepth(10); 

    return lifeSprite;
  }

  // ============================================================
  // CRIA BOTAO DE SAVE (canto superior direito)
  // onClick: função chamada quando clicar no botão
  // ============================================================
  createSaveButton(onClick) {
    const padding = 16;
    const btnSize = 44;
    const x = this.scene.scale.width - padding - btnSize / 2;
    const y = padding + btnSize / 2;

    // background circle
    const bg = this.scene.add.circle(x, y, btnSize / 2, 0x222222, 0.9).setDepth(20);

    // icon text (using floppy disk emoji as icon fallback)
    const icon = this.scene.add.text(x, y, '💾', { fontSize: '20px' }).setOrigin(0.5).setDepth(21);

    const container = this.scene.add.container(0, 0, [bg, icon]).setSize(btnSize, btnSize).setDepth(20);

    // make the background circle interactive (avoid referencing Phaser global in module scope)
    bg.setInteractive({ cursor: 'pointer' });
    bg.on('pointerdown', () => {
      // small press animation
      this.scene.tweens.add({ targets: [bg, icon], scale: 0.92, duration: 80, yoyo: true });
      if (onClick) onClick();
    });

    // store reference in case we need to update position on resize
    this.saveButton = container;
    return container;
  }

  // ============================================================
  // EXIBE UMA MENSAGEM DE FEEDBACK DE SALVAMENTO
  // ============================================================
  showSaveFeedback(message = 'Saved', success = true, duration = 1400) {
    const x = this.scene.scale.width - 120;
    const y = 72;

    const color = success ? '#7CFC00' : '#FF6347';

    if (this._saveFeedbackText) this._saveFeedbackText.destroy();

    this._saveFeedbackText = this.scene.add.text(x, y, message, {
      fontSize: '18px',
      fontFamily: 'Arial',
      fill: color,
      stroke: '#000000',
      strokeThickness: 2,
    }).setOrigin(0.5).setDepth(30);

    this._saveFeedbackText.alpha = 0;
    this.scene.tweens.add({ targets: this._saveFeedbackText, alpha: 1, duration: 180 });
    this.scene.time.delayedCall(duration, () => {
      this.scene.tweens.add({ targets: this._saveFeedbackText, alpha: 0, duration: 300, onComplete: () => { this._saveFeedbackText.destroy(); this._saveFeedbackText = null; } });
    });
  }

  // ============================================================
  // EXIBE UM PAINEL DE DEBUG (texto longo) ÚTIL PARA ERROS DE REDE
  // ============================================================
  showDebugPanel(text) {
    // limpa painel antigo
    if (this._debugPanel) this._debugPanel.destroy();

    const w = Math.min(760, this.scene.scale.width - 40);
    const h = Math.min(320, this.scene.scale.height / 3);
    const x = this.scene.scale.width / 2 - w / 2;
    const y = this.scene.scale.height - h - 20;

    const bg = this.scene.add.rectangle(x + w/2, y + h/2, w, h, 0x000000, 0.85).setDepth(1000);
    const txt = this.scene.add.text(x + 12, y + 12, text, { fontSize: '12px', fontFamily: 'monospace', color: '#ddd', wordWrap: { width: w - 24 } }).setDepth(1001);

    const close = this.scene.add.text(x + w - 18, y + 8, '×', { fontSize: '20px', color: '#fff' }).setDepth(1002).setInteractive({ cursor: 'pointer' });
    close.on('pointerdown', () => {
      if (this._debugPanel) {
        this._debugPanel.forEach(o => o.destroy());
        this._debugPanel = null;
      }
    });

    this._debugPanel = [bg, txt, close];
  }
}