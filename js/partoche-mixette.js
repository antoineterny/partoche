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
      console.log(tracks[i]._src, "is loaded");
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

    // stopped = false;
    tracks[0].on("end", () => {
      pauseBtn.classList.remove("invisible")
      playBtn.classList.add("invisible")
      // cancelAnimationFrame(animID);
    })
  }
}
