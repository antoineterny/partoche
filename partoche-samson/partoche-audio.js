//================================
// Initialisation du lecteur Audio
//================================
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
      src: [`${fileName}/${fileName}_${voices[i]}.${format}`],
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

//============================
// Fonctions du lecteur audio
//============================
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
  let curr = tracks[0].seek();
  tracks.forEach((track) => track.seek(curr + 5));
}
function backward() {
  let curr = tracks[0].seek();
  if (curr < 5) curr = 5;
  tracks.forEach((track) => track.seek(curr - 5));
}
function nextMarker() {
  let curr = tracks[0].seek();
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
  let curr = tracks[0].seek();
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

//===========================
// Commandes du lecteur audio
//===========================
playBtn.addEventListener("click", () => togglePlayPause());

// Raccourcis clavier
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

// Clic dans la barre de titre
titre.addEventListener("click", (event) => {
  let width = parseFloat(window.getComputedStyle(titre).width);
  let time = (event.offsetX / width) * tracks[0].duration();
  tracks.forEach((track) => track.seek(time));
  if (tracks[0].playing() === false) play();
});

// Clic dans la partoche
partoche.addEventListener("click", (event) => {
  let width = parseFloat(window.getComputedStyle(partoche).width);
  if (!menu.classList.contains("visible")) {
    if (event.offsetX / width < 0.33) {
      backward();
    } else if (event.offsetX / width > 0.66) {
      forward();
    }
  }
});
