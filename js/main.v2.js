/**
 * Frame Weavers Official
 * Main Behavior Script (Static V2)
 */

document.addEventListener('DOMContentLoaded', () => {
    console.log('Frame Weavers: Cinematic Luxury Initialized (Static)');

    // 1. Smooth scroll for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({ behavior: 'smooth' });
            }
        });
    });

    // 2. Portfolio Generation
    const grid = document.getElementById('portfolio-grid');

    function loadPortfolio() {
        if (!grid || typeof portfolioItems === 'undefined') {
            if (grid) grid.innerHTML = '<div style="color:#666; text-align:center; width:100%;">No projects found.</div>';
            return;
        }

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
        if (!window.portfolioData) return;
        const item = window.portfolioData[index];
        const lightbox = document.getElementById('lightbox');
        const title = document.getElementById('lightbox-title');
        const desc = document.getElementById('lightbox-desc');

        if (!item || !lightbox) return;

        const container = document.querySelector('.lightbox-video-container');
        container.innerHTML = '';

        let embedUrl = item.videoUrl || '';

        if (embedUrl.endsWith('.mp4') || embedUrl.includes('cloudinary')) {
            const videoTag = document.createElement('video');
            videoTag.src = embedUrl;
            videoTag.controls = true;
            videoTag.autoplay = true;
            videoTag.style.width = '100%';
            videoTag.style.height = '100%';
            container.appendChild(videoTag);
        } else {
            let iframeSrc = embedUrl;
            if (embedUrl.includes('youtube.com') || embedUrl.includes('youtu.be')) {
                const vId = embedUrl.split('v=')[1] || embedUrl.split('/').pop().split('?')[0];
                iframeSrc = `https://www.youtube.com/embed/${vId}?autoplay=1`;
            }

            const iframe = document.createElement('iframe');
            iframe.src = iframeSrc;
            iframe.allow = "autoplay; fullscreen";
            iframe.style.width = '100%';
            iframe.style.height = '100%';
            iframe.style.border = 'none';
            container.appendChild(iframe);
        }

        title.textContent = item.title;
        desc.textContent = item.description;

        lightbox.classList.add('active');
        document.body.style.overflow = 'hidden';
    };

    const closeLightbox = () => {
        const lightbox = document.getElementById('lightbox');
        const container = document.querySelector('.lightbox-video-container');

        if (lightbox) lightbox.classList.remove('active');
        if (container) container.innerHTML = '';
        document.body.style.overflow = '';
    };

    document.querySelector('.lightbox-close')?.addEventListener('click', closeLightbox);
    document.getElementById('lightbox')?.addEventListener('click', (e) => {
        if (e.target === document.getElementById('lightbox')) {
            closeLightbox();
        }
    });

    loadPortfolio();
});
