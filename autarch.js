window.cursorTime;
window.play;
window.videoInfo;

function loadVideoInfo() {
  $.ajax({
    type: "GET",
    dataType: "json",
    url: "videos.json",
    success: function(data) {
      window.videoInfo = data;
    },
    beforeSend: function (xhr) {
      if (xhr && xhr.overrideMimeType) {
        xhr.overrideMimeType('application/json;charset=utf-8');
      }
    }
  });
}

function videoToEntry() {
  var outputX = [];
  var outputY = [];
  window.videoInfo.forEach(function(video) {
    outputX.push(new Date(video.startTime));
    outputY.push(1);
    outputX.push(new Date(video.endTime));
    outputY.push(0);
  });
  return {x: outputX, y: outputY};
}

function spanOverlap(x, y) {
	if(y.isArray())
		return !(x[1] < y[0] || x[0] > y[1]);
	else
		return !(x[1] < y || x[0] > y);
}

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
  var yRange3 = [0, 1];
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
        y0: yRange2[0] + 0.1,
        y1: yRange2[1] - 0.1,
        line: {
          color: 'rgb(55, 128, 191)',
          width: 3
        }
      }
    ]
  });
}

function updateVideos(videos) {
  //videos.forEach(function(video) {
  for(video in videos) {
    if(!spanOverlap([video.data('startTime'), video.data('endTime')],
    window.cursorTime)) {
      var src = "";
      for(i = 0; i < videoInfo.videos.length; i++) {
        if(spanOverlap([videoInfo.videos[i].startTime, videoInfo.videos[i].endTime], window.cursorTime)
          && videoInfo.videos[i].id === video.attr('id')) {
          src = videoInfo.videos[i].filename;
          break;
        }
      }
      //window.videoInfo.videos.forEach(function(element)
      for(element in window.videoInfo.videos) {
        if(spanOverlap([element.startTime, element.endTime], window.cursorTime)
          && element.id === video.attr('id')) {
          src = element.filename;
        }
      }
      video.attr('src', src);
      video.load();
    }
    video.currentTime += window.cursorTime - video.data('startTime');
  }
}

$(document).ready(function() {
  var graphData = [];
  var max1;
  var min1;
  var max2;
  var min2;
  var play;
  loadVideoInfo();
  /*var canvas = document.getElementById('canvas');
  var videoCtx = new VideoContext(canvas);
  var videoNode1 = videoCtx.video("video.mp4");
  videoNode1.connect(videoCtx.destination);
  videoNode1.start(0);
  videoNode1.stop(20);*/
  $('#player-controls').submit(function(e) {
    e.preventDefault();
    var frameRate = 7;
    var playbackRate = 0.2;
    if(!window.play) {
      window.play = setInterval(function() {
        window.cursorTime += (1000 / frameRate) * playbackRate;
        updateCursor();
        updateVideos($('video'));
      }, (1000 / frameRate) / playbackRate);
      //videoCtx.play();
      $('#play-button').val('Pause');
    }
    else {
      clearInterval(window.play);
      window.play = null;
      //videoCtx.pause();
      $('#play-button').val('Play');
    }
  });

  $('video').on('play', function() {
    this.pause();
  });

  $.ajax({
    url: "http://autarchserver.westeurope.cloudapp.azure.com:4716/AAProvider/GetTags",
    dataType: "jsonp",
    type: "GET",
    async: false,
    success: function(data) {
      data.forEach(function(element) {
        if(element.Name === "KepSimTestRamp") {
          max1 = element.RangeMax;
          min1 = element.RangeMin;
        }
        else if(element.Name === "A_Random.AM01") {
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
      graphDataEntry = videoToEntry();
      graphDataEntry.type = 'bar';
      graphDataEntry.yaxis = 'y3';
      graphDataEntry.name = 'video';
      graphData.push(graphDataEntry);
      var layout = {
        yaxis: {
          domain: [0, 0.4],
          autorange: false,
          fixedrange: true,
          range: [min1, max1]
        },
        legend: {traceorder: 'reversed'},
        yaxis2: {
          domain: [0.4, 0.8],
          autorange: false,
          fixedrange: true,
          range: [min2, max2]
        },
        yaxis3: {
          domain: [0.8, 1.0],
          autorange: false,
          fixedrange: true,
          range: [0, 1]
        },
        xaxis: {
          autorange: true,
          rangeslider: {range: ['2017/08/20 16:50', '2017/08/20 17:10']},
          type: 'date',
          fixedrange: true
        }
      };

      Plotly.newPlot('graph', graphData, layout, {displayModeBar: false});
    }
  });
  var graph = $('#graph');
  graph.on('plotly_afterplot', function() {
    window.cursorTime = new Date(graph[0]._fullLayout.xaxis.range[0]).getTime();
    updateCursor();
    graph.unbind('plotly_afterplot');
  });
  graph.mousedown(function(data) {
    graph.mousemove(function(data) {
      var canvasContainer = $('.gridlayer')[0];
      canvasBounds = canvasContainer.getBoundingClientRect();
      var xAxis = this._fullLayout.xaxis;
      var xMin = new Date(xAxis.range[0]).getTime();
      var xMax = new Date(xAxis.range[1]).getTime();

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
