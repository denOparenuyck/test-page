'use strict';

/* ==========================================================================
   Global / shared helpers
   ========================================================================== */

const COOKIE_CONSENT_KEY = 'rr_cookie_consent';

const finishPageLoader = (loader) => {
    document.documentElement.classList.remove('has-page-loader');
    if (loader) {
        loader.classList.add('is-done');
        loader.setAttribute('aria-hidden', 'true');
    }
    document.body.classList.add('has-page-loader-done');
    document.dispatchEvent(new CustomEvent('rr:loader-complete'));
};

const initPageLoader = () => {
    const loader = document.querySelector('.page-loader');
    const html = document.documentElement;

    if (!loader) return;

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (reduceMotion || !html.classList.contains('has-page-loader')) {
        finishPageLoader(loader);
        return;
    }

    const onAnimationStart = (event) => {
        if (event.target !== loader || event.animationName !== 'page-loader-exit') return;
        setTimeout(() => {
            document.body.classList.add('has-page-loader-done');
            document.dispatchEvent(new CustomEvent('rr:loader-exit-start'));
        }, 300);
    };

    const onAnimationEnd = (event) => {
        if (event.target !== loader || event.animationName !== 'page-loader-exit') return;
        loader.removeEventListener('animationstart', onAnimationStart);
        loader.removeEventListener('animationend', onAnimationEnd);
        finishPageLoader(loader);
    };

    loader.addEventListener('animationstart', onAnimationStart);
    loader.addEventListener('animationend', onAnimationEnd);
};

initPageLoader();

const initCookieBanner = () => {
    if (localStorage.getItem(COOKIE_CONSENT_KEY)) return;

    const banner = document.createElement('div');
    banner.className = 'cookies';
    banner.setAttribute('role', 'dialog');
    banner.setAttribute('aria-live', 'polite');
    banner.setAttribute('aria-label', 'Cookie consent');
    banner.innerHTML = `
        <div class="cookies__inner">
            <p class="cookies__text">
                Our website use cookies. By continuing, we assume your permission to deploy cookies as detailed in our
                <a href="privacy-policy.html">Privacy Policy</a>.
            </p>
            <button type="button" class="default-button is-dark cookies__button">Accept</button>
        </div>
    `;

    document.body.appendChild(banner);

    requestAnimationFrame(() => {
        requestAnimationFrame(() => {
            banner.classList.add('is-visible');
        });
    });

    const acceptButton = banner.querySelector('.cookies__button');
    acceptButton.addEventListener('click', () => {
        localStorage.setItem(COOKIE_CONSENT_KEY, 'accepted');
        banner.classList.remove('is-visible');
        banner.classList.add('is-hiding');

        const onTransitionEnd = (event) => {
            if (event.target !== banner || event.propertyName !== 'opacity') return;
            banner.removeEventListener('transitionend', onTransitionEnd);
            banner.remove();
        };

        banner.addEventListener('transitionend', onTransitionEnd);
    });
};

initCookieBanner();

const rrPrefersReducedMotion = () =>
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const rrWhenLoaderDone = (callback) => {
    const hasLoaderDoneClass = () => document.body.classList.contains('has-page-loader-done');

    if (hasLoaderDoneClass() || !document.documentElement.classList.contains('has-page-loader')) {
        callback();
        return;
    }

    const observer = new MutationObserver(() => {
        if (!hasLoaderDoneClass()) return;
        observer.disconnect();
        callback();
    });

    observer.observe(document.body, {
        attributes: true,
        attributeFilter: ['class'],
    });
};

const rrIsEnoughVisible = (el, ratio = 0.2) => {
    if (!el) return false;

    const rect = el.getBoundingClientRect();
    const vh = window.innerHeight || document.documentElement.clientHeight;
    const height = el.offsetHeight || 1;
    const visible = Math.max(0, Math.min(rect.bottom, vh) - Math.max(rect.top, 0));

    if (visible <= 0) return false;

    const needed = Math.min(height * ratio, vh);
    return visible >= needed;
};

const rrWhenVisible = (el, { ratio = 0.2, onEnter } = {}) => {
    if (!el || typeof onEnter !== 'function') return;

    let done = false;

    const tryEnter = () => {
        if (done || !rrIsEnoughVisible(el, ratio)) return;
        done = true;
        window.removeEventListener('scroll', tryEnter);
        window.removeEventListener('resize', tryEnter);
        onEnter();
    };

    if (rrIsEnoughVisible(el, ratio)) {
        onEnter();
        return;
    }

    window.addEventListener('scroll', tryEnter, { passive: true });
    window.addEventListener('resize', tryEnter, { passive: true });
};

const rrResolveInRoot = (root, ref) => {
    if (!ref) return null;
    if (typeof ref !== 'string') return ref;
    return root.querySelector(ref);
};

const rrAnimateMediaZoom = (media, {
    duration = 1.45,
    ease = 'power1.out',
    targetSelector = 'img',
} = {}) => {
    if (!media || typeof gsap === 'undefined') return;

    const target = (targetSelector && media.querySelector(targetSelector)) || media;

    gsap.to(target, { scale: 1, duration, ease });
};

