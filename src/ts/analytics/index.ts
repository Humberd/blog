import { EventSender } from './event-sender';
import { getUserId } from '../utils/id-generator';

export function analyticsInit() {
  const eventSender = new EventSender();

  eventSender.registerPageView({
    userId: getUserId(),
    referrer: document.referrer,
    url: location.href,
  });

  // we wait until all the images are loaded so that there is no scroll jumping
  setTimeout(() => {
    const baseBreakpoints = [25, 50, 75, 90, 99];
    const initialScrollPercent = getScrollPercent();
    const filteredBreakpoints = baseBreakpoints.filter(it => it >= initialScrollPercent);

    watchForScroll(filteredBreakpoints, eventSender);
  }, 1000);

}

function watchForScroll(breakpoints: number[], eventSender: EventSender): void {
  console.log(`Starting with ${JSON.stringify(breakpoints)}`);
  let currentIndex = 0;
  const callback = () => {
    if (currentIndex >= breakpoints.length) {
      document.removeEventListener('scroll', callback);
      return;
    }

    const scrollPercent = getScrollPercent();

    if (scrollPercent < breakpoints[currentIndex]) {
      return;
    }

    eventSender.registerPageScroll({
      userId: getUserId(),
      referrer: document.referrer,
      url: location.href,
      breakpoint: breakpoints[currentIndex],
    });

    currentIndex++;
  };
  document.addEventListener('scroll', callback, {passive: true});
}


function getScrollPercent(): number {
  var h = document.documentElement,
      b = document.body,
      st = 'scrollTop',
      sh = 'scrollHeight';
  return (h[st] || b[st]) / ((h[sh] || b[sh]) - h.clientHeight) * 100;
}
