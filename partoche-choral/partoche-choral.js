let index = 0;
window.onload = () => {
  initAudio(index);
  initData(index);
}

// Traitement du CSV contenant régions et marqueurs
let regions = [];
let markers = [];
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
  // console.log("regions : ",regions);
  // console.log("markers : ",markers);
}

// Lecture des fichiers csv (regions et markers), json (décalages de page), stabiloJson
async function initData(index) {
  regions = [];
  markers = [];
  let markersRaw = await fetch(
    `${playlist[index].fileName}/${playlist[index].fileName}_regions_markers.csv`
  ).then((response) => response.text());
  processCSV(markersRaw);

  let json = await fetch(
    `${playlist[index].fileName}/${playlist[index].fileName}.json`
  ).then(function (response) {
    return response.json();
  });
  addPages(json);
  
  let stabiloJson = await fetch(
    `${playlist[index].fileName}/${playlist[index].fileName}_stabilo.json`
  ).then(function (response) {
    return response.json();
  });
  stabilo = stabiloJson;

  createVoiceButtons();
}

// Ajout des images
const pages = document.querySelector('#pages');
const partoche = document.querySelector('#partoche');
let pagesHeight, previousPagesHeight, pagesLoaded;
function addPages(json) {
  let partocheWidth = getComputedStyle(partoche).width;
  pages.innerHTML = '';
  pages.style = "transition-duration: .5s;";
  pagesHeight = [];
  previousPagesHeight = [0];
  pagesLoaded = 0;
  pageOffsets = [];
  for (let i=0; i<json.length; i++) {
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
    newImg.src = `${playlist[index].fileName}/${
      playlist[index].fileName
    }_page${[i]}.png`;
    newImg.style.width = partocheWidth;
    newImg.setAttribute("id", `page${i}`);
    pages.appendChild(newImg);
  }
  let readyForStabilo = setInterval(() => {
    if (pagesHeight.length > 0 && Object.keys(stabilo).length > 0) {
      clearInterval(readyForStabilo);
      Object.keys(stabilo).forEach(voix =>{
        for (let i in stabilo[voix]) {
          for (let j in stabilo[voix][i]) {
            let newStabiloDiv = document.createElement("div");
            let newDivHeight =
              previousPagesHeight[i] +
              (pagesHeight[i] * stabilo[voix][i][j]) / 100;
            newStabiloDiv.classList.add("stabilo", "invisible", `${voix.slice(0, 3)}`);
            newStabiloDiv.setAttribute("data-voice", voix)
            newStabiloDiv.style = `height: ${newDivHeight}px;`;
            pages.prepend(newStabiloDiv);
          }
        }
      })
    }
  }, 100);
  
}

window.addEventListener('resize', () => {
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
      // console.log(tracks[i]._src, "is unloaded");
    }
  }
  tracks = [];


  let fileName = playlist[index].fileName;
  let voices = playlist[index].voices;
  let format = playlist[index].format;
  let loadedTracks = 0;
  for (let i=0; i<voices.length; i++) {
    tracks[i] = new Howl({
      src: [`${playlist[index].fileName}/${fileName}_${voices[i]}.${format}`],
    });
    tracks[i]["data-voice"] = voices[i];
  }

  for (let i = 0; i < tracks.length; i++) {
    tracks[i].on("load", function () {
      if (i != 0) tracks[i].mute(true);
      // console.log(tracks[i]._src, "is loaded");
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
    if (markers.length === 0) {
      backward();
    }
    else {
      previousMarker();
    }
  }
  if (event.code == "ArrowRight") {
    event.preventDefault();
    if (markers.length === 0) {
      forward();
    }
    else {
      nextMarker();
    }
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
  pages.style = "transition-duration: 0s;";
  initAudio(index);
  initData(index);
}
function next() {
  stop();
  index += 1;
  if (index > playlist.length - 1) index = 0;
  pages.style = "transition-duration: 0s;";
  initAudio(index);
  initData(index);
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
function nextMarker() {
  let curr = tracks[0].seek(this);
  if (curr < markers[0].time) {
    tracks.forEach((track) => track.seek(markers[0].time));
  }
  else if (curr > markers[markers.length-1].time) {
    return
  }
  else {
    for (i=0; i<markers.length-1; i++) {
      if (curr > markers[i].time && curr < markers[i+1].time) {
        tracks.forEach((track) => track.seek(markers[i+1].time));
      }
    }
  }
}
function previousMarker() {
  let curr = tracks[0].seek(this);
  if (curr < markers[0].time + 1) {
    tracks.forEach((track) => track.seek(0));
  } 
  else if ((curr > markers[markers.length - 1].time) && (curr < markers[markers.length - 1].time +1)) {
    tracks.forEach((track) => track.seek(markers[markers.length - 2].time));
  } 
  else if (curr > markers[markers.length - 1].time +1) {
    tracks.forEach((track) => track.seek(markers[markers.length - 1].time));
  } 
  else {
    for (i = 0; i < markers.length -1; i++) {
      if (curr > markers[i].time && curr < markers[i + 1].time) {
        if (curr < markers[i].time + 1) {
          tracks.forEach((track) => track.seek(markers[i - 1].time));
        } else {
          tracks.forEach((track) => track.seek(markers[i].time));
        }
      }
    }
  }
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

// Création des boutons pour chaque voix et addEventListener pour tracks et stabilo
function createVoiceButtons() {
  const mixer = document.querySelector("#mixer");
  mixer.innerHTML = '<div id="currentTime"></div>';
  let voices = playlist[index].voices;
  let pupitre;
  for(i=0; i<voices.length; i++){
    if (voices[i].match(/sop/g)) {pupitre = "Sopranos"}
    else if (voices[i].match(/alt/g)) {pupitre = "Altos"}
    else if (voices[i].match(/ten/g)) {pupitre = "Ténors"}
    else if (voices[i].match(/bas/g)) {pupitre = "Basses"};
    let numero = voices[i].match(/[1-9]/g);
    if(numero) pupitre += ` ${numero[0]}`;
    
    if(pupitre) {
      // mixer.innerHTML += 
      // `<label data-voice="${voices[i]}"><input type="checkbox" value="${i}">${pupitre}</label>`;
      let newVoiceBtn = document.createElement("label");
      newVoiceBtn.setAttribute("data-voice", voices[i]);
      newVoiceBtn.innerText = pupitre;
      newVoiceBtn.addEventListener("click", function(e) {
        this.classList.toggle("checked");
        let allStabilo = document.querySelectorAll(".stabilo");
        if(this.classList.value === "checked") {
          tracks.forEach(tr => {
            if (tr["data-voice"] === e.target.attributes["data-voice"].value) {
              tr.mute(false);
            } 
          })
          allStabilo.forEach(st => {
            let stabiloVoice = st.getAttribute("data-voice");
            if (stabiloVoice === e.target.attributes["data-voice"].value) {
              st.classList.remove("invisible");
            } 
          });
        } else {
          tracks.forEach((tr) => {
            if (tr["data-voice"] === e.target.attributes["data-voice"].value) {
              tr.mute(true);
            }
            allStabilo.forEach(st => {
              let stabiloVoice = st.getAttribute("data-voice");
              if (stabiloVoice === e.target.attributes["data-voice"].value) {
                st.classList.add("invisible");
              } 
            });
          });
        }
      })
      mixer.append(newVoiceBtn);
    }
  }
}