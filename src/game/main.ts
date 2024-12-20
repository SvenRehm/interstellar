import { Boot } from './scenes/Boot'
import { GameOver } from './scenes/GameOver'
import { Game as MainGame } from './scenes/Game'
import { MainMenu } from './scenes/MainMenu'
import { AUTO, Game } from 'phaser'
import { Preloader } from './scenes/Preloader'
import SignalR from './SignalR'
import WebSocketManager from './WebSocketManager'
import { GamePrep } from './scenes/GamePrep'

//  Find out more information about the Game Config at:
//  https://newdocs.phaser.io/docs/3.70.0/Phaser.Types.Core.GameConfig
const config: Phaser.Types.Core.GameConfig = {
  type: AUTO,
  width: 1024,
  height: 768,
  parent: 'game-container',
  backgroundColor: '#028af8',
  scene: [Boot, Preloader, MainGame, MainMenu, GameOver, GamePrep]
}

const StartGame = (parent: string) => {
  return new Game({ ...config, parent })
}
// SignalR.connect(' https://localhost:7087/hub')
// SignalR.connect('http://localhost:5021/hub')
// WebSocketManager.connect('ws://localhost:3000')

export default StartGame
