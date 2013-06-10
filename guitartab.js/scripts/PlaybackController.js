if (typeof (GuitarTab) === "undefined") var GuitarTab = {};

define(function() {
    function playNextMeasure() {
        if (GuitarTab.currentMeasureIndex === GuitarTab.tab.lengthInMeasures) {
            clearInterval(this.currentInterval);
            document.getElementById('tab-measure-' + (GuitarTab.currentMeasureIndex - 1)).firstChild.classList.remove('active');
            return;
        }

        var measureEvent = GuitarTab.measureEvents[GuitarTab.currentMeasureIndex];

        if (measureEvent.startInterval && !measureEvent.stopInterval) {
            this.currentInterval = setInterval(playNextMeasure, measureEvent.measureLength);
        }

        document.getElementById('tab-measure-' + GuitarTab.currentMeasureIndex).firstChild.classList.add('active');

        for (var i = 0; i < measureEvent.sounds.length; i++) {
            MIDI.noteOn(0, measureEvent.sounds[i].note, 127, measureEvent.sounds[i].delay);
            MIDI.noteOff(0, measureEvent.sounds[i].note, measureEvent.sounds[i].delay + measureEvent.sounds[i].duration);
        }

        if (GuitarTab.currentMeasureIndex >= 1) {
            document.getElementById('tab-measure-' + (GuitarTab.currentMeasureIndex - 1)).firstChild.classList.remove('active');
        }

        if (!measureEvent.startInterval && measureEvent.stopInterval) {
            clearInterval(this.currentInterval);
        }

        GuitarTab.currentMeasureIndex++;
    };

    return {
        play: function() {
            if (GuitarTab.measureEvents == undefined) {
                this.calculateMeasureEvents();
            }

            GuitarTab.currentMeasureIndex = 0;

            for (var measureIndex = 0; measureIndex < GuitarTab.measureEvents.length; measureIndex++) {
                if (GuitarTab.measureEvents[measureIndex].startInterval) {
                    setTimeout(playNextMeasure, GuitarTab.measureEvents[measureIndex].timeOffset + 100);
                }
            }
        },
        calculateMeasureEvents: function() {
            var stringNoteOffsets = [76, 71, 67, 62, 57, 52];
            GuitarTab.measureEvents = [];
            var timeOffset = 0;
            var currentMeasureLength = 0;

            // If undefined time signature, default to 4/4
            if (GuitarTab.tab.measureTimeSignatures[0] == undefined) {
                GuitarTab.tab.measureTimeSignatures[0] = { beatsPerMeasure: 4, beatLength: 4 };
            }

            for (var measureIndex = 0; measureIndex < GuitarTab.tab.lengthInMeasures; measureIndex++) {
                var measureEvent = {};
                measureEvent.timeOffset = timeOffset;

                // If there is a time signature change at the start of this measure
                if (GuitarTab.tab.measureTimeSignatures[measureIndex] !== undefined) {
                    if (measureIndex >= 1) {
                        GuitarTab.measureEvents[measureIndex - 1].stopInterval = true;
                    }
                    measureEvent.startInterval = true;

                    var measureTimeSignature = GuitarTab.tab.measureTimeSignatures[measureIndex];
                    currentMeasureLength = (60000 * 4 * measureTimeSignature.beatsPerMeasure) / (GuitarTab.tab.beatsPerMinute * measureTimeSignature.beatLength);
                }

                measureEvent.measureLength = currentMeasureLength;
                document.getElementById('tab-measure-' + measureIndex).firstChild.style.transitionDuration =  currentMeasureLength + 'ms';

                // Sound events
                measureEvent.sounds = [];
                for (var instrIndex = 0; instrIndex < GuitarTab.tab.parts.length; instrIndex++) {
                    if (GuitarTab.tab.parts[instrIndex].measures[measureIndex] !== undefined &&
                        GuitarTab.tab.parts[instrIndex].measures[measureIndex].noteColumns !== undefined) {
                        var noteColumns = GuitarTab.tab.parts[instrIndex].measures[measureIndex].noteColumns;
                        var currentDelay = 0;
                        for (var columnIndex = 0; columnIndex < noteColumns.length; columnIndex++) {
                            var durationInSeconds = ((noteColumns[columnIndex].duration * 60) / (GuitarTab.tab.beatsPerMinute * 16));

                            for (var noteIndex in noteColumns[columnIndex].notes) {
                                measureEvent.sounds.push({
                                    delay: currentDelay,
                                    duration: durationInSeconds,
                                    note: stringNoteOffsets[noteIndex] + noteColumns[columnIndex].notes[noteIndex] });
                            }

                            currentDelay += durationInSeconds;
                        }
                    }
                }

                GuitarTab.measureEvents.push(measureEvent);

                timeOffset += currentMeasureLength;
            }
        }
    };
});