const exampleVoices = [
  "acc",
  "sop1",
  "sop2",
  "alt1",
  "alt2",
  "ten1",
  "ten2",
  "ten3",
  "bas1",
  "bas2",
]
const voicesNb = { sop: 0, alt: 0, ten: 0, bas: 0 }

exampleVoices.forEach(v => {
  if (v.match(/sop/g)) {
    voicesNb.sop += 1
  } else if (v.match(/alt/g)) {
    voicesNb.alt += 1
  } else if (v.match(/ten/g)) {
    voicesNb.ten += 1
  } else if (v.match(/bas/g)) {
    voicesNb.bas += 1
  }
})
console.log("voicesNb", voicesNb)
const totalVoices = Object.values(voicesNb).reduce((acc, curr) => acc + curr)

const decalages = [
  [70.88, 84.28],
  [3.2, 27.92, 51.04, 73.89],
  [3.09, 26.54, 50.96, 74.76],
  [3.11, 27.65, 46.32, 62.68, 81.27],
  [3.17, 21.6, 40.29, 59.42, 78.03],
  [3.11, 27.12, 51.3, 74.95],
  [2.03, 18.96, 35.53, 51.66, 76.61],
  [3.2, 31.83, 65.08],
  [2.91, 26.63, 49.99, 73.26],
  [3.38, 27.12, 50.59, 73.62],
  [2.82, 26.54, 50.96, 73.79],
]

let str = ""

decalages.forEach((arr, i) => arr.forEach((a, j) => (str += `${i + 1}-${j + 1}, `)))
