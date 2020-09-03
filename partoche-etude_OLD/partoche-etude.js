let index = 0;
window.onload = function() {
  init(index);
}

const titre = document.querySelector('.titre');

function convertToSeconds(ms) {
  let temp = ms.split(":");
  let minutes = Number(temp[0]);
  let seconds = Number(temp[1]);
  return minutes * 60 + seconds;
}

// Traitement du CSV contenant régions et marqueurs
let regions = [];
let markers = [];
let pageMarkers = [];
function processCSV(csv) {
  let lines = csv.split(/\r\n|\n/);
  for (let i = 0; i < lines.length; i++) {
    lines[i] = lines[i].split(",");
    lines[i][0] = lines[i][0].slice(0, 1);
    if (lines[i][0] == "R") {
      let temp = {};
      lines[i][1] = lines[i][1].split("-");
      temp.start = convertToSeconds(lines[i][2]);
      temp.end = convertToSeconds(lines[i][3]);
      temp.page = Number(lines[i][1][0]);
      temp.line = Number(lines[i][1][1]);
      regions.push(temp);
    } else if (lines[i][0] == "M") {
      let temp = {};
      temp.text = lines[i][1];
      temp.time = convertToSeconds(lines[i][2]);
      markers.push(temp);
    }
  }
  console.log("regions : ",regions);
  console.log("markers : ",markers);
  progression.innerHTML = "";
  for (let i=0; i<markers.length; i++) {
    let largeur = (markers[i].time / regions[regions.length -1].end * 958);
    // https://caracteres-speciaux.net/note-de-musique/
    progression.innerHTML += `<div class="delimiteurRegion" style="left: ${largeur}px;">♩=${markers[i].text}</div>`;
  }
}

// Lecture des fichiers csv (regions et markers), json (décalages de page)
async function init(index) {
  regions = [];
  markers = [];
  pageMarkers = [];
  let markersRaw = await fetch(`${playlist[index].titre}_regions_markers.csv`)
  .then( (response) => response.text() );
  processCSV(markersRaw);

  let json = await fetch(`${morceau}.json`).then(
    function (response) {
      return response.json();
    }
  );
  addPages(json);

  titre.innerHTML = playlist[index].description;
  audio1.src = `${playlist[index].titre}_droite.mp3`;
  audio2.src = `${playlist[index].titre}_gauche.mp3`;
  audio3.src = `${playlist[index].titre}_metronome.mp3`;

  metronomeCheckbox.checked = true;
  stopAudio();
  audio1.addEventListener('durationchange', function() {
    document.querySelector("#tempsTotal").innerText = formatTime(audio1.duration);
  } )
}


// Add images
const pages = document.querySelector('.pages');
let pagesHeight, previousPagesHeight, pagesLoaded;
function addPages(json) {
    pages.innerHTML = '';
    pagesHeight = [];
    previousPagesHeight = [0];
    pagesLoaded = 0;
    pageOffsets = [];
    for(let i=0; i<json.length; i++) {
        pageOffsets.push(json[i]);
    }
    for (let i=1; i<=pageOffsets.length; i++) {
      let newImg = document.createElement('img');
      newImg.onload = function() {
          pagesLoaded += 1;
          if (pagesLoaded == pageOffsets.length) {
              pagesHeight = Array.from(document.querySelectorAll('img')).map(x => x.height);
              for (let i=1; i<pagesHeight.length; i++) {
                  previousPagesHeight.push(previousPagesHeight[i-1] + pagesHeight[i]);
              }
          }
      }
      newImg.src = `page${[i]}.png`;
      pages.appendChild(newImg);
    }
    console.log("previousPagesHeight", previousPagesHeight);
    // progression.innerHTML = "";
}

// Décalage des pages et du curseur
const curseur     = document.getElementById('curseur');
const progression = document.getElementById("progression");
const audio1      = document.getElementById('audio1');
const audio2      = document.getElementById('audio2');
const audio3      = document.getElementById('audio3');
const tousAudio   = document.querySelectorAll('audio');
let avance = .5;
function formatTime(time) {
    var mins = Math.floor((time % 3600) / 60);
    var secs = Math.floor(time % 60);
    if (secs < 10) { secs = "0" + secs; }
    if (mins < 10) { mins = "0" + mins; }
    return mins + ":" + secs; // mm:ss
}
audio1.addEventListener('timeupdate', () => {
    for (let i=0; i<regions.length; i++) {
      if (audio1.currentTime > (regions[i].start - avance) 
        && audio1.currentTime < (regions[i].end - avance)) {
          let prevPagesH = previousPagesHeight[regions[i].page - 1];
          let currentPageH = pagesHeight[regions[i].page - 1];
          let currentPageOffset = pageOffsets[regions[i].page - 1][regions[i].line - 1];
          pages.style =
            "transform: translateY(-" +
            (prevPagesH + (currentPageH * currentPageOffset) / 100) +
            "px)";
      }
    }
    // TODO: rendre le déplacement plus fluide
    curseur.style = "left:" + (audio1.currentTime / audio1.duration * progression.clientWidth + 12) + "px";
    document.querySelector('#tempsCourant').innerText = formatTime(audio1.currentTime); 
    // TODO: faire afficher le temps total avant la lecture !!!

});

// Lecteur audio
const btn1 = document.querySelector("#btn1");
const metronomeCheckbox = document.getElementById('metronome');
const balance = document.getElementById("balance");
btn1.addEventListener('click', function() {
    if (audio1.paused || audio1.ended) {
        tousAudio.forEach((element) => { element.play(); });
        btn1.classList.remove("play");
        btn1.classList.add("pause");
    }
    else {
        tousAudio.forEach((element) => { element.pause(); })
        btn1.classList.remove("pause");
        btn1.classList.add("play");
    }
});
function stopAudio() {
  tousAudio.forEach((element) => { element.pause(); });
  tousAudio.forEach((element) => { element.currentTime = 0; });
  btn1.classList.remove("pause");
  btn1.classList.add("play");
}
document.querySelector('#stop').addEventListener('click', function() {
    stopAudio();
})
metronomeCheckbox.addEventListener("click", function () {
  if (metronomeCheckbox.checked == true) {
    audio3.volume = 1;
  } else {
    audio3.volume = 0;
  }
});
balance.addEventListener("input", function () {
  if (balance.value > 0) {
    audio1.volume = 1;
    audio2.volume = (100 - Number(balance.value)) / 100;
  } else if (balance.value < 0) {
    audio1.volume = (100 + Number(balance.value)) / 100;
    audio2.volume = 1;
  } else {
    audio1.volume = 1;
    audio2.volume = 1;
  }
});

// Changement de passage
document.querySelector("#prev").addEventListener("click", function () {
  index--;
  if (index < 0) index = playlist.length - 1; 
  init(index);
});
document.querySelector("#next").addEventListener("click", function () {
  index++; 
  if (index > playlist.length - 1) index = 0;
  init(index);
});

// Barre de progression cliquable
// TODO : rendre "draggable"
document.getElementById('progression').addEventListener('click', function(e) {
  tousAudio.forEach((element) => {
    element.currentTime = e.offsetX / this.clientWidth * element.duration;
  });
})


