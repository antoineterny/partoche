class Partoche {
	constructor(id, dataset) {
		this.id = id;
		this.type = dataset.type;
		this.mediaFile = `${id}.${dataset.format}`;
		this.jsonFile = `${id}.json`;
		this.csvFile = `${id}_regions_markers.csv`;
		this.title = dataset.title;
		this.regions = [];
		this.markers = [];
		this.pageOffsets = [];
		this.pagesHeight = [];
		// this.previousPagesHeight = []
		this.pagesLoaded = 0;
	}
	totalPreviousHeight(pageNbr) {
		if (pageNbr === 1) return 0;
		let tempArray = this.pagesHeight.slice(0, pageNbr - 1);
		return tempArray.reduce((total, current) => {
			return total + current;
		});
	}
}

const allPartoches = [];

window.onload = () => {
	const partocheInstances = document.querySelectorAll('.partoche');
	partocheInstances.forEach(partocheDiv => {
		// Création objet Partoche
		const newPartoche = new Partoche(partocheDiv.id, partocheDiv.dataset);
		if (partocheDiv.getAttribute('data-type') === 'audio') {
			partocheDiv.innerHTML = `<div class="lecteur"><div class="play-group"><div class="controls-group"> <button class="playBtn paused"></button> <button class="stopBtn"></button></div><div class="time-group"><div class="currentTime time">00:00</div><div class="time"> / </div><div class="totalTime time">00:00</div></div></div><div class="main-group"><div class="titre">${partocheDiv.dataset.title}</div></div></div><div class="partition cadre" style="height: 180px;"><div class="pages"></div><div class="fleche flechegauche">↸</div><div class="fleche flechedroite">↵</div></div>`;
			// Création audio player
			const newAudioPlayer = document.createElement('audio');
			newAudioPlayer.setAttribute('src', newPartoche.mediaFile);
			newAudioPlayer.setAttribute('id', `${newPartoche.id}-player`);
			newAudioPlayer.setAttribute('preload', 'metadata');
			newAudioPlayer.onended = () => {
				newAudioPlayer.currentTime = 0;
				newAudioPlayer.parentNode
					.querySelector('.playBtn')
					.classList.remove('playing');
				newAudioPlayer.parentNode
					.querySelector('.playBtn')
					.classList.add('paused');
			};
			newAudioPlayer.onpause = () => {
				newAudioPlayer.parentNode
					.querySelector('.playBtn')
					.classList.remove('playing');
				newAudioPlayer.parentNode
					.querySelector('.playBtn')
					.classList.add('paused');
			};
			newAudioPlayer.onplay = event => {
				const allPlayers = document.querySelectorAll('video, audio');
				allPlayers.forEach(player => {
					if (player.id !== event.target.getAttribute('id'))
						player.pause();
				});
			};
			partocheDiv
				.querySelector('.controls-group')
				.appendChild(newAudioPlayer);
			// Association du bouton play-pause
			const playBtn = partocheDiv.querySelector('.playBtn');
			const stopBtn = partocheDiv.querySelector('.stopBtn');
			playBtn.addEventListener(
				'click',
				togglePlayPause.bind(newAudioPlayer)
			);
			stopBtn.addEventListener('click', () => {
				newAudioPlayer.pause();
				newAudioPlayer.currentTime = 0;
			});
			// Association de la barre de titre
			const titre = partocheDiv.querySelector('.titre');
			titre.addEventListener('click', event => {
				let width = parseFloat(window.getComputedStyle(titre).width);
				let time = (event.offsetX / width) * newAudioPlayer.duration;
				const playBtn = event.target.parentNode.parentNode.querySelector(
					'.playBtn'
				);
				playBtn.classList.remove('paused');
				playBtn.classList.add('playing');
				newAudioPlayer.currentTime = time;
				if (newAudioPlayer.paused) newAudioPlayer.play();
			});
		} else if (
      partocheDiv.getAttribute("data-type") === "video" ||
      partocheDiv.getAttribute("data-type") === "video-dessus"
    ) {
      partocheDiv.innerHTML = `<div class="partition cadre" style="height: 300px;"><div class="pages"></div><div class="fleche flechegauche">↸</div><div class="fleche flechedroite">↵</div></div>`
      // Création video player
      const newVideoPlayer = document.createElement("video")
      newVideoPlayer.setAttribute("src", newPartoche.mediaFile)
      newVideoPlayer.setAttribute("id", `${newPartoche.id}-player`)
      newVideoPlayer.setAttribute("controls", true)
      newVideoPlayer.onended = () => (newVideoPlayer.currentTime = 0)
      newVideoPlayer.onplay = event => {
        const allPlayers = document.querySelectorAll("video, audio")
        allPlayers.forEach(player => {
          if (player.id !== event.target.getAttribute("id")) player.pause()
        })
      }
      if (partocheDiv.getAttribute("data-type") === "video-dessus") {
        partocheDiv.prepend(newVideoPlayer)
      } else {
        partocheDiv.append(newVideoPlayer)
      }
    } else {
      console.log('Il faut mettre un data-type="video" ou data-type="audio" à la div .partoche')
    }

		// Clic dans les flèches sur la partoche
		const flechegauche = partocheDiv.querySelector('.flechegauche');
		const flechedroite = partocheDiv.querySelector('.flechedroite');
		flechegauche.addEventListener('click', function () {
			flechegauche.style.opacity = 1;
			setTimeout(() => {
				flechegauche.style.opacity = 0;
			}, 50);
			previousRegion(newPartoche);
		});
		flechedroite.addEventListener('click', function () {
			flechedroite.style.opacity = 1;
			setTimeout(() => {
				flechedroite.style.opacity = 0;
			}, 50);
			nextRegion(newPartoche);
		});

		// Initialisation des données
		initData(newPartoche);
		allPartoches.push(newPartoche);
	});
	// setInterval(function waitForAudio() {
	// 	if (document.querySelector('audio, video').readyState !== 4) {
	// 		waitForAudio();
	// 	} else {
			animate();
	// 		return;
	// 	}
	// }, 500);
};

