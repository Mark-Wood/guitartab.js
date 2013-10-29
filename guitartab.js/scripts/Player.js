if (typeof GuitarTab === "undefined") var GuitarTab = {};

define(['midi', 'EventEmitter'], function(midi, events) {
    if (typeof GuitarTab.emitter === 'undefined') GuitarTab.emitter = new events.EventEmitter();

    window.AudioContext = window.AudioContext || window.webkitAudioContext;
    var audioContext;
    var timerId;

    var playbackPosition = 0;   // The elapsed time
    var timeAtStart;        // The audio context's time when playback began

    var soundEvents;        // The notes generated from the tab
    var measureBoundaries;  // Array detailing the measure boundaries for cursor animation

    var currentlyAnimatingMeasure;

    var nextSoundIndex = 0;
    var nextMeasureIndex = 0;

    var player = {};

    // First, let's shim the requestAnimationFrame API, with a setTimeout fallback
    window.requestAnimFrame = (function(){
        return window.requestAnimationFrame ||
            window.webkitRequestAnimationFrame ||
            window.mozRequestAnimationFrame ||
            window.oRequestAnimationFrame ||
            window.msRequestAnimationFrame ||
            function( callback ){
                window.setTimeout(callback, 1000 / 60);
            };
    })();

    var moveCursor = function(cursor, toPos, fromPos, duration) {
        cursor.style.borderRightWidth = '1px';
        cursor.style.transitionDuration = '';

        if (!duration) {
            cursor.style.left = toPos;
        } else {
            cursor.style.left = fromPos;

            setTimeout(function(){
                cursor.style.transitionDuration = duration;
                cursor.style.left = toPos;
            }, 0);
        }
    }

    var hideCursor = function(cursor) {
        cursor.style.borderRightWidth = '0px';
    }

    var draw = function() {
        var currentElapsed = audioContext.currentTime + playbackPosition - timeAtStart;

        if (measureBoundaries[measureBoundaries.length - 1].offset + measureBoundaries[measureBoundaries.length - 1].duration < currentElapsed) {
            GuitarTab.state.playback = false;
            GuitarTab.emitter.emit('state');
            playbackPosition = 0;
        }

        if (currentlyAnimatingMeasure &&
            (currentlyAnimatingMeasure.offset + currentlyAnimatingMeasure.duration < currentElapsed ||
             currentlyAnimatingMeasure.offset > currentElapsed)) {
            console.log('Measure '+ (nextMeasureIndex - 1) +' End @ ' + audioContext.currentTime)
            hideCursor(currentlyAnimatingMeasure.cursor);
        }

        if (GuitarTab.state.playback) {
            if (nextMeasureIndex < measureBoundaries.length) {
                var nextMeasure = measureBoundaries[nextMeasureIndex];

                // Fire off the new measure's cursor animation.
                if (nextMeasure.offset <= currentElapsed) {
                    // Start animation
                    var startingPosition = ((currentElapsed - nextMeasure.offset) * 100 / nextMeasure.duration) + '%';
                    var duration = (nextMeasure.duration + nextMeasure.offset - currentElapsed) + 's';
                    moveCursor(nextMeasure.cursor, '100%', startingPosition, duration);

                    currentlyAnimatingMeasure = nextMeasure;
                    nextMeasureIndex++;
                }
            }

            // Set up to draw again if still playing
            requestAnimFrame(draw);
        }
    };

    var scheduleSoundEvent = function(soundEvent) {
        MIDI.noteOn(0, soundEvent.note, 63, timeAtStart + soundEvent.offset - playbackPosition);
        MIDI.noteOff(0, soundEvent.note, timeAtStart + soundEvent.offset + soundEvent.duration - playbackPosition);
    };

    var schedule = function() {
        while (GuitarTab.state.playback &&
               nextSoundIndex < soundEvents.length &&
               soundEvents[nextSoundIndex].offset < ((audioContext.currentTime + playbackPosition - timeAtStart) + 0.1) ) {
            scheduleSoundEvent(soundEvents[nextSoundIndex]);
            nextSoundIndex++;
        }

        if (GuitarTab.state.playback) timerId = window.setTimeout(schedule, 50);
    };

    var calculatePlayerEvents = function() {
        var stringNoteOffsets = [76, 71, 67, 62, 57, 52];
        soundEvents = [];
        measureBoundaries = [];
        var tab = GuitarTab.tab;

        // The offset of the start of the measure
        var measureOffset = 0;

        for (var m = 0; m < tab.lengthInMeasures; m++) {
            var measureDuration = 0;

            // Sound events
            for (var i = 0; i < tab.parts.length; i++) {
                var noteColumns = tab.parts[i].measures[m].noteColumns;

                // The offset of the start of the note relative to the measure
                var noteOffset = 0;

                for (var c = 0; c < noteColumns.length; c++) {
                    var noteLengthInSecs = ((noteColumns[c].duration * 60) / (tab.beatsPerMinute * 16));

                    for (var n in noteColumns[c].notes) {
                        soundEvents.push({
                            offset: (measureOffset + noteOffset),
                            duration: noteLengthInSecs,
                            note: stringNoteOffsets[n] + noteColumns[c].notes[n],
                            measure: m,
                            onSource: undefined,
                            offSource: undefined
                        });
                    }

                    noteOffset += noteLengthInSecs;
                }

                // Get the measure length (if valid, will be the same for all instruments)
                measureDuration = Math.max(measureDuration, noteOffset);
            }

            // Animation event
            measureBoundaries.push({
                cursor: document.getElementById('tab-measure-' + m).firstChild,
                offset: measureOffset,
                duration: measureDuration
            });

            measureOffset += measureDuration;
        }

        soundEvents.sort(function(a, b){return a.offset - b.offset});
    };

    player.setPlaybackPosition = function(measureIndex, xCoordinate, measureWidth) {
        if (typeof soundEvents === 'undefined') calculatePlayerEvents();

        if (GuitarTab.state.playback) {
            //killPlaybackEvents();
        } else {
            // Clear any existing cursor
            if (typeof playbackPosition !== "undefined") {
                var i = 0;
                while ((measureBoundaries[i].offset + measureBoundaries[i].duration) <= playbackPosition) i++;
                hideCursor(measureBoundaries[i].cursor);
            }
        }

        playbackPosition = measureBoundaries[measureIndex].offset + (measureBoundaries[measureIndex].duration * xCoordinate / measureWidth);

        // Move the cursor to position
        moveCursor(measureBoundaries[measureIndex].cursor, (xCoordinate * 100 / measureWidth) + '%');

        GuitarTab.emitter.emit('playbackPosition', { playbackPosition: playbackPosition });

        if (GuitarTab.state.playback) {
            // Skip to the starting position
            nextSoundIndex = 0;
            nextMeasureIndex = 0;
            while (soundEvents[nextSoundIndex].offset < playbackPosition) nextSoundIndex++;
            while (measureBoundaries[nextMeasureIndex].offset + measureBoundaries[nextMeasureIndex].duration < playbackPosition) nextMeasureIndex++;

            timeAtStart = audioContext.currentTime;
        }
    }

    player.pause = function() {
        if (GuitarTab.state.playback) {
            playbackPosition = audioContext.currentTime + playbackPosition - timeAtStart;
            // Get the measure that the user has paused in
            for (var i = 0; (measureBoundaries[i].offset + measureBoundaries[i].duration) <= playbackPosition; i++);
            var measureEvent = measureBoundaries[i];

            moveCursor(measureEvent.cursor, ((playbackPosition - measureEvent.offset) * 100 / measureEvent.duration) + '%');

            GuitarTab.state.playback = false;
            GuitarTab.emitter.emit('state');
        }
    };

    player.play = function() {
        if (typeof measureBoundaries === "undefined") calculatePlayerEvents();

        if (!GuitarTab.state.playback) {
            // Skip to the starting position
            nextSoundIndex = 0;
            nextMeasureIndex = 0;
            while (soundEvents[nextSoundIndex].offset < playbackPosition) nextSoundIndex++;
            while (measureBoundaries[nextMeasureIndex].offset + measureBoundaries[nextMeasureIndex].duration < playbackPosition) nextMeasureIndex++;

            audioContext = MIDI.Player.ctx;
            timeAtStart = audioContext.currentTime;
            timerId = window.setTimeout(schedule, 50);
            requestAnimFrame(draw);

            GuitarTab.state.playback = true;
            GuitarTab.emitter.emit('state');
        }
    };

    GuitarTab.emitter.on('measure', function(e) {
        delete measureBoundaries;
        delete soundEvents;
    });

    GuitarTab.emitter.on('note', function(e) {
        delete measureBoundaries;
        delete soundEvents;
    });

    GuitarTab.emitter.on('loaded', function(e) {
        calculatePlayerEvents();
    });

    return player;
});