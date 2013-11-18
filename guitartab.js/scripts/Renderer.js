/*
GuitarTab.Renderer : 0.1
https://github.com/Markozy/guitartab.js

*/

define(['EventEmitter'], function (events) {
    if (typeof GuitarTab.emitter === 'undefined') GuitarTab.emitter = new events.EventEmitter();

    var drawingTarget;

    var renderer = {};

    function calculateMeasureColumnWidths(measureIndex) {
        var digitWidth = 0.6;
        var sixtyFourthNoteWidth = digitWidth / 4;
        var measureContainer = document.getElementById('tab-measure-' + measureIndex);

        var tables = measureContainer.getElementsByTagName('table');
        for (var i = 0; i < tables.length; i++){
            var rows = tables[i].getElementsByTagName('tr');
            for (var j = 0; j < rows.length; j++) {
                var cols = rows[j].getElementsByTagName('td');
                for (var k = 0; k < cols.length; k++) {
                    var cell = cols[k];

                    sixtyFourthNoteWidth =
                        Math.max(sixtyFourthNoteWidth,
                                 (Math.max(1, cell.getElementsByTagName('span')[0].textContent.length) * digitWidth)
                                      / GuitarTab.tab.parts[i].measures[measureIndex].noteColumns[k].duration);
                }
            }
        }

        for (var i = 0; i < tables.length; i++){
            var rows = tables[i].getElementsByTagName('tr');
            for (var j = 0; j < rows.length; j++) {
                var cols = rows[j].getElementsByTagName('td');
                for (var k = 0; k < cols.length; k++) {
                    var cell = cols[k];
                    var width = (sixtyFourthNoteWidth * GuitarTab.tab.parts[i].measures[measureIndex].noteColumns[k].duration) + 'em';
                    cell.style.width = width;
                }
            }
        }
    }

    function convertJsonMeasureToHtml(measure, numberOfStrings, index) {
        var measureContainer = document.createElement('div');
        measureContainer.id = 'tab-measure-' + index;
        measureContainer.className = 'tab-measure';

        var cursor = document.createElement('div');
        cursor.className = 'tab-cursor';

        var measureTable = document.createElement('table');
        var measureRows = [];

        for (var stringIndex = 0; stringIndex < numberOfStrings; stringIndex++) {
            var measureRow = document.createElement('tr');
            measureRows.push(measureRow);
            measureTable.appendChild(measureRow);
        }

        // Treat measure as a single pause if not defined
        measure = measure ||  {
            noteColumns: [ {duration: 64, notes: {} } ]
        };

        // Create and fill in each column of notes in the measure
        for (var colIndex = 0; colIndex < measure.noteColumns.length; colIndex++) {
            for (var stringIndex = 0; stringIndex < numberOfStrings; stringIndex++) {
                var measureNote = document.createElement('td');
                var measureNoteSpan = document.createElement('span');

                var noteValue = measure.noteColumns[colIndex].notes[stringIndex];
                if (typeof noteValue !== "undefined") {
                    measureNoteSpan.appendChild(document.createTextNode(noteValue));
                }

                measureNote.appendChild(measureNoteSpan);
                measureRows[stringIndex].appendChild(measureNote);
            }
        }

        measureContainer.appendChild(cursor);
        measureContainer.appendChild(measureTable);

        return measureContainer;
    }

    renderer.renderTab = function renderTab(tab, targetElement) {
        drawingTarget = targetElement;

        for (var partIndex = 0; partIndex < tab.parts.length; partIndex++) {
            var part = tab.parts[partIndex];

            for (var measureIndex = 0; measureIndex < tab.lengthInMeasures; measureIndex++) {
                var measureContainer = convertJsonMeasureToHtml(part.measures[measureIndex], part.numberOfStrings, measureIndex);
                targetElement.appendChild(measureContainer);
                calculateMeasureColumnWidths(measureIndex);
            }
        }
    };

    GuitarTab.emitter.on('measure', function onMeasureEvent(e) {
        if (e.event === 'updated') {
            calculateMeasureColumnWidths(e.index);
        } else if (e.event === 'created') {
            // If appending
            if (e.index === GuitarTab.tab.lengthInMeasures - 1) {
                drawingTarget.appendChild(convertJsonMeasureToHtml(e.index));
            } else {
                // 'Shift' all existing measures that are after the measure we're going to insert along one
                for (var i = GuitarTab.tab.lengthInMeasures - 2; i >= e.index; i--) {
                    var measure = document.getElementById('tab-measure-' + i);
                    measure.id = 'tab-measure-' + (i + 1);

                    if (i == e.index) {
                        drawingTarget.insertBefore(convertJsonMeasureToHtml(e.index), measure);
                    }
                }
            }

            calculateMeasureColumnWidths(e.index);
        } else if (e.event === 'deleted') {
            drawingTarget.removeChild(document.getElementById('tab-measure-' + e.index));

            // 'Shift' all existing measures that are after the measure we're going to delete back one
            for (var i = e.index + 1; i < GuitarTab.tab.lengthInMeasures; i++) {
                document.getElementById('tab-measure-' + i).id = 'tab-measure-' + (i - 1);
            }
        }
    });

    GuitarTab.emitter.on('note', function onNoteEvent(e) {
        if (e.event === 'updated') {
            if (e.type === 'value') {
                var noteValue = GuitarTab.tab.parts[0].measures[e.measureIndex].noteColumns[e.colIndex].notes[e.rowIndex];

                $('#tab-measure-' + e.measureIndex)
                    .find('tr:eq(' + e.rowIndex + ')')
                    .find('td:eq(' + e.colIndex + ')')
                    .find('span').text(typeof noteValue !== 'undefined' ? noteValue : '');
            }

            calculateMeasureColumnWidths(e.measureIndex);
        } else if (e.event === 'created') {
            calculateMeasureColumnWidths(e.measureIndex);
        } else if (e.event === 'deleted') {
            calculateMeasureColumnWidths(e.measureIndex);
        }
    });

    return renderer;
});