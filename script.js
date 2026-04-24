document.addEventListener('DOMContentLoaded', function () {
  let currentPage = window.location.pathname.split('/').pop() || 'index.html';

  document.querySelectorAll('.nav-links a').forEach(function (link) {
    if (link.getAttribute('href') === currentPage) {
      link.classList.add('active');
    }
  });

  let toggle = document.getElementById('nav-toggle');
  let navMenu = document.getElementById('nav-menu');
  if (toggle && navMenu) {
    toggle.addEventListener('click', function () {
      navMenu.classList.toggle('open');
    });
  }

  initFAQ();
});

function parsePageString(inputStr) {
  let trimmed = inputStr.trim();
  if (!trimmed) return null;

  let parts = trimmed.split(',');
  let pages = [];

  for (let i = 0; i < parts.length; i++) {
    let num = parseInt(parts[i].trim(), 10);
    if (isNaN(num) || num < 0) return null;
    pages.push(num);
  }

  return pages.length > 0 ? pages : null;
}

function showError(container, message) {
  container.innerHTML = '<div class="alert alert-error">' + message + '</div>';
}

function buildSimulationTable(result, numFrames, tableEl) {
  let steps = result.steps;
  tableEl.innerHTML = '';

  let thead = document.createElement('thead');
  let headerRow = document.createElement('tr');
  headerRow.classList.add('ref-row');

  let thLabel = document.createElement('th');
  thLabel.textContent = 'Step';
  headerRow.appendChild(thLabel);

  for (let i = 0; i < steps.length; i++) {
    let th = document.createElement('th');
    th.textContent = i + 1;
    headerRow.appendChild(th);
  }
  thead.appendChild(headerRow);
  tableEl.appendChild(thead);

  let tbody = document.createElement('tbody');

  let refRow = document.createElement('tr');
  refRow.classList.add('ref-row');
  let refLabel = document.createElement('td');
  refLabel.classList.add('row-label');
  refLabel.textContent = 'Page Ref';
  refRow.appendChild(refLabel);

  for (let i = 0; i < steps.length; i++) {
    let td = document.createElement('td');
    td.textContent = steps[i].page;
    refRow.appendChild(td);
  }
  tbody.appendChild(refRow);

  for (let f = 0; f < numFrames; f++) {
    let frameRow = document.createElement('tr');
    let frameLabel = document.createElement('td');
    frameLabel.classList.add('row-label');
    frameLabel.textContent = 'Frame ' + (f + 1);
    frameRow.appendChild(frameLabel);

    for (let i = 0; i < steps.length; i++) {
      let td = document.createElement('td');
      let val = steps[i].frames[f];

      if (val === -1) {
        td.textContent = '-';
        td.style.color = 'var(--text-muted)';
      } else {
        td.textContent = val;
      }

      td.classList.add(steps[i].isFault ? 'fault' : 'hit');
      td.classList.add('anim-in');
      frameRow.appendChild(td);
    }
    tbody.appendChild(frameRow);
  }

  let statusRow = document.createElement('tr');
  statusRow.classList.add('fault-row');
  let statusLabel = document.createElement('td');
  statusLabel.classList.add('row-label');
  statusLabel.textContent = 'Status';
  statusRow.appendChild(statusLabel);

  for (let i = 0; i < steps.length; i++) {
    let td = document.createElement('td');
    if (steps[i].isFault) {
      td.textContent = 'F';
      td.classList.add('fault-mark');
    } else {
      td.textContent = 'H';
      td.classList.add('hit-mark');
    }
    statusRow.appendChild(td);
  }
  tbody.appendChild(statusRow);

  tableEl.appendChild(tbody);
}

function updateMetrics(result) {
  let faultEl = document.getElementById('metric-faults');
  let hitEl = document.getElementById('metric-hits');
  let algoEl = document.getElementById('metric-algo');
  if (faultEl) faultEl.textContent = result.totalFaults;
  if (hitEl) hitEl.textContent = result.hitRatio + '%';
  if (algoEl) algoEl.textContent = result.algorithmName;
}

let runBtn = document.getElementById('run-btn');
if (runBtn) {
  runBtn.addEventListener('click', function () {
    runSimulation();
  });
}

async function runSimulation() {
  let pageInput = document.getElementById('page-string');
  let framesInput = document.getElementById('num-frames');
  let algoSelect = document.getElementById('algorithm');
  let outputArea = document.getElementById('output-area');
  let tableEl = document.getElementById('sim-table');
  let runBtn = document.getElementById('run-btn');
  let resultsSection = document.getElementById('results-section');
  let emptyState = document.getElementById('empty-state');

  let pages = parsePageString(pageInput.value);
  if (!pages) {
    showError(outputArea, 'Invalid page string. Use comma-separated non-negative integers. Example: 7,0,1,2,0,3');
    return;
  }

  let numFrames = parseInt(framesInput.value, 10);
  if (isNaN(numFrames) || numFrames < 1 || numFrames > 10) {
    showError(outputArea, 'Number of frames must be between 1 and 10.');
    return;
  }

  outputArea.innerHTML = '';
  runBtn.disabled = true;
  runBtn.textContent = 'Running...';

  await sleep(50);

  let algo = algoSelect.value;
  let result;
  if (algo === 'fifo') result = runFIFO(pages, numFrames);
  else if (algo === 'lru') result = runLRU(pages, numFrames);
  else if (algo === 'optimal') result = runOptimal(pages, numFrames);
  else {
    showError(outputArea, 'Unknown algorithm selected.');
    runBtn.disabled = false;
    runBtn.textContent = 'Run Simulation';
    return;
  }

  buildSimulationTable(result, numFrames, tableEl);
  updateMetrics(result);

  if (emptyState) emptyState.classList.add('hidden');
  if (resultsSection) resultsSection.classList.remove('hidden');

  await sleep(200);
  runBtn.disabled = false;
  runBtn.textContent = 'Run Simulation';
}

