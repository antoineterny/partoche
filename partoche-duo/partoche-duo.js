let index;
window.onload = () => {
  // initAudio(index);
  // initData(index);
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
        toggleMenu();
      });
      document.querySelector("#menu").append(newP);
    }
    let partocheHeight = parseInt(getComputedStyle(partoche_pri).height);
    menu.style = `max-height: ${partocheHeight}px`;
    toggleMenu();
  }
  initMenu();
};

// Menu
function toggleMenu() {
  pause();
  menu.classList.toggle("visible");
}

// Traitement du CSV contenant régions et marqueurs
let regions_pri = [];
let regions_sec = [];
let markers = [];
// let stabilo = {};

function convertToSeconds(ms) {
  let temp = ms.split(":");
  let minutes = Number(temp[0]);
  let seconds = Number(temp[1]);
  return minutes * 60 + seconds;
}

function processCSVregions(csv) {
  let lines = csv.split(/\r\n|\n/);
  let tempRegions = [];
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
      tempRegions.push(temp);
    } 
  }
  return tempRegions;
}
function processCSVmarkers(csv) {
  let lines = csv.split(/\r\n|\n/);
  let tempMarkers = [];
  for (let i = 0; i < lines.length; i++) {
    lines[i] = lines[i].split(",");
    lines[i][0] = lines[i][0].slice(0, 1);
    if (lines[i][0] == "M") {
      let temp = {};
      temp.text = lines[i][1];
      temp.time = convertToSeconds(lines[i][2]);
      tempMarkers.push(temp);
    }
  }
  return tempMarkers;
}

// Lecture des fichiers csv (regions et markers), json (décalages de page), stabiloJson
async function initData(index) {
  regions_pri = [];
  regions_sec = [];
  markers = [];

  let regionsPriRaw = await fetch(
    `${playlist[index].fileName}/${playlist[index].fileName}_pri_regions_markers.csv`
  ).then((response) => response.text());
  regions_pri = processCSVregions(regionsPriRaw);
  markers = processCSVmarkers(regionsPriRaw);
  // Les markers doivent être dans le csv de la partie prima
  
  let regionsSecRaw = await fetch(
    `${playlist[index].fileName}/${playlist[index].fileName}_sec_regions_markers.csv`
  ).then((response) => response.text());
  regions_sec = processCSVregions(regionsSecRaw);

  let jsonPri = await fetch(
    `${playlist[index].fileName}/${playlist[index].fileName}_pri.json`
  ).then(function (response) {
    return response.json();
  });

  let jsonSec = await fetch(
    `${playlist[index].fileName}/${playlist[index].fileName}_sec.json`
  ).then(function (response) {
    return response.json();
  });

  addPages(jsonPri, jsonSec);
}

