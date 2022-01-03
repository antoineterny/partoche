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
    titre.innerHTML = playlist[index].title
    animID = requestAnimationFrame(animate)

    // createVoiceButtons();
    createTitreMarkers()
    createMixetteControls(voices)

    // stopped = false;
    tracks[0].on("end", () => {
      pauseBtn.classList.remove("invisible")
      playBtn.classList.add("invisible")
      // cancelAnimationFrame(animID);
    })
  }
}

function createMixetteControls(voices) {
  voices.forEach(voice => {
    console.log(`voice`, voice, typeof voice)
    document.querySelector("#pages").innerHTML += `
      <div class="tranche" id="${voice}">
      <div class="slider-wrapper">
        <div class="slider-scale">
          <input
            class="volume-slider"
            type="range"
            id="volume-${voice}"
            min="0"
            max="100"
            value="100"
            oninput="updateVolume('${voice}')"
          />
        </div>
      </div>
      <label id="label-${voice}">100%</label>
      <div class="solo-mute-btns">
        <button class="solo-btn" id="solo-${voice}" onclick="soloVoice('${voice}')">S</button>
        <button class="mute-btn" id="mute-${voice}" onclick="muteVoice('${voice}')">M</button>
      </div>
      <p>${voice}</p>
    </div>`
  })
}

function soloVoice(voice) {
  document.getElementById(`solo-${voice}`).classList.toggle('soloed')
}
function muteVoice(voice) {
  document.getElementById(`mute-${voice}`).classList.toggle('muted')
}
function updateVolume(voice) {
  document.getElementById(`label-${voice}`).innerText = document.getElementById(`volume-${voice}`).value + "%"
}
