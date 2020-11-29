---
url: what-in-the-world-is-doctype-html-for-browsers-quirks-mode
title: What in the world is <!DOCTYPE html> for? Browser's "Quirks mode"
description: <todo>
date: 2020-11-04
tags:
    - css
    - html
----------


You've probably encountered an HTML code that looks like this:

```html
<!DOCTYPE html>
<html>
<head>...</head>
<body>...</body>
</html>
```

and also some that look like this:

```html
<html>
<head>...</head>
<body>...</body>
</html>
```

Notice the difference? The `<!DOCTYPE html>` is missing in the second one. However, they both render correctly... OR DO THEY?

In the next 5 minutes you will have learned:
1. What's the difference?
2. And why it's wise to ALWAYS include `<!DOCTYPE html>` at the beginning of every HTML you'll ever write.

But first, we need to go back in time, to year 1999.

# Web Specification or rather it's lack

In 1999, when many of us ate sand while playing with friends in a sandpit and didn't even know what a computer is, the browsers usage had been growing and growing. It's the time when Internet Explorer 5 was released as a major step forward. For the first time it implemented full CSS 1 specification. But before we go any further we need to know what a specification is?

It's a strictly defined set of rules what the browser should do when trying to render an HTML document. For example it says that if the browser encounters `padding: 10px` it should add padding to all of the edges of the element (top, right, bottom and left) and when it encounters `padding: 10px 15px` it should add 10px to vertical edges (top, bottom) and 15px to horizontal edges (right, left). The whole modern CSS specification is enormous and covers all the edge cases and can be found [here](https://www.w3.org/TR/css-2018/).

Now back to the topic. Internet Explorer 5 was introduced in 1999, but before that people used other browser such as Netscape Navigator (1994), Mosaic (1993) or even older versions of Internet Explorer. Those browsers didn't full support any specification, because either there wasn't any at that time or the web pages were not that complicated and "good enough" was their motto.

The browsers simply agreed what `background-color: #fff` or `display:block` were. However, with edge cases they were not so unanimous and decided to do what they though was right, so one HTML document could have looked differently between 2 browsers.

This was a huge problem when some people moved to more modern browsers that fully complied with a specification, but some stayed with the old ones. It meant that some web pages could have broken layout on modern browsers and some could be broken on the older ones.

# Quirks mode

The people behind specifications (W3C) didn't want to break the web and decided that all the weird stuff the old browsers implemented will also be included in the new official specifications under special rendering mode called "quirks mode". Some of the quirks are:

> In quirks mode CSS class and id names are case insensitive. In standards mode they are case sensitive.  (This also applies to getElementsByClassName.)

> The :hover and :active pseudo-classes will only be applied to links, and only if there is no other pseudo-class in the selector. To match other elements, the selector must include a tag name, id, class or attribute.

All the quirks can be found [here](https://developer.mozilla.org/en-US/docs/Mozilla/Mozilla_quirks_mode_behavior).

# `<!DOCTYPE html>`

To maintain backwards compatibility they needed to tell when to enable "quirks mode" and when to stick to the official spec. They decided that:

> If at the beginning of the HTML document there is `<!DOCTYPE html>` we apply official specification.
> If there is no doctype we render the page in quirks mode.

So the answer to the question why should we use `<!DOCTYPE html>` is
so that we make sure the rendering of a web page sticks to the specification the developers built it for.

# Summary

There was way more history than the actual explanation, but now you understand what's the difference. If you create a new HTML document make sure you include the `<!DOCTYPE html>` at the top.

**Note**: Be aware that if your HTML document was rendered in quirks mode and now you make it stick to the specification - some layouts will probably break a little.

In the next article we'll explore browser rendering pipelines, by knowing which you could make your web page render smoothly and score some additional points in job interviews. :)

See you around


