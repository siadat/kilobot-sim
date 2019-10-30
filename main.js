Box2D({
  // I initially wanted to change it to delay the out of memory
  // error. However, I fixed the problem completely by doing
  // Box2D.destory(b2Vec2Instance).
  TOTAL_MEMORY: 1024 * 1024 * 32, // default value is 1024 * 1024 * 16.
}).then(function(Box2D) {
  if(false) {
    let imageEditor = new ImageEditor();
    setTimeout(() => { console.log(JSON.stringify(imageEditor.convert())); }, 500);
    return;
  }

  console.log("Loaded.");

  let pitch = new Pitch(Box2D);
  window.pitch = pitch;

  // pitch.run(new ExperimentAssembly());
  // pitch.run(new ExperimentLab0());
  let ExperimentClass = window[window.location.search.substr(1)];
  if(!ExperimentClass) {
    console.error(`Experiment '${ExperimentClass}' is not defined`);
    return;
  }
  pitch.run(new ExperimentClass());
});
