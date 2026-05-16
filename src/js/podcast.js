/* =====================================================================
   podcast.js
   Handles: audio playback controls, sticky mini-player,
            synchronized chapter highlighting, expand/collapse all.
   ===================================================================== */

(function () {
    'use strict';

    var audio = document.getElementById('podcastAudio');
    if (!audio) return;


    // ── DOM references ─────────────────────────────────────────────────

    var btnPlay       = document.getElementById('btnPlay');
    var btnRewind     = document.getElementById('btnRewind');
    var btnForward    = document.getElementById('btnForward');
    var btnSpeed      = document.getElementById('btnSpeed');
    var progressTrack = document.getElementById('progressTrack');
    var progressFill  = document.getElementById('progressFill');
    var progressThumb = document.getElementById('progressThumb');
    var timeCurrent   = document.getElementById('timeCurrent');
    var timeDuration  = document.getElementById('timeDuration');

    var stickyPlayer        = document.getElementById('stickyPlayer');
    var stickyBtnPlay       = document.getElementById('stickyBtnPlay');
    var stickyProgressTrack = document.getElementById('stickyProgressTrack');
    var stickyProgressFill  = document.getElementById('stickyProgressFill');
    var stickyTimeCurrent   = document.getElementById('stickyTimeCurrent');

    var playerCard   = document.getElementById('playerCard');
    var expandAllBtn = document.getElementById('expandAll');

    var chapters = Array.from(document.querySelectorAll('.chapter[data-time]'))
        .sort(function (a, b) { return +a.dataset.time - +b.dataset.time; });

    var speeds     = [1, 1.25, 1.5, 1.75, 2];
    var speedIndex = 0;
    var isDragging = false;

    // Chapters start CLOSED. Button starts as "Buka Semua".
    var allOpen = false;


    // ── Helpers ────────────────────────────────────────────────────────

    function fmt(secs) {
        if (isNaN(secs) || secs < 0) return '0:00';
        var m = Math.floor(secs / 60);
        var s = String(Math.floor(secs % 60)).padStart(2, '0');
        return m + ':' + s;
    }

    function setPlayState(playing) {
        [btnPlay, stickyBtnPlay].forEach(function (btn) {
            if (!btn) return;
            var iconPlay  = btn.querySelector('.icon-play');
            var iconPause = btn.querySelector('.icon-pause');
            if (iconPlay)  iconPlay.style.display  = playing ? 'none' : '';
            if (iconPause) iconPause.style.display = playing ? ''     : 'none';
        });
    }


    // ── Progress sync ──────────────────────────────────────────────────

    function syncProgress() {
        var pct = audio.duration ? (audio.currentTime / audio.duration) * 100 : 0;

        if (progressFill)       progressFill.style.width       = pct + '%';
        if (progressThumb)      progressThumb.style.left       = pct + '%';
        if (timeCurrent)        timeCurrent.textContent        = fmt(audio.currentTime);
        if (stickyProgressFill) stickyProgressFill.style.width = pct + '%';
        if (stickyTimeCurrent)  stickyTimeCurrent.textContent  = fmt(audio.currentTime);

        syncChapters();
    }


    // ── Chapter sync ───────────────────────────────────────────────────
    // When audio plays into a chapter's time window, highlight and open it.

    function syncChapters() {
        if (!chapters.length) return;
        var t = audio.currentTime;
        var activeIdx = -1;
        for (var i = 0; i < chapters.length; i++) {
            if (t >= +chapters[i].dataset.time) activeIdx = i;
        }
        chapters.forEach(function (ch, i) {
            var isActive = (i === activeIdx);
            if (isActive && !ch.classList.contains('is-active')) {
                ch.classList.add('is-active');
                if (!ch.open) ch.open = true;
            }
            if (!isActive) ch.classList.remove('is-active');
        });
    }


    // ── Audio events ───────────────────────────────────────────────────

    audio.addEventListener('loadedmetadata', function () {
        if (timeDuration) timeDuration.textContent = fmt(audio.duration);
    });

    audio.addEventListener('timeupdate', syncProgress);
    audio.addEventListener('play',  function () { setPlayState(true);  });
    audio.addEventListener('pause', function () { setPlayState(false); });
    audio.addEventListener('ended', function () { setPlayState(false); });


    // ── Play / Pause ───────────────────────────────────────────────────

    function togglePlay() {
        if (audio.paused) audio.play().catch(function () {});
        else              audio.pause();
    }

    if (btnPlay)       btnPlay.addEventListener('click', togglePlay);
    if (stickyBtnPlay) stickyBtnPlay.addEventListener('click', togglePlay);


    // ── Skip ───────────────────────────────────────────────────────────

    if (btnRewind)  btnRewind.addEventListener('click', function () {
        audio.currentTime = Math.max(0, audio.currentTime - 15);
    });

    if (btnForward) btnForward.addEventListener('click', function () {
        audio.currentTime = Math.min(audio.duration || 0, audio.currentTime + 15);
    });


    // ── Speed ──────────────────────────────────────────────────────────

    if (btnSpeed) {
        btnSpeed.addEventListener('click', function () {
            speedIndex = (speedIndex + 1) % speeds.length;
            audio.playbackRate = speeds[speedIndex];
            btnSpeed.textContent = speeds[speedIndex] + '×';
        });
    }


    // ── Progress bar seeking ───────────────────────────────────────────

    function seekFromPointer(e, track) {
        var rect = track.getBoundingClientRect();
        var pct  = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
        audio.currentTime = pct * (audio.duration || 0);
    }

    if (progressTrack) {
        progressTrack.addEventListener('mousedown', function (e) {
            isDragging = true;
            seekFromPointer(e, progressTrack);
        });
        progressTrack.addEventListener('click', function (e) {
            seekFromPointer(e, progressTrack);
        });
        progressTrack.addEventListener('touchstart', function (e) {
            seekFromPointer(e.touches[0], progressTrack);
        }, { passive: true });
        progressTrack.addEventListener('touchmove', function (e) {
            seekFromPointer(e.touches[0], progressTrack);
        }, { passive: true });
    }

    document.addEventListener('mousemove', function (e) {
        if (isDragging && progressTrack) seekFromPointer(e, progressTrack);
    });
    document.addEventListener('mouseup', function () { isDragging = false; });

    if (stickyProgressTrack) {
        stickyProgressTrack.addEventListener('click', function (e) {
            seekFromPointer(e, stickyProgressTrack);
        });
    }


    // ── Sticky player ──────────────────────────────────────────────────

    if (playerCard && stickyPlayer) {
        var cardObserver = new IntersectionObserver(function (entries) {
            var cardVisible = entries[0].isIntersecting;
            stickyPlayer.classList.toggle('is-visible', !cardVisible);
            stickyPlayer.setAttribute('aria-hidden', String(cardVisible));
        }, { threshold: 0 });
        cardObserver.observe(playerCard);
    }


    // ── Expand / Collapse all ──────────────────────────────────────────
    // Chapters start closed; button says "Buka Semua".
    // First click opens all and flips to "Tutup Semua", and so on.

    if (expandAllBtn) {
        expandAllBtn.addEventListener('click', function () {
            allOpen = !allOpen;
            chapters.forEach(function (ch) { ch.open = allOpen; });
            expandAllBtn.textContent = allOpen ? 'Tutup Semua' : 'Buka Semua';
        });
    }


    // ── Timestamp badge: click to seek & play ─────────────────────────

    document.querySelectorAll('.chapter-timestamp').forEach(function (ts) {
        ts.addEventListener('click', function (e) {
            e.preventDefault();
            e.stopPropagation();
            var ch  = ts.closest('.chapter');
            var sec = ch ? +ch.dataset.time : NaN;
            if (!isNaN(sec)) {
                audio.currentTime = sec;
                audio.play().catch(function () {});
            }
        });
    });


})();