const rrAnimateFadeUp = (el, {
    duration = 1.15,
    ease = 'power1.out',
    delay = 0.1,
} = {}) => {
    if (!el || typeof gsap === 'undefined') return;

    gsap.to(el, { autoAlpha: 1, y: 0, duration, ease, delay });
};

const rrAnimateFade = (el, {
    duration = 1.15,
    ease = 'power1.out',
    delay = 0,
} = {}) => {
    if (!el || typeof gsap === 'undefined') return;

    gsap.to(el, { autoAlpha: 1, duration, ease, delay });
};

const initMediaContentReveal = (root, options = {}) => {
    if (!root || typeof gsap === 'undefined') return;

    const {
        media = null,
        content = null,
        trigger = null,
        visibleRatio = 0.2,
        zoom = {},
        fade = {},
        animatedClass = null,
        revealedClass = 'is-revealed',
    } = options;

    const mediaEl = rrResolveInRoot(root, media);
    const contentEl = rrResolveInRoot(root, content);
    const triggerEl = rrResolveInRoot(root, trigger) || root;

    if (!mediaEl && !contentEl) return;

    const scaleFrom = zoom.scaleFrom ?? 1.2;
    const fadeMode = fade.mode === 'fade' ? 'fade' : 'up';
    const fadeY = fadeMode === 'up' ? (fade.y ?? 32) : 0;
    const zoomTarget = mediaEl
        ? (mediaEl.querySelector(zoom.targetSelector || 'img') || mediaEl)
        : null;

    const markReady = () => {
        if (animatedClass) root.classList.add(animatedClass);
        if (revealedClass) root.classList.add(revealedClass);
    };

    if (rrPrefersReducedMotion()) {
        markReady();
        if (contentEl) gsap.set(contentEl, { autoAlpha: 1, y: 0 });
        if (zoomTarget) gsap.set(zoomTarget, { scale: 1 });
        return;
    }

    if (zoomTarget) gsap.set(zoomTarget, { scale: scaleFrom });
    if (contentEl) {
        gsap.set(contentEl, fadeMode === 'up'
            ? { autoAlpha: 0, y: fadeY }
            : { autoAlpha: 0 });
    }

    let hasPlayed = false;

    const play = () => {
        if (hasPlayed) return;
        hasPlayed = true;

        if (animatedClass) root.classList.add(animatedClass);

        const tl = gsap.timeline({
            onComplete: () => {
                if (revealedClass) root.classList.add(revealedClass);
            },
        });

        if (zoomTarget) {
            tl.to(zoomTarget, {
                scale: 1,
                duration: zoom.duration ?? 1.45,
                ease: zoom.ease ?? 'power1.out',
            }, 0);
        }

        if (contentEl) {
            const contentVars = {
                autoAlpha: 1,
                duration: fade.duration ?? 1.15,
                ease: fade.ease ?? 'power1.out',
            };

            if (fadeMode === 'up') {
                contentVars.y = 0;
            }

            tl.to(contentEl, contentVars, fade.delay ?? 0.1);
        }

        if (!zoomTarget && !contentEl) {
            markReady();
        }
    };

    rrWhenLoaderDone(() => {
        rrWhenVisible(triggerEl, {
            ratio: visibleRatio,
            onEnter: play,
        });
    });
};

const initSectionUnblur = (sectionSelector, innerSelector) => {
    if (typeof gsap === 'undefined') return;

    document.querySelectorAll(sectionSelector).forEach((section) => {
        const target = section.querySelector(innerSelector) || section;

        if (rrPrefersReducedMotion()) {
            section.classList.add('is-revealed');
            target.style.filter = 'none';
            return;
        }

        gsap.set(target, { filter: 'blur(18px)' });

        let hasPlayed = false;

        const play = () => {
            if (hasPlayed) return;
            hasPlayed = true;

            gsap.to(target, {
                filter: 'blur(0px)',
                duration: 1.25,
                ease: 'power1.out',
                onComplete: () => {
                    section.classList.add('is-revealed');
                    gsap.set(target, { clearProps: 'filter' });
                },
            });
        };

        rrWhenLoaderDone(() => {
            rrWhenVisible(section, {
                ratio: 0.2,
                onEnter: play,
            });
        });
    });
};

const scrollTabBlockToStart = (fromEl) => {
    if (!fromEl) return false;

    const anchor = fromEl.closest(
        '.about-location__block, .about__wrapper, .testimonials__wrapper, .about-location__wrapper, .release__wrapper, .location-switcher'
    ) || fromEl.closest('section');

    if (!anchor) return false;

    const headerEl = document.querySelector('.header');
    const headerOffset = headerEl
        ? (headerEl.querySelector('.header__inner') || headerEl).getBoundingClientRect().height
        : 0;
    const offset = headerOffset + 16;
    const rect = anchor.getBoundingClientRect();
    if (rect.top >= offset) return false;

    const behavior = window.matchMedia('(prefers-reduced-motion: reduce)').matches
        ? 'auto'
        : 'smooth';

    window.scrollTo({
        top: Math.max(0, window.pageYOffset + rect.top - offset),
        behavior,
    });

    return true;
};

const accordionMobileMq = window.matchMedia('(max-width: 991px)');

