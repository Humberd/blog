---
url: how-i-wrote-a-ps5-hunter-bot
title: How I wrote a PS5 hunter bot
description: <todo>
date: 2020-11-28
tags:
    - javascript
draft: true
-----------
**@edit 1**

\[2020.11.28] \[18:17 CET] - First deploy, no email received :(

# Introduction

I've never had a gaming console my entire life ([PSP](https://en.wikipedia.org/wiki/PlayStation_Portable) doesn't count). It looks like it's the best time to change it thanks to the recent release of PS5 and Xbox Series X. My eyes are primarly focused on the newest PlayStation due to its exclusive titles, such as: Spiderman, The Last of Us, Uncharted, etc.

However, I didn't preorder it, since it turned out to be a gamble. One shop delivered some preorders, but another said they will have them only in January. I don't want to have a consolless Christmas, so my plan was to grab it during the first day of sale. Unfortunately, I was not quick enough :(

Some online shops offer signing up for a newsletter that would hopefully notify me if there is restock. However, giving my mail to them is equal to receiving huge amount of spam, and the unsubscription doesn't necessarily mean they will delete my email. In the near future the sale will be entirely online.

{{< img src="res/media-expert-signup-form.png" alt="media expert newsletter signup form" >}}

Another way to get the console is through people who already bought them. But the prices... They are 2x more expensive (in the shop they cost 2200).

{{< img src="res/allegro-ps5-prices.png" alt="allegro ps5 prices listing" >}}

I was really pissed! There are so many people, who bought the console only to resell them right after for the higher price, while there are so many, who want to just enjoy playing the games. Capitalism, right?

# Goal

Fortunately, when I'm pissed I'm also very motivated. It would also be cool to combine it with a valuable skill called programming to achieve the goal:

> To buy a PS5 before Christmas

In order to help me with that I wrote a bot that scraps PS5 product pages of several polish online shops. After detecting that their availability changed it notifies me, so I can manually go to the shop and buy it.

It's only a change detection bot and not some auto buyer.

Here is a sneak peek of how it looks:

{{< img src="res/ps5-bot-demo.gif" alt="ps5 bot demo gif" >}}

# Research

The approach I took is basically to fetch the page every 5 minutes and check if there are strings indicating something changed. For example in one case I check for a literal text 'The product is temporarily available' while in another one I check for a characteristic class name.

I've targeted 7 online polish shops. After some research (clicking the site and inspecting network requests) I noticed some differences I need to take into consideration before staring to code.

1. **HTML vs JSON** - Some shops use a SSR (Server Side Rendering), so all the content is directly embedded into HTML file. However, some fetch the data using AJAX in JSON format.

2. **Inconsistent product pages** - Some shops don't event have a PS5 product page yet, so they use a fancy landing page, some have a product page, and one shop doesn't have either, so its only indication is that the search list is empty.

    In `Avans` we can only check if there is no PS5 on the list.
    {{< img src="res/avans-shop-example.png" alt="avans shop with no ps5 in the list" >}}

    In `MediaMarkt` we can only see a landing page.
    {{< img src="res/media-markt-shop-example.png" alt="media markt shop with ps5 landing page" >}}

# Site definitions

I've written the bot in Node.js using Typescript. The structure of the project looks like this:


{{< img src="res/project-structure.png" alt="project structure of a bot" >}}

Every shop has a dedicated class, which allows to adjust some quirks per shop. Each shop definition looks like this:

```typescript
// SITE WITH SSR
// Notice it extends from HTML
export class KomputronikDef extends HtmlSiteDef {
  protected getConfig(): SiteConfig {
    return {
      name: 'Komputronik',
      url: 'https://www.komputronik.pl/product/701046/sony-playstation-5.html',
    };
  }

  // Notice it receives a Document as a parameter
  protected hasUnexpectedChanges(document: Document): boolean {
    const phrase = 'Produkt tymczasowo niedostępny.';

    const xPathResult = document.evaluate(
      `//*[normalize-space() = '${phrase}']`,
      document,
      null,
      ORDERED_NODE_SNAPSHOT_TYPE,
      null
    );

    return xPathResult.snapshotLength === 0;
  }
}
```

Each site definition has 2 methods.
1. `getConfig()` - for a static data
2. `hasUnexpectedChanges(...)` - core of the functionality. Here we check for a specific values that would indicate that the product is still not available. Notice it receives a `Document` as a parameter, which is a parsed DOM tree, just like in a browser, so we can use some CSS selectors, or like in this case, XPATH to find a specific string.

There is also JSON type site definition that looks almost exactly the same, but instead of receiving a `Document` as a parameter it gets a JSON object.

```typescript
// SITE WITH AJAX REQUEST
// Notice it extends from JSON
export class NeonetDef extends JsonSiteDef<NeonetResponse> {
  protected getConfig(): SiteConfig {
    return {
      name: 'Neonet',
      url:
        'https://www.neonet.pl/graphql?query=query%20landingPageResolver($id:%20Int!)%20%7B%20landingPage:%20landingPageResolver(id:%20$id)%20%7B%20name%20custom_css%20teaser_alt%20teaser_file%20teaser_file_mobile%20show_teaser%20date_from%20clock_type%20modules%20%7B%20id%20position%20type%20parameters%20%7D%20is_outdated%20%7D%0A%7D%0A&variables=%7B%22id%22:1451%7D&v=2.54.0',
    };
  }

