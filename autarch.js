function formatData(inputObject) {
  var outputX = [];
  var outputY = [];
  inputObject.forEach(function(dataPoint) {
    outputX.push(dataPoint.IsoTime.replace('T', ' '));
    outputY.push(dataPoint.Value);
  });
  return {x: outputX, y: outputY};
}

$(document).ready(function() {
  var graphData;
  $.ajax({
    url: "http://autarchserver.westeurope.cloudapp.azure.com:4716/AAProvider/GetSerieValues?tagName=KepSimTestRamp&startTime=1503248050473&endTime=1503248657473&nSamples=100",
    dataType: "jsonp",
    type: "GET",
    async: false,
    success: function(data) {
      graphData = formatData(data);
      graphData.type = 'scatter';
      Plotly.newPlot('graph', [graphData]);
    }
  });

});
