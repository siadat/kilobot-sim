Box2D({
  // I initially wanted to change it to delay the out of memory
  // error. However, I fixed the problem completely by doing
  // Box2D.destory(b2Vec2Instance).
  TOTAL_MEMORY: 1024 * 1024 * 32, // default value is 1024 * 1024 * 16.
}).then(Box2D => {
  console.log("Loaded.");

  if(window.location.search == "") {
    // redirect to a default experiment:
    window.location.search = '?ExperimentRandom';
    return;
  }

  let experimentClassName = window.location.search.substr(1);
  let ExperimentClass = window[experimentClassName];
  if(!ExperimentClass) {
    console.error(`Experiment '${experimentClassName}' is not defined`);
    return;
  }

  let randomSeed = 55810; // Math.floor(Math.random()*1000000);
  let perfectStart = false;

  let pitch = new Pitch(Box2D, perfectStart, randomSeed);
  window.pitch = pitch;
  pitch.setLayersOrder([
    'Shape',
    '_Shadow',
    'NeighborRegion',
    '_TraversedPath',
    'RobustQuadlateral',
    'ConnsAndBouns',
    '_Robots',
    'LocalizationError',
  ]);
  pitch.run(new ExperimentClass());
});
