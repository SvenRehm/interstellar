import { EventBus } from '../EventBus'
import { Scene, Sound } from 'phaser'
import WebSocketManager from '../WebSocketManager'
import SignalR from '../SignalR'

enum TileStatus {
  Free,
  NotFree
}

type Tile = {
  ship: number
  status: 1 | 2 | 3
}

export class Game extends Scene {
  camera: Phaser.Cameras.Scene2D.Camera
  background: Phaser.GameObjects.Image
  gameText: Phaser.GameObjects.Text
  playerBoard: any
  opponentBoard: any
  // socket: WebSocket | null
  gridSize = 10
  cellSize = 40
  connection: any
  myboard: any
  enemyboard: any
  playerTurn: number = 1
  turnText: any

  constructor(sock: any) {
    super('Game')
  }

  // async getStats(connectionId) {
  //   const url = `http://localhost:5021/api/Session/GetOwnStats`
  //   try {
  //     const response = await fetch(url, {
  //       method: 'POST',
  //       body: connectionId
  //     })
  //     if (!response.ok) {
  //       throw new Error(`Response status: ${response.status}`)
  //     }
  //     return response
  //   } catch (error) {
  //     console.error(error)
  //   }
  // }
  create() {
    //@ts-ignore
    this.myboard = JSON.parse(JSON.stringify(window.gamestate.fields))
    this.enemyboard = Array(this.gridSize)
      .fill(null)
      .map(() => Array(this.gridSize).fill({ shipid: 0, fieldstatus: 0 }))

    this.turnText = this.add.text(100, 20, 'Player ' + this.playerTurn + ' turn', {
      fontFamily: 'Arial Black',
      fontSize: 30,
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 1,
      align: 'center'
    })

    this.camera = this.cameras.main

    this.connection = SignalR.getConnection()

    this.connection.on('Fired', (data) => {
      const status = data.fieldStatus
      const nextturn = data.gameState
      const gridSize = this.gridSize
      const cellSize = this.cellSize
      const x = 100
      const y = 200
      this.turnText.setText(`Player ${nextturn} turn`)

      // console.log(nextturn, status, 'turn, status')
      // console.log(this.playerTurn, 'playerturn')
      // console.log(data.x, data.y, 'row,col')

      if (window.gamestate.isPlayerOne && nextturn != 1) {
        console.log('player 1 shot dont update the board')
        this.playerTurn = nextturn

        const ex = this.cameras.main.width - 400
        const ey = 200
        this.enemyboard[data.x][data.y].fieldstatus = status
        if (this.enemyboard[data.x][data.y].fieldstatus === 2) {
          const shipPart = this.add
            .rectangle(
              ex + data.y * cellSize + cellSize / 2,
              ey + data.x * cellSize + cellSize / 2,
              cellSize - 1,
              cellSize - 1,
              0xe81e5b
            )

            .setAlpha(1)
          this.opponentBoard.group.add(shipPart)
          // boardGroup.add(shipPart) // Add to the board group for red tiles
        }

        if (this.enemyboard[data.x][data.y].fieldstatus === 3) {
          const shipPart = this.add
            .rectangle(
              ex + data.y * cellSize + cellSize / 2,
              ey + data.x * cellSize + cellSize / 2,
              cellSize - 1,
              cellSize - 1,
              0x505494
            )

            .setAlpha(1)
          this.opponentBoard.group.add(shipPart)
          // boardGroup.add(shipPart) // Add to the board group for red tiles
        }
        return
      }

      if (window.gamestate.isPlayerTwo && nextturn != 2) {
        console.log('player 2 shot dont update the board')
        this.playerTurn = nextturn
        const ex = this.cameras.main.width - 400
        const ey = 200
        this.enemyboard[data.x][data.y].fieldstatus = status
        if (this.enemyboard[data.x][data.y].fieldstatus === 2) {
          const shipPart = this.add
            .rectangle(
              ex + data.y * cellSize + cellSize / 2,
              ey + data.x * cellSize + cellSize / 2,
              cellSize - 1,
              cellSize - 1,
              0xe81e5b
            )

            .setAlpha(1)
          this.enemyboard.group.add(shipPart)
        }

        if (this.enemyboard[data.x][data.y].fieldstatus === 3) {
          const shipPart = this.add
            .rectangle(
              ex + data.y * cellSize + cellSize / 2,
              ey + data.x * cellSize + cellSize / 2,
              cellSize - 1,
              cellSize - 1,
              0x505494
            )

            .setAlpha(1)
          this.opponentBoard.group.add(shipPart)
          // boardGroup.add(shipPart) // Add to the board group for red tiles
        }
        return
      }

      this.myboard[data.x][data.y].fieldstatus = status

      for (let row = 0; row < gridSize; row++) {
        for (let col = 0; col < gridSize; col++) {
          if (this.myboard[row][col].fieldstatus === 2) {
            const shipPart = this.add
              .rectangle(
                x + col * cellSize + cellSize / 2,
                y + row * cellSize + cellSize / 2,
                cellSize - 1,
                cellSize - 1,
                0xcc392f
              )

              .setAlpha(1)
            this.playerBoard.group.add(shipPart)
          }

          if (this.myboard[row][col].fieldstatus === 3) {
            const shipPart = this.add
              .rectangle(
                x + col * cellSize + cellSize / 2,
                y + row * cellSize + cellSize / 2,
                cellSize - 1,
                cellSize - 1,
                0x505494 // Red color for ship parts
              )

              .setAlpha(1)
            this.playerBoard.group.add(shipPart)
          }
          // boardGroup.add(shipPart) // Add to the board group for red tiles
        }
      }

      this.playerTurn = nextturn
      // console.log(this.myboard)
      // console.log(data)
    })

    this.createUI()

    this.camera.setBackgroundColor(0x140b2e)
    EventBus.emit('current-scene-ready', this)
  }

