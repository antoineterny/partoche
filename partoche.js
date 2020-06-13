//Définition des morceaux
const playlist = [
    {
        titre: "novelette1",
        description: "Poulenc - Novelette n°1 <em>(Francis Poulenc, piano)</em>",
        avance: "0.5"
    },
    {
        titre: "vision09",
        description: "Prokofiev - Vision fugitive n°9 <em>(Serge Prokofiev, piano)</em>",
        avance: "0.5"
    },
    {
        titre: "suggestion",
        description: "Prokofiev - Suggestion diabolique, Op.4 n°4 <em>(Serge Prokofiev, piano)</em>",
        avance: "0.5"
    },
    {
        titre: "jennsrag",
        description: "Jenn's Rag",
        avance: "0.6"
    },
];
const audio = document.querySelector("audio");
const titre = document.querySelector(".boutons h2");

// Chargement de premier morceau
let index = 0;
loadAudio(index);
init(playlist[0].titre);

//Ecriture des liens
const ecrirePlaylist = playlist => {
    document.querySelector('.playlist').innerHTML = "";
    for (i=0; i<playlist.length; i++) {
        document.querySelector('.playlist').innerHTML += 
            `<a href="#" onclick="changeMorceau(${i});">${playlist[i].description}</a><br>`
    }
}
ecrirePlaylist(playlist);

// Update song details
function loadAudio(index) {
    titre.innerHTML = playlist[index].description;
    audio.src = `${playlist[index].titre}/${playlist[index].titre}.ogg`;
    avance = Number(playlist[index].avance); 
}

// Read markers & regions
function convertToSeconds(ms) {
    let temp = ms.split(':');
    let minutes = Number(temp[0]);
    let seconds = Number(temp[1]);
    return Number(((minutes * 60) + seconds).toFixed(3))
}

let markers = [];
let regions = [];
let pageMarkers = [];
function processCSV(csv) {
    let lines = csv.split(/\r\n|\n/);
    for (let i=0; i<lines.length; i++) {
      lines[i] = lines[i].split(',');
      lines[i][0] = lines[i][0].slice(0,1);
      if (lines[i][0] == "M") {
        markers.push(convertToSeconds(lines[i][2]));
      }
      else if (lines[i][0] == "R") {
        let temp = {};
        temp.start = convertToSeconds(lines[i][2]);
        temp.end = convertToSeconds(lines[i][3]);
        regions.push(temp);
      }
    };
    for (let i=0; i<regions.length; i++) {
        let temp = [];
        temp.push(regions[i]['start']);
        for (let j=0; j<markers.length; j++) {
            if (markers[j] > regions[i]['start'] && markers[j] < regions[i]['end']) {
                temp.push(markers[j]);
            }
        }
        temp.push(regions[i]['end']);
        pageMarkers.push(temp);
    }
    console.log("markers:", markers);
    console.log("regions:", regions);
}

let pageOffsets = [];

async function init(titre) {
    markers = [];
    regions = [];
    pageMarkers = [];
    let markersRaw = await fetch(`${titre}/_regions_markers.csv`)
    .then(response => { return response.text() })
    processCSV(markersRaw);

    let json = await fetch(`${titre}/${titre}.json`)
    .then(function(response) { return response.json() })
    addPages(json);
}
init(playlist[0].titre);

// Add images
const pages = document.querySelector('.pages');
let pagesHeight = [];
let previousPagesHeight = [0];
let pagesLoaded = 0;
function addPages(json) {
    pages.innerHTML = '';
    pagesHeight = [];
    previousPagesHeight = [0];
    pagesLoaded = 0;
    pageOffsets = [];
    for(let i=0; i<json.length; i++) {
        pageOffsets.push(json[i]);
    }
    for (let i=1; i<=pageOffsets.length; i++) {
        let newImg = document.createElement('img');
        newImg.onload = function() {
            pagesLoaded += 1;
            if (pagesLoaded == pageOffsets.length) {
                pagesHeight = [0].concat(Array.from(document.querySelectorAll('img'))
                                 .map(x => x.height));
                for (let i=1; i<pagesHeight.length; i++) {
                    previousPagesHeight.push(previousPagesHeight[i-1] + pagesHeight[i]);
                }
                console.log("pagesHeight: ", pagesHeight);
                console.log("previousPagesHeight: ", previousPagesHeight);
            }
        }
        newImg.src = `${playlist[index].titre}/page${[i]}.png`;
        pages.appendChild(newImg);
    }
    console.log("pageMarkers:",pageMarkers);
    console.log("pageOffsets:",pageOffsets);
    progression.innerHTML = "";
    for (i=0; i<regions.length-1; i++) {
        let largeur = (regions[i].end / regions[regions.length - 1].end * 958);
        console.log("largeur", i, largeur)
        progression.innerHTML += 
        `<div class="delimiteurRegion" style="left: ${largeur}px;"></div>`
    }
}

// Décalage des pages et du curseur
const curseur = document.getElementById('curseur');
function formatTime(time) {
    var mins = Math.floor((time % 3600) / 60);
    var secs = Math.floor(time % 60);
    if (secs < 10) {
        secs = "0" + secs;
    }
    if (mins < 10) {
        mins = "0" + mins;
    }
    return mins + ":" + secs; // mm:ss
}
audio.addEventListener('timeupdate', (event) => {
    for (let i=0; i<pageMarkers.length; i++) {
        if (audio.currentTime > (pageMarkers[i][0] - avance) 
            && audio.currentTime < (pageMarkers[i][pageMarkers[i].length-1] - avance)) {
            for (j=0; j<pageMarkers[i]['length']; j++) {
                if (audio.currentTime > (pageMarkers[i][j] - avance) 
                    && audio.currentTime < (pageMarkers[i][j+1] - avance)) {
                        pages.style = "transform: translateY(-" 
                        + (previousPagesHeight[i] + pageOffsets[i][j]) 
                        + "px)"
                }
            }
        }
    }
    // TODO: rendre le déplacement plus fluide
    curseur.style = "left:" + (audio.currentTime / audio.duration * 958 + 12) + "px";
    document.querySelector('#tempsCourant').innerText = formatTime(audio.currentTime); 
    // TODO: faire afficher le temps total avant la lecture !!!
    document.querySelector('#tempsTotal').innerText = formatTime(audio.duration);
});

// Lecteur audio
const btn1 = document.querySelector("#btn1");
btn1.addEventListener('click', function() {
    if (audio.paused || audio.ended) {
        audio.play();
        btn1.classList.remove("play");
        btn1.classList.add("pause");
    }
    else {
        audio.pause();
        btn1.classList.remove("pause");
        btn1.classList.add("play");
    }
});
document.querySelector('#stop').addEventListener('click', function() {
    audio.pause();
    audio.currentTime = 0;
    btn1.classList.remove("pause");
    btn1.classList.add("play");
})
document.querySelector('#prev').addEventListener('click', function() {
    index--;
    if (index < 0) {
        index = (playlist.length - 1);
    }
    changeMorceau(index);
})
document.querySelector('#next').addEventListener('click', function() {
    index++;
    if (index > (playlist.length - 1)) {
        index = 0;
    }
    changeMorceau(index);
})
function changeMorceau(index) {
    loadAudio(index);
    init(playlist[index].titre);
    audio.play();
    btn1.classList.remove("play");
    btn1.classList.add("pause");
}
// Barre de progression cliquable
// TODO : rendre draggable
document.getElementById('progression').addEventListener('click', function(e) {
    audio.currentTime = e.offsetX / this.clientWidth * audio.duration;
})