if (typeof GuitarTab === "undefined") var GuitarTab = {};

define(['Player', 'EventEmitter'], function(player, events) {
    if (typeof GuitarTab.emitter === 'undefined') GuitarTab.emitter = new events.EventEmitter();

    var playerController = {};

    var onMeasureClick = function(e) {
        var index = parseInt(e.currentTarget.id.match(/\d+$/));
        var xCoordinate = (e.pageX || (e.clientX + document.body.scrollLeft + document.documentElement.scrollLeft)) - e.currentTarget.offsetLeft;
        var measureWidth = e.currentTarget.offsetWidth;

        player.setPlaybackPosition(index, xCoordinate, measureWidth);
    };

    playerController.addMeasureContainerEventListeners = function(measureContainer) {
        measureContainer.addEventListener('click', onMeasureClick);
    };

    GuitarTab.emitter.on('measure', function(e) {
        if (e.event == 'added') {
            playerController.addMeasureContainerEventListeners(document.getElementById('tab-measure-' + e.index));
        }
    });

    GuitarTab.emitter.on('loaded', function(e) {
        document.getElementById('play-icon').addEventListener('click', function() {
            player.play();
        });
        document.getElementById('pause-icon').addEventListener('click', function() {
            player.pause();
        });
        document.getElementById('play-icon').style.visibility = 'visible';
    });

    GuitarTab.emitter.on('state', function(e) {
        if (GuitarTab.state === 'playback') {
            document.getElementById('play-icon').style.visibility = 'hidden';
            document.getElementById('pause-icon').style.visibility = 'visible';
        } else {
            document.getElementById('play-icon').style.visibility = 'visible';
            document.getElementById('pause-icon').style.visibility = 'hidden';
        }
    });

    GuitarTab.emitter.on('playbackPosition', function(e) {
        // scroll to measure container
    });

    return playerController;
});