/* ==========================================================================
   Header
   ========================================================================== */

(() => {
    const header = document.querySelector('.header');
    const headerMenu = document.querySelector('.header__menu');

    if (header && headerMenu) {
        headerMenu.addEventListener('click', () => {
            header.classList.toggle('is-open');
            document.body.classList.toggle('no-scroll');
        });
    }

    $('.header__nav-mobile .has-child').each(function (index, item) {
        const link = $(item).find('a');
        const submenu = $(item).find('.sub-menu');

        $(link).append('<span class="is-arrow"></span>');

        $(item).find('.is-arrow').on('click', function (e) {
            e.preventDefault();
            e.stopPropagation();
            $(item).toggleClass('is-open');
            $(submenu).stop().slideToggle();
        });
    });
})();

/* ==========================================================================
   Hero
   ========================================================================== */

$('.hero__next').on('click', function () {
    const nextSection = $(this).closest('.hero').next('section').get(0);
    if (nextSection) {
        nextSection.scrollIntoView({ behavior: 'smooth' });
    }
});

/* ==========================================================================
   Who we are — mobile gallery + text reveal
   ========================================================================== */

(() => {
    const mobileMq = window.matchMedia('(max-width: 991px)');
    const galleryState = new WeakMap();

    const destroyGallery = (gallery) => {
        const state = galleryState.get(gallery);
        if (!state) return;

        if (state.swiper) {
            state.swiper.destroy(true, true);
        }

        state.clones.forEach((clone) => clone.remove());
        galleryState.delete(gallery);
    };

    const initGallery = (gallery) => {
        if (typeof Swiper === 'undefined') return;

        if (!mobileMq.matches) {
            destroyGallery(gallery);
            return;
        }

        if (galleryState.has(gallery)) return;

        const swiperWrapper = gallery.querySelector('.swiper-wrapper');
        const paginationEl = gallery.querySelector('.swiper-pagination');
        if (!swiperWrapper) return;

        const slides = Array.from(swiperWrapper.children).filter(
            (el) => !el.classList.contains('slide-clone')
        );
        const originalCount = slides.length;

        const clones = slides.map((slide) => {
            const clone = slide.cloneNode(true);
            clone.classList.add('slide-clone');
            swiperWrapper.appendChild(clone);
            return clone;
        });

        const swiper = new Swiper(gallery, {
            loop: true,
            slidesPerView: 1.02,
            spaceBetween: 12,
            centeredSlides: true,
            speed: 1000,
            autoplay: {
                delay: 5000,
                disableOnInteraction: false,
            },
            pagination: {
                el: paginationEl,
                clickable: true,
                renderBullet: (index, className) =>
                    index < originalCount ? `<span class="${className}"></span>` : '',
            },
            on: {
                slideChange() {
                    const active = this.realIndex % originalCount;

                    this.pagination.bullets.forEach((bullet, i) => {
                        bullet.classList.toggle('swiper-pagination-bullet-active', i === active);
                    });

                    this.slides.forEach((slide, i) => {
                        slide.classList.toggle('is-active', i === this.activeIndex);
                    });
                },
            },
        });

        galleryState.set(gallery, { swiper, clones, originalCount });
        swiper.emit('slideChange');
    };

    const syncGalleries = () => {
        document.querySelectorAll('.who-we-are__gallery .swiper').forEach(initGallery);
    };

    syncGalleries();
    mobileMq.addEventListener('change', syncGalleries);

    const initTextReveal = (section) => {
        if (typeof gsap === 'undefined' || typeof SplitText === 'undefined') return;
        if (rrPrefersReducedMotion()) return;

        gsap.registerPlugin(SplitText);
        if (typeof ScrollTrigger !== 'undefined') {
            gsap.registerPlugin(ScrollTrigger);
        }

        const content = section.querySelector('.who-we-are__content');
        if (!content) return;

        const title = content.querySelector('.who-we-are__title');
        const titleTarget = title?.querySelector('.title, h2') || title;
        const textBlock = content.querySelector('.who-we-are__text');
        const paragraphs = gsap.utils.toArray(
            content.querySelectorAll('.who-we-are__text .text > *')
        );

        gsap.set([title, textBlock].filter(Boolean), { autoAlpha: 0 });

        let hasPlayed = false;
        let watching = false;

        const isSectionInView = () => {
            const rect = section.getBoundingClientRect();
            const vh = window.innerHeight || document.documentElement.clientHeight;
            return rect.top < vh * 0.85 && rect.bottom > vh * 0.15;
        };

        const play = () => {
            if (hasPlayed) return;
            hasPlayed = true;

            const run = () => {
                gsap.set([title, textBlock].filter(Boolean), { autoAlpha: 1 });

                const tl = gsap.timeline({
                    defaults: { ease: 'power1.out' },
                });

                if (titleTarget) {
                    const titleSplit = SplitText.create(titleTarget, {
                        type: 'lines',
                        linesClass: 'wwa-line',
                        aria: 'auto',
                    });
                    gsap.set(titleSplit.lines, { opacity: 0, y: 16 });
                    tl.to(titleSplit.lines, {
                        opacity: 1,
                        y: 0,
                        duration: 1.25,
                        stagger: 0.14,
                    }, 0);
                }

                if (paragraphs.length) {
                    const allLines = [];

                    paragraphs.forEach((paragraph) => {
                        const split = SplitText.create(paragraph, {
                            type: 'lines',
                            linesClass: 'wwa-line',
                            aria: 'auto',
                        });
                        allLines.push(...split.lines);
                    });

                    gsap.set(allLines, { opacity: 0, y: 12 });
                    tl.to(allLines, {
                        opacity: 1,
                        y: 0,
                        duration: 1.1,
                        stagger: 0.12,
                    }, 0.25);
                }
            };

            if (document.fonts && document.fonts.ready) {
                document.fonts.ready.then(run);
            } else {
                run();
            }
        };

        const startWatching = () => {
            if (watching) return;
            watching = true;

            if (isSectionInView()) {
                play();
                return;
            }

            if (typeof ScrollTrigger !== 'undefined') {
                ScrollTrigger.create({
                    trigger: section,
                    start: 'top 80%',
                    once: true,
                    onEnter: play,
                });
            }
        };

        rrWhenLoaderDone(startWatching);
    };

    document.querySelectorAll('.who-we-are').forEach(initTextReveal);
})();

