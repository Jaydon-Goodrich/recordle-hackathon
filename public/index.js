import * as wordsArr from './wordsArr.js'
const startBtn = document.getElementById('startBtn')
const gameContainer = document.getElementById('gameContainer')
const youLoseBanner = document.getElementById('you-lose-banner')
const youWinBanner = document.getElementById('you-win-banner')
const scoreCard = document.getElementById('scoreCard')
const played = document.getElementById('played')
const win = document.getElementById('win')
const letterDiv = document.getElementById('letter-div')
const instructions = document.getElementById('instructions')
let guessedWords = [];

let date = new Date();
let dd = String(date.getDate()).padStart(2, '0');
let mm = String(date.getMonth() + 1).padStart(2, '0'); //January is 0!
let yy = date.getFullYear().toString().substr(-2);
let wordIndex = parseInt(dd) + parseInt(mm) + parseInt(yy)
const wordOfTheDay = wordsArr.words[wordIndex].toUpperCase()

let row = 1;
let mediaRecorder;
let socket;
let api_key_id;

let playedToday = localStorage.getItem('playedToday')
if(playedToday == true){
  endGame()
}

function submitGuess(word){
  var spans = document.getElementById('alphabet-div').getElementsByTagName('span')

  guessedWords.push(word)
  let rowEl = document.querySelector(`.row-${row}`)
  const rowInputs = rowEl.querySelectorAll('div')
  let lettersRight = 0;
  rowInputs.forEach((input, i) => {
    for(var j = 0; j < spans.length; j++){
      if(spans[j].textContent == word[i]){
        spans[j].classList.add('letterWrong')
      }
    }
    input.textContent = word[i]
    if(input.textContent == wordOfTheDay[i]){
      input.classList.add('right')
      for(var j = 0; j < spans.length; j++){
        if(spans[j].textContent == input.textContent){
          spans[j].classList.remove('letterWrong')
          spans[j].classList.add('letterCorrect')
        }
      }
      lettersRight++
    }else if(wordOfTheDay.includes(input.textContent)){
      for(var k = 0; k < spans.length; k++){
        if(spans[k].textContent == input.textContent){
          spans[k].classList.remove('letterWrong')
          spans[k].classList.add('letterCorrect')
        }
      }
      input.classList.add('right-letter')
    }
  })
  if(lettersRight == 5){
    endGame('win')
  }else{
    if(row == 6){
      endGame('loss')
    }else{
      row++
    }
  }
}

function endGame(outcome){
  if(outcome == 'win'){
    youWinBanner.style.display = "block"
  }else{
    youLoseBanner.style.display = "block"
  }
  destroyKey()
  setScores(outcome)
  scoreCard.style.display = "flex"
  startBtn.style.display = "block"
  gameContainer.style.display = "none"
  startBtn.style.display = "none"
  instructions.style.display = "none"
  mediaRecorder.stop()
  socket.close();
}

async function destroyKey(){
  let something = await fetch('/key/' + api_key_id, {
    method: 'DELETE',
  }).then((r) => r.json())
}

function setScores(outcome){
  let scoreArr = [];
  let scores = JSON.parse(localStorage.getItem('scores'));
  if(scores == null && outcome == 'win'){
    scoreArr = [1, 1]
  }else if(scores == null && outcome == 'loss'){
    scoreArr = [1, 0]
  }else{
    scoreArr = scores;
    if(outcome == 'win'){
      scoreArr[0]++
      scoreArr[1]++
    }else {
      scoreArr[0]++
    }
  }
  played.textContent = scoreArr[0]
  win.textContent = parseInt((scoreArr[1] / scoreArr[0]) * 100)
  localStorage.setItem('playedToday', true)
  localStorage.setItem('scores', JSON.stringify(scoreArr))
}

function isOpen(ws) { return ws.readyState === ws.OPEN }


async function startGame() {
  
  const result = await fetch('/key', { method: 'POST' }).then((r) => r.json())
  let key = result.key
  api_key_id = result.api_key_id
  let msg = new SpeechSynthesisUtterance();
  msg.text = "Welcome to Recordle!";
  window.speechSynthesis.speak(msg);
  startBtn.style.display = "none"
  gameContainer.style.display = "flex"
  letterDiv.style.display = "block"
  navigator.mediaDevices.getUserMedia({audio: true}).then((stream) => {
    mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' })

    socket = new WebSocket('wss://api.deepgram.com/v1/listen', ['token', key])

    socket.onopen = () => {
      mediaRecorder.addEventListener('dataavailable', event => {
        if (!isOpen(socket)) return;
        socket.send(event.data)
      })
      mediaRecorder.start(250)
    }

    socket.onmessage = (message) => {
      const received = JSON.parse(message.data)
      let transcript = received.channel.alternatives[0].transcript
      if(transcript.includes('word')){
        transcript = transcript.split(' ')
        let index = transcript.indexOf('word')
        let guess = transcript[index + 1] ? transcript[index + 1] : ''
        if(guessedWords.includes(guess.toUpperCase())){
          var msg = new SpeechSynthesisUtterance();
          msg.text = `You have already guessed ${guess}`;
          window.speechSynthesis.speak(msg);
        }
        else if(guess.length == 5){
          submitGuess(guess.toUpperCase())
        }
        else if(guess.length > 0){
          var msg = new SpeechSynthesisUtterance();
          msg.text = `${guess} is not a valid word`;
          window.speechSynthesis.speak(msg);
        }
      }
    }
  })
}

startBtn.addEventListener('click', startGame)