  // Notice it receives an object specified 
  // in the base class JsonSiteDef<NeonetResponse>
  protected hasUnexpectedChanges(json: NeonetResponse): boolean {
    return !this.hasProperTitle(json) || !this.hasThankYouModule(json);
  }

  private hasProperTitle(json: NeonetResponse): boolean {
    return json.data.landingPage.name === 'Premiera Konsoli Playstation 5';
  }

  private hasThankYouModule(json: NeonetResponse): boolean {
    const module = json.data.landingPage.modules[4];
    if (!module) {
      return false;
    }

    /**
     * Cannot check all the message, because from the backend we get them encoded
     */
    const lastPartOfMessage = 'w celu uzyskania dalszych aktualizacji.';

    return module.id === 7201 && module.parameters.includes(lastPartOfMessage);
  }
}
```

# Custom framework

If you noticed there are 2 base classes `HtmlSiteDef` and `JsonSiteDef` that both fetch the site and make either a DOM tree of a JSON object. Below is an example of `HtmlSiteDef`.

```typescript
// Notice it also extends from SiteDef
export abstract class HtmlSiteDef extends SiteDef {
  protected async _internalTriggerChanges(): Promise<void> {
    // we fetch a page
    const body = await this.getBodyFor(
      this.config.url,
      this.config.cookie,
      'html'
    );
    // we create a DOM tree
    const dom = new JSDOM(body);

    // we invoke an abstract method implemented by a child class
    const somethingChanged = this.hasUnexpectedChanges(dom.window.document);
    if (!somethingChanged) {
      this.logger.info(`Nothing changed...`);
    } else {
      this.logger.warn(`-----------------------------------`);
      this.logger.warn(`SOMETHING CHANGED!!!`);
      this.logger.warn(`-----------------------------------`);

      // we also send an email
      this.sendSuccessMail();
    }
  }
  
  // here we define a method to be implemented per site definition
  protected abstract hasUnexpectedChanges(document: Document): boolean;
}
```


There is also a base class for them all called `SiteDef`. It's basically responsible for fetching a page and sending a success email, or in case of some exception, such as blocking ip, invalid response stats, etc., sending an error email.

```typescript
export abstract class SiteDef {
  // the config from the child class
  protected config = this.getConfig();
  protected logger = getLogger(this.config.name);

  // more on sending a mail later
  protected mailSender = new MailSender();

  // flags for sending an email,
  // we want to send email only once, so that it's not treated as spam
  private alreadySentMail = false;
  private alreadySentErrorMail = false;

  // classes for children to implement
  protected abstract getConfig(): SiteConfig;
  protected abstract _internalTriggerChanges(): Promise<void>;

  // main method invoked every 5 minutes
  async triggerChanges(): Promise<void> {
    try {
      await this._internalTriggerChanges();

      this.alreadySentErrorMail = false;
    } catch (e) {
      this.logger.error(e);
      if (!this.alreadySentErrorMail) {
        this.alreadySentErrorMail = true;
        this.mailSender.sendError(this.config.name, e);
      }
    }
  }

  protected async getBodyFor(
    url: string,
    cookie: string,
    type: 'json' | 'html'
  ): Promise<string> {
    // we need to spoof the headers, so the request looks legitimate
    const response = await fetch(url, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:83.0) Gecko/20100101 Firefox/83.0',
        Accept: type === 'html' ? 'text/html' : 'application/json',
        'Accept-Language': 'en-GB,en;q=0.5',
        Referer: 'https://www.google.com/',
        Pragma: 'no-cache',
        'Cache-Control': 'no-cache',
        'Accept-Encoding': 'gzip, deflate, br',
        Cookie: cookie ?? null,
      },
    });

    return await response.text();
  }

  protected sendSuccessMail(): void {
    if (!this.alreadySentMail) {
      this.alreadySentMail = true;
      this.mailSender.send(this.config.name);
    }
  }
}
```

# Main loop

Inside `index.ts` we simply loop the sites lists every 5 minutes.

```typescript
// 5 minutes
const TIMEOUT = 5 * 60 * 1000;

// list of all the supported sites
const sites: SiteDef[] = [
  new MediaMarktDef(),
  new MediaExpertDef(),
  new NeonetDef(),
  new EuroDef(),
  new EmpikDef(),
  new AvansDef(),
  new KomputronikDef(),
];

