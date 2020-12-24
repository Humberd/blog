import { PageViewEvent } from './events/page-view.event';

const ANALYTICS_URL = 'http://localhost:8080/xyz';

export class EventSender {
  async registerPageView(pageView: PageViewEvent) {
    return window.fetch(`${ANALYTICS_URL}/page-vew`, {
      method: 'POST',
      body: JSON.stringify(pageView)
    });
  }
}
