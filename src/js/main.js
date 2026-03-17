const toggleButton = document.getElementById('theme-toggle');
const htmlElement = document.documentElement;
const sunIcon = document.querySelector('.sun');
const moonIcon = document.querySelector('.moon');

// Check for saved user preference
const savedTheme = localStorage.getItem('theme');
if (savedTheme) {
    htmlElement.setAttribute('data-theme', savedTheme);
    updateIcons(savedTheme);
}

toggleButton.addEventListener('click', () => {
    const currentTheme = htmlElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    
    htmlElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    updateIcons(newTheme);
});

function updateIcons(theme) {
    if (theme === 'dark') {
        sunIcon.style.display = 'none';
        moonIcon.style.display = 'block';
    } else {
        sunIcon.style.display = 'block';
        moonIcon.style.display = 'none';
    }
}

/* ---------------------------------------------------
   Email copy-to-clipboard
   Targets any .email-copy-btn on the page.
   Reads the address from data-email, copies it,
   then briefly shows a "Tersalin!" confirmation.
--------------------------------------------------- */
document.querySelectorAll('.email-copy-btn').forEach(function(btn) {
    btn.addEventListener('click', function() {
        var email = btn.getAttribute('data-email');
        if (!email) return;

        // Use the modern clipboard API where available,
        // fall back to the legacy execCommand approach.
        var doCopy = navigator.clipboard
            ? navigator.clipboard.writeText(email)
            : Promise.resolve().then(function() {
                var ta = document.createElement('textarea');
                ta.value = email;
                ta.style.position = 'fixed';
                ta.style.opacity = '0';
                document.body.appendChild(ta);
                ta.select();
                document.execCommand('copy');
                document.body.removeChild(ta);
            });

        doCopy.then(function() {
            // Swap hint text to confirmation
            var hint = btn.querySelector('.email-copy-hint');
            var originalText = hint.textContent;
            hint.textContent = 'Tersalin!';
            btn.classList.add('copied');

            // Reset after 2 seconds
            setTimeout(function() {
                hint.textContent = originalText;
                btn.classList.remove('copied');
            }, 2000);
        }).catch(function() {
            // If clipboard is blocked (e.g. HTTP), fall back gracefully
            var hint = btn.querySelector('.email-copy-hint');
            hint.textContent = email;
            btn.classList.add('copied');
            setTimeout(function() {
                hint.textContent = 'klik untuk salin';
                btn.classList.remove('copied');
            }, 3000);
        });
    });
});