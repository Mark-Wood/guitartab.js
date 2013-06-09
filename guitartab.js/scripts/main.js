if (typeof (GuitarTab) === "undefined") var GuitarTab = {};

require(['Renderer', 'PlaybackController'], function(renderer, playbackController){
    if (GuitarTab.tab){
        document.getElementById('tab-title').appendChild(document.createTextNode(GuitarTab.tab.title));
        document.getElementById('tab-artist').appendChild(document.createTextNode(GuitarTab.tab.artist));

        var drawingCanvas = document.getElementById('drawing-canvas');

        // Convert to HTML and attach to the DOM
        for (var partIndex = 0; partIndex < GuitarTab.tab.parts.length; partIndex++) {
            var part = GuitarTab.tab.parts[partIndex];

            for (var measureIndex = 0; measureIndex < GuitarTab.tab.lengthInMeasures; measureIndex++) {
                drawingCanvas.appendChild(renderer.convertJsonMeasureToHtml(part.measures[measureIndex], part.numberOfStrings, measureIndex));
            }
        }

        playbackController.calculateMeasureEvents();

        document.getElementById('play-button').onclick = playbackController.play;
    }
});