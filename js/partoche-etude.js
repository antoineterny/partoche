// Lecture des fichiers csv (regions et markers), json (décalages de page), stabiloJson
async function initData(index) {
  let fileName = playlist[index].fileName

  let regionsMarkersRaw = await fetch(`${fileName}/${fileName}_regions_markers.csv`).then(
    response => response.text()
  )
  regions = processRegionsMarkers(regionsMarkersRaw)[0]
  markers = processRegionsMarkers(regionsMarkersRaw)[1]

  let json = await fetch(`${morceau}.json`).then(function (response) {
    return response.json()
  })
  pageOffsets = json
  addPages()
}

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
    newImg.src = `${morceau}_Page_${[i]}.png`
    newImg.style.width = partocheWidth
    newImg.setAttribute("id", `page${i}`)
    pages.appendChild(newImg)
  }

}

function initAudio(index) {
  masque.style = "display: flex"
  pauseBtn.classList.add("invisible")
  playBtn.classList.remove("invisible")
  document.querySelector("#arrows-group").classList.add("disabled")
  titre.innerHTML = "<i>juste un instant, je charge...</i>"
  for (let i in tracks) {
    if (tracks[i]) {
      tracks[i].unload()
      // console.log(tracks[i]._src, "is unloaded");
    }
  }
  tracks = []

  let fileName = playlist[index].fileName
  let voices = playlist[index].voices
  let format = playlist[index].format
  let loadedTracks = 0
  if (voices) {
    for (let i = 0; i < voices.length; i++) {
      tracks[i] = new Howl({
        src: [`${fileName}/${fileName}_${voices[i]}.${format}`],
      })
      tracks[i]["data-voice"] = voices[i]
    }
  } else {
    tracks[0] = new Howl({
      src: [`${fileName}/${fileName}.${format}`],
    })
  }

  for (let i = 0; i < tracks.length; i++) {
    tracks[i].on("load", function () {
      // if (i != 0) tracks[i].mute(true)
      // console.log(tracks[i]._src, "is loaded");
      loadedTracks += 1
      onceAudioLoaded()
    })
  }
  function onceAudioLoaded() {
    if (loadedTracks < tracks.length) return
    masque.style = "display: none"
    playBtn.disabled = false
    pauseBtn.disabled = false
    playBtn.classList.remove("disabled")
    document.querySelector("#arrows-group").classList.remove("disabled")
    titre.innerText = playlist[index].title
    animID = requestAnimationFrame(animate)

    // createVoiceButtons();
    createTitreMarkers()

    // stopped = false;
    tracks[0].on("end", () => {
      pauseBtn.classList.add("invisible")
      playBtn.classList.remove("invisible")
      // cancelAnimationFrame(animID);
    })
  }
}

//Gestion du mixage
const metronomeCheckbox = document.querySelector("#metronome")
metronomeCheckbox.addEventListener("click", function () {
  if (metronomeCheckbox.checked) {
    tracks[2].mute(false)
  } else {
    tracks[2].mute(true)
  }
})
const balance = document.querySelector("#balance")
balance.addEventListener("input", () => {
  if (balance.value == -3) {
    tracks[0].volume(0)
    tracks[1].volume(1)
  } else if (balance.value == -2) {
    tracks[0].volume(0.1)
    tracks[1].volume(1)
  } else if (balance.value == -1) {
    tracks[0].volume(0.3)
    tracks[1].volume(1)
  } else if (balance.value == 0) {
    tracks[0].volume(1)
    tracks[1].volume(1)
  } else if (balance.value == 1) {
    tracks[0].volume(1)
    tracks[1].volume(0.3)
  } else if (balance.value == 2) {
    tracks[0].volume(1)
    tracks[1].volume(0.1)
  } else if (balance.value == 3) {
    tracks[0].volume(1)
    tracks[1].volume(0)
  }
})

// Création des marqueurs
function createTitreMarkers() {
  document.querySelectorAll(".marker").forEach(x => x.remove())
  document.querySelectorAll(".marker-text").forEach(x => x.remove())
  if (markers.length > 0) {
    let dur = tracks[0].duration()
    for (let marker of markers) {

      document.querySelector("#titre").innerHTML += `
        <div class="marker" style="left: ${(marker.time / dur) * 100}%;"></div>`
      document.querySelector("#marqueurs").innerHTML += `
        <div class="marker-text" style="left: ${(marker.time / dur) * 100}%;">${aLa}=${
        marker.text
      }</div>`
    }
  }
}

