if (typeof GuitarTab === "undefined") var GuitarTab = {};

define(['midi'], function(midi) {
    var playing = false;
    var timeouts = [];
    var currentInterval;
    var startTime;

    function resetMeasureCursor(cursor) {
        var existingDuration = cursor.style.transitionDuration;
        cursor.style.transitionDuration = "";
        cursor.classList.remove('active');
        setTimeout(function(){cursor.style.transitionDuration = existingDuration;}, 0);
    }

    function stopCurrentInterval() {
        if (currentInterval) {
            clearInterval(currentInterval);
            currentInterval = null;
        }
    }

    function playNextMeasure(playbackStateChange) {
        if (GuitarTab.currentMeasureIndex === GuitarTab.tab.lengthInMeasures) {
            stopCurrentInterval();
            playing = false;
            GuitarTab.currentMeasureIndex = 0;
            playbackStateChange.call({}, playing);
            return;
        }

        var measureEvent = GuitarTab.measureEvents[GuitarTab.currentMeasureIndex];

        if (!currentInterval && !measureEvent.stopInterval) {
            currentInterval = setInterval(function() { playNextMeasure(playbackStateChange); }, measureEvent.measureLength);
        }

        var targetCursor = document.getElementById('tab-measure-' + GuitarTab.currentMeasureIndex).firstChild;
        targetCursor.classList.add('active');
        setTimeout(function() { resetMeasureCursor(targetCursor) },  measureEvent.measureLength);

        for (var i = 0; i < measureEvent.sounds.length; i++) {
            MIDI.noteOn(0, measureEvent.sounds[i].note, 63, measureEvent.sounds[i].delay);
            MIDI.noteOff(0, measureEvent.sounds[i].note, measureEvent.sounds[i].delay + measureEvent.sounds[i].duration);
        }

        if (measureEvent.stopInterval) {
            stopCurrentInterval();
        }

        GuitarTab.currentMeasureIndex++;
    }

    function selectMeasure(i) {
        if (!playing) {
            if (typeof GuitarTab.currentMeasureIndex !== "undefined") {
                document.getElementById('tab-measure-' + GuitarTab.currentMeasureIndex).classList.remove('selected');
            }

            GuitarTab.currentMeasureIndex = i;
            document.getElementById('tab-measure-' + i).classList.add('selected');
        }
    }

    function onMeasureClick() {
        selectMeasure(parseInt(this.id.match(/\d+$/)));
    }

    return {
        calculateMeasureEvents: function() {
            var stringNoteOffsets = [76, 71, 67, 62, 57, 52];
            GuitarTab.measureEvents = [];
            var tab = GuitarTab.tab;
            var offset = 0;
            var measureDuration = 0;

            // If undefined time signature, default to 4/4
            if (typeof tab.measureTimeSignatures[0] === "undefined") {
                tab.measureTimeSignatures[0] = { beatsPerMeasure: 4, beatLength: 4 };
            }

            for (var m = 0; m < tab.lengthInMeasures; m++) {
                var measureEvent = {
                    timeOffset: offset,
                    sounds: []
                };

                // If there is a time signature change at the start of this measure
                if (typeof tab.measureTimeSignatures[m] !== "undefined") {
                    measureEvent.startInterval = true;

                    if (m >= 1) GuitarTab.measureEvents[m - 1].stopInterval = true;

                    measureDuration = (60000 * 4 * tab.measureTimeSignatures[m].beatsPerMeasure) /
                                      (tab.beatsPerMinute * tab.measureTimeSignatures[m].beatLength);
                }

                measureEvent.measureLength = measureDuration;
                document.getElementById('tab-measure-' + m).firstChild.style.transitionDuration =  measureDuration + 'ms';

                // Sound events
                for (var i = 0; i < tab.parts.length; i++) {
                    if (typeof tab.parts[i].measures[m] !== "undefined" &&
                        typeof tab.parts[i].measures[m].noteColumns !== "undefined") {
                        var noteColumns = tab.parts[i].measures[m].noteColumns;
                        var currentDelay = 0;

                        for (var c = 0; c < noteColumns.length; c++) {
                            var durationInSeconds = ((noteColumns[c].duration * 60) / (tab.beatsPerMinute * 16));

                            for (var n in noteColumns[c].notes) {
                                measureEvent.sounds.push({
                                    delay: currentDelay,
                                    duration: durationInSeconds - 0.01,
                                    note: stringNoteOffsets[n] + noteColumns[c].notes[n]
                                });
                            }

                            currentDelay += durationInSeconds;
                        }
                    }
                }

                GuitarTab.measureEvents.push(measureEvent);

                offset += measureDuration;
            }
        },

        play: function(playbackStateChange) {
            if (playing) {
                for (var i = 0; i < timeouts.length; i++) {
                    clearTimeout(timeouts[i]);
                }

                timeouts = [];
                stopCurrentInterval();

                if (GuitarTab.currentMeasureIndex === GuitarTab.tab.lengthInMeasures) {
                    GuitarTab.currentMeasureIndex = 0;
                }

                playing = false;
            } else {
                startTime = getContext().currentTime;
                if (typeof GuitarTab.currentMeasureIndex === "undefined") {
                    GuitarTab.currentMeasureIndex = 0;
                } else {
                    document.getElementById('tab-measure-' + GuitarTab.currentMeasureIndex).classList.remove('selected');
                }

                if (typeof GuitarTab.measureEvents === "undefined") {
                    this.calculateMeasureEvents();
                }

                var startOffset = GuitarTab.measureEvents[GuitarTab.currentMeasureIndex].timeOffset;

                for (var i = GuitarTab.currentMeasureIndex; i < GuitarTab.measureEvents.length; i++) {
                    if (i === GuitarTab.currentMeasureIndex || GuitarTab.measureEvents[i].startInterval) {
                        // Arbitrarily add 100ms so that setTimeout is never called with a time of 0
                        timeouts.push(setTimeout(function() {playNextMeasure(playbackStateChange);}, (GuitarTab.measureEvents[i].timeOffset - startOffset) + 100));
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