const editor = document.getElementById('editor');
const pg = document.querySelector('#editor img');
const guide1 = document.getElementById("guide1");
const out = document.querySelector("#output p");
const input = document.querySelector("#input input");
const copyBtn = document.getElementById("copyBtn");
const resetBtn = document.getElementById("resetBtn");
let guides = [];
pg.addEventListener('mousemove', function(event) {
  guide1.style=`top:${event.pageY}px;`;
});
guide1.addEventListener('click', function(event) {
  let newGuide = document.createElement("div");
  let pgHeight = parseFloat(getComputedStyle(pg).getPropertyValue("height"));
  newGuide.className = "guide";
  newGuide.setAttribute("style", `top:${event.pageY}px`);
  editor.appendChild(newGuide);
  guides.push(Number((event.pageY / pgHeight * 100).toFixed(2)));
  out.innerText = "[" + guides.sort((a, b) => a - b) + "],";
});
input.addEventListener('change', function() {
  resetGuides();
  const selectedFile = input.files[0];
  const reader = new FileReader();
  reader.onload = (function (aImg) {
    return function (event) {
      aImg.src = event.target.result;
    };
  })(pg);
  reader.readAsDataURL(selectedFile);
  out.innerText = "Et maintenant place tes repères !";
});
function resetGuides() {
  let divGuides = document.querySelectorAll('.guide');
  divGuides.forEach((el) => el.remove());
  guides = [];
  out.innerText = "On respire et on recommence...";
}
resetBtn.addEventListener('click', () => resetGuides());
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