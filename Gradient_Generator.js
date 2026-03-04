///////////////////////////////
// Brandon A. Dalmer - 2026
// Gradient Grid with Anchored UI Panel
///////////////////////////////

let cols = 60;
let rows = 20;
let scl = 10;
let panelWidth = 200;
let paletteSize = 6;
let palette = [];
let colorInputs = [];
let bgInput;
let bgColor;
let showOutline = false;
let isBW = false;

// Gradient controls
let gradDirectionDropdown, densitySlider, randomnessSlider;
let gradDirection = 'horizontal';
let densityFalloff = 1.0;
let randomness = 1.0;

// UI elements
let bwToggle, outlineToggle, generateButton;
let densityLabel, randomLabel, paletteSizeSlider, rowsSlider, paletteLabel, rowsLabel;
let colorLabels = [];
let bgLabel;

function setup() {
  createCanvas(windowWidth, windowHeight);
  bgColor = color(255);

  panelX = windowWidth - panelWidth - 10;
  panelY = 15;
  let buttonWidth = 180;

  generateButton = createButton('Generate Grid');
  generateButton.position(panelX + 10, panelY + 10);
  ButtonStyle(generateButton, buttonWidth);
  generateButton.mousePressed(redraw);

  bwToggle = createCheckbox('B&W', false);
  bwToggle.position(panelX + 10, panelY + 40);
  ButtonStyle(bwToggle, buttonWidth);
  bwToggle.changed(() => {
    isBW = bwToggle.checked();
    generatePalette();
    redraw();
  });

  outlineToggle = createCheckbox('Outline', false);
  outlineToggle.position(panelX + 100, panelY + 40);
  ButtonStyle(outlineToggle, buttonWidth / 2);
  outlineToggle.changed(() => {
    showOutline = outlineToggle.checked();
    redraw();
  });

  gradDirectionDropdown = createSelect();
  gradDirectionDropdown.position(panelX + 10, panelY + 70);
  gradDirectionDropdown.option('horizontal');
  gradDirectionDropdown.option('vertical');
  gradDirectionDropdown.option('diagonal');
  gradDirectionDropdown.value('horizontal');
  ButtonStyle(gradDirectionDropdown, buttonWidth);
  gradDirectionDropdown.changed(() => {
    gradDirection = gradDirectionDropdown.value();
    redraw();
  });

  densityLabel = createSpan('&nbsp;Density Falloff');
  densityLabel.position(panelX + 10, panelY + 100);
  ButtonStyle(densityLabel, buttonWidth);

  densitySlider = createSlider(0.1, 2.0, 1.0, 0.01);
  densitySlider.position(panelX + 10, panelY + 120);
  ButtonStyle(densitySlider, buttonWidth);
  densitySlider.input(() => {
    densityFalloff = densitySlider.value();
    redraw();
  });

  randomLabel = createSpan('&nbsp;Randomness');
  randomLabel.position(panelX + 10, panelY + 150);
  ButtonStyle(randomLabel, buttonWidth);

  randomnessSlider = createSlider(0.0, 1.0, 1.0, 0.01);
  randomnessSlider.position(panelX + 10, panelY + 170);
  ButtonStyle(randomnessSlider, buttonWidth);
  randomnessSlider.input(() => {
    randomness = randomnessSlider.value();
    redraw();
  });

  paletteLabel = createSpan('&nbsp;Palette Size');
  paletteLabel.position(panelX + 10, panelY + 200);
  ButtonStyle(paletteLabel, buttonWidth);

  paletteSizeSlider = createSlider(1, 6, paletteSize, 1); // min 1 now
  paletteSizeSlider.position(panelX + 10, panelY + 220);
  ButtonStyle(paletteSizeSlider, buttonWidth);
  paletteSizeSlider.input(() => {
    const anyInputUsed = colorInputs.some(inp => inp.value().trim() !== "");
    if (anyInputUsed) {
      paletteSize = max(3, paletteSizeSlider.value());
      paletteSizeSlider.value(paletteSize);
    } else {
      paletteSize = paletteSizeSlider.value();
    }
    generatePalette();
    redraw();
  });

  rowsLabel = createSpan('&nbsp;Rows');
  rowsLabel.position(panelX + 10, panelY + 250);
  ButtonStyle(rowsLabel, buttonWidth);

  rowsSlider = createSlider(1, floor(windowHeight / 10), rows, 1);
  rowsSlider.position(panelX + 10, panelY + 270);
  ButtonStyle(rowsSlider, buttonWidth);
  rowsSlider.input(() => {
    rows = rowsSlider.value();
    redraw();
  });

  // Three palette inputs
  for (let i = 0; i < 3; i++) {
    let lbl = createSpan(`Color ${i + 1}:`)
      .style('color', 'red')
      .style('font-family', 'monospace')
      .style('font-size', '12px')
      .style('line-height', '25px')
      .position(panelX + 10, panelY + 300 + i * 30);
    colorLabels.push(lbl);

    let inp = createInput("#" + floor(random(0x1000000)).toString(16).padStart(6, '0'));
    inp.position(panelX + panelWidth - 170 + 80, panelY + 300 + i * 30);
    inp.size(80);
    ButtonStyle(inp, 80);
    inp.style('background-color', '#333');
    inp.style('color', 'white');
    inp.input(() => {
      generatePalette();
      redraw();
    });
    colorInputs.push(inp);
  }

  // Background input and label
  bgLabel = createSpan("Background:")
    .style('color', 'red')
    .style('font-family', 'monospace')
    .style('font-size', '12px')
    .style('line-height', '25px')
    .position(panelX + 10, panelY + 400);

  bgInput = createInput("#ffffff");
  bgInput.position(panelX + panelWidth - 170 + 80, panelY + 400);
  bgInput.size(80);
  ButtonStyle(bgInput, 80);
  bgInput.style('background-color', '#333');
  bgInput.style('color', 'white');
  bgInput.input(() => {
    updateBackgroundColor();
    redraw();
  });
  
  saveButton = createButton('Save PNG');
  saveButton.position(panelX + 10, height - 50);
  ButtonStyle(saveButton, buttonWidth);
  saveButton.mousePressed(() => {
    // Temporarily clear background if you want transparent pixels
    let prevBG = bgColor;
    clear();             // clears to transparent
    displayGradientGrid(); // redraw grid only
    saveCanvas('gradient_grid', 'png'); // save with transparency
    background(prevBG);  // restore background after saving
    redraw();
  });

  generatePalette();
  noLoop();
  redraw();
}

