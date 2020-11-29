---
url: why-does-my-element-not-align-properly-the-box-sizing-problem
title: Why does my element not align properly? The box-sizing problem
description: An explanation of what a box-sizing CSS property is and why the html layout sometimes break
date: 2020-11-01
tags:
    - css
    - html
----------


I have a code snippet element that I want to stretch to 100% of its parent. Easy peasy. Here's the code:

```html
<div class="container">
  <div class="box">
    Code snippet
  </div>
</div>
```

```css
.container {
  width: 400px;
  border: 5px solid black;
  margin: 10px;
}

.box {
  background-color: #407AA4;
  border: 3px solid red;
  line-height: 100px;
  color: #fff;
  text-align: center;

  width: 100%;
  padding: 0 10px;
}
```

![Rendered element with overflowed content](https://dev-to-uploads.s3.amazonaws.com/i/ctszcaffovsidbdr9b3o.png)

Wait! Why does it overflow like that? When we inspect the element we can see that its width is 426px meanwhile its parent is 400px. What is going on?

![Rendered element with overflowed content and displayed size](https://dev-to-uploads.s3.amazonaws.com/i/m89zepsj5bvq29zuh0f2.png)

This, my friend, is a CSS `box-sizing` problem. But before we fix it we need to understand why it happens. In order to do that first we need to make friends with CSS Box Model.

# Box model

[CSS Box Model](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_Box_Model/Introduction_to_the_CSS_box_model) is a way the browser represents **each and every** HTML element in the DOM Tree.

![HTML element Box Model](https://dev-to-uploads.s3.amazonaws.com/i/g9cdibj1zh94woabg6p9.png)

It consists of 4 layers, where the previous one is surrounded with the following one, just like the onion:
* content (blue) - changed by: `font-size`, `line-height`, `height`, etc.
* padding (green) - changed by: `padding`, `padding-left`, `padding-top`, etc.
* border (orange) - changed by: `border-width`
* margin (brown) - changed by: `margin`, `margin-left`, `margin-top`, etc.

## How can I see the Box Model of a given element?

Fortunately, every major browser has a way to visually represent the model in their DevTools, which we can open in a couple of steps:

1. Hit `Ctrl + Shift + C` when in browser and click on the element of choice.
2. Inside opened DevTools in the `Elements` tab click `Computed` tab.
3. Bam. That's all.
4. You can repeat from step 1 to pick a new element or just click the tag in the `Elements` tab DOM Tree.

{% details Gif %}
![Alt Text](https://dev-to-uploads.s3.amazonaws.com/i/x3jsiwviuads0p2ai213.gif)
{% enddetails %}

# The `box-sizing` problem

Now that we know the basics we can say hi to the CSS [box-sizing](https://developer.mozilla.org/en-US/docs/Web/CSS/box-sizing) property. It can have one of 2 values:
* content-box (default)
* border-box

## `content-box`

When we tell the browser that we want an element to have 100% width, like in our case, the browser:
1. Gets the width of the parent, in our case 400px.
2. Sets the elements **content** width to 400px.
3. Adds 20px of padding (to left and right). Now width is 420px.
4. Adds 6px of border (to left and right). Now width is 426px.
5. Puts the element inside the parent.

Our calculation matches the width measured empirically.

How can we fix it?

## `border-box`

The solution is to set the `box-sizing: border-box` to the `.box` element.

![Element with applied border-box value](https://dev-to-uploads.s3.amazonaws.com/i/lmzfat5akjyg3erxtuxq.png)

The browser now:
1. Gets the width of the parent, in our case 400px.
2. Sets the elements **content** width to 400px.
3. **Subtracts** 20px of padding (to left and right). Now width is 380px.
4. **Subtracts** 6px of border (to left and right). Now width is 374px.
5. Puts the element inside the parent.

The steps remained almost the same, but in steps 3 and 4 instead of adding padding and border the browser now subtracts them.


If we take a look at the elements Box Model now we can see that the calculations checkout.

![Box Model of the element with applied border-box property](https://dev-to-uploads.s3.amazonaws.com/i/ydw5rbxkz8zo0tpz89o3.png)

![Measured Element with applied border-box value](https://dev-to-uploads.s3.amazonaws.com/i/v2fkxfn0jofy2ghc05t8.png)


# How to avoid this kind of problems in the future?

The very first thing I do at the beginning of every project is I add this piece of CSS code:

```css
* {
    box-sizing: border-box;
}
```

This selector applies `border-box` value to every element in the DOM Tree, so that we don't have to worry this specific case anymore.

But be careful when you do this in your existing codebase, because all the layouts had been adjusted to the `content-box` calculations and there is a high chance that something might break.

# Conclusion

In this article we've made friends with CSS Box Model and `box-sizing` property. We now know how the browser performs calculations regarding `content-box` and `border-box` properties. We've also learned what to do at the start of every project.

The full example can be explored [here](https://stackblitz.com/edit/the-box-size-problem).

{% stackblitz the-box-size-problem view=preview %}

In the next articles we will get to know the lonely wanderer called `quirk modes` and flirt with rendering layers concept.

See you around.





