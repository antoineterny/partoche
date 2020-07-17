let index = 0;
window.onload = () => {
  initAudio(index);
  initData(index);
}

// Traitement du CSV contenant régions et marqueurs
let regions = [];
let markers = [];
let pageMarkers = [];
let stabilo = {};

function convertToSeconds(ms) {
  let temp = ms.split(":");
  let minutes = Number(temp[0]);
  let seconds = Number(temp[1]);
  return minutes * 60 + seconds;
}

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
  // progression.innerHTML = "";
  // for (let i=0; i<markers.length; i++) {
  //   let largeur = (markers[i].time / regions[regions.length -1].end * 958);
  //   // https://caracteres-speciaux.net/note-de-musique/
  //   progression.innerHTML += `<div class="delimiteurRegion" style="left: ${largeur}px;">♩=${markers[i].text}</div>`;
  // }
}

// Lecture des fichiers csv (regions et markers), json (décalages de page), stabiloJson
async function initData(index) {
  regions = [];
  markers = [];
  pageMarkers = [];
  let markersRaw = await fetch(`${playlist[index].fileName}_regions_markers.csv`)
  .then( (response) => response.text() );
  processCSV(markersRaw);

  let json = await fetch(`${playlist[index].fileName}.json`)
  .then(function (response) {
    return response.json();
  });
  addPages(json);
  
  let stabiloJson = await fetch(`${playlist[index].fileName}_stabilo.json`)
  .then(function (response) {
    return response.json();
  });
  stabilo = stabiloJson;
}

// Ajout des images
const pages = document.querySelector('.pages');
const partoche = document.querySelector('.partoche');
let pagesHeight, previousPagesHeight, pagesLoaded;
function addPages(json) {
  let partocheWidth = window.getComputedStyle(partoche).width;
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
    newImg.src = `${playlist[index].fileName}_page${[i]}.png`;
    newImg.style.width = partocheWidth;
    newImg.setAttribute("id", `page${i}`);
    pages.appendChild(newImg);
  }
}

window.addEventListener('resize', () => {
  // pages.innerHTML = "";
  initData(index)
})

// Lecteur Audio
const playBtn = document.querySelector("#playBtn");
const titre = document.querySelector("#titre");
let tracks = [];
// let stopped;
function initAudio(index) {
  playBtn.disabled = true;
  playBtn.classList.add("disabled");
  titre.innerHTML = "<i>juste un instant, je charge...</i>";
  for (let i in tracks) {
    if (tracks[i]) {
      tracks[i].unload();
      console.log(tracks[i]._src, "is unloaded");
    }
  }

  let fileName = playlist[index].fileName;
  let voices = playlist[index].voices;
  let format = playlist[index].format;
  let loadedTracks = 0;
  for (let i in voices) {
    tracks[i] = new Howl({ src: [`${fileName}_${voices[i]}.${format}`] });
  }

  for (let i in tracks) {
    tracks[i].on("load", function () {
      if (i != 0) tracks[i].mute(true)
      console.log(tracks[i]._src, "is loaded");
      loadedTracks += 1;
      checkLoaded();
    });
  }
  function checkLoaded() {
      if (loadedTracks < tracks.length) return;
      playBtn.disabled = false;
      playBtn.classList.remove("disabled", "playing");
      playBtn.classList.add("paused");
      titre.innerText = playlist[index].title;
      animID = requestAnimationFrame(animate);
      // stopped = false;
      tracks[0].on("end", () => {
        playBtn.classList.remove("playing");
        playBtn.classList.add("paused");
        // cancelAnimationFrame(animID);
      });
  }
}

// Fonctions du lecteur
playBtn.addEventListener("click", () => togglePlayPause());
document.addEventListener("keydown", (event) => {
  if (event.code == "Space") {
    event.preventDefault();
    togglePlayPause();
  }
  if (event.code == "ArrowLeft") {
    event.preventDefault();
    backward();
  }
  if (event.code == "ArrowRight") {
    event.preventDefault();
    forward();
  }
});

