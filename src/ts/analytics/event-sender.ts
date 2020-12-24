import { PageViewEvent } from './events/page-view.event';
import { BaseEvent } from './events/base.event';
import { PageScrollEvent } from './events/page-scroll.event';

const ANALYTICS_URL = 'http://localhost:8080/xyz';

export class EventSender {
  async registerPageView(event: PageViewEvent) {
    return this.sendEvent('/page-view', event);
  }

  async registerPageScroll(event: PageScrollEvent) {
    return this.sendEvent('/page-scroll', event);
  }

  private async sendEvent(path: string, event: BaseEvent) {
    return fetch(`${ANALYTICS_URL}${path}`, {
      method: 'POST',
      body: JSON.stringify(event)
    });
  }
}