/* ==========================================================================
   Scroll reveals — release / locations / process / education (unblur)
   ========================================================================== */

initSectionUnblur('section.release', '.release__inner');
initSectionUnblur('section.locations', '.locations__inner');
initSectionUnblur('section.process', '.process__inner');
initSectionUnblur('section.education', '.education__inner');

/* ==========================================================================
   Text image
   ========================================================================== */

document.querySelectorAll('section.text-image').forEach((section) => {
    initMediaContentReveal(section, {
        media: '.text-image__media',
        content: '.text-image__content',
        trigger: '.text-image__wrapper',
    });
});

/* ==========================================================================
   Insurance
   ========================================================================== */

document.querySelectorAll('section.insurance').forEach((section) => {
    initMediaContentReveal(section, {
        content: '.container',
        trigger: '.container',
    });
});

/* ==========================================================================
   Banner
   ========================================================================== */

document.querySelectorAll('section.banner').forEach((section) => {
    initMediaContentReveal(section, {
        media: '.banner__background',
        content: '.banner__content',
        trigger: '.banner__inner',
        fade: { mode: 'fade' },
    });
});

/* ==========================================================================
   Assistance
   ========================================================================== */

document.querySelectorAll('section.assistance').forEach((section) => {
    initMediaContentReveal(section, {
        content: '.assistance__content',
        trigger: '.assistance__content',
        fade: { mode: 'fade' },
        animatedClass: 'is-animated',
        revealedClass: 'is-animated',
    });
});

/* ==========================================================================
   Release reviews — mobile gallery
   ========================================================================== */

(() => {
    const mobileMq = window.matchMedia('(max-width: 991px)');
    const galleryState = new WeakMap();

    const destroyGallery = (gallery) => {
        const state = galleryState.get(gallery);
        if (!state) return;

        if (state.swiper) {
            state.swiper.destroy(true, true);
        }

        state.clones.forEach((clone) => clone.remove());
        galleryState.delete(gallery);
    };

    const initGallery = (gallery) => {
        if (typeof Swiper === 'undefined') return;

        if (!mobileMq.matches) {
            destroyGallery(gallery);
            return;
        }

        if (galleryState.has(gallery)) return;

        const swiperWrapper = gallery.querySelector('.swiper-wrapper');
        const paginationEl = gallery.querySelector('.swiper-pagination');
        if (!swiperWrapper) return;

        const slides = Array.from(swiperWrapper.children).filter(
            (el) => !el.classList.contains('slide-clone')
        );
        const originalCount = slides.length;

        const clones = slides.map((slide) => {
            const clone = slide.cloneNode(true);
            clone.classList.add('slide-clone');
            swiperWrapper.appendChild(clone);
            return clone;
        });

        const swiper = new Swiper(gallery, {
            loop: true,
            slidesPerView: 1.02,
            spaceBetween: 10,
            centeredSlides: true,
            speed: 1000,
            autoplay: {
                delay: 5000,
                disableOnInteraction: false,
            },
            pagination: {
                el: paginationEl,
                clickable: true,
                renderBullet: (index, className) =>
                    index < originalCount ? `<span class="${className}"></span>` : '',
            },
            on: {
                slideChange() {
                    const active = this.realIndex % originalCount;

                    this.pagination.bullets.forEach((bullet, i) => {
                        bullet.classList.toggle('swiper-pagination-bullet-active', i === active);
                    });

                    this.slides.forEach((slide, i) => {
                        slide.classList.toggle('is-active', i === this.activeIndex);
                    });
                },
            },
        });

        galleryState.set(gallery, { swiper, clones, originalCount });
        swiper.emit('slideChange');
    };

    const syncGalleries = () => {
        document.querySelectorAll('.release-reviews__list .swiper').forEach(initGallery);
    };

    syncGalleries();
    mobileMq.addEventListener('change', syncGalleries);
})();

/* ==========================================================================
   Release — desktop tabs + mobile accordion
   ========================================================================== */