let compareBtn = document.getElementById('compare-btn');
if (compareBtn) {
  compareBtn.addEventListener('click', function () {
    runComparison();
  });
}

async function runComparison() {
  let pageInput = document.getElementById('compare-pages');
  let framesInput = document.getElementById('compare-frames');
  let outputArea = document.getElementById('compare-output');
  let btn = document.getElementById('compare-btn');

  let pages = parsePageString(pageInput.value);
  if (!pages) {
    showError(outputArea, 'Invalid page string. Example: 7,0,1,2,0,3,0,4,2,3');
    return;
  }
  let numFrames = parseInt(framesInput.value, 10);
  if (isNaN(numFrames) || numFrames < 1 || numFrames > 10) {
    showError(outputArea, 'Number of frames must be between 1 and 10.');
    return;
  }

  outputArea.innerHTML = '';
  btn.disabled = true;
  btn.textContent = 'Comparing...';
  await sleep(100);

  let fifoResult = runFIFO(pages, numFrames);
  let lruResult = runLRU(pages, numFrames);
  let optResult = runOptimal(pages, numFrames);
  let results = [fifoResult, lruResult, optResult];

  let minFaults = Math.min(fifoResult.totalFaults, lruResult.totalFaults, optResult.totalFaults);
  let bestName = results.find(r => r.totalFaults === minFaults).algorithmName;

  let cardsHtml = '<div class="compare-cards">';
  results.forEach(function (r) {
    let isBest = r.totalFaults === minFaults;
    cardsHtml += `
      <div class="compare-card ${isBest ? 'best' : ''}">
        <div class="compare-card-head">
          <h3>${r.algorithmName}</h3>
          ${isBest ? '<span class="best-badge">Best</span>' : ''}
        </div>
        <div class="compare-card-body">
          <div class="compare-stat"><span>Total Pages</span><span class="stat-val">${r.totalPages}</span></div>
          <div class="compare-stat"><span>Page Faults</span><span class="stat-val fault">${r.totalFaults}</span></div>
          <div class="compare-stat"><span>Page Hits</span><span class="stat-val hit">${r.totalHits}</span></div>
          <div class="compare-stat"><span>Hit Ratio</span><span class="stat-val hit">${r.hitRatio}%</span></div>
        </div>
      </div>`;
  });
  cardsHtml += '</div>';

  let maxFaults = Math.max(fifoResult.totalFaults, lruResult.totalFaults, optResult.totalFaults) || 1;
  let chartHtml = `
    <div class="compare-chart">
      <h2>Page Faults Comparison &mdash; fewer is better</h2>
      <div class="bar-chart">
        ${buildBar('FIFO', fifoResult.totalFaults, maxFaults, 'fifo')}
        ${buildBar('LRU', lruResult.totalFaults, maxFaults, 'lru')}
        ${buildBar('OPT', optResult.totalFaults, maxFaults, 'opt')}
      </div>
    </div>`;

  let winnerHtml = `
    <div class="winner-box">
      <div class="winner-icon">[*]</div>
      <div class="winner-text">
        <h3>Best performing algorithm for this input:</h3>
        <strong>${bestName}</strong>
        &nbsp;&mdash;&nbsp;
        <span style="color:var(--text-secondary);font-size:0.95rem;">
          ${minFaults} page fault${minFaults !== 1 ? 's' : ''} out of ${pages.length} references
        </span>
      </div>
    </div>`;

  outputArea.innerHTML = cardsHtml + chartHtml + winnerHtml;

  await sleep(200);
  btn.disabled = false;
  btn.textContent = 'Compare All Algorithms';
}

function buildBar(label, faults, maxFaults, cssClass) {
  let pct = Math.max((faults / maxFaults) * 100, 8);
  return `
    <div class="bar-row">
      <span class="bar-label">${label}</span>
      <div class="bar-track">
        <div class="bar-fill ${cssClass}" style="width:${pct}%">${faults}</div>
      </div>
    </div>`;
}

function initFAQ() {
  let faqItems = document.querySelectorAll('.faq-item');
  faqItems.forEach(function (item) {
    let btn = item.querySelector('.faq-question');
    if (!btn) return;

    btn.addEventListener('click', function () {
      let isOpen = item.classList.contains('open');
      faqItems.forEach(function (other) {
        other.classList.remove('open');
      });
      if (!isOpen) {
        item.classList.add('open');
      }
    });
  });
}

function sleep(ms) {
  return new Promise(function (resolve) {
    setTimeout(resolve, ms);
  });
}

function loadSample() {
  let pageEl = document.getElementById('page-string') || document.getElementById('compare-pages');
  let frameEl = document.getElementById('num-frames') || document.getElementById('compare-frames');
  if (pageEl) pageEl.value = '7,0,1,2,0,3,0,4,2,3,0,3,2';
  if (frameEl) frameEl.value = '3';
}

let sampleBtn = document.getElementById('sample-btn');
let sampleBtnCompare = document.getElementById('sample-btn-compare');
if (sampleBtn) sampleBtn.addEventListener('click', loadSample);
if (sampleBtnCompare) sampleBtnCompare.addEventListener('click', loadSample);
