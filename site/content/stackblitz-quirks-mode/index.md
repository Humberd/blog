---
url: why-you-should-not-use-stackblitz-to-shopcase-your-app
title: Why you should NOT use StackBlitz to showcase your app
description: <todo>
date: 2020-11-05
tags:
    - css
    - html
----------

In the previous post I wrote about browser's "quirks mode", which makes sure a browser is able to correctly render very, very old pages just like the were meant to be rendered.

{% post https://dev.to/humberd/what-in-the-world-is-lt-doctype-html-gt-for-browser-s-quirks-mode-5e13 %}

"Quirks mode" seems to be a feature that covers old problem that you probably will never, ever encounter, right???

Now take a seat, because in the next 5 minutes you will have learned why StackBlitz is broken an why this is related to "quirks mode".

# StackBlitz's new static app

![Create new app from stackblitz](https://dev-to-uploads.s3.amazonaws.com/i/dy21rrrteeohscafvo7l.png)

When we are logged in and we want to create a new static app we are welcomed with this simple `index.html` code (the `<link>` element is originally commented out):

```html
<html>
  <head>
    <meta charset="UTF-8" />
    <script src="script.js"></script>
    <link rel="stylesheet" type="text/css" href="styles.css" />
  </head>

  <body>
    <h1>Hello there!</h1>
    <a href="/me.html">My other page</a>
  </body>
</html>

```

And here is how it is being rendered:

![stackblitz default static app render](https://dev-to-uploads.s3.amazonaws.com/i/fo6syqlpaojzviefbzbo.png)

The code looks fairly normal and simple, however, there is a one very important piece missing. Can you tell which one?

[Link](https://stackblitz.com/edit/stackblitz-default-quirks-mode) to StackBlitz project.

# "Quirks mode" rendering

By default StackBlitz creates an HTML document that tells the browser to render everything in "quirks mode". So even though you might write something according to the specification the browser would say:

> Sorry dude, in this mode I render everything just like Bob, the code rapist, implemented in his browser used by a small community of cow lovers 20 years ago.

But we already know a fix for this issue, right? Let's add `<!DOCTYPE html>` at the beginning of `index.html` to make sure browser renders everything in a predictable way:

```html
<!DOCTYPE html>
<html>
   ...
</html>
```

Now if we display a page we see:

![stackblitz has broken default project in strict mode](https://dev-to-uploads.s3.amazonaws.com/i/a7046kwvxxtz4upyac3j.png)

WHOA! Why is the page being rendered without a background?

[Link](https://stackblitz.com/edit/stackblitz-strict-mode-is-broken) to the broken (until they fix it) StackBlitz project.

# The broken stuff

If we take a look at the JavaScript console we can see the following error message:

![image of a message: "The stylesheet https://stackblitz-strict-mode-is-broken.stackblitz.io/styles.css was not loaded because its MIME type, "text/plain", is not "text/css"](https://dev-to-uploads.s3.amazonaws.com/i/7sejpkw7vg3lw2msqyqg.png)

So, it looks there was a problem with fetching CSS file from a server. Let's have a look at the Network tab.

![broken mime type network tab](https://dev-to-uploads.s3.amazonaws.com/i/tvj4bz8gxf7nm5airtd2.png)

The column we should look at is on the very right side named `Type`. It displays what the server told the browser that file was. For HTML file it said it was `html`, so the browser rendered it as an HTML document. For JavaScript file it said it was `js`, so the browser executed it.

However, for CSS file (the last row marked in red) the server said it was `plain`. Now the browser treats the file a regular text file and does nothing to it although we used it as a stylesheet. And this is why we have no background color in our app anymore.

## BUT WAIT A MOMENT

Why did our app have a background color before we had added `<!DOCTYPE html>`?

The answer can be found in quirks mode behaviours list https://developer.mozilla.org/en-US/docs/Mozilla/Mozilla_quirks_mode_behavior. One of the bullet points states that:

> Stylesheets linked in the document with an advisory MIME type of text/css will still be treated as CSS even if the server gives a Content-Type header other than text/css.

It means that in strict mode browser applies styles only from  files of type `text/css`. Other types are ignored. HOWEVER, in quirks mode browser doesn't care about a type and will treat js, exe or even xxx_horse_nudes.jpg files as stylesheets.

# How to fix?

StackBlitz need to add proper content type to response headers:

```
content-type: text/css
```

Otherwise we should not use Stackblitz for simple static projects, because rendering apps in quirks mode for us, developers, is very unpredictable. Alternatives apps are [CodePen](https://codepen.io/) or [jsFiddle](https://jsfiddle.net/).

**Note**: The projects for React and Angular are OK, because those frameworks use their own servers. Simple static projects are just files, so Stackblitz serves them with their dedicated server.

# Summary

During past 5 minutes we've learned that StackBlitz has a broken static files server that tells the browser that CSS files have a type `plain`. This results in styles being rejected by a browser. To mask this fact they set the rendering mode to quirks mode, so that browser doesn't care, but in turn renders all the content in an unpredictable way.

In the next article I don't know what I will write about. So until then.

See you around.
