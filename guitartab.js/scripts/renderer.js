/*
GuitarTab.Renderer : 0.1
https://github.com/Markozy/guitartab.js

*/

define(function() {
    return {
        convertJsonMeasureToHtml: function(measure, numberOfStrings, index) {
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
                    measureNote.classList.add('dur' + measure.noteColumns[colIndex].duration);

                    if (measure.noteColumns[colIndex].notes[stringIndex] !== undefined) {
                        var measureNoteSpan = document.createElement('span');
                        measureNoteSpan.appendChild(document.createTextNode(measure.noteColumns[colIndex].notes[stringIndex]));
                        measureNote.appendChild(measureNoteSpan);
                    }

                    measureRows[stringIndex].appendChild(measureNote);
                }
            }

            measureContainer.appendChild(cursor);
            measureContainer.appendChild(measureTable);

            return measureContainer;
        }
    }
});