if (typeof GuitarTab === "undefined") var GuitarTab = {};

define(['Player', 'EventEmitter'], function (player, events) {
    if (typeof GuitarTab.emitter === 'undefined') GuitarTab.emitter = new events.EventEmitter();

    var playerController = {};

    function onMeasureClick(e) {
        // Only skip to a position if already playing or not editing
        if (GuitarTab.state.playback || !GuitarTab.state.edit) {
            var index = parseInt(e.currentTarget.id.match(/\d+$/));
            var xCoordinate = (e.pageX || (e.clientX + document.body.scrollLeft + document.documentElement.scrollLeft)) - e.currentTarget.offsetLeft;
            var measureWidth = e.currentTarget.offsetWidth;

            player.setPlaybackPosition(index, xCoordinate, measureWidth);
        }
    }

    playerController.addMeasureContainerEventListeners = function addMeasureContainerEventListeners(measureContainer) {
        measureContainer.addEventListener('click', onMeasureClick);
    };

    GuitarTab.emitter.on('measure', function onMasureEvent(e) {
        if (e.event == 'added') {
            playerController.addMeasureContainerEventListeners(document.getElementById('tab-measure-' + e.index));
        }
    });

    GuitarTab.emitter.on('loaded', function onLoadedEvent() {
        document.getElementById('play-icon').addEventListener('click', function () {
            player.play();
        });
        document.getElementById('pause-icon').addEventListener('click', function () {
            player.pause();
        });
        document.getElementById('play-icon').style.visibility = 'visible';
    });

    GuitarTab.emitter.on('state', function onStateEvent() {
        document.getElementById('play-icon').style.visibility = GuitarTab.state.playback ? 'hidden' : 'visible';
        document.getElementById('pause-icon').style.visibility = GuitarTab.state.playback ? 'visible' : 'hidden';
    });

    GuitarTab.emitter.on('playbackPosition', function onPlaybackPositionEvent(e) {
        // scroll to measure container
    });

    return playerController;
});