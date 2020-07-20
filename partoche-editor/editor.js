const editor = document.getElementById('editor');
const editorImage = document.getElementById('editorImage');
const pg = document.querySelector('#editorImage');
const guide1 = document.getElementById("guide1");
const out = document.querySelector("#output p");
const input = document.querySelector("#input input");
const copyBtn = document.getElementById("copyBtn");
const resetBtn = document.getElementById("resetBtn");
const nextBtn = document.querySelector("#next");
const prevBtn = document.querySelector("#prev");
let allImages = document.querySelectorAll(".image")

let guides = [];
let pages = [];
let index = 0;

input.addEventListener('change', function() {
  guides = [];
  pages = [];
  index = 0;
  for (let i = 0; i < input.files.length; i++ ) {
      let image = document.createElement("img");
      image.src = URL.createObjectURL(input.files[i]);
      pages.push(image);
      guides.push([]);
  }
  editorImage.append(pages[index]);
  out.innerText =
    "Et maintenant place tes repères ! ";
});

nextBtn.addEventListener("click", function() {
  index ++;
  index > input.files.length-1 ? index = 0 : index;
  document.querySelectorAll("#editorImage img").forEach(el => el.remove());
  resetGuides();
  editorImage.append(pages[index]);
  if (guides[index].length > 0) alert("attention ce n'est pas vide !")
})

prevBtn.addEventListener("click", function() {
  index --;
  index < 0 ? (index = input.files.length - 1) : index;
  document.querySelectorAll("#editorImage img").forEach(el => el.remove());
  resetGuides();
  editorImage.append(pages[index]);
  if (guides[index].length > 0) alert("attention ce n'est pas vide !")
})

pg.addEventListener('mousemove', function(event) {
  guide1.style=`top:${event.pageY}px;`;
});
guide1.addEventListener('click', function(event) {
  let newGuide = document.createElement("div");
  let pgHeight = parseFloat(getComputedStyle(pg).getPropertyValue("height"));
  newGuide.className = "guide";
  newGuide.setAttribute("style", `top:${event.pageY}px`);
  editor.appendChild(newGuide);
  guides[index].push(Number((event.pageY / pgHeight * 100).toFixed(2)));
  guides[index] = guides[index].sort((a, b) => a - b);
  updateOutDisplay();
});

function updateOutDisplay() {
  out.innerHTML = "[<br>";
  for (i=0; i<guides.length-1; i++) {
    out.innerHTML += `&nbsp;&nbsp;[${guides[i]}],<br>`;
  }
  out.innerHTML += `&nbsp;&nbsp;[${guides[guides.length - 1]}]<br>]`;
}

function resetGuides() {
  let divGuides = document.querySelectorAll('.guide');
  divGuides.forEach((el) => el.remove());
  updateOutDisplay();
}

resetBtn.addEventListener('click', () => {
  resetGuides();
  guides[index] = [];
  updateOutDisplay();
});

function copyText(element) {
  selection = window.getSelection();
  range = document.createRange();
  range.selectNodeContents(element);
  selection.removeAllRanges();
  selection.addRange(range);
  document.execCommand("copy");
  out.innerHTML += ' <i>(copié dans le presse-papier)</i>';
}
copyBtn.addEventListener('click', () => {
  copyText(out);
});