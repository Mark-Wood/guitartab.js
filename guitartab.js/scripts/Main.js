if (typeof GuitarTab === "undefined") var GuitarTab = {};

requirejs.config({
    paths: {
        midi: '../deps/MIDI.js/MIDI.min',
        EventEmitter: '../deps/node.js/EventEmitter'
    }
});

require(['Renderer', 'PlayerController', 'EditorController', 'EventEmitter'], function(renderer, playerController, editorController, events){
    if (typeof GuitarTab.emitter === 'undefined') GuitarTab.emitter = new events.EventEmitter();

    if (typeof GuitarTab.tab !== 'undefined') {
        GuitarTab.state = { playback: false, edit: false };

        document.getElementById('tab-title').appendChild(document.createTextNode(GuitarTab.tab.title));
        document.getElementById('tab-artist').appendChild(document.createTextNode(GuitarTab.tab.artist));

        var drawingCanvas = document.getElementById('drawing-canvas');

        // Convert to HTML and attach to the DOM
        renderer.renderTab(GuitarTab.tab, drawingCanvas);
        editorController.addEditorPanelEventHandlers();

        for (var measureIndex = 0; measureIndex < GuitarTab.tab.lengthInMeasures; measureIndex++) {
            var measureContainer = document.getElementById('tab-measure-' + measureIndex);
            editorController.addMeasureContainerEventListeners(measureContainer);
            playerController.addMeasureContainerEventListeners(measureContainer);
        }

        MIDI.loadPlugin({
            soundfontUrl: "./soundfont/",
            instrument: "acoustic_grand_piano",
            callback: function() {
                var audioContextInteraction = false;

                (function checkAudioContextReady() {
                    if (MIDI.Player.ctx.currentTime > 0) {
                        GuitarTab.emitter.emit('loaded');
                    }
                    else {
                        if (!audioContextInteraction &&
                            typeof MIDI.Player.ctx !== "undefined") {
                            MIDI.Player.ctx.createGain();
                            audioContextInteraction = true;
                        }

                        setTimeout(checkAudioContextReady, 100);
                    }
                })();
            }
        });
    }
});