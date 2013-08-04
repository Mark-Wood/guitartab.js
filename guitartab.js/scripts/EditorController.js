if (typeof GuitarTab === "undefined") var GuitarTab = {};

define(['Editor', 'EventEmitter'], function(editor, events) {
    if (typeof GuitarTab.emitter === 'undefined') GuitarTab.emitter = new events.EventEmitter();

    var noteEditingSession = false;
    var editorController = {};

    var getNoteIndices = function(noteElement) {
        var jqueryNoteElement = $(noteElement);

        return {
            measure: parseInt(jqueryNoteElement.closest('.tab-measure').attr('id').match(/\d+$/)),
            row: jqueryNoteElement.closest('tr').prevAll().length,
            column: jqueryNoteElement.closest('td').prevAll().length
        };
    };

    var setSelectedCell = function(target) {
        if (GuitarTab.focusedCell) GuitarTab.focusedCell.classList.remove('selected');
        GuitarTab.focusedCell = target;

        if (target) {
            GuitarTab.focusedCell.classList.add('selected');

            noteEditingSession = false;
            var indices = getNoteIndices(target);
            var noteLength = GuitarTab.tab.parts[0].measures[indices.measure].noteColumns[indices.column].duration;
            $('#editor-panel input[name="note-length"]').prop('disabled', false);
            document.getElementById('note-length-' + noteLength).checked = true;
        } else {
            $('#editor-panel input[name="note-length"]').prop({ disabled: true, checked: false });
        }
    };

    var onMeasureCellClick = function(e) {
        if (GuitarTab.state.edit && !GuitarTab.state.playback) {
            setSelectedCell(e.currentTarget);
        }
    };

    var onEditPanelTabClick = function(e) {
        if (GuitarTab.state.edit) {
            document.getElementById('editor-panel').classList.remove('edit');
            document.getElementById('editor-panel-content').classList.remove('edit');
            GuitarTab.state.edit = false;
        } else {
            document.getElementById('editor-panel').classList.add('edit');
            document.getElementById('editor-panel-content').classList.add('edit');
            GuitarTab.state.edit = true;
        }

        GuitarTab.emitter.emit('state');
    };

    var onEditPanelInputClick = function(e) {
        if (e.currentTarget.name === 'note-length') {
            var indices = getNoteIndices(GuitarTab.focusedCell);
            editor.setNoteLength(indices.measure, indices.column, e.currentTarget.value);
        }
    };

    editorController.addMeasureContainerEventListeners = function(measureContainer) {
        var measureCells = measureContainer.getElementsByTagName('td');
        for (var i = 0; i < measureCells.length; i++) {
            measureCells[i].addEventListener('click', onMeasureCellClick);
        }
    };

    editorController.addEditorPanelEventHandlers = function() {
        document.getElementById('editor-panel-tab').addEventListener('click', onEditPanelTabClick);
        $('#editor-panel input').click(onEditPanelInputClick);
    };

    GuitarTab.emitter.on('measure', function(e) {
        if (e.event == 'added') {
            editorController.addMeasureContainerEventListeners(document.getElementById('tab-measure-' + e.index));
        }
    });

    GuitarTab.emitter.on('state', function(e) {
        if (GuitarTab.state.playback || !GuitarTab.state.edit) {
            setSelectedCell(null);
        }
    });

    document.addEventListener('keydown', function(e) {
        if (GuitarTab.focusedCell) {
            var keyCode = e.which || e.keyCode;
            if (!e.ctrlKey && !e.metaKey && !e.altKey && !e.shiftKey) {
                // If a numeric char
                if (keyCode >= 48 && keyCode < 58) {
                    var char = String.fromCharCode(e.which || e.keyCode);
                    var newValue;

                    if (noteEditingSession) {
                        newValue = GuitarTab.focusedCell.getElementsByTagName('span')[0].innerText + char;
                    } else {
                        newValue = char;
                    }

                    var indices = getNoteIndices(GuitarTab.focusedCell);
                    editor.setNote(indices.measure, indices.row, indices.column, newValue);
                    noteEditingSession = true;
                } else if (keyCode == 46) {
                    var indices = getNoteIndices(GuitarTab.focusedCell);
                    editor.setNote(indices.measure, indices.row, indices.column, '');
                }
            }
            console.log(keyCode);
        }
    });

    return editorController;
});