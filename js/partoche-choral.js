window.onresize = function () {
  if (index !== undefined) {
    addPages()
    // initStabilo(index)
    // createVoiceButtons(index);
    // restoreVoiceButtonsState()
  }
} 

//=================
// Création du menu
//=================
function initMenu() {
  const menu = document.querySelector("#menu");
  menu.innerHTML = "";
  for (let i = 0; i < playlist.length; i++) {
    let newP = document.createElement("p");
    newP.innerHTML = playlist[i].title;
    newP.addEventListener("click", () => {
      index = i;
      initAudio(i);
      initData(i);
      initStabilo(i);
      createVoiceButtons(i);
      toggleMenu();
    });
    document.querySelector("#menu").append(newP);
  }
  let partocheHeight = parseInt(getComputedStyle(partoche).height);
  menu.style = `max-height: ${partocheHeight}px;`;
  toggleMenu();
}

//=================================
// Traitement du json des marqueurs
//=================================
let stabilo = {};

async function initStabilo(index) {
  let fileName = playlist[index].fileName

  let stabiloJson = await fetch(`${fileName}/${fileName}_stabilo.json`).then(
    function (response) {
      return response.json()
    }
  )
  stabilo = stabiloJson
}

//===================================
// Ajout des images puis des stabilos
//===================================
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
        pagesHeight = Array.from(
          document.querySelectorAll("#pages img")
        ).map(x => parseFloat(getComputedStyle(x).height))
        for (let i = 0; i < pagesHeight.length; i++) {
          previousPagesHeight.push(getTotalPreviousHeight(i + 1))
        }
      }
    }
    newImg.src = `${playlist[index].fileName}/${
      playlist[index].fileName
    }_Page_${[i]}.png`
    newImg.style.width = partocheWidth
    newImg.setAttribute("id", `page${i}`)
    pages.appendChild(newImg)
  }
  // addStabilo positionne les stabilos en fonction de la hauteur des pages
  addStabilo()
}


//=================================
// Création des boutons et stabilos
//=================================
function createVoiceButtons(index) {
  document.querySelectorAll("#mixer label").forEach((x) => x.remove());
  const mixer = document.querySelector("#mixer");
  let voices = playlist[index].voices;
  let pupitre;
  for(i=0; i<voices.length; i++){
    if (voices[i].match(/sop/g)) {pupitre = "sop"}
    else if (voices[i].match(/alt/g)) {pupitre = "alt"}
    else if (voices[i].match(/ten/g)) {pupitre = "ten"}
    else if (voices[i].match(/bas/g)) {pupitre = "bas"};
    let numero = voices[i].match(/[1-9]/g);
    if(numero) pupitre += ` ${numero[0]}`;
    
    if(pupitre) {
      let newVoiceBtn = document.createElement("label");
      newVoiceBtn.setAttribute("data-voice", voices[i]);
      newVoiceBtn.innerText = pupitre;
      newVoiceBtn.addEventListener("click", function(e) {
        e.target.classList.toggle("checked")
        let allStabilo = document.querySelectorAll(".stabilo")
        // Mute ou non les pistes et affiche ou non les stabilos
        if (e.target.classList.value === "checked") {
          tracks.forEach(tr => {
            if (tr["data-voice"] === e.target.attributes["data-voice"].value) {
              tr.mute(false)
            }
          })
          allStabilo.forEach(st => {
            let stabiloVoice = st.getAttribute("data-voice")
            if (stabiloVoice === e.target.attributes["data-voice"].value) {
              st.classList.remove("invisible")
            }
          })
        } else {
          tracks.forEach(tr => {
            if (tr["data-voice"] === e.target.attributes["data-voice"].value) {
              tr.mute(true)
            }
            allStabilo.forEach(st => {
              let stabiloVoice = st.getAttribute("data-voice")
              if (stabiloVoice === e.target.attributes["data-voice"].value) {
                st.classList.add("invisible")
              }
            })
          })
        }
        // Ajuste le volume des pistes de voix s'il y en a plusieurs à jouer
        let allLabels = document.querySelectorAll("#mixer label")
        let activeLabels = 0
        allLabels.forEach(label => {
          if (label.classList.value === "checked") activeLabels++
        })
        if (activeLabels === 1) {
          tracks.forEach(tr => tr.volume(1))
        } else {
          // TODO : affiner la formule du volume
          const volume = 1 - activeLabels / 10
          tracks.forEach((tr, i) => {
            if (i > 0) tr.volume(volume)
          })
        }
      })
      mixer.append(newVoiceBtn);
    }
  }
}

// Visiblement ne sert plus à rien :-)
// function restoreVoiceButtonsState() {
//   console.log("restoreVoiceButtonsState fired")
//   for (let tr of tracks) {
//     if (tr._muted === false) {
//       document.querySelectorAll("#mixer label").forEach((label) => {
//         if (label.getAttribute("data-voice") === tr["data-voice"]) {
//           label.classList.add("checked");
//         }
//       });
//     }
//   }
// }

function addStabilo() {
  if (pagesLoaded !== pageOffsets.length) {
    setTimeout(addStabilo, 150)
  } else {
    document.querySelectorAll(".stabilo").forEach(x => x.remove())
    Object.keys(stabilo).forEach(voix => {
      for (let i in stabilo[voix]) {
        for (let j in stabilo[voix][i]) {
          let newStabiloDiv = document.createElement("div")
          let newDivTop =
            previousPagesHeight[i] +
            (pagesHeight[i] * stabilo[voix][i][j]) / 100
          newStabiloDiv.classList.add(
            "stabilo",
            `${voix.slice(0, 3)}`,
            "invisible"
          )
          newStabiloDiv.setAttribute("data-voice", voix)
          newStabiloDiv.style = `top: ${newDivTop}px; height: 20px`
          for (let tr of tracks) {
            if (
              tr["data-voice"] === voix &&
              tr.state() === "loaded" &&
              tr._muted === false
            ) {
              newStabiloDiv.classList.remove("invisible")
            }
          }
          pages.prepend(newStabiloDiv)
        }
      }
    })
  }
}
