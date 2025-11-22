import Phaser from "phaser";
import MainScene from "./scenes/MainScene.js";

const config = {
  type: Phaser.AUTO,
  backgroundColor: "#1a1a1a",
    scale: {
    mode: Phaser.Scale.RESIZE,  
    width: "100%",              
    height: "100%",              
  },
  scene: [MainScene],
};

new Phaser.Game(config);
