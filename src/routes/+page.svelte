<script lang="ts">
  import { onMount } from 'svelte'
  import SignalR from '../game/SignalR'
  import { env } from '$env/dynamic/private'
  import { goto } from '$app/navigation'
  import type { FetchResult } from 'vite/runtime'

  let roomCode = ''
  let dialogElement: HTMLDialogElement
  let playerOne = ''
  let playerTwo = ''
  let isPlayerOne = false
  let isPlayerTwo = false
  let connection = null

  let connectionID = ''
  let roomID = ''

  // async function test() {
  //   // const test = await SignalR.invoke('Test', 'nani')
  //   const test = await SignalR.invoke('CheckShipPositions', 'nani')
  //   console.log(test)
  // }

  async function joinRoom() {
    connectionID = SignalR.getConnectionID()
    const url = `${env.PUBLIC_BACKENDURL}/api/Session/JoinRoom/${connectionID}/${roomCode}`

    try {
      const response = await fetch(url, { method: 'POST' })
      if (!response.ok) {
        throw new Error(`Response status: ${response.status}`)
      }

      // console.log(response, 'joinRoom')
      // console.log(playerOne, playerTwo, 'players')
      //@ts-ignore
      // window.gamestate.playerOne = playerOne
      dialogElement.showModal()
    } catch (error) {
      console.error(error)
    }
  }

  async function handleCreateRoom() {
    connectionID = SignalR.getConnectionID()
    console.log('createRooom')
    console.log(env.PUBLIC_BACKENDURL, 'test')
    const url = `${env.PUBLIC_BACKENDURL}/api/Session/CreateRoom/${connectionID}`
    try {
      const response = await fetch(url, { method: 'POST' })
      if (!response.ok) {
        throw new Error(`Response status: ${response.status}`)
      }

      console.log(response, 'creaehtrt')
    } catch (error) {
      console.error(error)
    }

    dialogElement.showModal()
  }

  function closeDialog() {
    dialogElement.close()
  }

  onMount(() => {
    window.gamestate = {}
    SignalR.connect(`${env.PUBLIC_BACKENDURL}/hub`)
    connection = SignalR.getConnection()
    connectionID = SignalR.getConnectionID()

    connection.on('CreatedRoom', (data, message) => {
      roomID = data.roomId
      playerOne = data.hostSessionId
      // SignalR.setRoomId(data.roomId)
      console.log(data, 'createrRoom')
      console.log(connectionID, 'connectionID')
    })

    connection.on('PlayerJoinedRoom', (data, message) => {
      console.log(data, 'playerjoinde')
      roomID = data.roomId
      if (data.hostSessionId !== data.player2Id) {
        playerOne = data.hostSessionId
        playerTwo = data.player2Id
        if (connectionID === playerTwo) {
          isPlayerTwo = true
          window.gamestate.isPlayerTwo = true
        } else {
          window.gamestate.isPlayerOne = true
          isPlayerOne = true
        }
        window.gamestate.playerOne = playerOne
        window.gamestate.playerTwo = playerTwo
      } else {
        playerTwo = data.player2Id
      }
    })
  })
  function copyText() {
    navigator.clipboard
      .writeText(roomID)
      .then(() => {})
      .catch((err) => {
        console.error('Failed to copy text: ', err)
      })
  }

  function startGame() {
    goto(`/game/${roomID}`)
  }
</script>

