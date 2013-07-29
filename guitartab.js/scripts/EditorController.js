if (typeof GuitarTab === "undefined") var GuitarTab = {};

define(['Editor', 'EventEmitter'], function(editor, events) {
    if (typeof GuitarTab.emitter === 'undefined') GuitarTab.emitter = new events.EventEmitter();

    var noteEditingSession = false;
    var editorController = {};

    var setSelectedCell = function(target) {
        if (GuitarTab.focusedCell) GuitarTab.focusedCell.classList.remove('selected');
        GuitarTab.focusedCell = target;

        if (target) {
            GuitarTab.focusedCell.classList.add('selected');

            noteEditingSession = false;
        }
    }

    var onMeasureCellClick = function(e) {
        if (GuitarTab.state === 'edit') {
            setSelectedCell(e.currentTarget);
        }
    };

    var onEditPanelTabClick = function(e) {
        if (GuitarTab.state === 'edit') {
            document.getElementById('editor-panel').classList.remove('edit');
            GuitarTab.state = '';
        } else if (GuitarTab.state === '') {
            document.getElementById('editor-panel').classList.add('edit');
            GuitarTab.state = 'edit';
        }

        GuitarTab.emitter.emit('state');
    }

    editorController.addMeasureContainerEventListeners = function(measureContainer) {
        var measureCells = measureContainer.getElementsByTagName('td');
        for (var i = 0; i < measureCells.length; i++) {
            measureCells[i].addEventListener('click', onMeasureCellClick);
        }
    };

    editorController.addEditorPanelEventHandlers = function() {
        document.getElementById('editor-panel-tab').addEventListener('click', onEditPanelTabClick);
    };

    GuitarTab.emitter.on('measure', function(e) {
        if (e.event == 'added') {
            editorController.addMeasureContainerEventListeners(document.getElementById('tab-measure-' + e.index));
        }
    });

    GuitarTab.emitter.on('state', function(e) {
        if (GuitarTab.state !== 'edit') {
            setSelectedCell(null);
        }
    });

    document.addEventListener('keydown', function(e) {
        var setNote = function(span, value) {
            var measureIndex = parseInt(span.closest('.tab-measure').attr('id').match(/\d+$/));
            var row = span.closest('tr').prevAll().length;
            var col = span.closest('td').prevAll().length;

            editor.setNote(measureIndex, row, col, value);
        };

        if (GuitarTab.focusedCell) {
            var keyCode = e.which || e.keyCode;
            if (!e.ctrlKey && !e.metaKey && !e.altKey && !e.shiftKey) {
                // If a numeric char
                if (keyCode >= 48 && keyCode < 58) {
                    var char = String.fromCharCode(e.which || e.keyCode);
                    var span = $(GuitarTab.focusedCell.getElementsByTagName('span')[0]);

                    var newValue;
                    if (noteEditingSession) {
                        newValue = span.text() + char;
                    } else {
                        newValue = char;
                    }

                    setNote(span, newValue);

                    noteEditingSession = true;
                } else if (keyCode == 46) {
                    var span = $(GuitarTab.focusedCell.getElementsByTagName('span')[0]);

                    setNote(span, '');
                }
            }
            console.log(keyCode);
        }
    });

    return editorController;
});