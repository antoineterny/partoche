const editor = document.getElementById('editor');
const pg = document.querySelector('#editor img');
const guide1 = document.getElementById("guide1");
const out = document.querySelector("#output");
const input = document.getElementById("input");
const copyBtn = document.getElementById("copyBtn");
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
  const divGuides = document.querySelectorAll('.guide');
  divGuides.forEach((el) => el.remove());
  guides = [];
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