document.querySelectorAll('section.release').forEach((section) => {
    const navigationButtons = section.querySelectorAll('.release__navigation .navigation-button');
    const listItems = section.querySelectorAll('.release__list .item');

    navigationButtons.forEach((button, index) => {
        button.addEventListener('click', () => {
            if (button.classList.contains('is-current')) return;

            navigationButtons.forEach((btn) => btn.classList.remove('is-current'));
            button.classList.add('is-current');
            listItems.forEach((item) => item.classList.remove('is-current'));
            if (listItems[index]) {
                listItems[index].classList.add('is-current');
            }
            scrollTabBlockToStart(button);
        });
    });

    const $section = $(section);
    const $items = $section.find('.release__list .item');

    const syncAccordionForViewport = () => {
        const $titles = $items.find('.item-title');
        const $wrappers = $items.find('.item-wrapper');

        if (accordionMobileMq.matches) {
            $titles.removeClass('is-open');
            $wrappers.hide();
            $items.first().find('.item-title').addClass('is-open');
            $items.first().find('.item-wrapper').show();
        } else {
            $titles.removeClass('is-open');
            $wrappers.css('display', '');
        }
    };

    $items.each(function (index, item) {
        const $item = $(item);
        const $button = $item.find('.item-title');
        const $content = $item.find('.item-wrapper');

        $button.on('click', function () {
            if (!accordionMobileMq.matches) return;

            const isOpen = $button.hasClass('is-open');

            $items.find('.item-title.is-open').not($button).removeClass('is-open');
            $items.find('.item-wrapper').not($content).stop().slideUp();

            if (isOpen) {
                $button.removeClass('is-open');
                $content.stop().slideUp();
            } else {
                $button.addClass('is-open');
                $content.stop().slideDown();
            }
        });
    });

    syncAccordionForViewport();
    if (typeof accordionMobileMq.addEventListener === 'function') {
        accordionMobileMq.addEventListener('change', syncAccordionForViewport);
    } else if (typeof accordionMobileMq.addListener === 'function') {
        accordionMobileMq.addListener(syncAccordionForViewport);
    }
});

/* ==========================================================================
   Education — desktop cards + mobile accordion
   ========================================================================== */

document.querySelectorAll('section.education').forEach((section) => {
    const $section = $(section);

    $section.find('.education__list .item-media').each(function (index, item) {
        $(item).on('click', function () {
            $(item).parent().addClass('is-current').siblings().removeClass('is-current');
        });
    });

    const $items = $section.find('.education__list-mobile .item');

    const syncAccordionForViewport = () => {
        const $wrappers = $items.find('.item-wrapper');

        if (accordionMobileMq.matches) {
            $items.removeClass('is-open');
            $wrappers.hide();
            $items.first().addClass('is-open');
            $items.first().find('.item-wrapper').show();
        } else {
            $items.removeClass('is-open');
            $wrappers.css('display', '');
        }
    };

    $items.each(function (index, item) {
        const $item = $(item);
        const $button = $item.find('.item-title');
        const $content = $item.find('.item-wrapper');

        $button.on('click', function () {
            if (!accordionMobileMq.matches) return;

            const isOpen = $item.hasClass('is-open');

            $items.not($item).removeClass('is-open');
            $items.find('.item-wrapper').not($content).stop().slideUp();

            if (isOpen) {
                $item.removeClass('is-open');
                $content.stop().slideUp();
            } else {
                $item.addClass('is-open');
                $content.stop().slideDown();
            }
        });
    });

    syncAccordionForViewport();
    if (typeof accordionMobileMq.addEventListener === 'function') {
        accordionMobileMq.addEventListener('change', syncAccordionForViewport);
    } else if (typeof accordionMobileMq.addListener === 'function') {
        accordionMobileMq.addListener(syncAccordionForViewport);
    }
});

/* ==========================================================================
   Section FAQ
   ========================================================================== */

document.querySelectorAll('section.section-faq').forEach((section) => {
    const $section = $(section);
    const $items = $section.find('.section-faq__list .item');

    $items.each(function (index, item) {
        const $item = $(item);
        const $button = $item.find('.item-title');
        const $content = $item.find('.item-content');

        $button.on('click', function () {
            const isOpen = $item.hasClass('is-open');

            $items.not($item).removeClass('is-open');
            $items.find('.item-content').not($content).stop().slideUp();

            if (isOpen) {
                $item.removeClass('is-open');
                $content.stop().slideUp();
            } else {
                $item.addClass('is-open');
                $content.stop().slideDown();
            }
        });
    });
});

/* ==========================================================================
   Section side navigation (shared UI)
   ========================================================================== */

