if (typeof GuitarTab === "undefined") var GuitarTab = {};

define(['midi'], function(midi) {
    var playing = false;
    var timeouts = [];
    var currentInterval;
    var playbackPosition;
    var timeAtStart;

    function startMeasure(measure) {
        var playbackPositionInMeasure = playbackPosition - measure.offset;
        measure.cursor.style.left = '';
        measure.cursor.style.borderRightWidth = '';
        measure.cursor.style.transitionDuration = (measure.measureLength - playbackPositionInMeasure) + 'ms';
        measure.cursor.classList.add('active');

        for (var i = 0; i < measure.sounds.length; i++) {
            var sound = measure.sounds[i];
            if (sound.offset < playbackPositionInMeasure) continue;
            sound.onSource = MIDI.noteOn(0, sound.note, 63, (sound.offset - playbackPositionInMeasure) / 1000);
            sound.offSource = MIDI.noteOff(0, sound.note, ((sound.offset + sound.duration) - playbackPositionInMeasure) / 1000);
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

    function playMeasure(index, playbackStateChange) {
        if (!playing) return;

        // If we've reached the end
        if (index === GuitarTab.tab.lengthInMeasures) {
            stopCurrentInterval();
            playbackPosition = 0;
            playing = false;
            playbackStateChange.call({}, playing);
            return;
        }

        var measureEvent = GuitarTab.measureEvents[index];

        if (measureEvent.offset < playbackPosition){
            // Queue up the next measure
            timeouts.push(setTimeout(function() { playMeasure(index + 1, playbackStateChange); }, measureEvent.measureLength - (playbackPosition - measureEvent.offset)));
        } else {
            playbackPosition = measureEvent.offset;

            // If this is the first measure of a changed time-signature
            if (!currentInterval && !measureEvent.stopInterval) {
                var indexToPlay = index + 1;

                currentInterval = setInterval(function() {
                    playMeasure(indexToPlay++, playbackStateChange);
                }, measureEvent.measureLength);
            }
        }

        startMeasure(measureEvent);
        timeouts.push(setTimeout(function() { resetMeasure(measureEvent) }, measureEvent.measureLength - (playbackPosition - measureEvent.offset)));

        if (measureEvent.stopInterval) {
            stopCurrentInterval();
        }
    }

    function onMeasureClick(e) {
        if (!playing) {
            if (typeof playbackPosition !== "undefined") {
                var i = 0;
                while ((GuitarTab.measureEvents[i].offset + GuitarTab.measureEvents[i].measureLength) <= playbackPosition) i++;
                var existingSelection = document.getElementById('tab-measure-' + i);
                existingSelection.firstChild.style.left = '';
                existingSelection.firstChild.style.borderRightWidth = '';
            }

            // Get x co-ordinate as a percentage
            var x = ((e.pageX || (e.clientX + document.body.scrollLeft + document.documentElement.scrollLeft)) - this.offsetLeft) / this.offsetWidth;
            var index = parseInt(this.id.match(/\d+$/));

            playbackPosition = GuitarTab.measureEvents[index].offset + (GuitarTab.measureEvents[index].measureLength * x);
            this.firstChild.style.left = (x * 100) + '%';
            this.firstChild.style.borderRightWidth = '1px';
        }
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

                    measureDuration = (60000 * 4 * tab.measureTimeSignatures[m].beatsPerMeasure) /
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
                            var durationInMs = ((noteColumns[c].duration * 60000) / (tab.beatsPerMinute * 16));

                            for (var n in noteColumns[c].notes) {
                                measureEvent.sounds.push({
                                    offset: noteOffset,
                                    duration: durationInMs - 10,
                                    note: stringNoteOffsets[n] + noteColumns[c].notes[n],
                                    onSource: undefined,
                                    offSource: undefined
                                });
                            }

                            noteOffset += durationInMs;
                        }
                    }
                }

                GuitarTab.measureEvents.push(measureEvent);

                measureOffset += measureDuration;
            }
        },

        play: function(playbackStateChange) {
            if (playing) {
                // Cleared any queued up measures
                while (timeouts.length) clearTimeout(timeouts.pop());
                stopCurrentInterval();

                // Get the measure currently playing
                var i = 0;
                while ((GuitarTab.measureEvents[i].offset + GuitarTab.measureEvents[i].measureLength) <= playbackPosition) i++;
                var measureEvent = GuitarTab.measureEvents[i];

                // Kill all currently playing and queued audio
                for (var i = 0; i < measureEvent.sounds.length; i++) {
                    var onSource = measureEvent.sounds[i].onSource;
                    var offSource = measureEvent.sounds[i].offSource;

                    if (!onSource) continue; // is not web audio
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

                playbackPosition = new Date().getTime() - timeAtStart;
                // Get the measure that the user has paused in
                for (var i = 0; (GuitarTab.measureEvents[i].offset + GuitarTab.measureEvents[i].measureLength) <= playbackPosition; i++);
                measureEvent = GuitarTab.measureEvents[i];

                measureEvent.cursor.style.left = ((playbackPosition - measureEvent.offset) * 100 / measureEvent.measureLength) + '%';
                measureEvent.cursor.style.borderRightWidth = '1px';

                playing = false;
            } else {
                playbackPosition = playbackPosition || 0;
                timeAtStart = new Date().getTime() - playbackPosition; // Set the effective start time

                if (typeof GuitarTab.measureEvents === "undefined") this.calculateMeasureEvents();

                var queueMeasure = function(i, measureStartTime) {
                    timeouts.push(setTimeout(function() {
                        playMeasure(i, playbackStateChange);
                    }, measureStartTime));
                };

                for (var i = 0; i < GuitarTab.measureEvents.length; i++) {
                    var measureEvent = GuitarTab.measureEvents[i];

                    // If we're resuming from after this measure, ignore
                    if (measureEvent.offset + measureEvent.measureLength < playbackPosition) continue;

                    if (measureEvent.offset < playbackPosition){
                        queueMeasure(i, 0);
                    } else if (measureEvent.startInterval) {
                        queueMeasure(i, GuitarTab.measureEvents[i].offset - playbackPosition);
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