function play() {
  tracks.forEach((track) => track.play());
  playBtn.classList.remove("paused");
  playBtn.classList.add("playing");
}
function pause() {
  tracks.forEach((track) => track.pause());
  playBtn.classList.remove("playing");
  playBtn.classList.add("paused");
}
function togglePlayPause() {
  if (!tracks[0].playing()) {
    playBtn.onclick = play();
  } else {
    playBtn.onclick = pause();
  }
}
function stop() {
  tracks.forEach((track) => track.stop());
  playBtn.classList.remove("playing");
  playBtn.classList.add("paused");
  // cancelAnimationFrame(animID);
}
function prev() {
  stop();
  index -= 1;
  if (index < 0) index = playlist.length - 1;
  initAudio(index);
}
function next() {
  stop();
  index += 1;
  if (index > playlist.length - 1) index = 0;
  initAudio(index);
}
function forward() {
  let curr = tracks[0].seek(this);
  tracks.forEach((track) => track.seek(curr + 5));
}
function backward() {
  let curr = tracks[0].seek(this);
  if (curr < 5) curr = 5;
  tracks.forEach((track) => track.seek(curr - 5));
}
function formatTime(rawSec) {
  let min = Math.floor((rawSec % 3600) / 60);
  let sec = Math.floor(rawSec % 60);
  min < 10 ? (min = "0" + min) : min;
  sec < 10 ? (sec = "0" + sec) : sec;
  return min + ":" + sec;
}

// Animation de la partition et du lecteur
function animate() {
  let curr = tracks[0].seek(this);
  let dur = tracks[0].duration();
  let avance = .5;

  if (tracks[0].state() === "loaded")
    currentTime.innerHTML = formatTime(curr) + " / " + formatTime(dur);
  titre.style =
    "background-image: linear-gradient(to right, gainsboro " +
    (curr / dur) * 100 +
    "%, white 0);";

  for (let i = 0; i < regions.length; i++) {
    if (
      curr > regions[i].start - avance &&
      curr < regions[i].end - avance
    ) {
      let prevPagesH = previousPagesHeight[regions[i].page - 1];
      let currentPageH = pagesHeight[regions[i].page - 1];
      let currentPageOffset =
        pageOffsets[regions[i].page - 1][regions[i].line - 1];
      pages.style =
        "transform: translateY(-" +
        (prevPagesH + (currentPageH * currentPageOffset) / 100) +
        "px)";
    }
  }

  animID = requestAnimationFrame(animate);
}

// Clic dans la barre de titre
titre.addEventListener("click", (event) => {
  let width = parseFloat(window.getComputedStyle(titre).width);
  let time = (event.offsetX / width) * tracks[0].duration();
  tracks.forEach((track) => track.seek(time));
  if (tracks[0].playing() === false) play();
});

// Unmute des pistes voix et dessin des stabilo
const allCheckboxes = document.querySelectorAll(
  '.mixer input[type="checkbox"]'
);
for (let checkbox of allCheckboxes) {
  checkbox.addEventListener("change", function (e) {
    let voix = e.target.parentNode.attributes["data-voice"].value;
    checkbox.parentNode.classList.toggle("checked");
    
    if (checkbox.checked) {
      tracks[checkbox.value].mute(false);

      for(let i in stabilo[voix]) {
        for (let j in stabilo[voix][i]) {
          let newStabiloDiv = document.createElement("div");
          let newDivHeight =
            previousPagesHeight[i] + (pagesHeight[i] * stabilo[voix][i][j]) / 100;
          newStabiloDiv.classList.add("stabilo", `${voix}`);
          newStabiloDiv.style = `height: ${newDivHeight}px;`;
          pages.prepend(newStabiloDiv)
        }
      }
    }
    else {
      tracks[checkbox.value].mute(true);
      document.querySelectorAll(`.stabilo.${voix}`).forEach(e => e.remove());
    }

  });
}