$('.section-side-navigation').each(function (_, navigation) {
    const $navigation = $(navigation);
    const $scope = $navigation.closest('section');
    const scopeEl = $scope.get(0) || document.body;
    const $placeholder = $navigation.find('.section-side-navigation__placeholder');
    const $current = $navigation.find('.section-side-navigation__current');
    const $list = $navigation.find('.section-side-navigation__list');
    const $items = $list.find('li');
    const isGrouped = $navigation.hasClass('is-grouped');
    const mobileMq = window.matchMedia('(max-width: 991px)');
    const slideDuration = 300;

    const syncCurrentLabel = () => {
        const label = $items.filter('.is-current').first().text().trim();
        if (label) {
            $current.text(label);
        }
    };

    const syncMobileHeight = () => {
        if (!mobileMq.matches || isGrouped) {
            scopeEl.style.removeProperty('--section-side-navigation-height');
            return;
        }

        scopeEl.style.setProperty(
            '--section-side-navigation-height',
            `${$placeholder.outerHeight()}px`
        );
    };

    const openNavigation = () => {
        if ($navigation.hasClass('is-open')) return;
        $navigation.addClass('is-open');
        $list.stop(true, true).slideDown(slideDuration);
    };

    const closeNavigation = () => {
        if (!$navigation.hasClass('is-open')) return;
        $navigation.removeClass('is-open');
        $list.stop(true, true).slideUp(slideDuration);
    };

    const syncListForViewport = () => {
        if (isGrouped) {
            $navigation.removeClass('is-open');
            $list.stop(true, true).show().css('display', '');
            syncMobileHeight();
            return;
        }

        if (mobileMq.matches) {
            if (!$navigation.hasClass('is-open')) {
                $list.hide();
            }
            syncMobileHeight();
            return;
        }

        $navigation.removeClass('is-open');
        $list.stop(true, true).show().css('display', '');
        syncMobileHeight();
    };

    syncCurrentLabel();
    syncListForViewport();

    $placeholder.on('click', function (event) {
        event.preventDefault();
        event.stopPropagation();
        if (!mobileMq.matches || isGrouped) return;

        if ($navigation.hasClass('is-open')) {
            closeNavigation();
        } else {
            openNavigation();
        }
    });

    $items.on('click', function () {
        window.setTimeout(function () {
            syncCurrentLabel();
            syncMobileHeight();
            if (mobileMq.matches && !isGrouped) {
                closeNavigation();
            }
        }, 0);
    });

    $(document).on('click.sectionSideNavigation', function (event) {
        if (!mobileMq.matches || isGrouped) return;
        if (!$navigation.is(event.target) && $navigation.has(event.target).length === 0) {
            closeNavigation();
        }
    });

    $(window).on('resize.sectionSideNavigation', syncMobileHeight);

    if (typeof mobileMq.addEventListener === 'function') {
        mobileMq.addEventListener('change', syncListForViewport);
    } else if (typeof mobileMq.addListener === 'function') {
        mobileMq.addListener(syncListForViewport);
    }
});

/* ==========================================================================
   Location switcher
   ========================================================================== */

document.querySelectorAll('.location-switcher').forEach((switcher) => {
    const buttons = switcher.querySelectorAll('.location-toggle__button');
    const panels = switcher.querySelectorAll('.location-toggle-panel');

    buttons.forEach((button, index) => {
        button.addEventListener('click', () => {
            if (button.classList.contains('is-current')) return;

            buttons.forEach((btn) => btn.classList.remove('is-current'));
            button.classList.add('is-current');
            panels.forEach((panel) => panel.classList.remove('is-current'));

            const panel = panels[index];
            if (!panel) return;
            panel.classList.add('is-current');

            const mainEl = panel.querySelector('.gallery-block__main');
            if (mainEl && mainEl.swiper) mainEl.swiper.update();
            scrollTabBlockToStart(switcher);
        });
    });
});

/* ==========================================================================
   Gallery block
   ========================================================================== */

document.querySelectorAll('.gallery-block').forEach((gallery) => {
    if (typeof Swiper === 'undefined') return;

    const mainEl = gallery.querySelector('.gallery-block__main');
    const thumbsEl = gallery.querySelector('.gallery-block__thumbs');
    const prevEl = gallery.querySelector('.gallery-block__prev');
    const nextEl = gallery.querySelector('.gallery-block__next');
    if (!mainEl || !thumbsEl) return;

    const thumbsSwiper = new Swiper(thumbsEl, {
        slidesPerView: 'auto',
        spaceBetween: 10,
        watchSlidesProgress: true,
        slideToClickedSlide: true,
        breakpoints: {
            0: {
                spaceBetween: 8,
            },
            992: {
                spaceBetween: 10,
            },
        },
    });

    new Swiper(mainEl, {
        speed: 600,
        effect: 'fade',
        navigation: {
            prevEl: prevEl || null,
            nextEl: nextEl || null,
        },
        thumbs: {
            swiper: thumbsSwiper,
        },
    });
});

/* ==========================================================================
   Story — decoration scroll pin
   ========================================================================== */

