// JS Goes here - ES6 supported

import "./css/main.scss";
import { EventSender } from './ts/analytics/event-sender';

// Say hello
console.log("🦊 Hello! Edit me in src/index.js !!!");

const eventSender = new EventSender();

eventSender.registerPageView({});
