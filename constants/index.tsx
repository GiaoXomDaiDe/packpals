import arrowDown from '@/assets/icons/arrow-down.png'
import arrowUp from '@/assets/icons/arrow-up.png'
import backArrow from '@/assets/icons/back-arrow.png'
import chat from '@/assets/icons/chat.png'
import checkmark from '@/assets/icons/check.png'
import close from '@/assets/icons/close.png'
import dollar from '@/assets/icons/dollar.png'
import email from '@/assets/icons/email.png'
import eyecross from '@/assets/icons/eyecross.png'
import google from '@/assets/icons/google.png'
import home from '@/assets/icons/home.png'
import list from '@/assets/icons/list.png'
import lock from '@/assets/icons/lock.png'
import locker from '@/assets/icons/locker.png'
import map from '@/assets/icons/map.png'
import marker from '@/assets/icons/marker.png'
import out from '@/assets/icons/out.png'
import person from '@/assets/icons/person.png'
import pin from '@/assets/icons/pin.png'
import point from '@/assets/icons/point.png'
import profile from '@/assets/icons/profile.png'
import search from '@/assets/icons/search.png'
import selectedMarker from '@/assets/icons/selected-marker.png'
import star from '@/assets/icons/star.png'
import target from '@/assets/icons/target.png'
import to from '@/assets/icons/to.png'
import check from '@/assets/images/check.png'
import getStarted from '@/assets/images/get-started.png'
import message from '@/assets/images/message.png'
import noResult from '@/assets/images/no-result.png'
import onboarding1 from '@/assets/images/onboarding1.png'
import onboarding2 from '@/assets/images/onboarding2.png'
import onboarding3 from '@/assets/images/onboarding3.png'
import signUpCar from '@/assets/images/signup-car.png'

export const palette = {
  primary: '#3B82F6',
  secondary: '#6B7280',
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  white: '#FFFFFF',
  black: '#000000',
  gray: {
    50: '#F9FAFB',
    100: '#F3F4F6',
    200: '#E5E7EB',
    300: '#D1D5DB',
    400: '#9CA3AF',
    500: '#6B7280',
    600: '#4B5563',
    700: '#374151',
    800: '#1F2937',
    900: '#111827',
  },
}

export const images = {
    onboarding1,
    onboarding2,
    onboarding3,
    getStarted,
    signUpCar,
    check,
    noResult,
    message,
}

export const icons = {
    arrowDown,
    arrowUp,
    backArrow,
    chat,
    checkmark,
    close,
    dollar,
    email,
    eyecross,
    google,
    home,
    list,
    lock,
    map,
    marker,
    out,
    person,
    pin,
    point,
    profile,
    search,
    selectedMarker,
    star,
    target,
    to,
    locker
}


export const onboarding = [
    {
        id: 1,
        title: 'The perfect ride is just a tap away!',
        description:
            'Your journey begins with FakeUber. Find your ideal ride effortlessly.',
        image: images.onboarding1,
    },
    {
        id: 2,
        title: 'Best car in your hands with us',
        description:
            'Discover the convenience of finding your perfect ride with FakeUber',
        image: images.onboarding2,
    },
    {
        id: 3,
        title: "Your ride, your way. Let's go!",
        description:
            'Enter your destination, sit back, and let us take care of the rest.',
        image: images.onboarding3,
    },
]

export const data = {
    onboarding,
}