document.querySelectorAll('section.story').forEach((story) => {
    if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') return;

    const dec = story.querySelector('.story__dec');
    const list = story.querySelector('.story__list');
    const lastDot = list?.querySelector('.item:last-child .item-dot');
    if (!dec || !list || !lastDot) return;

    gsap.registerPlugin(ScrollTrigger);

    const mm = gsap.matchMedia();

    mm.add('(prefers-reduced-motion: no-preference)', () => {
        let tween = null;

        // Recreate instead of ScrollTrigger.refresh() — refresh while scrolled
        // shifts start/end by -scrollY and starts the scrub too early.
        const create = () => {
            if (tween) {
                tween.scrollTrigger?.kill();
                tween.kill();
            }

            gsap.set(dec, { y: 0 });

            const travelY =
                (lastDot.getBoundingClientRect().top + lastDot.offsetHeight / 2)
                - (dec.getBoundingClientRect().top + dec.offsetHeight / 2);

            const scrollDistance = Math.max(
                1,
                (lastDot.getBoundingClientRect().top + lastDot.offsetHeight / 2)
                - list.getBoundingClientRect().top
            );

            tween = gsap.to(dec, {
                y: travelY,
                ease: 'none',
                scrollTrigger: {
                    trigger: list,
                    start: 'top center',
                    end: `+=${scrollDistance}`,
                    scrub: true,
                },
            });
        };

        let resizeTimer = null;
        const onResize = () => {
            window.clearTimeout(resizeTimer);
            resizeTimer = window.setTimeout(create, 150);
        };

        rrWhenLoaderDone(create);
        window.addEventListener('load', create);
        window.addEventListener('resize', onResize);

        return () => {
            window.clearTimeout(resizeTimer);
            window.removeEventListener('load', create);
            window.removeEventListener('resize', onResize);
            if (tween) {
                tween.scrollTrigger?.kill();
                tween.kill();
            }
            gsap.set(dec, { clearProps: 'transform' });
        };
    });
});

/* ==========================================================================
   Side navigation filter (shared helper)
   ========================================================================== */

const initSideNavigationFilter = ($navItems, $panels) => {
    if (!$navItems.length || !$panels.length) return;

    const hasAllOption = $navItems.filter('[data-value="all"]').length > 0;
    const fadeDuration = 300;
    let isAnimating = false;

    const getTargetPanels = ($item) => {
        if (hasAllOption && $item.attr('data-value') === 'all') {
            return $panels;
        }

        const index = $navItems.index($item);
        const panelIndex = hasAllOption ? index - 1 : index;
        return $panels.eq(panelIndex);
    };

    if (!hasAllOption) {
        let $active = $navItems.filter('.is-current').first();
        if (!$active.length) {
            $active = $navItems.first();
        }

        $navItems.removeClass('is-current');
        $active.addClass('is-current');
        $panels.hide();
        getTargetPanels($active).show();
    }

    $navItems.on('click', function () {
        const $item = $(this);
        if (isAnimating || $item.hasClass('is-current')) return;

        $navItems.removeClass('is-current');
        $item.addClass('is-current');
        scrollTabBlockToStart(this);

        isAnimating = true;
        const $visible = $panels.filter(':visible');
        const $target = getTargetPanels($item);
        const $container = $panels.first().parent();
        const containerEl = $container.get(0);

        if (containerEl) {
            containerEl.style.minHeight = `${containerEl.offsetHeight}px`;
        }

        $visible.stop(true, true).fadeOut(fadeDuration).promise().done(function () {
            $target.stop(true, true).hide().fadeIn(fadeDuration).promise().done(function () {
                if (containerEl) {
                    containerEl.style.minHeight = '';
                }
                isAnimating = false;
            });
        });
    });
};

/* ==========================================================================
   Testimonials
   ========================================================================== */

$('.testimonials').each(function (_, section) {
    initSideNavigationFilter(
        $(section).find('.testimonials__navigation li'),
        $(section).find('.testimonials__list')
    );
});

/* ==========================================================================
   About
   ========================================================================== */

$('.about').each(function (_, section) {
    initSideNavigationFilter(
        $(section).find('.about__navigation li'),
        $(section).find('.about__list > .item')
    );
});

/* ==========================================================================
   About location
   ========================================================================== */

