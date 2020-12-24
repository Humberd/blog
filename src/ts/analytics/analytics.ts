import { EventSender } from './event-sender';

export function analyticsInit() {
  const eventSender = new EventSender();

  eventSender.registerPageView({
    id: '123',
    referrer: document.referrer,
    url: location.href
  })
}