function draw() {
  background(bgColor);
  displayGradientGrid();
  drawUIPanel();
}

function drawUIPanel() {
  const swatchX = panelX + 10;
  const swatchY = 470;
  const swatchSize = 15;

  fill(0);
  stroke(255, 0, 0);
  rect(panelX, panelY, panelWidth, height - 30);

  textSize(12);
  fill(255);
  noStroke();
  text("Palette RGB Codes:", swatchX, swatchY - 10);

  for (let i = 0; i < palette.length; i++) {
    fill(palette[i]);
    rect(swatchX, swatchY + i * 25, swatchSize, swatchSize);

    let r = red(palette[i]);
    let g = green(palette[i]);
    let b = blue(palette[i]);

    fill(255);
    text(`${int(r)}, ${int(g)}, ${int(b)}`, swatchX + swatchSize + 5, swatchY + i * 25 + 12);
  }
}

function displayGradientGrid() {
  let availableW = width - panelWidth - 30;
  let availableH = height - 20;
  scl = floor(min(availableW / cols, availableH / rows));
  scl = max(scl, 4);

  let gridW = cols * scl;
  let gridH = rows * scl;
  let offsetX = (availableW - gridW) / 2 + 10;
  let offsetY = (availableH - gridH) / 2 + 10;

  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      let xpos = offsetX + x * scl + scl / 2;
      let ypos = offsetY + y * scl + scl / 2;

      let density;
      if (gradDirection === 'horizontal') density = pow(map(x, 0, cols - 1, 1, 0), densityFalloff);
      else if (gradDirection === 'vertical') density = pow(map(y, 0, rows - 1, 1, 0), densityFalloff);
      else {
        let d = dist(x, y, 0, 0);
        let maxD = dist(0, 0, cols - 1, rows - 1);
        density = pow(map(d, 0, maxD, 1, 0), densityFalloff);
      }

      if (random(1) < density * randomness) {
        fill(random(palette));
        if (showOutline) stroke(0);
        else noStroke();
        rect(xpos, ypos, scl * 0.9, scl * 0.9);
      }
    }
  }
}

