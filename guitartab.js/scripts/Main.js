if (typeof GuitarTab === "undefined") var GuitarTab = {};

requirejs.config({
    paths: {
        midi: '../deps/MIDI.js/MIDI.min',
        EventEmitter: '../deps/node.js/EventEmitter'
    }
});

require(['Renderer', 'Player', 'Editor', 'EventEmitter'], function(renderer, player, editor, events){
    if (typeof GuitarTab.emitter === 'undefined') GuitarTab.emitter = new events.EventEmitter();

    var onMeasureClick = function(e) {
        var index = parseInt(e.currentTarget.id.match(/\d+$/));
        var xCoordinate = (e.pageX || (e.clientX + document.body.scrollLeft + document.documentElement.scrollLeft)) - e.currentTarget.offsetLeft;
        var measureWidth = e.currentTarget.offsetWidth;

        player.setPlaybackPosition(index, xCoordinate, measureWidth);
    };

    var onMeasureCellInput = function(e) {
        var span = $(e.target);
        var measureIndex = parseInt(span.closest('.tab-measure').attr('id').match(/\d+$/));
        var row = span.closest('tr')[0].sectionRowIndex;
        var col = span.closest('td')[0].cellIndex;

        editor.setNote(measureIndex, row, col, e.target.innerText);
    };

    var onMeasureCellClick = function(e) {
        e.currentTarget.getElementsByTagName('span')[0].focus();
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

        player.calculateMeasureEvents();
        editor.setTabEditable(true);

        MIDI.loadPlugin({
            soundfontUrl: "./soundfont/",
            instrument: "acoustic_grand_piano",
            callback: function() {
                document.getElementById('play-icon').addEventListener('click', function() {
                    player.play();
                });
                document.getElementById('pause-icon').addEventListener('click', function() {
                    player.pause();
                });
                document.getElementById('play-icon').style.visibility = 'visible';
            }
        });
    }
});