// Ajout des images
const pages_pri = document.querySelector("#pages_pri");
const partoche_pri = document.querySelector("#partoche_pri");
const pages_sec = document.querySelector("#pages_sec");
const partoche_sec = document.querySelector("#partoche_sec");
let pagesHeight, previousPagesHeight, pagesLoaded;
function addPages(jsonPri, jsonSec) {
  pages_pri.innerHTML = "";
  pages_sec.innerHTML = "";
  let partocheWidth = getComputedStyle(partoche_pri).width;
  // pages_pri.style = "transition-duration: .5s;";
  // pages_sec.style = "transition-duration: .5s;";
  pagesHeight_pri = [];
  pagesHeight_sec = [];
  previousPagesHeight_pri = [];
  previousPagesHeight_sec = [];
  pagesLoaded_pri = 0;
  pagesLoaded_sec = 0;
  pageOffsets_pri = [];
  pageOffsets_sec = [];

  for (let i = 0; i < jsonPri.length; i++) {
    pageOffsets_pri.push(jsonPri[i]);
  }
  for (let i = 0; i < jsonSec.length; i++) {
    pageOffsets_sec.push(jsonSec[i]);
  }

  for (let i = 1; i <= pageOffsets_pri.length; i++) {
    let newImg = document.createElement("img");
    newImg.onload = function () {
      pagesLoaded_pri += 1;
      if (pagesLoaded_pri == pageOffsets_pri.length) {
        pagesHeight_pri = Array.from(
          document.querySelectorAll("#pages_pri img")
        ).map((x) => parseFloat(getComputedStyle(x).height));
        for (let i = 0; i < pagesHeight_pri.length; i++) {
          previousPagesHeight_pri.push(
            getTotalPreviousHeight(i + 1, pagesHeight_pri)
          );
        }
      }
    };
    newImg.src = `${playlist[index].fileName}/${playlist[index].fileName}_pri_Page_${[i]}.png`;
    newImg.style.width = partocheWidth;
    newImg.setAttribute("id", `pri_page${i}`);
    pages_pri.appendChild(newImg);
  }
  for (let i = 1; i <= pageOffsets_sec.length; i++) {
    let newImg = document.createElement("img");
    newImg.onload = function () {
      pagesLoaded_sec += 1;
      if (pagesLoaded_sec == pageOffsets_sec.length) {
        pagesHeight_sec = Array.from(
          document.querySelectorAll("#pages_sec img")
        ).map((x) => parseFloat(getComputedStyle(x).height));
        for (let i = 0; i < pagesHeight_sec.length; i++) {
          previousPagesHeight_sec.push(
            getTotalPreviousHeight(i + 1, pagesHeight_sec)
          );
        }
      }
    };
    newImg.src = `${playlist[index].fileName}/${playlist[index].fileName}_sec_Page_${[i]}.png`;
    newImg.style.width = partocheWidth;
    newImg.setAttribute("id", `sec_page${i}`);
    pages_sec.appendChild(newImg);
  }
}