function generatePalette() {
  const anyInputUsed = colorInputs.some(inp => inp.value().trim() !== "");
  let inputPalette = [];

  if (anyInputUsed) {
    for (let i = 0; i < colorInputs.length; i++) {
      let val = colorInputs[i].value().trim();
      if (!val) continue;
      if (/^#([0-9A-F]{6})$/i.test(val)) inputPalette.push(color(val));
      else if (/^\s*\d{1,3}\s*,\s*\d{1,3}\s*,\s*\d{1,3}\s*$/.test(val)) {
        let parts = val.split(",").map(s => Number(s.trim()));
        if (parts.every(v => v >= 0 && v <= 255)) inputPalette.push(color(parts[0], parts[1], parts[2]));
      }
    }
    paletteSize = max(3, paletteSizeSlider.value());
    paletteSizeSlider.value(paletteSize);
  }

  // Fill palette with inputs first, then random/B&W colors
  palette = [...inputPalette];
  let additional = paletteSize - palette.length;
  for (let i = 0; i < additional; i++) {
    if (isBW) {
      palette.push(paletteSize === 1 ? color(0) : color(int(random(255))));
    } else {
      palette.push(color(random(255), random(255), random(255)));
    }
  }
}

function updateBackgroundColor() {
  let val = bgInput.value().trim();
  if (!val) return;

  if (/^#([0-9A-F]{6})$/i.test(val)) bgColor = color(val);
  else if (/^\s*\d{1,3}\s*,\s*\d{1,3}\s*,\s*\d{1,3}\s*$/.test(val)) {
    let parts = val.split(",").map(s => Number(s.trim()));
    if (parts.every(v => v >= 0 && v <= 255)) bgColor = color(parts[0], parts[1], parts[2]);
  }
}

function ButtonStyle(btn, w) {
  btn.style('width', w + 'px');
  btn.style('height', '25px');
  btn.style('color', 'red');
  btn.style('background-color', 'black');
  btn.style('border', '1px solid red');
  btn.style('padding', '0');
  btn.style('line-height', '25px');
  btn.style('font-size', '12px');
  btn.style('box-sizing', 'border-box');
  btn.style('font-family', 'monospace');
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);

  panelX = windowWidth - panelWidth - 10;
  panelY = 15;

  generateButton.position(panelX + 10, panelY + 10);
  bwToggle.position(panelX + 10, panelY + 40);
  outlineToggle.position(panelX + 100, panelY + 40);
  gradDirectionDropdown.position(panelX + 10, panelY + 70);
  densityLabel.position(panelX + 10, panelY + 100);
  densitySlider.position(panelX + 10, panelY + 120);
  randomLabel.position(panelX + 10, panelY + 150);
  randomnessSlider.position(panelX + 10, panelY + 170);
  paletteLabel.position(panelX + 10, panelY + 200);
  paletteSizeSlider.position(panelX + 10, panelY + 220);
  rowsLabel.position(panelX + 10, panelY + 250);
  rowsSlider.position(panelX + 10, panelY + 270);

  let inputX = panelX + panelWidth - 170;
  for (let i = 0; i < colorInputs.length; i++) {
    colorLabels[i].position(panelX + 10, panelY + 300 + i * 30);
    colorInputs[i].position(inputX + 80, panelY + 300 + i * 30);
  }

  bgLabel.position(panelX + 10, panelY + 400);
  bgInput.position(inputX + 80, panelY + 400);
  saveButton.position(panelX + 10, height - 50);

  redraw();
}
