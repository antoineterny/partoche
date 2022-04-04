//================================
// Initialisation du lecteur Audio
//================================
const playBtn = document.querySelector("#playBtn")
const pauseBtn = document.querySelector("#pauseBtn")
const titre = document.querySelector("#titre")
const masque = document.querySelector("#masque")
let tracks = []
// let stopped;
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
      if (i != 0) tracks[i].mute(true)
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
    // playBtn.classList.remove("disabled", "playing");
    // playBtn.classList.add("paused");
    playBtn.classList.remove("disabled")
    document.querySelector("#arrows-group").classList.remove("disabled")
    titre.innerHTML = playlist[index].title
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

//============================
// Fonctions du lecteur audio
//============================
function play() {
  tracks.forEach(track => track.play())
  playBtn.classList.add("invisible")
  pauseBtn.classList.remove("invisible")
}
function pause() {
  tracks.forEach(track => track.pause())
  playBtn.classList.remove("invisible")
  pauseBtn.classList.add("invisible")
}
// function togglePlayPause() {
//   if (!tracks[0].playing()) {
//     playBtn.onclick = play();
//   } else {
//     playBtn.onclick = pause();
//   }
// }

function stop() {
  tracks.forEach(track => track.stop())
  playBtn.classList.remove("playing")
  playBtn.classList.add("paused")
  // cancelAnimationFrame(animID);
}
function prev() {
  stop()
  index -= 1
  if (index < 0) index = playlist.length - 1
  pages.style = "transition-duration: 0s;"
  initAudio(index)
  initData(index)
}
function next() {
  stop()
  index += 1
  if (index > playlist.length - 1) index = 0
  pages.style = "transition-duration: 0s;"
  initAudio(index)
  initData(index)
}
function backward(sec) {
  let curr = tracks[0].seek()
  if (curr < sec) curr = sec
  tracks.forEach(track => track.seek(curr - sec))
}
function forward(sec) {
  let curr = tracks[0].seek()
  tracks.forEach(track => track.seek(curr + sec))
}
function previousMarker() {
  let curr = tracks[0].seek()
  if (curr < markers[0].time + 1) {
    tracks.forEach(track => track.seek(0))
  } else if (
    curr > markers[markers.length - 1].time &&
    curr < markers[markers.length - 1].time + 1
  ) {
    tracks.forEach(track => track.seek(markers[markers.length - 2].time))
  } else if (curr > markers[markers.length - 1].time + 1) {
    tracks.forEach(track => track.seek(markers[markers.length - 1].time))
  } else {
    for (i = 0; i < markers.length - 1; i++) {
      if (curr > markers[i].time && curr < markers[i + 1].time) {
        if (curr < markers[i].time + 1) {
          tracks.forEach(track => track.seek(markers[i - 1].time))
        } else {
          tracks.forEach(track => track.seek(markers[i].time))
        }
      }
    }
  }
}
function nextMarker() {
  let curr = tracks[0].seek()
  if (curr < markers[0].time) {
    tracks.forEach(track => track.seek(markers[0].time))
  } else if (curr > markers[markers.length - 1].time) {
    return
  } else {
    for (i = 0; i < markers.length - 1; i++) {
      if (curr > markers[i].time && curr < markers[i + 1].time) {
        tracks.forEach(track => track.seek(markers[i + 1].time))
      }
    }
  }
}
function previousRegion() {
  let curr = tracks[0].seek()
  if (curr < regions[0].end) {
    tracks.forEach(track => track.seek(0))
  } else {
    for (i = 1; i < regions.length; i++) {
      if (curr > regions[i].start && curr < regions[i].start + 1) {
        tracks.forEach(track => track.seek(regions[i - 1].start))
      } else if (curr > regions[i].start && curr < regions[i].end) {
        tracks.forEach(track => track.seek(regions[i].start))
      }
    }
  }
}
function nextRegion() {
  let curr = tracks[0].seek()
  if (curr > regions[regions.length - 1].start) return
  for (let region of regions) {
    if (curr > region.start && curr < region.end) {
      tracks.forEach(track => track.seek(region.end))
    }
  }
}

//===========================
// Commandes du lecteur audio
//===========================
playBtn.addEventListener("click", () => play())
pauseBtn.addEventListener("click", () => pause())

// Raccourcis clavier
document.addEventListener("keydown", event => {
  if (event.code == "Space") {
    event.preventDefault()
    tracks[0].playing() ? pause() : play()
  }
  if (event.code == "ArrowLeft") {
    event.preventDefault()
    backward(3)
  }
  if (event.code == "ArrowRight") {
    event.preventDefault()
    forward(3)
  }
  if (event.code == "ArrowUp") {
    event.preventDefault()
    previousRegion()
  }
  if (event.code == "ArrowDown") {
    event.preventDefault()
    nextRegion()
  }
})

// Clic dans la barre de titre
titre.addEventListener("click", event => {
  let width = parseFloat(window.getComputedStyle(titre).width)
  let time = (event.offsetX / width) * tracks[0].duration()
  tracks.forEach(track => track.seek(time))
  if (tracks[0].playing() === false) play()
})

// Clic dans les flèches sur la partoche
const flechegauche = document.querySelector("#flechegauche")
const flechedroite = document.querySelector("#flechedroite")
flechegauche.addEventListener("click", function () {
  if (document.querySelector("#menu").classList.contains("visible")) return
  flechegauche.style.opacity = 1
  setTimeout(() => {
    flechegauche.style.opacity = 0
  }, 100)
  previousRegion()
})
flechedroite.addEventListener("click", function () {
  if (document.querySelector("#menu").classList.contains("visible")) return
  flechedroite.style.opacity = 1
  setTimeout(() => {
    flechedroite.style.opacity = 0
  }, 100)
  nextRegion()
})
