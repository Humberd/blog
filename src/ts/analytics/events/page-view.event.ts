import { BaseEvent } from './base.event';

export interface PageViewEvent extends BaseEvent{
  url: string;
  referrer: string;
}