function sleep(timer: number): Promise<void> {
  return new Promise<void>((resolve) => setTimeout(() => resolve(), timer));
}

// the main infinite loop
async function main() {
  while (true) {
    for (const site of sites) {
      await site.triggerChanges();
    }

    console.log('------------- SLEEPING -------------');
    await sleep(TIMEOUT);
  }
}

main();
```

# Sending an email

First I thought about writing a mobile app that would send me a custom notification, but the same functionality can be achieved simply by sending an email to my gmail account, which in turn would display a notification on my phone. Cool

For this purpose I used [sendgrid](https://sendgrid.com/) mainly because it has a free tier with 100 mails per day, which is 100x more than I need.

Integration was super easy. I took me less than 15 minutes to successfully send the first email.

### 1. Custom DNS entries

Sendgrid requires a custom domain to be verified by adding some DNS entries. Luckily I have mine in [Cloudflare](https://www.cloudflare.com/), so it was a piece of cake.

Here is what I had was presented by Sendgrid
{{< img src="res/sendgrid-dns-records.png" alt="sendgrid dns entries" >}}

Here is where I put the entries on Cloudflare
{{< img src="res/cloudflare-dns-records.png" alt="cloudflare dns entries" >}}

### 2. Downloading a Node library

They have a dedicated library, which can be installed with:

```
npm install --save @sendgrid/mail
```

Then on top of it I created a `MailSender` wrapper class you might have noticed in `SiteDef` class.

```typescript
// we set api key created in the sendgrid app
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

export class MailSender {
  send(siteName: string): void {
    const mailData: MailDataRequired = {
      to: process.env.TARGET_MAIL,
      from: process.env.SENDGRID_MAIL,
      subject: `[ps5-bot] ${siteName} has changed`,
      text: `${siteName} has changed`,
    };

    sgMail
      .send(mailData)
      .then(() => {
        logger.info('Mail sent');
      })
      .catch((error) => {
        logger.warn(error);
      });
  }

  sendError(siteName: string, error: Error): void {
    const mailData: MailDataRequired = {
      to: process.env.TARGET_MAIL,
      from: process.env.SENDGRID_MAIL,
      subject: `[ps5-bot] ERROR in ${siteName}`,
      text: `${error.stack}`,
    };

    sgMail
      .send(mailData)
      .then(() => {
        logger.info('Mail sent');
      })
      .catch((error) => {
        logger.warn(error);
      });
  }
}
```

It is very simple, it has only 2 methods, one for sending success mail and the other for sending an error. The error message also sends a stack trace of the exception, so that I know which part of code broke. Below is the error mail screen.

{{< img src="res/error-mail-screen.png" alt="error mail screen" >}}

You can also notice that the bot uses sensitive data, such as: `SENDGRID_API_KEY`, `SENDGRID_MAIL`, `TARGET_MAIL` using environment variables. Nothing is hardcoded.

# Deployment

I was thinking about setting a pipeline, that would build a Docker image, put it on DockerHub and then deploy it to Kubernetes cluster using Terraform on my RaspberryPi, however, it would be an overkill. I hope this bot would do its job during the next couple of weeks and be forgotten, so the pipeline doesn't need to be fancy.

This is why I decided to manually SSH into my RaspberryPI, pull the repository and then run the Docker image. All by hand.

First I created a `Dockerfile`

```dockerfile
FROM node:14.15-alpine as builder

WORKDIR /usr/app/ps5-bot
COPY ./package.json ./package-lock.json ./
RUN npm set progress=false
RUN npm ci
COPY . .
RUN npm run build

# -----------

FROM node:14.15-alpine

WORKDIR /usr/app/ps5-bot
COPY --from=builder /usr/app/ps5-bot/build build
COPY --from=builder /usr/app/ps5-bot/node_modules node_modules

ENTRYPOINT ["node", "./build/main/index.js"]
```

Then a `docker-compose.yml` which would allow me to quickly make it running.

```yml
version: '3'
services:
  ps5-bot:
    build:
      context: .
    restart: always
    env_file:
      - .env
```

To run it I used a Docker Compose CLI:

```
docker-compose up -d
```

Here is the final result:

{{< img src="res/ps5-bot-demo.gif" alt="ps5 bot demo gif" >}}

The repository:

{% github Humberd/ps5-bot no-readme %}

# Conclusion

Creation of this bot took me 7 hours:

* 5 hours of research and implementation
* 1 hour of configuration and integration with Sendgrid
* 1 hour of configuring a deployment

I am pretty happy of what I achieved. The bot crawls 7 pages every 5 minutes looking for changes and when it happens it emails me. It is currently deployed on my RaspberryPi running inside a Docker container.

Now I need to patiently wait for an email to come :)

See you again.
