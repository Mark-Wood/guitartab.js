if (typeof GuitarTab === "undefined") var GuitarTab = {};

requirejs.config({
    paths: {
        midi: '../deps/MIDI.js/MIDI.min',
        EventEmitter: '../deps/node.js/EventEmitter'
    }
});

require(['Renderer', 'PlaybackController', 'EventEmitter'], function(renderer, playbackController, events){
    if (typeof GuitarTab.emitter === 'undefined') GuitarTab.emitter = new events.EventEmitter();

    var onMeasureClick = function(e) {
        var index = parseInt(this.id.match(/\d+$/));
        var xCoordinate = (e.pageX || (e.clientX + document.body.scrollLeft + document.documentElement.scrollLeft)) - this.offsetLeft;
        var measureWidth = this.offsetWidth;

        playbackController.setPlaybackPosition(index, xCoordinate, measureWidth);
    };

    GuitarTab.emitter.on('measure', function(e) {
        if (e.event == 'added') {
            document.getElementById('tab-measure-' + e.index).onclick = onMeasureClick;
        }
    });

    if (typeof GuitarTab.tab !== 'undefined'){
        document.getElementById('tab-title').appendChild(document.createTextNode(GuitarTab.tab.title));
        document.getElementById('tab-artist').appendChild(document.createTextNode(GuitarTab.tab.artist));

        var drawingCanvas = document.getElementById('drawing-canvas');

        // Convert to HTML and attach to the DOM
        renderer.renderTab(GuitarTab.tab, drawingCanvas);

        for (var measureIndex = 0; measureIndex < GuitarTab.tab.lengthInMeasures; measureIndex++) {
            document.getElementById('tab-measure-' + measureIndex).onclick = onMeasureClick;
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