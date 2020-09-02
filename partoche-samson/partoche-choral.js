let index;
window.onload = () => {
  initMenu();
}
window.addEventListener("resize", () => {
  if (index) {
    initData(index);
    createVoiceButtons(index);
    addStabilo();
    restoreVoiceButtonsState()
  }
});

//=================
// Création du menu
//=================
function initMenu() {
  const menu = document.querySelector("#menu");
  menu.innerHTML = "";
  for (let i = 0; i < playlist.length; i++) {
    let newP = document.createElement("p");
    newP.innerText = playlist[i].title;
    newP.addEventListener("click", () => {
      index = i;
      initAudio(i);
      initData(i);
      createVoiceButtons(i);
      toggleMenu();
    });
    document.querySelector("#menu").append(newP);
  }
  let partocheHeight = parseInt(getComputedStyle(partoche).height);
  menu.style = `max-height: ${partocheHeight}px`;
  toggleMenu();
}
function toggleMenu() {
  // pause();
  menu.classList.toggle("visible");
}

//=================================================
// Traitement du CSV contenant régions et marqueurs
//=================================================
let regions = [];
let markers = [];
let pageOffsets = [];
let stabilo = {};

// Lecture des fichiers csv (regions et markers), json (décalages de page), stabiloJson
async function initData(index) {
  let fileName = playlist[index].fileName;

  let regionsMarkersRaw = await fetch(
    `${fileName}/${fileName}_regions_markers.csv`
  ).then((response) => response.text());
  regions = processRegionsMarkers(regionsMarkersRaw)[0];
  markers = processRegionsMarkers(regionsMarkersRaw)[1];

  let json = await fetch(
    `${fileName}/${fileName}.json`
  ).then(function (response) {
    return response.json();
  });
  pageOffsets = json;
  addPages();
  
  let stabiloJson = await fetch(
    `${fileName}/${fileName}_stabilo.json`
  ).then(function (response) {
    return response.json();
  });
  stabilo = stabiloJson;
  // addStabilo();
}

function processRegionsMarkers(csv) {
  let lines = csv.split(/\r\n|\n/);
  let tempRegions = [];
  let tempMarkers = [];
  for (let i = 0; i < lines.length; i++) {
    lines[i] = lines[i].split(",");
    lines[i][0] = lines[i][0].slice(0, 1);
    if (lines[i][0] == "R") {
      let temp = {};
      lines[i][1] = lines[i][1].split("-");
      temp.start = msToSeconds(lines[i][2]);
      temp.end = msToSeconds(lines[i][3]);
      temp.page = Number(lines[i][1][0]);
      temp.line = Number(lines[i][1][1]);
      tempRegions.push(temp);
    } else if (lines[i][0] == "M") {
      let temp = {};
      temp.text = lines[i][1];
      temp.time = msToSeconds(lines[i][2]);
      tempMarkers.push(temp);
    }
  }
  return [tempRegions, tempMarkers];
}

