function createVoiceButtons(index) {
  document.querySelectorAll("#mixer label").forEach(x => x.remove())
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
        document.querySelectorAll("#mixer label").forEach(function(label) {
          if (label != e.target) {
            label.classList.remove("checked");
          } else {
            e.target.classList.toggle("checked");
          }
          let allStabilo = document.querySelectorAll(".stabilo");
          if(label.classList.value === "checked") {
            tracks.forEach(tr => {
              if (tr["data-voice"] === label.attributes["data-voice"].value) {
                tr.mute(false);
              } 
            })
            allStabilo.forEach(st => {
              let stabiloVoice = st.getAttribute("data-voice");
              if (stabiloVoice === label.attributes["data-voice"].value) {
                st.classList.remove("invisible");
              } 
            });
          } else {
            tracks.forEach((tr) => {
              if (tr["data-voice"] === label.attributes["data-voice"].value) {
                tr.mute(true);
              }
              allStabilo.forEach(st => {
                let stabiloVoice = st.getAttribute("data-voice");
                if (stabiloVoice === label.attributes["data-voice"].value) {
                  st.classList.add("invisible");
                } 
              });
            });
          }
        });
      })
      mixer.append(newVoiceBtn);
    }
  }
}