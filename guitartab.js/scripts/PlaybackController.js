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

                GuitarTab.measureEvents.push(measureEvent);

                timeOffset += currentMeasureLength;
            }
        }
    };
});