function togglePlayPause() {
	const playBtn = this.parentNode.querySelector('.playBtn');
	const playerId = this.parentNode.querySelector('audio').getAttribute('id');
	if (this.paused) {
		this.play();
		playBtn.classList.remove('paused');
		playBtn.classList.add('playing');
	} else {
		this.pause();
		playBtn.classList.remove('playing');
		playBtn.classList.add('paused');
	}
}
function previousRegion(part) {
	const player = document.querySelector(
		`#${part.id} audio, #${part.id} video`
	);
	let curr = player.currentTime;
	if (curr < part.regions[0].end) {
		player.currentTime = 0;
	} else {
		for (i = 1; i < part.regions.length; i++) {
			if (
				curr > part.regions[i].start &&
				curr < part.regions[i].start + 1
			) {
				player.currentTime = part.regions[i - 1].start;
			} else if (
				curr > part.regions[i].start &&
				curr < part.regions[i].end
			) {
				player.currentTime = part.regions[i].start;
			}
		}
	}
}
function nextRegion(part) {
	const player = document.querySelector(
		`#${part.id} audio, #${part.id} video`
	);
	let curr = player.currentTime;
	if (curr > part.regions[part.regions.length - 1].start) return;
	for (let region of part.regions) {
		if (curr > region.start && curr < region.end) {
			player.currentTime = region.end;
		}
	}
}
async function initData(part) {
	let regionsMarkersRaw = await fetch(part.csvFile).then(response =>
		response.text()
	);
	let regions = processRegionsMarkers(regionsMarkersRaw)[0];
	let markers = processRegionsMarkers(regionsMarkersRaw)[1];

	let pageOffsets = await fetch(part.jsonFile).then(response =>
		response.json()
	);
	part.regions = regions;
	part.markers = markers;
	part.pageOffsets = pageOffsets;
	addPages(part);
}
function processRegionsMarkers(csv) {
	let lines = csv.split(/\r\n|\n/);
	let tempRegions = [];
	let tempMarkers = [];
	for (let i = 0; i < lines.length; i++) {
		lines[i] = lines[i].split(',');
		lines[i][0] = lines[i][0].slice(0, 1);
		if (lines[i][0] == 'R') {
			let temp = {};
			lines[i][1] = lines[i][1].split('-');
			temp.start = msToSeconds(lines[i][2]);
			temp.end = msToSeconds(lines[i][3]);
			temp.page = Number(lines[i][1][0]);
			temp.line = Number(lines[i][1][1]);
			tempRegions.push(temp);
		} else if (lines[i][0] == 'M') {
			let temp = {};
			temp.text = lines[i][1];
			temp.time = msToSeconds(lines[i][2]);
			tempMarkers.push(temp);
		}
	}
	return [tempRegions, tempMarkers];
}
function msToSeconds(ms) {
	let temp = ms.split(':');
	let minutes = Number(temp[0]);
	let seconds = Number(temp[1]);
	return minutes * 60 + seconds;
}
function addPages(part) {
	// document.querySelectorAll("#pages img").forEach(x => x.remove())
	const partitionDiv = document.querySelector(`#${part.id} .partition`);
	const pages = partitionDiv.querySelector('.pages');
	let partitionWidth = getComputedStyle(partitionDiv).width;
	for (let i = 1; i <= part.pageOffsets.length; i++) {
		let newImg = document.createElement('img');
		newImg.onload = function () {
			part.pagesLoaded += 1;
			if (part.pagesLoaded == part.pageOffsets.length) {
				part.pagesHeight = Array.from(
					partitionDiv.querySelectorAll('.pages img')
				).map(x => parseFloat(getComputedStyle(x).height));

			}
		};
		newImg.src = `${part.id}_Page_${[i]}.png`;
		newImg.style.width = partitionWidth;
		newImg.setAttribute('id', `${part.id}-page${i}`);
		pages.appendChild(newImg);
	}
}

