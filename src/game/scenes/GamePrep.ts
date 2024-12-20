import { EventBus } from '../EventBus'
import { Scene, Sound } from 'phaser'
import WebSocketManager from '../WebSocketManager'
import SignalR from '../SignalR'

type Tile = {
  shipid: number
  fieldstatus: 1 | 2 | 3
}

export class GamePrep extends Scene {
  camera: Phaser.Cameras.Scene2D.Camera
  background: Phaser.GameObjects.Image
  gameText: Phaser.GameObjects.Text
  playerBoard: any
  opponentBoard: any
  socket: signalR.HubConnection | null
  gridSize = 10
  cellSize = 40
  GRID_SIZE = 50 // Size of each grid cell
  grid = [] // 2D array to track occupied cells
  rectangles = [] // Array to store draggable rectangles
  readyButtonText: string = 'Ready'
  playButton: any

  // Initialize gridInfo
  gridInfo = Array(this.gridSize)
    .fill(null)
    .map(() => Array(this.gridSize).fill({ shipid: 0, fieldstatus: 0 }))

  constructor(sock: any) {
    super('GamePrep')
  }

  create() {
    const cols = 10
    const rows = 10
    this.grid = Array.from({ length: rows }, () => Array(cols).fill({ shipid: 0, fieldstatus: 0 }))
    this.drawGrid(cols, rows, 300, 300)

    //col,500-value for height, width, height
    this.createDraggableRectangle(0, 350, 50, 100)
    this.createDraggableRectangle(100, 350, 50, 150)
    this.createDraggableRectangle(200, 300, 50, 200)
    this.createDraggableRectangle(400, 250, 50, 250)

    // this.gameText = this.add.text(
    //   20,
    //   20,
    //   'Make something fun!\nand share it with us:\nsupport@phaser.io',
    //   {
    //     fontFamily: 'Arial Black',
    //     fontSize: 30,
    //     color: '#ffffff',
    //     stroke: '#000000',
    //     strokeThickness: 1,
    //     align: 'center'
    //   }
    // )
    this.playButton = this.add
      .text(600, 260, this.readyButtonText, { fill: '#0f0', align: 'center', fontSize: 24 })
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', () => this.sendGridtoSocket())

    // this.createDraggableRectangle(300, 200, 150, 100)

    // Log the initial state of the grid
    console.log('Initial Grid:', this.grid)

    this.camera = this.cameras.main
    this.socket = SignalR.getConnection()

    this.socket.on('IsPreperationPhaseOver', (data) => {
      if (data === true) {
        this.scene.start('Game')
      } else {
      }
      console.log(data)
    })

    this.createUI()
    this.camera.setBackgroundColor(0x140b2e)

    // this.background = this.add.image(512, 384, '../assets/background')
    // this.background.setAlpha(0.5)

    EventBus.emit('current-scene-ready', this)
  }

  async sendGridtoSocket() {
    const roomId = SignalR.getRoomId()
    const json = {
      roomId: roomId,
      connectionId: SignalR.getConnectionID(),
      field: { field: this.grid }
    }

    window.gamestate.fields = this.grid
    await SignalR.invoke('CheckShipPositions', json)
    this.readyButtonText = 'Waiting on second player...'
    this.playButton.setText(this.readyButtonText)
  }

  drawGrid2(x, y) {
    const boardGroup = this.add.group()
    const cellSize = this.cellSize
    const gridSize = this.gridSize

    const boardBackground = this.add.rectangle(
      x + (gridSize * cellSize) / 2,
      y + (gridSize * cellSize) / 2,
      gridSize * cellSize,
      gridSize * cellSize,
      0x140b2e
    )

    boardGroup.add(boardBackground)
    this.createDraggableRectangle2(x, y, 100, 100, boardGroup)
  }

  drawGrid(cols, rows, x, y) {
    for (let x = 0; x <= cols * this.GRID_SIZE; x += this.GRID_SIZE) {
      this.add.line(0, 0, x, 0, x, cols * this.GRID_SIZE, 0x5b40ae).setOrigin(0, 0)
    }

    for (let y = 0; y <= rows * this.GRID_SIZE; y += this.GRID_SIZE) {
      this.add.line(0, 0, 0, y, cols * this.GRID_SIZE, y, 0x5b40ae).setOrigin(0, 0)
    }
  }

