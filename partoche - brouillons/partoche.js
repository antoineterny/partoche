document.querySelector('.titreLong').innerHTML = titreLong;
document.querySelector('#lecteurAudio1').src = `${titreCourt}.mp3`;
document.querySelector('#lecteurAudio1').load();

let markers = ['0:00.000'];
let partocheImages = [];
async function init() {
    let markersRaw = await fetch('markers.csv')
        .then(response => { return response.text() })
    markersRaw = markersRaw.split(",");
    markersRaw = markersRaw.slice(6);
    let nbMarkers = Math.ceil(markersRaw.length/4);
    for (let i=0; i<nbMarkers; i++) {
        markers.push(markersRaw[i*4])
    }
    for (let i=0; i<markers.length; i++) {
        markers[i] = Number(markers[i].slice(2))
        partocheImages[i] = new Image();
        partocheImages[i].src = `slice${i+1}.png`
    }
    markers.push(999999)
    let max = (arr) => Math.max.apply(null, arr)
    let hauteurs = partocheImages.map(x => x.naturalHeight)
    document.querySelector(".partoche-viewer").style = `height:${max(hauteurs)*2}px`;
    stop(lecteurAudio1);
}
init();

function play(idPlayer, playBtn) {
    let player = document.querySelector('#' + idPlayer);
    if (player.paused) {
        player.play();
        playBtn.classList.remove("play-button");
        playBtn.classList.add("pause-button");
    } else {
        player.pause();
        playBtn.classList.remove("pause-button");
        playBtn.classList.add("play-button");
    }
}
function stop() {
    let player = document.querySelector('#lecteurAudio1');
    player.currentTime = 0;
    player.pause();
    let playBtn = document.querySelector("#button1");
    playBtn.classList.remove("pause-button");
    playBtn.classList.add("play-button");
}
function update(player) {
    var duration = player.duration;    // Durée totale
    var time     = player.currentTime; // Temps écoulé
    var fraction = time / duration;
    var percent  = fraction * 100;
    var progress = document.querySelector('#progressBar');
    let partoche1 = document.querySelector("#partoche1");
    let partoche2 = document.querySelector("#partoche2");

    progress.style.width = percent + '%';
    document.querySelector('#displayCurrentTime').innerHTML = formatTime(time);
    document.querySelector('#displayTotalTime').innerHTML = formatTime(duration);

    for (let i=0; i<markers.length; i++) {
        if (time > markers[markers.length-2] && time < markers[markers.length-1]) {
            partoche1.src = `slice${markers.length - 2}.png`;
            partoche2.src = `slice${markers.length - 1}.png`
        }
        else if (time > markers[i] && time < markers[i+1]) {
            partoche1.src = `slice${i+1}.png`;
            partoche2.src = `slice${i+2}.png`
        }
    }
}

function dessineReperes() {
    let player = document.querySelector('#lecteurAudio1');
    let progress = document.querySelector('#progressBarControl'); 
    var duration = player.duration;    // Durée totale
    for (let i=1; i<markers.length-1; i++) {
        var time = markers[i];
        console.log(time);
        var percent  = time / duration * 100;
        let divRepere = document.createElement("div");
        console.log(percent);
        divRepere.className = "repereLigne";
        divRepere.style = "width:" + percent + "%";
        progress.appendChild(divRepere);
    }
}

function formatTime(time) {
    var mins  = Math.floor((time % 3600) / 60);
    var secs  = Math.floor(time % 60);
    if (secs < 10) {
        secs = "0" + secs;
    }
    if (mins < 10) {
        mins = "0" + mins;
    }
    return mins + ":" + secs; // mm:ss
}
function getMousePosition(event) {
    return {
        x: event.pageX,
        y: event.pageY
    }
}
function getPosition(element){
    var top = 0, left = 0;
    do {
        top  += element.offsetTop;
        left += element.offsetLeft;
    } while (element = element.offsetParent);
    return { x: left, y: top };
}
function clickProgress(idPlayer, control, event) {
    var parent = getPosition(control);    // La position absolue de la progressBar
    var target = getMousePosition(event); // L'endroit de la progressBar où on a cliqué
    var player = document.querySelector('#' + idPlayer);

    var x = target.x - parent.x; 
    var wrapperWidth = document.querySelector('#progressBarControl').offsetWidth;
    
    var percent = (x / wrapperWidth) * 100;    
    var duration = player.duration;
    
    player.currentTime = (duration * percent) / 100;
}
dessineReperes();
