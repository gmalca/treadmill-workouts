(function(){
    var container;
    var prev;
    var play;
    var next;
    var status;
    var time;
    var speed;
    var incline;
    var startTime;
    var endTime;
    var roundIndex;
    var isPaused = false;
    var lastStatus;
    var pauseStatus;
    var pauseTime;

    window.workout = window.workout || [];

    document.addEventListener('touchmove', function(e){
        e.preventDefault();
    }, false);

    onDomReady(loadTemplate);

    function onDomReady(callback) {
        if (!document.body) {
            return setTimeout(function(){
                onDomReady(callback);
            }, 0);
        }
        callback();
    }

    function reset() {
        startTime = undefined;
        endTime = undefined;
        setTime(0);
        setSpeed(0);
        setIncline(0);
    }

    function loadTemplate() {
        var xhr = new XMLHttpRequest();
        xhr.open('GET', 'workout.template.html', true);
        xhr.onload = function(e){
            if (xhr.status == '200') {
                var frag = document.createElement('div');
                frag.innerHTML = xhr.responseText;
                while (frag.childNodes.length) {
                    document.body.appendChild(frag.firstChild);
                }
                prepareWorkout();
            }
        };
        xhr.send();
    }

    function prepareWorkout() {
        container = document.getElementById('container');
        prev = document.getElementById('prev');
        play = document.getElementById('play');
        next = document.getElementById('next');
        status = document.getElementById('status');
        time = document.getElementById('time');
        speed = document.getElementById('speed');
        incline = document.getElementById('incline');
        reset();
        setStatus('GET READY / SET-UP');
        roundIndex = 0;
        setSpeed((workout[0] || {}).speed || 0);
        setIncline((workout[0] || {}).incline || 0);
        countDown(30, nextRound);

        prev.addEventListener('click', function(){
            roundIndex = Math.max(roundIndex - 2, 0);
            nextRound();
        }, false);

        next.addEventListener('click', function(){
            nextRound();
        }, false);

        play.addEventListener('click', function(){
            isPaused = !isPaused;
            if (isPaused) {
                pauseStatus = '' + lastStatus;
                setStatus('PAUSED');
                pauseTime = (+new Date);
            }
            else {
                lastStatus = '' + pauseStatus;
                setStatus(lastStatus);
                endTime = endTime + (+new Date - pauseTime);
            }
            play.innerHTML = !isPaused ? 'pause_circle_outline' : 'play_circle_outline';
        }, false);
    }

    function countDown(seconds, callback) {
        if (!endTime) {
            startTime = (+new Date);
            endTime = startTime + (seconds * 1000);
        }
        if (isPaused) {
            setTimeout(function(){
                countDown(seconds, callback);
            }, 10);
            return;
        }
        // Reset seconds in case timer got delayed
        var now = (+new Date);
        if (now >= endTime) {
            setTime(0);
            endTime = undefined;
            callback();
        }
        else {
            var timeLeft = (endTime - now);
            seconds = Math.ceil(timeLeft/1000);
            if (seconds <= 3) {
                setGetReady();
            }
            setTime(seconds);
            setTimeout(function(){
                countDown(seconds, callback);
            }, 10);
        }
    }

    function nextRound() {
        startTime = undefined;
        endTime = undefined;
        if (roundIndex >= workout.length) {
            // Done!
            setRest();
            setStatus('DONE! GOOD JOB!')
            return;
        }
        var round = workout[roundIndex];
        if (!round.speed) {
            // Rest
            setRest();
            // Look ahead for speed / incline
            if (roundIndex+1 < workout.length) {
                setSpeed(workout[roundIndex+1].speed || 0);
                setIncline(workout[roundIndex+1].incline || 0);
            }
        }
        else {
            // Run
            setRun();
            setSpeed(round.speed || 0);
            setIncline(round.incline || 0);
        }

        roundIndex++;

        countDown(round.time, nextRound);
    }

    function setRest() {
        setStatus('REST');
        container.style.background = 'red';
    }

    function setGetReady() {
        container.style.background = 'orange';
    }

    function setRun() {
        setStatus('GO!');
        container.style.background = 'green';
    }

    function setStatus(msg) {
        status.innerHTML = msg;
        lastStatus = msg;
    }

    function setTime(seconds) {
        var minutes = (seconds/60)|0;
        seconds -= (minutes * 60);
        time.innerHTML = (minutes < 10 ? '0' : '') + minutes + ':' + ((seconds < 10) ? '0' : '') + seconds;
    }

    function setSpeed(val) {
        speed.innerHTML = val.toFixed(1);
    }
    function setIncline(val) {
        incline.innerHTML = val.toFixed(1);
    }

})();