  createDraggableRectangle2(x, y, width, height, boardGroup) {
    const rect = this.add.rectangle(x, y, width, height, 0xff0000).setOrigin(0, 0)
    rect.setStrokeStyle(2, 0xffffff) // Add border for better visibility
    this.rectangles.push({ rect, width, height })

    // boardGroup.add(rect)
    rect.setInteractive({ draggable: true })

    boardGroup.add(rect)
    this.input.setDraggable(rect)

    this.input.on('drag', (pointer, gameObject, dragX, dragY) => {
      gameObject.x = Phaser.Math.Snap.To(dragX, this.GRID_SIZE)
      gameObject.y = Phaser.Math.Snap.To(dragY, this.GRID_SIZE)
      // gameObject.x = Phaser.Math.Snap.To(dragX - gridOffsetX, this.GRID_SIZE) + gridOffsetX
      // gameObject.y = Phaser.Math.Snap.To(dragY - gridOffsetY, this.GRID_SIZE) + gridOffsetY
    })

    this.input.on('dragstart', (pointer, gameObject) => {
      // Store the rectangle's previous grid position
      const { rect, width, height } = this.rectangles.find((r) => r.rect === gameObject)
      gameObject.prevGridPosition = {
        colStart: Math.floor(gameObject.x / this.GRID_SIZE),
        rowStart: Math.floor(gameObject.y / this.GRID_SIZE),
        colEnd: Math.floor((gameObject.x + width) / this.GRID_SIZE),
        rowEnd: Math.floor((gameObject.y + height) / this.GRID_SIZE)
      }
    })

    this.input.on('dragend', (pointer, gameObject) => {
      const { rect, width, height } = this.rectangles.find((r) => r.rect === gameObject)

      // Clear the previous grid occupation using stored position
      const prev = gameObject.prevGridPosition
      for (let row = prev.rowStart; row < prev.rowEnd; row++) {
        for (let col = prev.colStart; col < prev.colEnd; col++) {
          if (row >= 0 && row < this.grid.length && col >= 0 && col < this.grid[0].length) {
            this.grid[row][col] = { shipid: 0, fieldstatus: 0 } // Mark cell as free
          }
        }
      }
    })

    // Update the grid with the new position
  }

  createDraggableRectangle(x, y, width, height) {
    const rect = this.add.rectangle(x, y, width, height, 0x61076b).setOrigin(0, 0)
    rect.setStrokeStyle(2, 0xffffff) // Add border for better visibility

    // Add rectangle to the array
    this.rectangles.push({ rect, width, height })

    // Mark initial grid occupation
    this.updateGridOccupation(rect, width, height, true)

    rect.setInteractive({ draggable: true })
    this.input.setDraggable(rect)

    this.input.on('drag', (pointer, gameObject, dragX, dragY) => {
      // Snap the rectangle visually while dragging
      gameObject.x = Phaser.Math.Snap.To(dragX, this.GRID_SIZE)
      gameObject.y = Phaser.Math.Snap.To(dragY, this.GRID_SIZE)
    })

    this.input.on('dragstart', (pointer, gameObject) => {
      const { rect, width, height } = this.rectangles.find((r) => r.rect === gameObject)
      gameObject.prevGridPosition = {
        colStart: Math.floor(gameObject.x / this.GRID_SIZE),
        rowStart: Math.floor(gameObject.y / this.GRID_SIZE),
        colEnd: Math.floor((gameObject.x + width) / this.GRID_SIZE),
        rowEnd: Math.floor((gameObject.y + height) / this.GRID_SIZE)
      }
    })

    this.input.on('dragend', (pointer, gameObject) => {
      const { rect, width, height } = this.rectangles.find((r) => r.rect === gameObject)

      // Clear the previous grid occupation using stored position
      const prev = gameObject.prevGridPosition
      for (let row = prev.rowStart; row < prev.rowEnd; row++) {
        for (let col = prev.colStart; col < prev.colEnd; col++) {
          if (row >= 0 && row < this.grid.length && col >= 0 && col < this.grid[0].length) {
            this.grid[row][col] = { shipid: 0, fieldstatus: 0 } // Mark cell as free
          }
        }
      }

      // Update the grid with the new position
      this.updateGridOccupation(gameObject, width, height, true)

      // Log updated grid for debugging
      console.log('Updated Grid:', this.grid)
    })
  }

  updateGridOccupation(gameObject, width, height, isOccupied) {
    const colStart = Math.floor(gameObject.x / this.GRID_SIZE)
    const rowStart = Math.floor(gameObject.y / this.GRID_SIZE)
    const colEnd = colStart + Math.floor(width / this.GRID_SIZE)
    const rowEnd = rowStart + Math.floor(height / this.GRID_SIZE)

    // Mark grid cells as occupied (1) or free (0)
    for (let row = rowStart; row < rowEnd; row++) {
      for (let col = colStart; col < colEnd; col++) {
        if (row >= 0 && row < this.grid.length && col >= 0 && col < this.grid[0].length) {
          this.grid[row][col] = isOccupied
            ? { shipid: 1, fieldstatus: 1 }
            : { shipid: 0, fieldstatus: 0 }
        }
      }
    }
  }

  getGameIDfromUrl() {
    const currentUrl = window.location.href
    const parts = currentUrl.split('/') // Split the URL by "/"
    const id = parts[parts.length - 1] // Get the last part
  }
  sendPrepPhase() {
    const test: Tile = {
      shipid: 1,
      fieldstatus: 1
    }
    const cellSize = this.cellSize
    const gridSize = this.gridSize

    const tiles = []
    for (let row = 0; row < gridSize; row++) {
      tiles[row] = []
      for (let col = 0; col < gridSize; col++) {
        tiles[row][col] = test
      }
    }
    console.log(tiles)
  }

