/*
 GuitarTab.Editor : 0.1
 https://github.com/Markozy/guitartab.js

 */

define(['EventEmitter'], function(events) {
    if (typeof GuitarTab.emitter === 'undefined') GuitarTab.emitter = new events.EventEmitter();

    var editor = {};

    editor.setNote = function (measureIndex, row, column, value) {
        if (typeof value === 'number' || value.match(/^\d+$/)) {
            GuitarTab.tab.parts[0].measures[measureIndex].noteColumns[column].notes[row] = parseInt(value);
        } else {
            delete GuitarTab.tab.parts[0].measures[measureIndex].noteColumns[column].notes[row];
        }

        GuitarTab.emitter.emit('measure', { event: 'updated', index: measureIndex });
    };

    editor.setTabEditable = function(value) {
        for (var i = 0; i < GuitarTab.tab.lengthInMeasures; i++) {
            var measureContainer = document.getElementById('tab-measure-' + i);
            var spans = measureContainer.getElementsByTagName('span');

            for (var j = 0; j < spans.length; j++) {
                spans[j].contentEditable = value;
            }
        }
    };

    GuitarTab.emitter.on('playbackState', function(e) {
        editor.setTabEditable(!e.playing);
    });

    GuitarTab.emitter.on('loaded', function(e) {
        editor.setTabEditable(true);
    });

    return editor;
});