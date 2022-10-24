let index
window.onload = () => {
  initMenu()
}

window.onresize = function () {
  console.log(
    "width:",
    window.innerWidth,
    "height:",
    window.innerHeight,
    "ratio:",
    window.innerWidth / window.innerHeight
  )
  if (index !== undefined) {
    initData(index)
    // createVoiceButtons(index);
    // addStabilo();
    // restoreVoiceButtonsState()
  }
}

//=================
// Création du menu
//=================
function initMenu() {
  const menu = document.querySelector("#menu")
  menu.innerHTML = ""
  for (let i = 0; i < playlist.length; i++) {
    let newP = document.createElement("p")
    newP.innerHTML = playlist[i].title
    newP.addEventListener("click", () => {
      index = i
      initAudio(i)
      initData(i)
      // createVoiceButtons(i);
      toggleMenu()
    })
    menu.append(newP)
  }
  let partocheHeight = parseInt(getComputedStyle(partoche).height)
  menu.style = `max-height: ${partocheHeight}px`
  toggleMenu()
}
function toggleMenu() {
  document.querySelectorAll(".fleche").forEach(x => x.classList.toggle("invisible"))
  menu.classList.toggle("visible")
}

//=================================================
// Traitement du CSV contenant régions et marqueurs
//=================================================
let regions = []
let markers = []
let pageOffsets = []

// Lecture des fichiers csv (regions et markers), json (décalages de page), stabiloJson
async function initData(index) {
  let fileName = playlist[index].fileName

  let regionsMarkersRaw = await fetch(`${fileName}/${fileName}_regions_markers.csv`).then(
    response => response.text()
  )
  regions = processRegionsMarkers(regionsMarkersRaw)[0]
  markers = processRegionsMarkers(regionsMarkersRaw)[1]

  // Juste une exception pour partoche-mixette
  if (typeof partocheType === "undefined") {
    let json = await fetch(`${fileName}/${fileName}.json`).then(function (response) {
      return response.json()
    })
    pageOffsets = json
    addPages()
  }
}

function processRegionsMarkers(csv) {
  let lines = csv.split(/\r\n|\n/)
  let tempRegions = []
  let tempMarkers = []
  for (let i = 0; i < lines.length; i++) {
    lines[i] = lines[i].split(",")
    lines[i][0] = lines[i][0].slice(0, 1)
    if (lines[i][0] == "R") {
      let temp = {}
      lines[i][1] = lines[i][1].split("-")
      temp.start = msToSeconds(lines[i][2])
      temp.end = msToSeconds(lines[i][3])
      temp.page = Number(lines[i][1][0])
      temp.line = Number(lines[i][1][1])
      tempRegions.push(temp)
    } else if (lines[i][0] == "M") {
      let temp = {}
      temp.text = lines[i][1]
      temp.time = msToSeconds(lines[i][2])
      tempMarkers.push(temp)
    }
  }
  return [tempRegions, tempMarkers]
}

// Ajout des images
const pages = document.querySelector("#pages")
const partoche = document.querySelector("#partoche")
let pagesHeight = []
let previousPagesHeight = []
let pagesLoaded = 0
function addPages() {
  document.querySelectorAll("#pages img").forEach(x => x.remove())
  let partocheWidth = getComputedStyle(partoche).width
  pagesHeight = []
  previousPagesHeight = []
  pagesLoaded = 0
  for (let i = 1; i <= pageOffsets.length; i++) {
    let newImg = document.createElement("img")
    newImg.onload = function () {
      pagesLoaded += 1
      if (pagesLoaded == pageOffsets.length) {
        pagesHeight = Array.from(document.querySelectorAll("#pages img")).map(x =>
          parseFloat(getComputedStyle(x).height)
        )
        for (let i = 0; i < pagesHeight.length; i++) {
          previousPagesHeight.push(getTotalPreviousHeight(i + 1))
        }
      }
    }
    newImg.src = `${playlist[index].fileName}/${playlist[index].fileName}_Page_${[i]}.png`
    newImg.style.width = partocheWidth
    newImg.setAttribute("id", `page${i}`)
    pages.appendChild(newImg)
  }
  // addStabilo positionne les stabilos en fonction de la hauteur des pages
  // addStabilo();
}

// Ajout des marqueurs s'il y en a
function createTitreMarkers() {
  document.querySelectorAll(".marker").forEach(x => x.remove())
  document.querySelectorAll(".marker-text").forEach(x => x.remove())
  if (markers.length === 0) {
    // document.querySelector("#previousMarkerBtn").classList.add("disabled")
    document.querySelector("#nextMarkerBtn").classList.add("disabled")
    markers[0] = { time: 0 }
  } else {
    document.querySelector("#previousMarkerBtn").classList.remove("disabled")
    document.querySelector("#nextMarkerBtn").classList.remove("disabled")
    let dur = tracks[0].duration()
    for (let marker of markers) {
      document.querySelector("#titre").innerHTML += `
        <div class="marker" style="left: ${(marker.time / dur) * 100}%;"></div>`
      document.querySelector("#marqueurs").innerHTML += `
        <div class="marker-text" style="left: ${(marker.time / dur) * 100}%;">${marker.text}</div>`
    }
  }
}

//========================================
// Animation de la partition et du lecteur
//========================================
function animate() {
  let curr = tracks[0].seek()
  let dur = tracks[0].duration()
  let avance = 0.5

  if (tracks[0].state() === "loaded") currentTime.innerHTML = formatTime(curr)
  totalTime.innerHTML = formatTime(dur)
  titre.style =
    "background-image: linear-gradient(to right, var(--accent) " +
    (curr / dur) * 100 +
    "%, white 0);"

  for (let i = 0; i < regions.length; i++) {
    if (curr >= regions[i].start - avance && curr < regions[i].end - avance) {
      let prevPagesH = previousPagesHeight[regions[i].page - 1]
      let currentPageH = pagesHeight[regions[i].page - 1]
      let currentPageOffset = pageOffsets[regions[i].page - 1][regions[i].line - 1]
      pages.style =
        "transform: translateY(-" + (prevPagesH + (currentPageH * currentPageOffset) / 100) + "px)"
    }
  }

  animID = requestAnimationFrame(animate)
}

//======================
// Fonctions utilitaires
//======================
function getTotalPreviousHeight(pageNbr) {
  if (pageNbr === 1) return 0
  let tempArray = pagesHeight.slice(0, pageNbr - 1)
  return tempArray.reduce((total, current) => {
    return total + current
  })
}
function formatTime(rawSec) {
  let min = Math.floor((rawSec % 3600) / 60)
  let sec = Math.floor(rawSec % 60)
  min < 10 ? (min = "0" + min) : min
  sec < 10 ? (sec = "0" + sec) : sec
  return min + ":" + sec
}
function exactTime(rawSec) {
  let min = Math.floor((rawSec % 3600) / 60)
  let sec = (rawSec % 60).toFixed(3)
  sec < 10 ? (sec = "0" + sec) : sec
  return min + ":" + sec
}
function msToSeconds(ms) {
  let temp = ms.split(":")
  let minutes = Number(temp[0])
  let seconds = Number(temp[1])
  return minutes * 60 + seconds
}