  createGameBoards() {
    let playerText
    //@ts-ignore
    if (window.gamestate.isPlayerOne == true) {
      playerText = 'Player 1'
    } else {
      playerText = 'Player 2'
    }
    this.playerBoard = this.createBoard2(100, 200, playerText + '(You)', true)
    this.opponentBoard = this.createBoard2(this.cameras.main.width - 400, 200, 'Opponent', false)
  }

  createBoard2(x: number, y: number, label: string, isPlayerBoard: boolean) {
    const boardGroup = this.add.group()
    const cellSize = this.cellSize
    const gridSize = this.gridSize

    // Board background
    const boardBackground = this.add.rectangle(
      x + (gridSize * cellSize) / 2,
      y + (gridSize * cellSize) / 2,
      gridSize * cellSize,
      gridSize * cellSize,
      0x333333
    )

    boardGroup.add(boardBackground)

    // Board label
    this.add
      .text(x + (gridSize * cellSize) / 2, y - 30, label, {
        fontSize: '18px',
        fill: '#ffffff'
      })
      .setOrigin(0.5)

    // Create 10x10 grid
    const tiles = []

    for (let row = 0; row < gridSize; row++) {
      tiles[row] = []
      for (let col = 0; col < gridSize; col++) {
        const tile = this.add.rectangle(
          x + col * cellSize + cellSize / 2,
          y + row * cellSize + cellSize / 2,
          cellSize - 1,
          cellSize - 1,
          0x140b2e
        )

        // this.add.line(0, 0, x, 0, x, cols * this.GRID_SIZE, 0x5b40ae).setOrigin(0, 0)
        tile.setStrokeStyle(0.4, 0x5b40ae)

        if (this.myboard[row][col].fieldstatus === 1 && isPlayerBoard) {
          const shipPart = this.add
            .rectangle(
              x + col * cellSize + cellSize / 2,
              y + row * cellSize + cellSize / 2,
              cellSize - 1,
              cellSize - 1,
              0x3d89d4 // shipcolor
            )
            .setAlpha(1)
          boardGroup.add(shipPart)
        }

        // Only add interactivity to opponent board
        if (!isPlayerBoard) {
          tile.setInteractive()
          tile.on('pointerdown', () => this.handleTileClick(row, col, tile))
        }

        tiles[row][col] = tile
        boardGroup.add(tile)
      }
    }

    return {
      group: boardGroup,
      tiles: tiles
    }
  }

  createBoard(x: number, y: number, label: string, isPlayerBoard: boolean) {
    const boardGroup = this.add.group()
    const cellSize = this.cellSize
    const gridSize = this.gridSize

    // Board background
    const boardBackground = this.add.rectangle(
      x + (gridSize * cellSize) / 2,
      y + (gridSize * cellSize) / 2,
      gridSize * cellSize,
      gridSize * cellSize,
      0x333333
    )

    boardGroup.add(boardBackground)

    // Board label
    this.add
      .text(x + (gridSize * cellSize) / 2, y - 30, label, {
        fontSize: '18px',
        fill: '#ffffff'
      })
      .setOrigin(0.5)

    // Create 10x10 grid
    const tiles = []
    for (let row = 0; row < gridSize; row++) {
      tiles[row] = []
      for (let col = 0; col < gridSize; col++) {
        const tile = this.add.rectangle(
          x + col * cellSize + cellSize / 2,
          y + row * cellSize + cellSize / 2,
          cellSize - 1,
          cellSize - 1,
          0x666666
        )
        tile.setStrokeStyle(1, 0xffffff)

        // Only add interactivity to opponent board
        if (!isPlayerBoard) {
          tile.setInteractive()
          tile.on('pointerdown', () => this.handleTileClick(row, col, tile))
        }

        tiles[row][col] = tile
        boardGroup.add(tile)
      }
    }

    return {
      group: boardGroup,
      tiles: tiles
    }
  }
  async fire(row, col) {
    console.log('fire, row,col,getroomid', SignalR.getRoomId(), row, col)
    const result = this.connection.invoke('Fire', SignalR.getRoomId(), row, col)
    return result
  }

  async handleTileClick(row: number, col: number, tile: string) {
    if (window.gamestate.isPlayerOne && this.playerTurn != 1) {
      console.log('is player one', this.playerTurn)
      return
    }

    if (window.gamestate.isPlayerTwo && this.playerTurn != 2) {
      console.log('is player two', this.playerTurn)
      return
    }

    await this.fire(row, col)
  }

  createUI() {
    this.createGameBoards()
    // Add phase text
    // this.phaseText = this.add
    //   .text(this.cameras.main.centerX, 50, 'Connecting...', { fontSize: '24px', fill: '#ffffff' })
    //   .setOrigin(0.5)
  }

  changeScene() {
    this.scene.start('GameOver')
  }
}