  createBoard(x: number, y: number, label: string) {
    const boardGroup = this.add.group()
    const cellSize = this.cellSize
    const gridSize = this.gridSize
    // Initialize gridInfo
    const gridInfo = Array(gridSize)
      .fill(null)
      .map(() => Array(gridSize).fill({ shipid: 0, fieldstatus: 0 }))
    // Track which cells the rectangle occupies

    // Board background
    const boardBackground = this.add.rectangle(
      x + (gridSize * cellSize) / 2,
      y + (gridSize * cellSize) / 2,
      gridSize * cellSize,
      gridSize * cellSize,
      0x140b2e
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
        // Add row and column text to the tile
        const tileText = this.add.text(
          x + col * cellSize + cellSize / 2,
          y + row * cellSize + cellSize / 2,
          `${row},${col}`, // Text showing row and column
          {
            fontSize: '12px',
            fill: '#ffffff'
          }
        )
        tileText.setOrigin(0.5) // Center the text within the tile
        // tile.setInteractive()
        // tile.on('pointerdown', () => this.handleTileClick(row, col))

        //@ts-ignore
        tiles[row][col] = tile
        boardGroup.add(tile)
      }
    }

    this.createDraggableShip(x, y, 1, boardGroup)
    this.createDraggableShip(x, y, 3, boardGroup)

    return {
      group: boardGroup,
      tiles: tiles,
      gridInfo: this.gridInfo
    }
  }

  createDraggableShip(x: number, y: number, startRow: number, boardGroup: any) {
    let previousCells = []
    const cellSize = this.cellSize
    const gridSize = this.gridSize
    const draggableRectangle = this.add.rectangle(
      x + cellSize * startRow + cellSize / 2,
      y + (gridSize - 1) * cellSize + cellSize / 2, // Start at the last row (adjusted for half-height)
      cellSize,
      cellSize * 1, // Spanning 3 rows
      0xff0000
    )

    draggableRectangle.setInteractive({ draggable: true })
    boardGroup.add(draggableRectangle)

    // Enable drag-and-drop behavior
    this.input.setDraggable(draggableRectangle)

    // Drag events
    draggableRectangle.on('dragstart', (pointer) => {
      draggableRectangle.setFillStyle(0xffaaaa) // Highlight on drag start
    })

    draggableRectangle.on('drag', (pointer, dragX, dragY) => {
      draggableRectangle.x = dragX
      draggableRectangle.y = dragY
    })

    draggableRectangle.on('dragend', () => {
      // Snap to the nearest grid position

      console.log(draggableRectangle)

      const snappedCol = Phaser.Math.Clamp(
        Math.floor((draggableRectangle.x - x) / cellSize),
        0,
        gridSize - 1
      )
      const snappedRow = Phaser.Math.Clamp(
        Math.floor((draggableRectangle.y - y) / cellSize),
        0,
        gridSize - 1 // Account for 3-row height
      )

      draggableRectangle.x = x + snappedCol * cellSize + cellSize / 2
      draggableRectangle.y = y + snappedRow * cellSize + cellSize / 2

      //kinda useless
      previousCells = []

      // Check bounds and update gridInfo if valid
      if (
        snappedCol >= 0 &&
        snappedCol < gridSize &&
        snappedRow >= 0 &&
        snappedRow + 1 <= gridSize // Ensure it fits within the grid
      ) {
        draggableRectangle.x = x + snappedCol * cellSize + cellSize / 2
        draggableRectangle.y = y + snappedRow * cellSize + cellSize / 2

        // Mark the occupied cells in gridInfo
        //the 1 here is the ship length
        for (let i = 0; i < 1; i++) {
          console.log(snappedRow, snappedCol)
          this.gridInfo[snappedRow + i][snappedCol] = { shipid: 1, fieldstatus: 1 }
          // this.gridInfo[snappedRow + i][snappedCol] = { ship: 1, status: 1 }
          previousCells.push({ row: snappedRow + i, col: snappedCol })
          console.log(previousCells)
        }
      } else {
        // Reset position if out of bounds

        console.log(snappedRow, snappedCol, 'outofbounds')
        draggableRectangle.x = x + cellSize / 2
        draggableRectangle.y = y + cellSize / 2
      }

      // console.log(gridSize, snappedCol, 'gridsize', 'snappedCol')
      // console.log(gridSize, snappedRow + 1, 'gridsize', 'snappedRow')
      console.log(this.gridInfo)
      draggableRectangle.setFillStyle(0xff0000) // Reset highlight
    })
  }

  createUI() {
    // this.createBoard(300, 300, 'nai')
    // this.createBoard(0, 0, 'test')
    // this.phaseText = this.add
    //   .text(this.cameras.main.centerX, 50, 'Connecting...', { fontSize: '24px', fill: '#ffffff' })
    //   .setOrigin(0.5)
  }

  changeScene() {
    this.scene.start('Game')
  }
}
