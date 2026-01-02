/**
 * Frame Weavers Official
 * Main Behavior Script
 */

document.addEventListener('DOMContentLoaded', () => {
    console.log('Frame Weavers: Cinematic Luxury Initialized');

    // Smooth scroll for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth'
                });
            }
        });
    });

    // --- Portfolio Generation & Filtering ---
    const grid = document.getElementById('portfolio-grid');

    // 1. Generate Items (Static Mode)
    if (grid && typeof portfolioItems !== 'undefined') {
        window.portfolioData = portfolioItems; // Store for filtering accesses

        grid.innerHTML = portfolioItems.map((item, index) => `
            <div class="portfolio-item" data-category="${item.category}" onclick="openLightbox(${index})">
                <div class="item-image" style="background-image: url('${item.image}');"></div>
                <div class="viewfinder-overlay">
                    <div class="crosshair tl"></div>
                    <div class="crosshair tr"></div>
                    <div class="crosshair bl"></div>
                    <div class="crosshair br"></div>
                    <div class="rec-dot">● REC</div>
                    <div class="meta-data top-right">ISO 800</div>
                    <div class="meta-data bottom-left">F/2.8 1/60</div>
                </div>
                <div class="item-content">
                    <h3>${item.title}</h3>
                    <p>${item.category} // ${item.description}</p>
                </div>
            </div>
        `).join('');

        initializeFilters();
    } else {
        if (grid) grid.innerHTML = '<div style="color:#666; text-align:center;">No projects found in portfolio-data.js</div>';
    }

    function initializeFilters() {
        const filterBtns = document.querySelectorAll('.filter-btn');
        const items = grid.querySelectorAll('.portfolio-item');

        filterBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                filterBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');

                const filterValue = btn.getAttribute('data-filter');

                items.forEach(item => {
                    if (filterValue === 'all' || item.getAttribute('data-category') === filterValue) {
                        item.style.display = 'block';
                    } else {
                        item.style.display = 'none';
                    }
                });
            });
        });
    }

    // 3. Lightbox Logic
    window.openLightbox = (index) => {
        if (typeof portfolioItems === 'undefined') return;
        const item = portfolioItems[index];
        const lightbox = document.getElementById('lightbox');
        const title = document.getElementById('lightbox-title');
        const desc = document.getElementById('lightbox-desc');

        if (!item || !lightbox) return;

        // Clear previous content
        const container = document.querySelector('.lightbox-video-container');
        container.innerHTML = ''; // wipe iframe or video

        let embedUrl = item.videoUrl || '';

        // Check if it's a local uploaded file (starts with 'videos/')
        if (embedUrl.startsWith('videos/')) {
            // Create Local Video Player
            const videoTag = document.createElement('video');
            videoTag.src = embedUrl;
            videoTag.controls = true;
            videoTag.autoplay = true;
            videoTag.style.width = '100%';
            videoTag.style.height = '100%';
            videoTag.style.position = 'absolute';
            container.appendChild(videoTag);
        } else {
            // Handle External Links (YouTube/Vimeo)
            let iframeSrc = embedUrl;

            if (embedUrl.includes('youtube.com/watch?v=')) {
                const videoId = embedUrl.split('v=')[1].split('&')[0];
                iframeSrc = `https://www.youtube.com/embed/${videoId}?autoplay=1`;
            } else if (embedUrl.includes('vimeo.com/')) {
                const videoId = embedUrl.split('.com/')[1];
                iframeSrc = `https://player.vimeo.com/video/${videoId}?autoplay=1`;
            } else if (embedUrl.includes('youtu.be/')) {
                const videoId = embedUrl.split('.be/')[1];
                iframeSrc = `https://www.youtube.com/embed/${videoId}?autoplay=1`;
            }

            const iframe = document.createElement('iframe');
            iframe.src = iframeSrc;
            iframe.frameBorder = "0";
            iframe.allow = "autoplay; fullscreen";
            iframe.allowFullscreen = true;
            iframe.style.position = 'absolute';
            iframe.style.top = '0';
            iframe.style.left = '0';
            iframe.style.width = '100%';
            iframe.style.height = '100%';
            container.appendChild(iframe);
        }

        title.textContent = item.title;
        desc.textContent = item.description;

        lightbox.classList.add('active');
        document.body.style.overflow = 'hidden'; // Prevent scrolling
    };

    const closeLightbox = () => {
        const lightbox = document.getElementById('lightbox');
        const container = document.querySelector('.lightbox-video-container');

        lightbox.classList.remove('active');
        container.innerHTML = ''; // Stop video
        document.body.style.overflow = '';
    };

    document.querySelector('.lightbox-close')?.addEventListener('click', closeLightbox);
    document.getElementById('lightbox')?.addEventListener('click', (e) => {
        if (e.target === document.getElementById('lightbox')) {
            closeLightbox();
        }
    });
});
