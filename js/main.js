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


$('.education__list .item-media').each(function(index, item){
    $(item).on('click', function(){
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