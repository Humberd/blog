import { PageViewEvent } from './events/page-view.event';
import { BaseEvent } from './events/base.event';
import { PageScrollEvent } from './events/page-scroll.event';
import { getSessionId, getUserId, getViewId } from '../utils/id-generator';

const ANALYTICS_URL = 'http://localhost:8080/xyz';

export class EventSender {
  async registerPageView(event: PageViewEvent) {
    return this.sendEvent('/page-view', event);
  }

  async registerPageScroll(event: PageScrollEvent) {
    return this.sendEvent('/page-scroll', event);
  }

  private async sendEvent<T>(path: string, event: T) {
    const eventData: BaseEvent & T = {
      userId: getUserId(),
      sessionId: getSessionId(),
      viewId: getViewId(),
      referrer: document.referrer,
      url: location.href,
      ...event,
    };

    return fetch(`${ANALYTICS_URL}${path}`, {
      method: 'POST',
      body: JSON.stringify(eventData),
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }
}
