function isPageInFrames(frames, page) {
  return frames.includes(page);
}

function snapshotFrames(frames) {
  return [...frames];
}

function runFIFO(pages, numFrames) {
  let frames = new Array(numFrames).fill(-1);
  let pointer = 0;
  let steps = [];
  let pageFaults = 0;
  let pageHits = 0;

  for (let i = 0; i < pages.length; i++) {
    let page = pages[i];
    let isHit = isPageInFrames(frames, page);

    if (isHit) {
      pageHits++;
    } else {
      pageFaults++;
      frames[pointer] = page;
      pointer = (pointer + 1) % numFrames;
    }

    steps.push({
      page: page,
      frames: snapshotFrames(frames),
      isFault: !isHit,
      faultCount: pageFaults,
      hitCount: pageHits
    });
  }

  return {
    algorithmName: 'FIFO',
    steps: steps,
    totalFaults: pageFaults,
    totalHits: pageHits,
    totalPages: pages.length,
    hitRatio: ((pageHits / pages.length) * 100).toFixed(2)
  };
}

function runLRU(pages, numFrames) {
  let frames = new Array(numFrames).fill(-1);
  let lastUsed = new Array(numFrames).fill(-1);
  let steps = [];
  let pageFaults = 0;
  let pageHits = 0;

  for (let i = 0; i < pages.length; i++) {
    let page = pages[i];
    let frameIndex = frames.indexOf(page);
    let isHit = frameIndex !== -1;

    if (isHit) {
      lastUsed[frameIndex] = i;
      pageHits++;
    } else {
      pageFaults++;
      let targetIndex = frames.indexOf(-1);

      if (targetIndex === -1) {
        let minTime = Infinity;
        for (let j = 0; j < numFrames; j++) {
          if (lastUsed[j] < minTime) {
            minTime = lastUsed[j];
            targetIndex = j;
          }
        }
      }

      frames[targetIndex] = page;
      lastUsed[targetIndex] = i;
    }

    steps.push({
      page: page,
      frames: snapshotFrames(frames),
      isFault: !isHit,
      faultCount: pageFaults,
      hitCount: pageHits
    });
  }

  return {
    algorithmName: 'LRU',
    steps: steps,
    totalFaults: pageFaults,
    totalHits: pageHits,
    totalPages: pages.length,
    hitRatio: ((pageHits / pages.length) * 100).toFixed(2)
  };
}

function runOptimal(pages, numFrames) {
  let frames = new Array(numFrames).fill(-1);
  let steps = [];
  let pageFaults = 0;
  let pageHits = 0;

  for (let i = 0; i < pages.length; i++) {
    let page = pages[i];
    let isHit = isPageInFrames(frames, page);

    if (isHit) {
      pageHits++;
    } else {
      pageFaults++;
      let emptyIndex = frames.indexOf(-1);

      if (emptyIndex !== -1) {
        frames[emptyIndex] = page;
      } else {
        let farthestUse = -1;
        let replaceIdx = 0;

        for (let j = 0; j < numFrames; j++) {
          let nextUse = Infinity;

          for (let k = i + 1; k < pages.length; k++) {
            if (pages[k] === frames[j]) {
              nextUse = k;
              break;
            }
          }

          if (nextUse > farthestUse) {
            farthestUse = nextUse;
            replaceIdx = j;
          }
        }

        frames[replaceIdx] = page;
      }
    }

    steps.push({
      page: page,
      frames: snapshotFrames(frames),
      isFault: !isHit,
      faultCount: pageFaults,
      hitCount: pageHits
    });
  }

  return {
    algorithmName: 'Optimal',
    steps: steps,
    totalFaults: pageFaults,
    totalHits: pageHits,
    totalPages: pages.length,
    hitRatio: ((pageHits / pages.length) * 100).toFixed(2)
  };
}

window.runFIFO = runFIFO;
window.runLRU = runLRU;
window.runOptimal = runOptimal;
