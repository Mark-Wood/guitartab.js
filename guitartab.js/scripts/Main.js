if (typeof GuitarTab === "undefined") var GuitarTab = {};

requirejs.config({
    paths: {
        midi: '../deps/MIDI.js/MIDI.min',
        EventEmitter: '../deps/node.js/EventEmitter'
    }
});

require(['Renderer', 'PlaybackController', 'Editor', 'EventEmitter'], function(renderer, playbackController, editor, events){
    if (typeof GuitarTab.emitter === 'undefined') GuitarTab.emitter = new events.EventEmitter();

    var onMeasureClick = function(e) {
        var index = parseInt(this.id.match(/\d+$/));
        var xCoordinate = (e.pageX || (e.clientX + document.body.scrollLeft + document.documentElement.scrollLeft)) - this.offsetLeft;
        var measureWidth = this.offsetWidth;

        playbackController.setPlaybackPosition(index, xCoordinate, measureWidth);
    };

    var onMeasureCellInput = function(e) {
        var measureIndex = parseInt(e.target.parentNode.parentNode.parentNode.parentNode.id.match(/\d+$/));
        var row = e.target.parentNode.parentNode.sectionRowIndex;
        var col = e.target.parentNode.cellIndex;

        editor.setNote(measureIndex, row, col, e.target.innerText);
    };

    var onMeasureCellClick = function(e) {
        this.firstChild.focus();
    };

    GuitarTab.emitter.on('measure', function(e) {
        if (e.event == 'added') {
            addMeasureContainerEventListeners(document.getElementById('tab-measure-' + e.index));
        }
    });

    var addMeasureContainerEventListeners = function(measureContainer) {
        measureContainer.addEventListener('click', onMeasureClick);

        var measureCells = measureContainer.getElementsByTagName('td');
        for (var i = 0; i < measureCells.length; i++) {
            measureCells[i].firstChild.addEventListener('input', onMeasureCellInput);
            measureCells[i].addEventListener('click', onMeasureCellClick);
        }
    };

    if (typeof GuitarTab.tab !== 'undefined') {
        document.getElementById('tab-title').appendChild(document.createTextNode(GuitarTab.tab.title));
        document.getElementById('tab-artist').appendChild(document.createTextNode(GuitarTab.tab.artist));

        var drawingCanvas = document.getElementById('drawing-canvas');

        // Convert to HTML and attach to the DOM
        renderer.renderTab(GuitarTab.tab, drawingCanvas);

        for (var measureIndex = 0; measureIndex < GuitarTab.tab.lengthInMeasures; measureIndex++) {
            addMeasureContainerEventListeners(document.getElementById('tab-measure-' + measureIndex));
        }

        playbackController.calculateMeasureEvents();
        editor.setTabEditable(true);

        MIDI.loadPlugin({
            soundfontUrl: "./soundfont/",
            instrument: "acoustic_grand_piano",
            callback: function() {
                document.getElementById('play-icon').addEventListener('click', function() {
                    playbackController.play();
                });
                document.getElementById('pause-icon').addEventListener('click', function() {
                    playbackController.pause();
                });
                document.getElementById('play-icon').style.visibility = 'visible';
            }
        });
    }
});