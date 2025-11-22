// utils/animations.js

export function applyCardHoverAnimation(scene, sprite, baseY, baseScale) {
  const hoverScale = baseScale * 1.5;
  const hoverOffset = 35;

  sprite.setInteractive({ useHandCursor: true });

  let isHovering = false;

  sprite.on("pointerover", () => {
    // ⛔ se existe carta comprada, NÃO faz hover
    if (scene.gameState?.currentDrawnCard) return;

    if (isHovering) return;
    isHovering = true;

    scene.time.delayedCall(20, () => sprite.setDepth(100));

    scene.tweens.add({
      targets: sprite,
      scale: hoverScale,
      y: baseY - hoverOffset,
      duration: 220,
      ease: "Back.easeOut",
    });
  });

  sprite.on("pointerout", () => {
    // ⛔ se tem carta comprada, garante que a carta fique normal
    if (scene.gameState?.currentDrawnCard) {
      sprite.setScale(baseScale);
      sprite.setY(baseY);
      sprite.setDepth(1);
      isHovering = false;
      return;
    }

    if (!isHovering) return;
    isHovering = false;

    scene.tweens.add({
      targets: sprite,
      scale: baseScale,
      y: baseY,
      duration: 220,
      ease: "Back.easeIn",
      onComplete: () => sprite.setDepth(1),
    });
  });
}


/* ------------------------------------------------------------------
   💳 Flip Animation — vira a carta ao comprar do baralho
   ------------------------------------------------------------------ */

export function applyCardFlip(scene, sprite, newTexture) {
  if (!scene.textures.exists(newTexture)) {
    console.warn("Textura não existe:", newTexture);
    return;
  }

  // shrink
  scene.tweens.add({
    targets: sprite,
    scaleX: 0.01,
    duration: 120,
    ease: "Linear",
    onComplete: () => {

      // troca textura no meio
      sprite.setTexture(newTexture);

      // expand
      scene.tweens.add({
        targets: sprite,
        scaleX: 1.3,
        duration: 120,
        ease: "Linear"
      });
    }
  });
}


export function animateCardCut(scene, sprite, onComplete) {
  const x = sprite.x;
  const y = sprite.y;
  const texture = sprite.texture.key;
  const scale = sprite.scale;

  // Esconde a carta original
  sprite.setVisible(false);

  // Criar lado esquerdo
  const leftHalf = scene.add.image(x, y, texture).setScale(scale);
  leftHalf.setCrop(0, 0, leftHalf.width / 2, leftHalf.height);

  // Criar lado direito
  const rightHalf = scene.add.image(x, y, texture).setScale(scale);
  rightHalf.setCrop(rightHalf.width / 2, 0, rightHalf.width / 2, rightHalf.height);

  // Animação das duas metades
  scene.tweens.add({
    targets: leftHalf,
    x: x - 80,
    y: y - 20,
    angle: -25,
    alpha: 0,
    duration: 300,
    ease: "Quad.easeOut"
  });

  scene.tweens.add({
    targets: rightHalf,
    x: x + 80,
    y: y + 10,
    angle: 35,
    alpha: 0,
    duration: 300,
    ease: "Quad.easeOut",
    onComplete: () => {
      leftHalf.destroy();
      rightHalf.destroy();
      sprite.destroy();
      if (onComplete) onComplete();
    }
  });
}