<div class="container">
  <div class="stars" />
  <div class="card">
    <h1>Interstellar Fallen Fleet</h1>
    <h2>Game on</h2>
    <div class="join-section">
      <p>Join Room</p>
      <input type="text" bind:value={roomCode} placeholder="Enter room code" />

      <!-- <button on:click={test}>test</button> -->
      <button on:click={joinRoom}>Join Room</button>
      <button on:click={handleCreateRoom}>Create Room</button>
    </div>
  </div>

  <dialog bind:this={dialogElement}>
    <div class="dialog-content">
      <button class="close-button" on:click={closeDialog}>&times;</button>
      <h1>Interstellar Fallen Fleet</h1>
      <div class="room-code" on:click={copyText} style="cursor: pointer; color: blue;">
        {roomID}
      </div>
      <div class="players-list">
        <h3>Current Players:</h3>
        {playerOne}
        {playerTwo}
        <!-- <ul> -->
        <!--   {#each players as player, i} -->
        <!--     <li class:current={player === currentPlayer}> -->
        <!--       {player} -->
        <!--       {player === currentPlayer ? '(You)' : ''} -->
        <!--     </li> -->
        <!--   {/each} -->
        <!-- </ul> -->
      </div>
      <!-- <button disabled={!isPlayerOne} class="play-button" on:click={startGame}>Play</button> -->
      <button class="play-button" on:click={startGame}>Play</button>
    </div>
  </dialog>
</div>

<style>
  .container {
    min-height: 100vh;
    width: 100%;
    background: #0a0426;
    position: relative;
    display: grid;
    place-items: center;
    overflow: hidden;
  }

  .stars {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-image: radial-gradient(2px 2px at 20px 30px, #eee, rgba(0, 0, 0, 0)),
      radial-gradient(2px 2px at 40px 70px, #fff, rgba(0, 0, 0, 0)),
      radial-gradient(1px 1px at 90px 40px, #ddd, rgba(0, 0, 0, 0)),
      radial-gradient(2px 2px at 160px 120px, #fff, rgba(0, 0, 0, 0));
    background-repeat: repeat;
    background-size: 200px 200px;
    animation: twinkle 4s ease-in-out infinite;
  }

  .card,
  dialog {
    background: white;
    padding: 2rem;
    border-radius: 12px;
    width: 90%;
    max-width: 400px;
    text-align: center;
    position: relative;
    z-index: 1;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  }

  dialog {
    border: none;
  }

  dialog::backdrop {
    background: rgba(0, 0, 0, 0.5);
  }

  .dialog-content {
    position: relative;
  }

  .close-button {
    position: absolute;
    top: -1rem;
    right: -1rem;
    background: #000;
    color: white;
    border: none;
    border-radius: 50%;
    width: 2rem;
    height: 2rem;
    font-size: 1.5rem;
    line-height: 1;
    cursor: pointer;
    transition: background-color 0.2s;
  }

  .close-button:hover {
    background: #333;
  }

  .room-code {
    font-size: 1.5rem;
    font-weight: bold;
    margin: 1.5rem 0;
    color: #333;
  }

  .players-list {
    text-align: left;
    margin-bottom: 1.5rem;
  }

  .players-list h3 {
    font-size: 1.2rem;
    margin-bottom: 0.5rem;
    color: #333;
  }

  .players-list ul {
    list-style-type: none;
    padding: 0;
  }

  .players-list li {
    padding: 0.5rem 0;
    border-bottom: 1px solid #eee;
  }

  .players-list li:last-child {
    border-bottom: none;
  }

  .players-list li.current {
    font-weight: bold;
  }

  h1 {
    font-size: 1.8rem;
    margin: 0 0 1rem;
    color: #0a0426;
  }

  h2 {
    font-size: 1.4rem;
    margin: 0 0 2rem;
    color: #333;
  }

  .join-section {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  p {
    margin: 0;
    color: #666;
    font-size: 0.9rem;
  }

  input {
    padding: 0.75rem;
    border: 1px solid #ddd;
    border-radius: 4px;
    font-size: 1rem;
    width: 100%;
    box-sizing: border-box;
  }

  button {
    padding: 0.75rem;
    background: #000;
    color: white;
    border: none;
    border-radius: 4px;
    font-size: 1rem;
    cursor: pointer;
    transition: background-color 0.2s;
  }

  button:hover {
    background: #333;
  }

  .play-button {
    width: 100%;
    margin-top: 1rem;
  }
  button:disabled {
    background: #555; /* Dimmed background color for a disabled state */
    color: #999; /* Dimmed text color */
    cursor: not-allowed;
    opacity: 0.7; /* Slightly faded appearance */
  }

  @keyframes twinkle {
    0%,
    100% {
      opacity: 0.8;
    }
    50% {
      opacity: 1;
    }
  }

  @media (min-width: 768px) {
    .card,
    dialog {
      padding: 3rem;
    }

    h1 {
      font-size: 2.2rem;
    }

    h2 {
      font-size: 1.6rem;
    }
  }
</style>
