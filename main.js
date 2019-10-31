(function() {
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

  let pitch = new Pitch(Box2D);
  window.pitch = pitch;
  pitch.run(new ExperimentClass());
})();
