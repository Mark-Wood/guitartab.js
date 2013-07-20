if (typeof GuitarTab === "undefined") var GuitarTab = {};

define(['Editor', 'EventEmitter'], function(editor, events) {
    if (typeof GuitarTab.emitter === 'undefined') GuitarTab.emitter = new events.EventEmitter();

    var editorController = {};

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

    editorController.addMeasureContainerEventListeners = function(measureContainer) {
        var measureCells = measureContainer.getElementsByTagName('td');
        for (var i = 0; i < measureCells.length; i++) {
            measureCells[i].firstChild.addEventListener('input', onMeasureCellInput);
            measureCells[i].addEventListener('click', onMeasureCellClick);
        }
    };

    GuitarTab.emitter.on('measure', function(e) {
        if (e.event == 'added') {
            editorController.addMeasureContainerEventListeners(document.getElementById('tab-measure-' + e.index));
        }
    });

    return editorController;
});