window.addEventListener("resize", () => {
  initData(index);
  // initAudio(index);
});

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
  tracks = [];

  const fileName = `${playlist[index].fileName}/${playlist[index].fileName}`;
  const voices = ["pri", "sec"];
  if (playlist[index].metronome) {
    voices.push("metronome");
    if (!document.querySelector("#metronome")) {
      createMetronomeButton();
    } else {
      metronome.checked = false;
    }
  }
  let format = playlist[index].format;
  let loadedTracks = 0;
  for (let i = 0; i < voices.length; i++) {
    tracks[i] = new Howl({
      src: [`${fileName}_${voices[i]}.${format}`],
    });
    tracks[i]["data-voice"] = voices[i];
  }

  for (let i = 0; i < tracks.length; i++) {
    tracks[i].on("load", function () {
      if (tracks[i]["data-voice"] === "metronome") tracks[i].mute(true);
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

    // createVoiceButtons();
    createTitreMarkers();

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
    // if (markers.length === 0) {
    //   backward();
    // }
    // else {
    //   previousMarker();
    // }
  }
  if (event.code == "ArrowRight") {
    event.preventDefault();
    forward();
    // if (markers.length === 0) {
    //   forward();
    // }
    // else {
    //   nextMarker();
    // }
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
  // pages.style = "transition-duration: 0s;";
  initAudio(index);
  initData(index);
}
function next() {
  stop();
  index += 1;
  if (index > playlist.length - 1) index = 0;
  // pages.style = "transition-duration: 0s;";
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
  } else if (curr > markers[markers.length - 1].time) {
    return;
  } else {
    for (i = 0; i < markers.length - 1; i++) {
      if (curr > markers[i].time && curr < markers[i + 1].time) {
        tracks.forEach((track) => track.seek(markers[i + 1].time));
      }
    }
  }
}
function previousMarker() {
  let curr = tracks[0].seek(this);
  if (curr < markers[0].time + 1) {
    tracks.forEach((track) => track.seek(0));
  } else if (
    curr > markers[markers.length - 1].time &&
    curr < markers[markers.length - 1].time + 1
  ) {
    tracks.forEach((track) => track.seek(markers[markers.length - 2].time));
  } else if (curr > markers[markers.length - 1].time + 1) {
    tracks.forEach((track) => track.seek(markers[markers.length - 1].time));
  } else {
    for (i = 0; i < markers.length - 1; i++) {
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

//Gestion du mixage
const balance = document.querySelector("#balance");
balance.addEventListener("input", (e) => {
  console.log(e);
  if      (balance.value == -3) {tracks[0].volume(0);  tracks[1].volume(1)}
  else if (balance.value == -2) {tracks[0].volume(.1); tracks[1].volume(1)}
  else if (balance.value == -1) {tracks[0].volume(.33); tracks[1].volume(1)}
  else if (balance.value == 0)  {tracks[0].volume(1);  tracks[1].volume(1)}
  else if (balance.value == 1)  {tracks[0].volume(1);  tracks[1].volume(.33)}
  else if (balance.value == 2)  {tracks[0].volume(1);  tracks[1].volume(.1)}
  else if (balance.value == 3)  {tracks[0].volume(1);  tracks[1].volume(0)}
});

// Animation de la partition et du lecteur
function animate() {
  let curr = tracks[0].seek(this);
  let dur = tracks[0].duration();
  let avance = 0.5;

  if (tracks[0].state() === "loaded") currentTime.innerHTML = formatTime(curr);
  totalTime.innerHTML = formatTime(dur);
  titre.style =
    "background-image: linear-gradient(to right, gainsboro " +
    (curr / dur) * 100 +
    "%, white 0);";

  for (let i = 0; i < regions_pri.length; i++) {
    if (
      curr > regions_pri[i].start - avance &&
      curr < regions_pri[i].end - avance
    ) {
      let prevPagesH = previousPagesHeight_pri[regions_pri[i].page - 1];
      let currentPageH = pagesHeight_pri[regions_pri[i].page - 1];
      let currentPageOffset =
        pageOffsets_pri[regions_pri[i].page - 1][regions_pri[i].line - 1];
      pages_pri.style =
        "transform: translateY(-" +
        (prevPagesH + (currentPageH * currentPageOffset) / 100) +
        "px)";
    }
  }
  for (let i = 0; i < regions_sec.length; i++) {
    if (
      curr > regions_sec[i].start - avance &&
      curr < regions_sec[i].end - avance
    ) {
      let prevPagesH = previousPagesHeight_sec[regions_sec[i].page - 1];
      let currentPageH = pagesHeight_sec[regions_sec[i].page - 1];
      let currentPageOffset =
        pageOffsets_sec[regions_sec[i].page - 1][regions_sec[i].line - 1];
      pages_sec.style =
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

// Création du bouton métronome
function createMetronomeButton() {
  let newLabel = document.createElement("label");
  newLabel.setAttribute("for", "metronome");
  newLabel.innerText = "métronome";
  newLabel.style="flex-grow: 0.2;"
  let newInput = document.createElement("input");
  newInput.setAttribute("type", "checkbox");
  newInput.setAttribute("id", "metronome");
  newInput.addEventListener("click", function () {
    if (newInput.checked) {
      tracks[2].mute(false);
    } else {
      tracks[2].mute(true);
    }
  });
  document.querySelector("#mixer").appendChild(newLabel).appendChild(newInput);
}
// Création des marqueurs
function createTitreMarkers() {
  if (markers.length > 0) {
    let dur = tracks[0].duration();
    for (let marker of markers) {
      let newMarker = document.createElement("div");
      let newMarkerText = document.createElement("div");
      newMarker.classList.add("marker");
      newMarker.style = `left: ${(marker.time / dur) * 100}%;`;
      newMarkerText.classList.add("marker-text");
      newMarkerText.innerHTML = marker.text;
      document
        .querySelector("#titre")
        .appendChild(newMarker)
        .appendChild(newMarkerText);
    }
  }
}
function getTotalPreviousHeight(pageNbr, pagesHeight) {
  if (pageNbr === 1) return 0;
  let tempArray = pagesHeight.slice(0, pageNbr - 1);
  return tempArray.reduce((total, current) => {
    return total + current;
  });
}
