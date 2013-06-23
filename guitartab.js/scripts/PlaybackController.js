if (typeof GuitarTab === "undefined") var GuitarTab = {};

define(['midi'], function(midi) {
    var playing = false;
    var timeouts = [];
    var currentInterval;

    function startMeasure(measure, startOffset) {
        measure.cursor.style.left = '';
        measure.cursor.style.borderRightWidth = '';
        measure.cursor.style.transitionDuration = (measure.measureLength - startOffset) + 's';
        measure.cursor.classList.add('active');

        for (var i = 0; i < measure.sounds.length; i++) {
            var sound = measure.sounds[i];
            if (sound.offset < startOffset) continue;
            sound.onSource = MIDI.noteOn(0, sound.note, 63, sound.offset - startOffset);
            sound.offSource = MIDI.noteOff(0, sound.note, (sound.offset + sound.duration) - startOffset);
        }

        measure.active = true;
    }

    function resetMeasure(measure) {
        if (measure.active) {
            measure.cursor.style.transitionDuration = "";
            measure.active = false;

            setTimeout(function(){measure.cursor.classList.remove('active');}, 0);
        }
    }

    function stopCurrentInterval() {
        if (currentInterval) {
            clearInterval(currentInterval);
            currentInterval = null;
        }
    }

    function playMeasure(index, startOffset, playbackStateChange) {
        // If we've reached the end
        if (index === GuitarTab.tab.lengthInMeasures) {
            stopCurrentInterval();
            GuitarTab.currentMeasureIndex = 0;
            GuitarTab.currentMeasureInternalPosition = 0;
            playing = false;
            playbackStateChange.call({}, playing);
            return;
        }

        GuitarTab.currentMeasureIndex = index;
        var measureEvent = GuitarTab.measureEvents[index];

        if (startOffset !== 0){
            // Queue up the next measure
            setTimeout(function() { playMeasure(GuitarTab.currentMeasureIndex + 1, 0, playbackStateChange); }, (measureEvent.measureLength - startOffset) * 1000);
        } else {
            // If this is the first measure of a changed time-signature
            if (!currentInterval && !measureEvent.stopInterval) {
                currentInterval = setInterval(function() { playMeasure(GuitarTab.currentMeasureIndex + 1, 0, playbackStateChange); }, measureEvent.measureLength * 1000);
            }
        }

        startMeasure(measureEvent, startOffset);
        setTimeout(function() { resetMeasure(measureEvent) }, (measureEvent.measureLength - startOffset) * 1000);

        if (measureEvent.stopInterval) {
            stopCurrentInterval();
        }
    }

    function selectMeasure(i, xPosition) {
        if (!playing) {
            if (typeof GuitarTab.currentMeasureIndex !== "undefined") {
                var existingSelection = document.getElementById('tab-measure-' + GuitarTab.currentMeasureIndex);
                existingSelection.classList.remove('selected');
                existingSelection.firstChild.style.left = '';
                existingSelection.firstChild.style.borderRightWidth = '';
            }

            GuitarTab.currentMeasureIndex = i;
            GuitarTab.currentMeasureInternalPosition = xPosition;

            var pendingSelection = document.getElementById('tab-measure-' + i);
            pendingSelection.classList.add('selected');
            pendingSelection.firstChild.style.left = xPosition + '%';
            pendingSelection.firstChild.style.borderRightWidth = '1px';
        }
    }

    function onMeasureClick(e) {
        var index = parseInt(this.id.match(/\d+$/));
        var x = (e.pageX || (e.clientX + document.body.scrollLeft + document.documentElement.scrollLeft)) - this.offsetLeft;

        selectMeasure(index, x * 100 / this.offsetWidth);
    }

    return {
        calculateMeasureEvents: function() {
            var stringNoteOffsets = [76, 71, 67, 62, 57, 52];
            GuitarTab.measureEvents = [];
            var tab = GuitarTab.tab;
            var measureOffset = 0;
            var measureDuration = 0;

            // If undefined time signature, default to 4/4
            if (typeof tab.measureTimeSignatures[0] === "undefined") {
                tab.measureTimeSignatures[0] = { beatsPerMeasure: 4, beatLength: 4 };
            }

            for (var m = 0; m < tab.lengthInMeasures; m++) {
                var measureEvent = {
                    active: false,
                    cursor: document.getElementById('tab-measure-' + m).firstChild,
                    index: m,
                    measureLength: 0,
                    offset: measureOffset,
                    sounds: [],
                    startInterval: false,
                    stopInterval: false
                };

                // If there is a time signature change at the start of this measure
                if (typeof tab.measureTimeSignatures[m] !== "undefined") {
                    measureEvent.startInterval = true;

                    if (m >= 1) GuitarTab.measureEvents[m - 1].stopInterval = true;

                    measureDuration = (60 * 4 * tab.measureTimeSignatures[m].beatsPerMeasure) /
                                      (tab.beatsPerMinute * tab.measureTimeSignatures[m].beatLength);
                }

                measureEvent.measureLength = measureDuration;

                // Sound events
                for (var i = 0; i < tab.parts.length; i++) {
                    if (typeof tab.parts[i].measures[m] !== "undefined" &&
                        typeof tab.parts[i].measures[m].noteColumns !== "undefined") {
                        var noteColumns = tab.parts[i].measures[m].noteColumns;
                        var noteOffset = 0;

                        for (var c = 0; c < noteColumns.length; c++) {
                            var durationInSeconds = ((noteColumns[c].duration * 60) / (tab.beatsPerMinute * 16));

                            for (var n in noteColumns[c].notes) {
                                measureEvent.sounds.push({
                                    offset: noteOffset,
                                    duration: durationInSeconds - 0.01,
                                    note: stringNoteOffsets[n] + noteColumns[c].notes[n],
                                    onSource: undefined,
                                    offSource: undefined
                                });
                            }

                            noteOffset += durationInSeconds;
                        }
                    }
                }

                GuitarTab.measureEvents.push(measureEvent);

                measureOffset += measureDuration;
            }
        },

        play: function(playbackStateChange) {
            if (playing) {
                while (timeouts.length) clearTimeout(timeouts.pop());
                stopCurrentInterval();

                var measureEvent = GuitarTab.measureEvents[GuitarTab.currentMeasureIndex];

                // Kill all currently playing and queued audio
                for (var i = 0; i < measureEvent.sounds.length; i++) {
                    var onSource = measureEvent.sounds[i].onSource;
                    var offSource = measureEvent.sounds[i].offSource;

                    if (!measureEvent.sounds[i].onSource) continue; // is not web audio
                    if (typeof(onSource) === "number") {
                        window.clearTimeout(onSource);
                        window.clearTimeout(offSource);
                    } else { // web audio
                        onSource.disconnect(0);
                        onSource.noteOff(0);
                        offSource.disconnect(0);
                        offSource.noteOff(0);
                    }
                }
                resetMeasure(measureEvent);

                playing = false;
            } else {
                GuitarTab.currentMeasureIndex = GuitarTab.currentMeasureIndex || 0;
                GuitarTab.currentMeasureInternalPosition = GuitarTab.currentMeasureInternalPosition || 0;

                document.getElementById('tab-measure-' + GuitarTab.currentMeasureIndex).classList.remove('selected');

                if (typeof GuitarTab.measureEvents === "undefined") this.calculateMeasureEvents();

                var startOffset = GuitarTab.measureEvents[GuitarTab.currentMeasureIndex].offset +
                    (GuitarTab.measureEvents[GuitarTab.currentMeasureIndex].measureLength * GuitarTab.currentMeasureInternalPosition / 100);

                var queueMeasure = function(i, startOffset, measureStartTime) {
                    timeouts.push(setTimeout(function() {
                        playMeasure(i, startOffset, playbackStateChange);
                    }, measureStartTime));
                };

                for (var i = GuitarTab.currentMeasureIndex; i < GuitarTab.measureEvents.length; i++) {
                    if (i === GuitarTab.currentMeasureIndex){
                        queueMeasure(i, startOffset, 0);
                    } else if (GuitarTab.measureEvents[i].startInterval) {
                        queueMeasure(i, 0, GuitarTab.measureEvents[i].offset - startOffset);
                    }
                }
                playing = true;
            }

            playbackStateChange.call({}, playing);
        },

        attachTabEventHandlers: function(element) {
            element.onclick = onMeasureClick;
        }
    };
});