////////////////////////////////////////////// UI ///////////////////////////////////////////////////
//const videoInput = document.getElementById('videoInput');
const musicPlayer = document.getElementById('musicPlayer');
const generateMusicButton = document.getElementById('generateMusic');
const imageCanvas = document.getElementById('imageCanvas');
const playButton = document.getElementById("playMusic");

////////////////////////////////////////////// Image Processing ///////////////////////////////////////////////////
let pixelData = null;
let memoryCard = [];
let filtrada = [];

const Qx = 7;
const Qy = 7;

function loadVideo() {
  console.log(framesList)

  for (let i = 0; i < framesList.length; i++) {
    const reader = new FileReader();
    const img = new Image();
    img.src = framesList[i];

    img.onload = function () {
      imageCanvas.width = img.width;
      imageCanvas.height = img.height;

      const ctx = imageCanvas.getContext('2d');
      ctx.drawImage(img, 0, 0);
      pixelData = ctx.getImageData(0, 0, img.width, img.height).data;

      // Tamanho do quadrado de pixels (largura e altura)
      const altura = Math.floor(img.height / Qy);
      const largura = Math.floor(img.width / Qx);

      // Coordenadas do canto superior esquerdo do quadrado
      let startX = 0;
      let startY = 0;

      let hd = []
      for (let i = 0; i < Qx * Qy; i++) {
        startX = (i % Qx) * largura;
        startY = Math.floor(i / Qx) * altura;

        // Variáveis para calcular a soma dos valores de pixel
        let somaR = 0;
        let somaG = 0;
        let somaB = 0;
        for (let y = startY; y < startY + altura; y++) {
          for (let x = startX; x < startX + largura; x++) {
            const index = (y * img.width + x) * 4;
            somaR += pixelData[index];
            somaG += pixelData[index + 1];
            somaB += pixelData[index + 2];
          }
        }

        const numPixels = altura * largura;
        const mediaR = Math.floor(somaR / numPixels);
        const mediaG = Math.floor(somaG / numPixels);
        const mediaB = Math.floor(somaB / numPixels);

        hd.push(Math.floor((mediaR + mediaG + mediaB) / 3))
        hd.push(i)
      };
      memoryCard.push(hd)
    }
  }
  console.log(memoryCard);
};

////////////////////////////////////////////// Image Converter ///////////////////////////////////////////////////
let composicao = []

generateMusicButton.addEventListener('click', function () {
  if (!memoryCard) {
    alert('Please select an image first.');
    return;
  }

  for (let frameS = 0; frameS < framesList.length; frameS++) {
    let media = 0
    for (let i = 0; i < 2 * Qx * Qy; i += 2) {
      media += memoryCard[frameS][i]
    }
    media /= (Qx * Qy)
    console.log(media)
    let filtro = 0
    for (let i = 0; i < 2 * Qx * Qy; i += 2) {
      filtro += Math.pow((media - memoryCard[frameS][i]), 2);
    }
    filtro = Math.sqrt(filtro)
    console.log(filtro)
    filtro /= (Qx * Qy);
    console.log(filtro)
    filtro = 4 * filtro + media
    console.log(filtro)

    filtrada = []
    while (filtrada.length < 2 * 2) {
      for (let i = 0; i < 2 * Qx * Qy; i += 2) {
        if (memoryCard[frameS][i] > filtro) {
          filtrada.push(memoryCard[frameS][i])
          filtrada.push(memoryCard[frameS][i + 1])
        }
      }
      filtro--;
    }
    console.log(filtrada)

    let cd = [];
    for (let i = 0; i < filtrada.length; i += 2) {
      let lateral = (((filtrada[i + 1]) % Qx) - 3) / 3
      //let oitava = .5
      let vertical = Math.floor(filtrada[i + 1] / Qx)
      let vol = (0.2 * filtrada[i]) / Math.max(...filtrada)
      //const notas = [265, 250, 220, 200, 175, 165, 150, 130]
      const notas = ["C2", "B2", "A2", "G1", "F1", "E1", "D1", "C1"]
      //cd.push(notas[vertical] * oitava, lateral, vol)
      cd.push(notas[vertical], lateral, vol)
    }
    composicao.push(cd);
  }
  console.log(composicao)

});

////////////////////////////////////////////// Player ///////////////////////////////////////////////////
//let attackTime = 0;
//let releaseTime = 0;

