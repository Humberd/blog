import { BaseEvent } from './base.event';

export interface PageScrollEvent extends BaseEvent{
  url: string;
  referrer: string;
  breakpoint: number
}
