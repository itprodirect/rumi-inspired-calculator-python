/* ---------- STATE & ELEMENTS ---------- */
let expression = "";
const displayEl = document.getElementById("display");
const fractionTextEl = document.getElementById("fraction-text");
const canvas = document.getElementById("fraction-canvas");
const ctx = canvas.getContext("2d");

/* ---------- INITIALIZATION ---------- */
// Draw an empty circle on load
drawPieChart(0);
updateDisplay("0");

/* ---------- DISPLAY FUNCTIONS ---------- */

function updateDisplay(value) {
  // Make multiplication and division look nicer for humans
  // 3 * 4 becomes 3 × 4
  let niceValue = value
    .replace(/\*/g, "×")
    .replace(/\//g, "÷");
  
  displayEl.textContent = niceValue || "0";
}

function updateVisualizer(numberValue) {
  // 1. Draw the Pie Chart
  drawPieChart(numberValue);

  // 2. Update the Text Helper
  if (numberValue === null || Number.isNaN(numberValue) || !Number.isFinite(numberValue)) {
    fractionTextEl.textContent = "—";
    return;
  }

  // Convert decimal to fraction string (e.g., 0.5 -> 1/2)
  const fractionString = decimalToNiceFraction(numberValue);
  
  if (fractionString) {
    fractionTextEl.textContent = fractionString;
  } else {
    // If it's a messy decimal, just show 2 decimal places
    fractionTextEl.textContent = parseFloat(numberValue.toFixed(4));
  }
}

/* ---------- CANVAS DRAWING (The Visualizer) ---------- */
function drawPieChart(value) {
  // Clear previous drawing
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const centerX = canvas.width / 2;
  const centerY = canvas.height / 2;
  const radius = 40;

  // 1. Draw Background Circle (Dark Grey)
  ctx.beginPath();
  ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
  ctx.fillStyle = "#1e1e24";
  ctx.fill();
  ctx.strokeStyle = "#444";
  ctx.lineWidth = 2;
  ctx.stroke();

  // If invalid or 0, stop here
  if (!value || value === 0 || !Number.isFinite(value)) return;

  // 2. Calculate how much to fill
  // If value is 1.5, we want to visualize the 0.5 part mostly, 
  // but let's just handle value % 1.
  let percent = value - Math.floor(value);
  
  // If it's an exact whole number (like 1, 2, 3), treat it as full (100%)
  if (value >= 1 && percent < 0.0001) {
    percent = 1; 
  }

  // Draw the Slice (Demon Hunter Purple)
  ctx.beginPath();
  ctx.moveTo(centerX, centerY);
  // Start at top (-90 degrees or -PI/2)
  const startAngle = -Math.PI / 2;
  const endAngle = startAngle + (percent * 2 * Math.PI);
  
  ctx.arc(centerX, centerY, radius, startAngle, endAngle);
  ctx.closePath();
  
  ctx.fillStyle = "#7d5fff"; // The purple fill
  ctx.fill();
  
  // Optional: Add a neon glow to the slice
  ctx.shadowColor = "#b388ff";
  ctx.shadowBlur = 10;
  ctx.stroke();
  ctx.shadowBlur = 0; // reset
}

/* ---------- MATH LOGIC ---------- */

function evaluateExpression() {
  if (!expression) return;

  try {
    // Safe evaluation of the math string
    // Note: 'Function' is a safer alternative to 'eval' in strict mode
    const result = Function(`"use strict"; return (${expression})`)();
    
    // Update State
    expression = String(result);
    
    // Update UI
    updateDisplay(expression);
    updateVisualizer(result);
    
  } catch (err) {
    displayEl.textContent = "Error";
    expression = "";
    updateVisualizer(0);
  }
}

function appendValue(value) {
  // Prevent double operators (e.g., "++")
  const isOperator = /[+\-*/]/.test(value);
  const lastChar = expression.slice(-1);

  if (expression === "" && isOperator && value !== "(") {
    // Don't start with / or *
    return;
  }

  if (isOperator && /[+\-*/]/.test(lastChar)) {
    // Replace the last operator with the new one
    expression = expression.slice(0, -1) + value;
  } else {
    expression += value;
  }

  updateDisplay(expression);
  
  // Try to update visualizer live while typing?
  // Only if it doesn't end in an operator
  if (!/[+\-*/(]$/.test(expression)) {
    try {
      const tempResult = Function(`"use strict"; return (${expression})`)();
      updateVisualizer(tempResult);
    } catch (e) {
      // If incomplete math, do nothing
    }
  }
}

function clearCalc() {
  expression = "";
  updateDisplay("0");
  updateVisualizer(0);
}

/* ---------- FRACTION CONVERTER ---------- */
// Converts 0.5 -> "1/2", 1.25 -> "1 1/4"
function decimalToNiceFraction(value) {
  if (value === 0) return "0";
  
  const sign = value < 0 ? "-" : "";
  value = Math.abs(value);
  
  const whole = Math.floor(value);
  const remainder = value - whole;
  
  if (remainder < 0.0001) return sign + whole; // It's a whole number

  // Check common denominators for Rumi (2, 3, 4, 5, 8, 10)
  const denoms = [2, 3, 4, 5, 8, 10];
  let bestNum = 0;
  let bestDen = 1;
  let minError = 1.0;

  for (let d of denoms) {
    let n = Math.round(remainder * d);
    let diff = Math.abs((n / d) - remainder);
    
    if (diff < minError) {
      minError = diff;
      bestNum = n;
      bestDen = d;
    }
  }

  if (minError > 0.01) return null; // Couldn't find a nice fraction

  // Build string
  let result = sign;
  if (whole > 0) result += `${whole} `;
  result += `${bestNum}/${bestDen}`;
  
  return result;
}

/* ---------- EVENT LISTENERS ---------- */

document.querySelector(".app").addEventListener("click", (e) => {
  const btn = e.target.closest("button");
  if (!btn) return;

  const action = btn.dataset.action;
  const value = btn.dataset.value;
  const fraction = btn.dataset.fraction;

  if (action === "clear") {
    clearCalc();
  } else if (action === "equals") {
    evaluateExpression();
  } else if (value) {
    appendValue(value);
  }
});