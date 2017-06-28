(function(){
    var container;
    var timeElapsed;
    var currentRound;
    var timeLeft;
    var prev;
    var play;
    var next;
    var status;
    var time;
    var isSpeedMPH = true;
    var speedHeader;
    var speed;
    var speedNext;
    var incline;
    var inclineNext;
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
        setRound(0);
        setTime(0);
        setSpeed(0);
        setSpeedNext(0);
        setIncline(0);
        setInclineNext(0);
    }

    function loadTemplate() {
        var xhr = new XMLHttpRequest();
        xhr.open('GET', 'workout.template.html?cb=' + (+new Date), true);
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
        timeElapsed = document.getElementById('time_elapsed');
        currentRound = document.getElementById('current_round');
        timeLeft = document.getElementById('time_left');
        prev = document.getElementById('prev');
        play = document.getElementById('play');
        next = document.getElementById('next');
        status = document.getElementById('status');
        time = document.getElementById('time');
        speedHeader = document.getElementById('speed_header');
        speed = document.getElementById('speed');
        speedNext = document.getElementById('speed_next');
        incline = document.getElementById('incline');
        inclineNext = document.getElementById('incline_next');
        reset();
        roundIndex = 0;
        nextRound();
        togglePause();

        speedHeader.addEventListener('click', function(){
            isSpeedMPH = !isSpeedMPH;
            speedHeader.innerHTML = 'SPEED<br />(' + (isSpeedMPH ? 'MPH' : 'KPH') + ')';
            if (isSpeedMPH) {
                setSpeed(speed.innerHTML / 1.60934);
                setSpeedNext(speedNext.innerHTML / 1.60934);
            }
            else {
                setSpeed(speed.innerHTML * 1.60934);
                setSpeedNext(speedNext.innerHTML * 1.60934);
            }
        }, false);

        prev.addEventListener('click', function(){
            roundIndex = Math.max(roundIndex - 2, 0);
            nextRound();
        }, false);

        next.addEventListener('click', function(){
            roundIndex = Math.max(roundIndex, 0);
            nextRound();
        }, false);

        play.addEventListener('click', togglePause, false);
    }

    function togglePause() {
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
        setRound();
        if (roundIndex >= workout.length) {
            // Done!
            setRest();
            setStatus('DONE! GOOD JOB!')
            return;
        }
        var round = workout[roundIndex];
        var roundNext = workout[roundIndex+1] || {};
        if (!round.speed) {
            // Rest
            setRest();
            // Look ahead for speed / incline
            if (roundIndex+1 < workout.length) {
                setSpeed(roundNext.speed || 0);
                setSpeedNext(roundNext.speed || 0);
                setIncline(roundNext.incline || 0);
                setInclineNext(roundNext.incline || 0);
            }
        }
        else {
            // Run
            setRun();
            setSpeed(round.speed || 0);
            setSpeedNext(roundNext.speed || 0);
            setIncline(round.incline || 0);
            setInclineNext(roundNext.incline || 0);
        }

        roundIndex++;

        countDown(round.time, nextRound);
    }

    function setRound() {
        currentRound.innerHTML = Math.min((roundIndex||0) + 1, workout.length) + '/' + workout.length;
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
        time.innerHTML = formatTime(seconds);
        if (roundIndex > -1) {
            var totalTime = 0;
            var totalTimeElapsed = 0;
            for (var i=0; i<workout.length; i++) {
                if (i < roundIndex - 1) {
                    totalTimeElapsed += workout[i]['time'];
                }
                totalTime += workout[i]['time'];
            }
            totalTimeElapsed = totalTimeElapsed + workout[roundIndex - 1].time - seconds;
            timeElapsed.innerHTML = formatTime(totalTimeElapsed);
            totalTimeLeft = totalTime - totalTimeElapsed;
            timeLeft.innerHTML = formatTime(totalTimeLeft);
        }
    }

    function setTimeLeft() {
        timeLeft.innerHTML = formatTime(seconds);
    }

    function formatTime(seconds) {
        var minutes = (seconds/60)|0;
        seconds -= (minutes * 60);
        return (minutes < 10 ? '0' : '') + minutes + ':' + ((seconds < 10) ? '0' : '') + seconds;
    }

    function setSpeed(val) {
        speed.innerHTML = val.toFixed(1);
    }
    function setSpeedNext(val) {
        speedNext.innerHTML = val.toFixed(1);
    }
    function setIncline(val) {
        incline.innerHTML = val.toFixed(1);
    }
    function setInclineNext(val) {
        inclineNext.innerHTML = val.toFixed(1);
    }

})();