$('.about-location').each(function (_, section) {
    const $section = $(section);
    const $desktopItems = $section.find('.about-location__navigation .section-side-navigation__list li');
    const $blocks = $section.find('.about-location__block');
    const $allPanels = $section.find('.about-location__list > .item');
    const $blocksContainer = $section.find('.about-location__blocks');
    const $desktopNav = $section.find('.about-location__navigation');
    const fadeDuration = 300;
    const minHeightBuffer = 16;
    let isAnimating = false;
    const mobileMq = window.matchMedia('(max-width: 991px)');

    const getBlockNavItems = ($block) =>
        $block.find('.about-location__navigation-list .section-side-navigation__list li');

    const syncPlaceholder = ($navigation) => {
        const $current = $navigation.find('.section-side-navigation__current');
        const label = $navigation.find('li.is-current').first().text().trim();
        if (label) {
            $current.text(label);
        }
    };

    const syncPlaceholdersIn = ($root) => {
        $root.find('.section-side-navigation').each(function () {
            syncPlaceholder($(this));
        });
    };

    const updateGalleries = ($panel) => {
        $panel.find('.gallery-block__main').each(function () {
            if (this.swiper) this.swiper.update();
        });
    };

    const getNavMinHeight = () => ($desktopNav.outerHeight() || 0) + minHeightBuffer;

    const syncBlocksMinHeight = () => {
        const containerEl = $blocksContainer.get(0);
        if (!containerEl) return;

        if (mobileMq.matches) {
            containerEl.style.minHeight = '';
            return;
        }

        containerEl.style.minHeight = '';
        const contentHeight = containerEl.offsetHeight;
        const minHeight = getNavMinHeight();
        containerEl.style.minHeight = contentHeight < minHeight ? `${minHeight}px` : '';
    };

    const getGlobalIndexFromBlock = ($block, $li) => {
        let offset = 0;
        let result = -1;

        $blocks.each(function () {
            const $currentBlock = $(this);
            const $lis = getBlockNavItems($currentBlock);

            if ($currentBlock.is($block)) {
                result = offset + $lis.index($li);
                return false;
            }

            offset += $lis.length;
        });

        return result;
    };

    const syncBlockNavFromGlobal = (globalIndex) => {
        let offset = 0;

        $blocks.each(function () {
            const $block = $(this);
            const $lis = getBlockNavItems($block);
            const count = $lis.length;
            const localIndex = globalIndex - offset;

            if (localIndex >= 0 && localIndex < count) {
                $lis.removeClass('is-current');
                $lis.eq(localIndex).addClass('is-current');
                syncPlaceholdersIn($block);
            }

            offset += count;
        });
    };

    const syncDesktopNavFromGlobal = (globalIndex) => {
        $desktopItems.removeClass('is-current');
        $desktopItems.eq(globalIndex).addClass('is-current');
        syncPlaceholdersIn($section.find('.about-location__navigation'));
    };

    const applyVisibility = () => {
        if (mobileMq.matches) {
            $blocksContainer.css('min-height', '');
            $blocks.each(function () {
                const $block = $(this);
                const $lis = getBlockNavItems($block);
                const $panels = $block.find('.about-location__list > .item');
                let localIndex = $lis.index($lis.filter('.is-current').first());
                if (localIndex < 0) localIndex = 0;

                $panels.hide();
                $panels.eq(localIndex).show();
                updateGalleries($panels.eq(localIndex));
            });
            return;
        }

        let globalIndex = $desktopItems.index($desktopItems.filter('.is-current').first());
        if (globalIndex < 0) globalIndex = 0;

        $allPanels.hide();
        $allPanels.eq(globalIndex).show();
        updateGalleries($allPanels.eq(globalIndex));
        syncBlocksMinHeight();
    };

    const fadeSwap = ($hide, $show, $heightTarget) => {
        if (isAnimating || !$show.length) return;

        isAnimating = true;
        const containerEl = ($heightTarget && $heightTarget.get(0)) || $blocksContainer.get(0);

        if (containerEl) {
            containerEl.style.minHeight = `${containerEl.offsetHeight}px`;
        }

        $hide.stop(true, true).fadeOut(fadeDuration).promise().done(function () {
            $show.stop(true, true).hide().fadeIn(fadeDuration).promise().done(function () {
                if (mobileMq.matches) {
                    if (containerEl) {
                        containerEl.style.minHeight = '';
                    }
                } else {
                    syncBlocksMinHeight();
                }
                updateGalleries($show);
                isAnimating = false;
            });
        });
    };

    $desktopItems.removeClass('is-current');
    $desktopItems.first().addClass('is-current');
    syncPlaceholdersIn($section.find('.about-location__navigation'));

    $blocks.each(function () {
        const $lis = getBlockNavItems($(this));
        if (!$lis.filter('.is-current').length) {
            $lis.first().addClass('is-current');
        }
        syncPlaceholdersIn($(this));
    });

    applyVisibility();

    $desktopItems.on('click', function () {
        const $item = $(this);
        if (isAnimating || $item.hasClass('is-current') || mobileMq.matches) return;

        const globalIndex = $desktopItems.index($item);
        syncDesktopNavFromGlobal(globalIndex);
        syncBlockNavFromGlobal(globalIndex);
        scrollTabBlockToStart(this);
        fadeSwap(
            $allPanels.filter(':visible'),
            $allPanels.eq(globalIndex),
            $blocksContainer
        );
    });

    $blocks.each(function () {
        const $block = $(this);
        const $lis = getBlockNavItems($block);
        const $panels = $block.find('.about-location__list > .item');

        $lis.on('click', function () {
            const $item = $(this);
            if (isAnimating || $item.hasClass('is-current')) return;

            const localIndex = $lis.index($item);
            const globalIndex = getGlobalIndexFromBlock($block, $item);

            $lis.removeClass('is-current');
            $item.addClass('is-current');
            syncPlaceholdersIn($block);
            syncDesktopNavFromGlobal(globalIndex);
            scrollTabBlockToStart(this);

            if (mobileMq.matches) {
                fadeSwap(
                    $panels.filter(':visible'),
                    $panels.eq(localIndex),
                    $block.find('.about-location__list')
                );
            } else {
                fadeSwap(
                    $allPanels.filter(':visible'),
                    $allPanels.eq(globalIndex),
                    $blocksContainer
                );
            }
        });
    });

    if (typeof mobileMq.addEventListener === 'function') {
        mobileMq.addEventListener('change', applyVisibility);
    } else if (typeof mobileMq.addListener === 'function') {
        mobileMq.addListener(applyVisibility);
    }

    $(window).on('resize.aboutLocation', syncBlocksMinHeight);
});