// Expose attack time & release time
const sweepLength = 1;
function playSweep(frameS, time, freq, panVal, vol) {

  const panner = new Tone.Panner(panVal).toDestination();
  const gainNode = new Tone.Gain(vol).toDestination();

  let config = {
    frequency: freq, //"C4" Frequência da nota (por exemplo, "C4" para a nota Dó na oitava 4)

    harmonicity: 3, // Índice que controla a quantidade de modulação de frequência
    modulationIndex: 10, // Índice que controla a intensidade da modulação de frequência
    detune: 0, // Alteração fina na afinação da nota em cents
    oscillator: {
      type: "sine" // Tipo de onda do operador de modulação
    },
    envelope: {
      attack: 0.05, // Duração do ataque em segundos
      decay: 0.2, // Duração do decay em segundos
      sustain: 0.5, // Nível de sustain (de 0 a 1)
      release: 1 // Duração do release em segundos
    }
  }

  const fmSynth = new Tone.FMSynth(config).connect(panner).connect(gainNode);
  fmSynth.triggerAttackRelease(freq, time)
}

function playSweep2(frameS, i, panner, gainNode, fmSynth) {
  let time = 1
  let freq = composicao[frameS][i]
  //const gainNode = new Tone.Gain(0.4).toDestination();
  //const panner = new Tone.Panner(1).toDestination();
  //panner.pan.rampTo(-1, 0.5);
  panner.pan.rampTo(composicao[frameS][i + 1]);
  gainNode.gain.rampTo(composicao[frameS][i + 2] * 0.2);
  /*
  let config = {
    type: "sine", // Tipo de onda (pode ser "sine", "sawtooth", "square", "triangle", etc.)
    frequency: composicao[frameS][i], //"C4" Frequência da nota (por exemplo, "C4" para a nota Dó na oitava 4)
  }*/

  //const osc = new Tone.Oscillator(config).connect(panner).connect(gainNode).start(frameS).stop(frameS + time);
  //osc.Oscillator(config).start(frameS).stop(frameS + time);

  fmSynth.triggerAttackRelease(freq, time).toDestination()
}

////////////////////////////////////////////// Play Music ///////////////////////////////////////////////////
const AudioContext = window.AudioContext || window.webkitAudioContext;
const audioCtx = new AudioContext();
playButton.addEventListener('click', function () {
  let time = 1
  console.log("play")

  audioCtx.resume()

  const panner = new Tone.Panner(0).toDestination();
  const gainNode = new Tone.Gain(0).toDestination();
  //const osc = new Tone.Oscillator().connect(panner).connect(gainNode).start(0);

  let config = {
    harmonicity: 3, // Índice que controla a quantidade de modulação de frequência
    modulationIndex: 10, // Índice que controla a intensidade da modulação de frequência
    detune: 0, // Alteração fina na afinação da nota em cents
    oscillator: {
      type: "sine" // Tipo de onda do operador de modulação
    },
    envelope: {
      attack: 0.05, // Duração do ataque em segundos
      decay: 0.2, // Duração do decay em segundos
      sustain: 0.5, // Nível de sustain (de 0 a 1)
      release: 0.5 // Duração do release em segundos
    }
  }

  Tone.Transport.start();
  const fmSynth = new Tone.FMSynth(config).connect(panner).connect(gainNode);

  for (let frameS = 0; frameS < composicao.length; frameS++) {
    console.log("Frame: ", frameS);
    for (let i = 0; i < composicao[frameS].length; i += 3) {
      //playSweep(frameS, time, composicao[frameS][i], composicao[frameS][i + 1], composicao[frameS][i + 2])
      console.log(frameS, time, composicao[frameS][i], composicao[frameS][i + 1], composicao[frameS][i + 2]);
    }
    setTimeout(function () {
      currentFrameIndex = frameS
      displayCurrentFrame()
      for (let i = 0; i < composicao[frameS].length; i += 3) {
        //playSweep(frameS, time, composicao[frameS][i], composicao[frameS][i + 1], composicao[frameS][i + 2])
        playSweep2(frameS, i, panner, gainNode, fmSynth)
      }
      if (currentFrameIndex == composicao.length - 1) {
        audioCtx.suspend()
      }
    }, frameS * 1000);
  }
});