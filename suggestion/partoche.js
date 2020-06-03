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
}

let pageOffsets = [];

async function init() {
    let markersRaw = await fetch('_regions_markers.csv')
    .then(response => { return response.text() })
    processCSV(markersRaw);

    let json = await fetch('suggestion.json')
    .then(function(response) { return response.json() })
    addPages(json);
}
init();
console.log("markers:",markers);
console.log("regions:",regions);

// Add images
const pages = document.querySelector('.pages');
let pagesHeight = [];
let previousPagesHeight = [0];
let pagesLoaded = 0;
function addPages(json) {
    for(let i=0; i<json.length; i++) {
        pageOffsets.push(json[i]);
    }
    for (let i=1; i<=pageOffsets.length; i++) {
        let newImg = document.createElement('img');
        newImg.onload = function() {
            pagesLoaded += 1;
            if (pagesLoaded == pageOffsets.length) {
                pagesHeight = [0].concat(Array.from(document.querySelectorAll('img')).map(x => x.height));
                for (let i=1; i<pagesHeight.length; i++) {
                    previousPagesHeight.push(previousPagesHeight[i-1] + pagesHeight[i]);
                }
                console.log("pagesHeight: ", pagesHeight);
                console.log("previousPagesHeight: ", previousPagesHeight);
            }
        }
        newImg.src = `page${[i]}.png`;
        pages.appendChild(newImg);
    }
}


console.log("pageMarkers:",pageMarkers);
console.log("pageOffsets:",pageOffsets);

// Passe à la ligne suivante plus tôt
let avance = .5;

// Conditions de décalage des pages
const audio = document.querySelector("audio");
audio.addEventListener('timeupdate', (event) => {
    for (let i=0; i<pageMarkers.length; i++) {
        if (audio.currentTime > (pageMarkers[i][0] - avance) && audio.currentTime < (pageMarkers[i][pageMarkers[i].length-1] - avance)) {
            for (j=0; j<pageMarkers[i]['length']; j++) {
                if (audio.currentTime > (pageMarkers[i][j] - avance) && audio.currentTime < (pageMarkers[i][j+1] - avance)) {
                    pages.style = "transform: translateY(-" + (previousPagesHeight[i] + pageOffsets[i][j]) + "px)"
                }
            }
        }
    }
});