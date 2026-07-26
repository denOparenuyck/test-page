'use strict';

const header = document.querySelector('.header');
const headerMenu = document.querySelector('.header__menu');

if (headerMenu) {
    headerMenu.addEventListener('click', () => {
        header.classList.toggle('is-open');
        document.body.classList.toggle('no-scroll');
    });
}

const whoWeAreGallery = document.querySelector('.who-we-are__gallery .swiper');
const whoWeAreMobileMq = window.matchMedia('(max-width: 991px)');
let whoWeAreSwiper = null;
let whoWeAreClones = [];
let whoWeAreOriginalCount = 0;

const destroyWhoWeAreSwiper = () => {
    if (whoWeAreSwiper) {
        whoWeAreSwiper.destroy(true, true);
        whoWeAreSwiper = null;
    }

    whoWeAreClones.forEach((clone) => clone.remove());
    whoWeAreClones = [];
    whoWeAreOriginalCount = 0;
};

const initWhoWeAreSwiper = () => {
    if (!whoWeAreGallery || typeof Swiper === 'undefined') return;

    if (!whoWeAreMobileMq.matches) {
        destroyWhoWeAreSwiper();
        return;
    }

    if (whoWeAreSwiper) return;

    const swiperWrapper = whoWeAreGallery.querySelector('.swiper-wrapper');
    if (!swiperWrapper) return;

    const slides = Array.from(swiperWrapper.children).filter(
        (el) => !el.classList.contains('slide-clone')
    );
    whoWeAreOriginalCount = slides.length;

    whoWeAreClones = slides.map((slide) => {
        const clone = slide.cloneNode(true);
        clone.classList.add('slide-clone');
        swiperWrapper.appendChild(clone);
        return clone;
    });

    whoWeAreSwiper = new Swiper(whoWeAreGallery, {
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
            el: '.who-we-are__gallery .swiper-pagination',
            clickable: true,
            renderBullet: (index, className) =>
                index < whoWeAreOriginalCount ? `<span class="${className}"></span>` : '',
        },
        on: {
            slideChange() {
                const active = this.realIndex % whoWeAreOriginalCount;

                this.pagination.bullets.forEach((bullet, i) => {
                    bullet.classList.toggle('swiper-pagination-bullet-active', i === active);
                });

                this.slides.forEach((slide, i) => {
                    slide.classList.toggle('is-active', i === this.activeIndex);
                });
            },
        },
    });

    whoWeAreSwiper.emit('slideChange');
};

initWhoWeAreSwiper();
whoWeAreMobileMq.addEventListener('change', initWhoWeAreSwiper);


let releaseNavigationButtons = document.querySelectorAll('.release__navigation .navigation-button');
let releaseListItems = document.querySelectorAll('.release__list .item');

releaseNavigationButtons.forEach((button, index) => {
    button.addEventListener('click', () => {
        releaseNavigationButtons.forEach((btn) => btn.classList.remove('is-current'));
        button.classList.add('is-current');
        releaseListItems.forEach((item) => item.classList.remove('is-current'));
        releaseListItems[index].classList.add('is-current');
    });
});


$('.release__list .item').each(function (index, item) {
    let button = $(item).find('.item-title');
    let content = $(item).find('.item-wrapper');
    $(button).on('click', function () {
        const isOpen = $(button).hasClass('is-open');

        $('.release__list .item .item-title.is-open').not(button).removeClass('is-open');
        $('.release__list .item .item-wrapper').not(content).stop().slideUp();

        if (isOpen) {
            $(button).removeClass('is-open');
            $(content).stop().slideUp();
        } else {
            $(button).addClass('is-open');
            $(content).stop().slideDown();
        }
    });
});


$('.education__list .item-media').each(function (index, item) {
    $(item).on('click', function () {
        $(item).parent().addClass('is-current').siblings().removeClass('is-current');
    });
});

$('.education__list-mobile .item').each(function (index, item) {
    let button = $(item).find('.item-title');
    let content = $(item).find('.item-wrapper');
    $(button).on('click', function () {
        const isOpen = $(item).hasClass('is-open');

        $('.education__list-mobile .item').not(item).removeClass('is-open');
        $('.education__list-mobile .item .item-wrapper').not(content).stop().slideUp();

        if (isOpen) {
            $(item).removeClass('is-open');
            $(content).stop().slideUp();
        } else {
            $(item).addClass('is-open');
            $(content).stop().slideDown();
        }
    });
});

