window.BINGO_THEMES = window.BINGO_THEMES || [];
window.BINGO_THEMES.push({
  id: "halloween",
  kind: "slot",
  title: "Halloween",
  heading: "Halloween-bingo",
  lead: "Två hjul snurrar som på en enarmad bandit. Först stannar ett tal, sedan en bild, till exempel 4 och en pumpa. Den som har en ruta med fyra pumpor markerar den.",
  hint: "Tryck på hjulen, pilen eller mellanslag för att snurra. Tryck under tiden de snurrar, så stannar de direkt. D visar vad som har dragits. M stänger av eller sätter på ljudet.",
  printLead: "Varje bricka får 25 av de 30 kombinationerna, i en egen ordning. Barnen räknar bilderna i rutan. Först med fem i rad vinner. Utskriften lägger en bricka på varje ark.",
  base: "themes/halloween/",
  sound: "halloween",
  numbers: { min: 1, max: 10 },
  symbols: [
    { id: "pumpa", name: "pumpa", image: "pumpa.png" },
    { id: "spoke", name: "spöke", image: "spoke.png" },
    { id: "katt", name: "katt", image: "katt.png" }
  ]
});
