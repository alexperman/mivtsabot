$(document).ready(function(){   
  layerJS.init();
  var frames = ['main', 'second'];
  var findex = 0;
  document.getElementById('next').addEventListener('click', function() {
	  findex++;
	  findex %= frames.length;
	  layerJS.select('#layer1').transitionTo(frames[findex], {
	  	type: 'left'
	  });
  })
});