// Ajout des images
const pages = document.querySelector('#pages');
const partoche = document.querySelector('#partoche');
let pagesHeight, previousPagesHeight, pagesLoaded;
function addPages() {
  pages.innerHTML = '';
  let partocheWidth = getComputedStyle(partoche).width;
  // pages.style = "transition-duration: .5s;";
  pagesHeight = [];
  previousPagesHeight = [];
  pagesLoaded = 0;
  for (let i=1; i<=pageOffsets.length; i++) {
    let newImg = document.createElement('img');
    newImg.onload = function() {
      pagesLoaded += 1;
      if (pagesLoaded == pageOffsets.length) {
        pagesHeight = Array.from(
          document.querySelectorAll("#pages img")
        ).map((x) => parseFloat(getComputedStyle(x).height));
          for (let i=0; i<pagesHeight.length; i++) {
              previousPagesHeight.push(getTotalPreviousHeight(i+1));
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
  // addStabilo positionne les stabilos en fonction de la hauteur des pages
  addStabilo();
}

//========================================
// Animation de la partition et du lecteur
//========================================
function animate() {
  let curr = tracks[0].seek(this);
  let dur = tracks[0].duration();
  let avance = .5;

  if (tracks[0].state() === "loaded")
    currentTime.innerHTML = formatTime(curr);
    totalTime.innerHTML = formatTime(dur);
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

//============================================
// Création des boutons, stabilo et marqueurs
//============================================
function createVoiceButtons(index) {
  document.querySelectorAll("#mixer label").forEach((x) => x.remove());
  const mixer = document.querySelector("#mixer");
  let voices = playlist[index].voices;
  let pupitre;
  for(i=0; i<voices.length; i++){
    if (voices[i].match(/sop/g)) {pupitre = "sopranos"}
    else if (voices[i].match(/alt/g)) {pupitre = "altos"}
    else if (voices[i].match(/ten/g)) {pupitre = "ténors"}
    else if (voices[i].match(/bas/g)) {pupitre = "basses"};
    let numero = voices[i].match(/[1-9]/g);
    if(numero) pupitre += ` ${numero[0]}`;
    
    if(pupitre) {
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

function restoreVoiceButtonsState() {
  for (let tr of tracks) {
    if (tr._muted === false) {
      document.querySelectorAll("#mixer label").forEach((label) => {
        if (label.getAttribute("data-voice") === tr["data-voice"]) {
          label.classList.add("checked");
        }
      });
    }
  }
}

function addStabilo() {
  document.querySelectorAll(".stabilo").forEach((x) => x.remove());
  if (pagesHeight.length === 0 || Object.keys(stabilo).length === 0) {
    window.requestAnimationFrame(addStabilo);
  } else {
    Object.keys(stabilo).forEach((voix) => {
      for (let i in stabilo[voix]) {
        for (let j in stabilo[voix][i]) {
          let newStabiloDiv = document.createElement("div");
          let newDivTop =
            previousPagesHeight[i] +
            (pagesHeight[i] * stabilo[voix][i][j]) / 100;
          newStabiloDiv.classList.add(
            "stabilo",
            `${voix.slice(0, 3)}`,
            "invisible"
          );
          newStabiloDiv.setAttribute("data-voice", voix);
          newStabiloDiv.style = `top: ${newDivTop}px; height: 20px`;
          for (let tr of tracks) {
            if (
              tr["data-voice"] === voix &&
              tr.state() === "loaded" &&
              tr._muted === false
            ) {
              newStabiloDiv.classList.remove("invisible");
            }
          }
          pages.prepend(newStabiloDiv);
        }
      }
    });
  }
}

// Création des marqueurs
function createTitreMarkers() {
  document.querySelectorAll(".marker").forEach((x) => x.remove());
  if (markers.length > 0) {
    let dur = tracks[0].duration(); 
    for (let marker of markers) {
      let newMarker = document.createElement('div');
      let newMarkerText = document.createElement('div');
      newMarker.classList.add('marker');
      newMarker.style = `left: ${marker.time / dur * 100}%;`
      newMarkerText.classList.add('marker-text');
      newMarkerText.innerHTML = marker.text;
      document.querySelector('#titre').appendChild(newMarker).appendChild(newMarkerText)
    }
  }
}

//======================
// Fonctions utilitaires
//======================
function getTotalPreviousHeight(pageNbr) {
  if (pageNbr === 1) return 0;
  let tempArray = pagesHeight.slice(0, pageNbr-1);
  return tempArray.reduce((total, current) => {
    return total + current
  })
}
function formatTime(rawSec) {
  let min = Math.floor((rawSec % 3600) / 60);
  let sec = Math.floor(rawSec % 60);
  min < 10 ? (min = "0" + min) : min;
  sec < 10 ? (sec = "0" + sec) : sec;
  return min + ":" + sec;
}
function msToSeconds(ms) {
  let temp = ms.split(":");
  let minutes = Number(temp[0]);
  let seconds = Number(temp[1]);
  return minutes * 60 + seconds;
}