/*
 GuitarTab.Editor : 0.1
 https://github.com/Markozy/guitartab.js

 */

define(['EventEmitter'], function(events) {
    if (typeof GuitarTab.emitter === 'undefined') GuitarTab.emitter = new events.EventEmitter();

    var editor = {};

    editor.setNote = function (measureIndex, row, column, value) {
        console.log('Index: '+measureIndex+', Row: '+row+', Col: '+column+', Val: '+value);
        if (typeof value === 'number' || value.match(/^\d+$/)) {
            GuitarTab.tab.parts[0].measures[measureIndex].noteColumns[column].notes[row] = parseInt(value);
        } else {
            delete GuitarTab.tab.parts[0].measures[measureIndex].noteColumns[column].notes[row];
        }

        GuitarTab.emitter.emit('note', {
            event: 'updated',
            type: 'value',
            measureIndex: measureIndex,
            rowIndex: row,
            colIndex: column
        });
    };

    editor.setNoteLength = function(measureIndex, column, value) {
        if (typeof value === 'number' || value.match(/^\d+$/)) {
            GuitarTab.tab.parts[0].measures[measureIndex].noteColumns[column].duration = parseInt(value);
        }

        GuitarTab.emitter.emit('note', {
            event: 'updated',
            type: 'length',
            measureIndex: measureIndex,
            colIndex: column
        });
    };

    return editor;
});