$('.section-faq__list .item').each(function (index, item) {
    let button = $(item).find('.item-title');
    let content = $(item).find('.item-content');
    $(button).on('click', function () {
        const isOpen = $(item).hasClass('is-open');

        $('.section-faq__list .item').not(item).removeClass('is-open');
        $('.section-faq__list .item .item-content').not(content).stop().slideUp();

        if (isOpen) {
            $(item).removeClass('is-open');
            $(content).stop().slideUp();
        } else {
            $(item).addClass('is-open');
            $(content).stop().slideDown();
        }
    });
});



$('.section-side-navigation').each(function (_, navigation) {
    const $navigation = $(navigation);
    const $placeholder = $navigation.find('.section-side-navigation__placeholder');
    const $current = $navigation.find('.section-side-navigation__current');
    const $list = $navigation.find('.section-side-navigation__list');
    const $items = $list.find('li');
    const mobileMq = window.matchMedia('(max-width: 991px)');
    const slideDuration = 300;

    const syncCurrentLabel = () => {
        const label = $items.filter('.is-current').first().text().trim();
        if (label) {
            $current.text(label);
        }
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
        if (mobileMq.matches) {
            if (!$navigation.hasClass('is-open')) {
                $list.hide();
            }
            return;
        }

        $navigation.removeClass('is-open');
        $list.stop(true, true).show().css('display', '');
    };

    syncCurrentLabel();
    syncListForViewport();

    $placeholder.on('click', function (event) {
        event.preventDefault();
        event.stopPropagation();
        if (!mobileMq.matches) return;

        if ($navigation.hasClass('is-open')) {
            closeNavigation();
        } else {
            openNavigation();
        }
    });

    $items.on('click', function () {
        window.setTimeout(function () {
            syncCurrentLabel();
            if (mobileMq.matches) {
                closeNavigation();
            }
        }, 0);
    });

    $(document).on('click.sectionSideNavigation', function (event) {
        if (!mobileMq.matches) return;
        if (!$navigation.is(event.target) && $navigation.has(event.target).length === 0) {
            closeNavigation();
        }
    });

    if (typeof mobileMq.addEventListener === 'function') {
        mobileMq.addEventListener('change', syncListForViewport);
    } else if (typeof mobileMq.addListener === 'function') {
        mobileMq.addListener(syncListForViewport);
    }
});

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
        });
    });
});

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

(() => {
    const story = document.querySelector('.story');
    if (!story || typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') return;

    const dec = story.querySelector('.story__dec');
    const list = story.querySelector('.story__list');
    const lastDot = list?.querySelector('.item:last-child .item-dot');
    if (!dec || !list || !lastDot) return;

    gsap.registerPlugin(ScrollTrigger);

    const getTravelY = () => {
        const currentY = Number(gsap.getProperty(dec, 'y')) || 0;
        const decRect = dec.getBoundingClientRect();
        const dotRect = lastDot.getBoundingClientRect();
        const decCenter = decRect.top + decRect.height / 2;
        const dotCenter = dotRect.top + dotRect.height / 2;

        return currentY + (dotCenter - decCenter);
    };

    const mm = gsap.matchMedia();

    mm.add('(prefers-reduced-motion: no-preference)', () => {
        gsap.to(dec, {
            y: getTravelY,
            ease: 'none',
            scrollTrigger: {
                trigger: list,
                start: 'top center',
                endTrigger: lastDot,
                end: 'center center',
                scrub: true,
                invalidateOnRefresh: true,
            },
        });

        const refresh = () => ScrollTrigger.refresh();
        window.addEventListener('load', refresh);

        return () => {
            window.removeEventListener('load', refresh);
        };
    });
})();

$('.testimonials').each(function (_, section) {
    const $navigation = $(section).find('.testimonials__navigation li');
    const $lists = $(section).find('.testimonials__list');
    const fadeDuration = 300;
    let isAnimating = false;

    $navigation.on('click', function () {
        const $item = $(this);
        if (isAnimating || $item.hasClass('is-current')) return;

        const index = $navigation.index($item);
        $navigation.removeClass('is-current');
        $item.addClass('is-current');

        isAnimating = true;
        const $visible = $lists.filter(':visible');
        const $target = index === 0 ? $lists : $lists.eq(index - 1);

        $visible.stop(true, true).fadeOut(fadeDuration).promise().done(function () {
            $target.stop(true, true).hide().fadeIn(fadeDuration).promise().done(function () {
                isAnimating = false;
            });
        });
    });
});