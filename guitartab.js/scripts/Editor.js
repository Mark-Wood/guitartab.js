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

    return editor;
});