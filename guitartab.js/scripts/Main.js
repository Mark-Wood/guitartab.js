if (typeof (GuitarTab) === "undefined") var GuitarTab = {};

requirejs.config({
    paths: {
        midi: '../deps/MIDI.js/MIDI.min',
        EventEmitter: '../deps/node.js/EventEmitter'
    }
});

require(['Renderer', 'PlaybackController'], function(renderer, playbackController){
    playbackController.on('playbackStateChange', function onPlaybackStateChange(playing) {
        if (playing) {
            document.getElementById('play-icon').style.visibility = 'hidden';
            document.getElementById('pause-icon').style.visibility = 'visible';
        } else {
            document.getElementById('play-icon').style.visibility = 'visible';
            document.getElementById('pause-icon').style.visibility = 'hidden';
        }
    });

    if (GuitarTab.tab){
        document.getElementById('tab-title').appendChild(document.createTextNode(GuitarTab.tab.title));
        document.getElementById('tab-artist').appendChild(document.createTextNode(GuitarTab.tab.artist));

        var drawingCanvas = document.getElementById('drawing-canvas');

        // Convert to HTML and attach to the DOM
        for (var partIndex = 0; partIndex < GuitarTab.tab.parts.length; partIndex++) {
            var part = GuitarTab.tab.parts[partIndex];

            for (var measureIndex = 0; measureIndex < GuitarTab.tab.lengthInMeasures; measureIndex++) {
                var measureElement = renderer.convertJsonMeasureToHtml(part.measures[measureIndex], part.numberOfStrings, measureIndex);
                playbackController.attachTabEventHandlers(measureElement);
                drawingCanvas.appendChild(measureElement);
            }
        }

        playbackController.calculateMeasureEvents();

        MIDI.loadPlugin({
            soundfontUrl: "./soundfont/",
            instrument: "acoustic_grand_piano",
            callback: function() {
                document.getElementById('play-icon').onclick = function() {
                    playbackController.play();
                };
                document.getElementById('pause-icon').onclick = function() {
                    playbackController.pause();
                };
                document.getElementById('play-icon').style.visibility = 'visible';
            }
        });
    }
});