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

  RANDOM_SEED = 1234;

  let pitch = new Pitch(Box2D, RANDOM_SEED);
  window.pitch = pitch;
  pitch.run(new ExperimentClass());
});
