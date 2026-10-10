/* ---------------------------------------------------
   Dark / light mode toggle
   The starting theme is already set by the small script
   in <head> (base.njk), so the page never flashes.
   This part only handles clicks. The sun/moon icons are
   swapped by CSS (global.css), not by JavaScript.
--------------------------------------------------- */
(function () {
    var root = document.documentElement;
    var toggleButton = document.getElementById('theme-toggle');
    if (!toggleButton) return;

    function currentTheme() {
        return root.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
    }

    function applyTheme(theme) {
        root.setAttribute('data-theme', theme);
        toggleButton.setAttribute('aria-pressed', String(theme === 'dark'));
    }

    applyTheme(currentTheme());

    toggleButton.addEventListener('click', function () {
        var newTheme = currentTheme() === 'dark' ? 'light' : 'dark';
        applyTheme(newTheme);
        try { localStorage.setItem('theme', newTheme); } catch (e) { /* private mode: not saved */ }
    });

    // If the reader never picked a theme, follow their device when it changes.
    if (window.matchMedia) {
        var media = window.matchMedia('(prefers-color-scheme: dark)');
        var onChange = function (e) {
            var saved = null;
            try { saved = localStorage.getItem('theme'); } catch (err) {}
            if (!saved) applyTheme(e.matches ? 'dark' : 'light');
        };
        if (media.addEventListener) media.addEventListener('change', onChange);
        else if (media.addListener) media.addListener(onChange);
    }
}());

/* ---------------------------------------------------
   Link preview card
   Hovering a link inside an article (.prose / .im-prose)
   shows a small card above it with the destination
   domain and a "Buka di tab baru" button.

   - One shared card lives at the end of <body>, NOT
     inside the link, so screen readers read the link
     text only and clicking the link works normally.
   - Only on devices with a mouse. On phones/tablets a
     tap just follows the link.
   - Footnote (#...) and email links are skipped.
   Zero external dependencies, no fetch calls.
--------------------------------------------------- */
(function () {
    var hasMouse = window.matchMedia && window.matchMedia('(hover: hover) and (pointer: fine)').matches;
    if (!hasMouse) return;

    var links = document.querySelectorAll('.prose a[href], .im-prose a[href]');
    if (!links.length) return;

    var card = document.createElement('div');
    card.className = 'link-preview';
    card.setAttribute('aria-hidden', 'true');
    card.innerHTML =
        '<span class="preview-domain"></span>' +
        '<button type="button" class="preview-visit" tabindex="-1">Buka di tab baru ↗</button>';
    document.body.appendChild(card);

    var domainLabel = card.querySelector('.preview-domain');
    var visitButton = card.querySelector('.preview-visit');
    var activeHref = null;
    var hideTimer = null;

    function hide() {
        card.classList.remove('is-visible');
        activeHref = null;
    }

    function scheduleHide() {
        clearTimeout(hideTimer);
        // Small delay so the mouse can travel from the link into the card
        hideTimer = setTimeout(hide, 150);
    }

    function show(link, event) {
        clearTimeout(hideTimer);

        var url;
        try { url = new URL(link.getAttribute('href'), window.location.href); }
        catch (e) { return; }

        activeHref = url.href;
        domainLabel.textContent = url.origin === window.location.origin
            ? 'JurnalPivot' + url.pathname
            : url.hostname.replace(/^www\./, '');

        // A link can wrap over several lines: use the line under the mouse.
        var rects = link.getClientRects();
        if (!rects.length) return;
        var rect = rects[0];
        if (event && rects.length > 1) {
            for (var i = 0; i < rects.length; i++) {
                if (event.clientY >= rects[i].top && event.clientY <= rects[i].bottom) { rect = rects[i]; break; }
            }
        }

        card.classList.add('is-visible');
        var gap = 10;
        var margin = 8;
        var cardWidth = card.offsetWidth;
        var cardHeight = card.offsetHeight;
        var viewportWidth = document.documentElement.clientWidth;
        var linkCentre = rect.left + rect.width / 2;

        var left = Math.max(margin, Math.min(linkCentre - cardWidth / 2, viewportWidth - cardWidth - margin));
        var top = rect.top - cardHeight - gap;
        var below = top < margin; // not enough room above: show it under the link
        if (below) top = rect.bottom + gap;

        card.classList.toggle('is-below', below);
        card.style.left = (left + window.scrollX) + 'px';
        card.style.top = (top + window.scrollY) + 'px';
        card.style.setProperty('--arrow-x', Math.max(12, Math.min(linkCentre - left, cardWidth - 12)) + 'px');
    }

    links.forEach(function (link) {
        var href = link.getAttribute('href');
        if (!href || href.charAt(0) === '#' || /^(mailto|tel):/i.test(href)) return;
        link.addEventListener('mouseenter', function (e) { show(link, e); });
        link.addEventListener('mouseleave', scheduleHide);
    });

    card.addEventListener('mouseenter', function () { clearTimeout(hideTimer); });
    card.addEventListener('mouseleave', scheduleHide);

    visitButton.addEventListener('click', function () {
        if (activeHref) window.open(activeHref, '_blank', 'noopener,noreferrer');
        hide();
    });

    window.addEventListener('resize', hide);
}());

/* ---------------------------------------------------
   Email copy-to-clipboard
   Targets any .email-copy-btn on the page (profile pages).
   Reads the address from data-email, copies it, briefly
   shows "Tersalin!", then shows the email address again.
   If copying is blocked, the address stays visible so it
   can be copied by hand.
--------------------------------------------------- */
(function () {
    function copyText(text) {
        function legacyCopy() {
            var ta = document.createElement('textarea');
            ta.value = text;
            ta.setAttribute('readonly', '');
            ta.style.position = 'fixed';
            ta.style.opacity = '0';
            document.body.appendChild(ta);
            ta.select();
            var ok = false;
            try { ok = document.execCommand('copy'); } catch (e) {}
            document.body.removeChild(ta);
            if (!ok) throw new Error('copy failed');
        }

        if (navigator.clipboard && navigator.clipboard.writeText) {
            return navigator.clipboard.writeText(text).catch(function () {
                legacyCopy();
            });
        }
        return Promise.resolve().then(legacyCopy);
    }

    document.querySelectorAll('.email-copy-btn').forEach(function (btn) {
        var hint = btn.querySelector('.email-copy-hint');
        var email = btn.getAttribute('data-email');
        if (!hint || !email) return;

        var resetTimer = null;

        function showMessage(message, duration) {
            clearTimeout(resetTimer);
            hint.textContent = message;
            btn.classList.add('copied');
            resetTimer = setTimeout(function () {
                hint.textContent = email;   // always back to the email address
                btn.classList.remove('copied');
            }, duration);
        }

        btn.addEventListener('click', function () {
            copyText(email).then(function () {
                showMessage('Tersalin!', 2000);
            }).catch(function () {
                showMessage(email, 4000);
            });
        });
    });
}());
