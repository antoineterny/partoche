class Partoche {
  constructor(id, dataset) {
    this.id = id
    this.type = dataset.type
    this.mediaFile = `${id}/${id}.${dataset.format}`
    this.jsonFile = `${id}/${id}.json`
    this.csvFile = `${id}/${id}_regions_markers.csv`
    this.title = dataset.title
    this.regions = []
    this.markers = []
    this.pageOffsets = []
    this.pagesHeight = []
    // this.previousPagesHeight = []
    this.pagesLoaded = 0
  }
  totalPreviousHeight(pageNbr) {
    if (pageNbr === 1) return 0
    let tempArray = this.pagesHeight.slice(0, pageNbr - 1)
    return tempArray.reduce((total, current) => {
      return total + current
    })
  }
}

const partoche = document.querySelector("#partoche")
const player = partoche.querySelector("video")
player.onended = () => (player.currentTime = 0)
const menuItems = document.querySelectorAll(".menu-item")
let currentPartoche = {}

window.onload = () => {
  const newPartoche = new Partoche(menuItems[0].id, menuItems[0].dataset)
  player.src = newPartoche.mediaFile
  
  // Clic dans les flèches sur la partoche
  const flechegauche = partoche.querySelector(".flechegauche")
  const flechedroite = partoche.querySelector(".flechedroite")
  flechegauche.addEventListener("click", function () {
    flechegauche.style.opacity = 1
    setTimeout(() => {
      flechegauche.style.opacity = 0
    }, 50)
    previousRegion(newPartoche)
  })
  flechedroite.addEventListener("click", function () {
    flechedroite.style.opacity = 1
    setTimeout(() => {
      flechedroite.style.opacity = 0
    }, 50)
    nextRegion(newPartoche)
  })

  // Initialisation des données
  currentPartoche = newPartoche
  initData(currentPartoche)
  animate(currentPartoche)

  // Association des événements aux liens du menu
  document.querySelectorAll('.menu-item').forEach(menuItem => {
    menuItem.addEventListener('click', function() {
      const newPartoche = new Partoche(menuItem.id, menuItem.dataset)
      player.src = newPartoche.mediaFile

      // Initialisation des données
      partoche.querySelectorAll('img').forEach(img => img.remove())
      currentPartoche = newPartoche
      initData(currentPartoche)
      animate(currentPartoche)
    })
  })
}

function previousRegion(part) {
  let curr = player.currentTime
  if (curr < part.regions[0].end) {
    player.currentTime = 0
  } else {
    for (i = 1; i < part.regions.length; i++) {
      if (curr > part.regions[i].start && curr < part.regions[i].start + 1) {
        player.currentTime = part.regions[i - 1].start
      } else if (curr > part.regions[i].start && curr < part.regions[i].end) {
        player.currentTime = part.regions[i].start
      }
    }
  }
}
function nextRegion(part) {
  let curr = player.currentTime
  if (curr > part.regions[part.regions.length - 1].start) return
  for (let region of part.regions) {
    if (curr > region.start && curr < region.end) {
      player.currentTime = region.end
    }
  }
}

async function initData(part) {
  let regionsMarkersRaw = await fetch(part.csvFile).then(response => response.text())
  let regions = processRegionsMarkers(regionsMarkersRaw)[0]
  let markers = processRegionsMarkers(regionsMarkersRaw)[1]

  let pageOffsets = await fetch(part.jsonFile).then(response => response.json())
  part.regions = regions
  part.markers = markers
  part.pageOffsets = pageOffsets
  addPages(part)
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
function msToSeconds(ms) {
  let temp = ms.split(":")
  let minutes = Number(temp[0])
  let seconds = Number(temp[1])
  return minutes * 60 + seconds
}
function addPages(part) {
  const pages = partition.querySelector(".pages")
  let partitionWidth = getComputedStyle(partition).width
  for (let i = 1; i <= part.pageOffsets.length; i++) {
    let newImg = document.createElement("img")
    newImg.onload = function () {
      part.pagesLoaded += 1
      if (part.pagesLoaded == part.pageOffsets.length) {
        part.pagesHeight = Array.from(partition.querySelectorAll(".pages img")).map(x =>
          parseFloat(getComputedStyle(x).height)
        )
      }
    }
    newImg.src = `${part.id}/${part.id}_Page_${[i]}.png`
    newImg.style.width = partitionWidth
    newImg.setAttribute("id", `${part.id}-page${i}`)
    pages.appendChild(newImg)
  }
}

function animate() {
  let curr = player.currentTime
  let avance = 0.5
  const p = currentPartoche

  for (let i = 0; i < p.regions.length; i++) {
    if (curr > p.regions[i].start - avance && curr < p.regions[i].end - avance) {
      let prevPagesH = p.totalPreviousHeight(p.regions[i].page)
      let currentPageH = p.pagesHeight[p.regions[i].page - 1]
      let currentPageOffset = p.pageOffsets[p.regions[i].page - 1][p.regions[i].line - 1]
      partoche.querySelector(".pages").style =
        "transform: translateY(-" + (prevPagesH + (currentPageH * currentPageOffset) / 100) + "px)"
    }
  }
  requestAnimationFrame(animate)
}

function formatTime(rawSec) {
  let min = Math.floor((rawSec % 3600) / 60)
  let sec = Math.floor(rawSec % 60)
  min < 10 ? (min = "0" + min) : min
  sec < 10 ? (sec = "0" + sec) : sec
  return min + ":" + sec
}