function animate() {
	allPartoches.forEach(part => {
		const player = document.querySelector(
			`#${part.id} audio, #${part.id} video`
		);
		const partocheDiv = document.querySelector(`#${part.id}`);
		let curr = player.currentTime;
		let dur = player.duration;
		let avance = 0.5;

		if (partocheDiv.getAttribute('data-type') === 'audio') {
			partocheDiv.querySelector('.currentTime').innerHTML = formatTime(
				curr
			);
			partocheDiv.querySelector('.totalTime').innerHTML = formatTime(dur);
			partocheDiv.querySelector(
				'.titre'
			).style = `background-image: linear-gradient(to right, gainsboro ${
				(curr / dur) * 100
			}%, white 0);`;
		}

		for (let i = 0; i < part.regions.length; i++) {
			if (
				curr > part.regions[i].start - avance &&
				curr < part.regions[i].end - avance
			) {
				let prevPagesH = part.totalPreviousHeight(part.regions[i].page);
				let currentPageH = part.pagesHeight[part.regions[i].page - 1];
				let currentPageOffset =
					part.pageOffsets[part.regions[i].page - 1][
						part.regions[i].line - 1
					];
				partocheDiv.querySelector('.pages').style =
					'transform: translateY(-' +
					(prevPagesH + (currentPageH * currentPageOffset) / 100) +
					'px)';
			}
		}
	});
	requestAnimationFrame(animate);
}

function formatTime(rawSec) {
	let min = Math.floor((rawSec % 3600) / 60);
	let sec = Math.floor(rawSec % 60);
	min < 10 ? (min = '0' + min) : min;
	sec < 10 ? (sec = '0' + sec) : sec;
	return min + ':' + sec;
}
