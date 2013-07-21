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

    var setMeasureEditable = function(measureIndex, value) {
        var measureContainer = document.getElementById('tab-measure-' + measureIndex);
        var spans = measureContainer.getElementsByTagName('span');

        for (var j = 0; j < spans.length; j++) {
            spans[j].contentEditable = value;
        }
    };

    var onEditPanelTabClick = function(e) {
        if (GuitarTab.state === 'edit') {
            document.getElementById('editor-panel').classList.remove('edit');

            for (var i = 0; i < GuitarTab.tab.lengthInMeasures; i++) {
                setMeasureEditable(i, false);
            }

            GuitarTab.state = '';
        } else if (GuitarTab.state === '') {
            document.getElementById('editor-panel').classList.add('edit');

            for (var i = 0; i < GuitarTab.tab.lengthInMeasures; i++) {
                setMeasureEditable(i, true);
            }

            GuitarTab.state = 'edit';
        }

        GuitarTab.emitter.emit('state');
    }

    editorController.addMeasureContainerEventListeners = function(measureContainer) {
        var measureCells = measureContainer.getElementsByTagName('td');
        for (var i = 0; i < measureCells.length; i++) {
            measureCells[i].firstChild.addEventListener('input', onMeasureCellInput);
            measureCells[i].addEventListener('click', onMeasureCellClick);
        }
    };

    editorController.addEditorPanelEventHandlers = function() {
        document.getElementById('editor-panel-tab').addEventListener('click', onEditPanelTabClick);
    };

    GuitarTab.emitter.on('measure', function(e) {
        if (e.event == 'added') {
            editorController.addMeasureContainerEventListeners(document.getElementById('tab-measure-' + e.index));

            if (GuitarTab.state === 'edit') {
                setMeasureEditable(e.index, true);
            }
        }
    });

    return editorController;
});