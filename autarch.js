window.cursorTime;
window.play;

function formatData(inputObject) {
  var outputX = [];
  var outputY = [];
  inputObject.forEach(function(dataPoint) {
    outputX.push(dataPoint.IsoTime.replace('T', ' '));
    outputY.push(dataPoint.Value);
  });
  return {x: outputX, y: outputY};
}

function updateCursor() {
  var graph = $('#graph')[0];
  var yRange = graph._fullLayout.yaxis.range;
  var yRange2 = graph._fullLayout.yaxis2.range;
  Plotly.relayout('graph', {
    shapes: [
      {
        type: 'line',
        xref: 'x',
        yref: 'y',
        x0: window.cursorTime,
        x1: window.cursorTime,
        y0: yRange[0] + 0.01,
        y1: yRange[1] - 0.01,
        line: {
          color: 'rgb(55, 128, 191)',
          width: 3
        }
      },
      {
        type: 'line',
        xref: 'x',
        yref: 'y2',
        x0: window.cursorTime,
        x1: window.cursorTime,
        y0: yRange2[0] + 0.01,
        y1: yRange2[1] - 0.01,
        line: {
          color: 'rgb(55, 128, 191)',
          width: 3
        }
      }
    ]
  });
}

$(document).ready(function() {
  var graphData = [];
  var max1;
  var min1;
  var max2;
  var min2;
  var play;
  var canvas = document.getElementById('canvas');
  var videoCtx = new VideoContext(canvas);
  var videoNode1 = videoCtx.video("video.mp4");
  videoNode1.connect(videoCtx.destination);
  videoNode1.start(0);
  videoNode1.stop(20);
  $('#player-controls').submit(function(e) {
    e.preventDefault();
    if(!window.play) {
      window.play = setInterval(function() {
        window.cursorTime += 66;
        updateCursor();
      }, 33);
      videoCtx.play();
      $('#play-button').val('Pause');
    }
    else {
      clearInterval(window.play);
      window.play = null;
      videoCtx.pause();
      $('#play-button').val('Play');
    }
  });
	

	
	window.asyncReady = false;
  $.ajax({
    url: "http://autarchserver.westeurope.cloudapp.azure.com:4716/AAProvider/GetTags",
    dataType: "jsonp",
    type: "GET",
    async: false,
    success: function(data) {
      data.forEach(function(element) {
        if(element.Name == "KepSimTestRamp") {
          max1 = element.RangeMax;
          min1 = element.RangeMin;
        }
        else if(element.Name == "A_Random.AM01") {
          max2 = element.RangeMax;
          min2 = element.RangeMin;
        }
      });
    }
  });
  $.ajax({
    url: "http://autarchserver.westeurope.cloudapp.azure.com:4716/AAProvider/GetSerieValues?tagName=KepSimTestRamp&startTime=1503248050473&endTime=1503248657473&nSamples=100",
    dataType: "jsonp",
    type: "GET",
    success: function(data) {
      var graphDataEntry = formatData(data);
      graphDataEntry.type = 'scatter';
      graphDataEntry.hoverinfo = 'none';
	  graphDataEntry.yaxis = 'y';
	  graphDataEntry.name = 'signal1';
      graphData.push(graphDataEntry);
    }
  });
  $.ajax({
    url: "http://autarchserver.westeurope.cloudapp.azure.com:4716/AAProvider/GetSerieValues?tagName=A_Random.AM01&startTime=1503248050473&endTime=1503248657473&nSamples=100",
    dataType: "jsonp",
    type: "GET",
    success: function(data) {
      var graphDataEntry = formatData(data);
      graphDataEntry.type = 'scatter';
      graphDataEntry.hoverinfo = 'none';
      graphDataEntry.yaxis = 'y2';
	  graphDataEntry.name = 'signal2';
      graphData.push(graphDataEntry);
      var layout = {
        yaxis: {
          domain: [0, 0.5],
          fixedrange: true,
          range: [min1, max1]
        },
        legend: {traceorder: 'reversed'},
        yaxis2: {
          domain: [0.5, 1],
          fixedrange: true,
          range: [min2, max2]
        },
        xaxis: {
          autorange: true,
          rangeslider: {range: ['2017-08-20 16:50', '2017-08-20 17:10']},
          type: 'date',
          fixedrange: true
        }
      };

      Plotly.newPlot('graph', graphData, layout, {displayModeBar: false});
    }
  });
  var graph = $('#graph');
  graph.on('plotly_afterplot', function() {
	window.cursorTime = new Date(graph[0]._fullLayout.xaxis.range[0].replace('-', '/')).getTime();
	updateCursor();
	graph.unbind('plotly_afterplot');
  });
  graph.mousedown(function(data) {
    graph.mousemove(function(data) {
      var canvasContainer = $('.gridlayer')[0];
      canvasBounds = canvasContainer.getBoundingClientRect();
      var xAxis = this._fullLayout.xaxis;

      var xMin = new Date(xAxis.range[0].replace('-', '/')).getTime();
      var xMax = new Date(xAxis.range[1].replace('-', '/')).getTime();

      var xScale = (xMax - xMin) / canvasBounds.width;

      var xOffset = data.clientX - canvasBounds.left;

      var xP2C = Math.round((xOffset * xScale) + xMin);

      window.cursorTime = xP2C;
      updateCursor();
    });
  });
  graph.mouseup(function(data) {
    graph.unbind('mousemove');
  });
  graph.mouseout(function(data) {
    graph.unbind('mousemove');
  });
});
