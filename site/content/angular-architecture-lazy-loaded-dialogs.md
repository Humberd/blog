---
title: Angular Architecture - Lazy loaded dialogs
description: How to efficiently lazy load a large amount of dialogs and how to structure an application around them
date: 2020-11-12
series: ["angular"]
-------------------

In the previous article I wrote about storing context menu action definitions in a scalable way using a Command Pattern (no more 1000 lines `ActionService` 🎉). In the showcase application I used dialogs that were loaded eagerly, which means all the dialog modules are being downloaded to the browser at once despite displaying only some of them most of the time. Let's fix it!

**After this article ends you will have known how to easily manage dozens of dialogs that are scalable and independent of each other and the rest of the app.**

A gif from the showcase application presenting dialogs sequencing:
![unassign action flow](https://dev-to-uploads.s3.amazonaws.com/i/xwgrw4nfgwbojbk81lzs.gif)

Link to the article:
{% link humberd/context-menu-actions-at-scale-command-pattern-in-a-real-life-scenario-9o0 %}

# The Problem

Currently, the dialogs structure looks like this:

![current dialogs structure in the project](https://dev-to-uploads.s3.amazonaws.com/i/krwd3ai42q5ushzw2g6c.png)

Each dialog:
1. Has a module,
2. Has a component,
3. Has a data input model structure.

So far so good. We show a dialog using Angular Material's `MatDialog` Service:

```typescript
constructor(private matDialog: MatDialog) {
   const dialogData: JobUserAssignDialogDataModel = {
         jobId: params.jobId,
   };

   this.matDialog
       .open(JobUserAssignDialogComponent, {data: dialogData})
}
```

Unfortunately, we have 2 problems with this approach:

### 1. All dialogs are bundled with AppModule
In order for Angular to instantiate the `JobUserAssignDialogComponent` it needs to be declared somewhere and since it was declared in the `JobUserAssignDialogModule` we also need to import it in the `AppModule`:

```typescript
@NgModule({
  declarations: [
    AppComponent
  ],
  imports: [
    ...,
    JobUserAssignDialogModule,
    ConfirmationDialogModule
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
```

Now all the dialogs are bundled with `main.js` file, which results in downloading them all even if a user is on the page that doesn't use any of them at all!

### 2. No static type enforcement for dialog data

In the expression `.open(JobUserAssignDialogComponent, {data: dialogData})` the `data` field has type of `any` until we manually specify given type. This is very error prone, because it's extremely easy to mistype something or just not type something at all.

We need a method, which automatically matches dialog data interface with the dialog.

# The Solution

Just like in Action Definition's case from the previous article it would be wise to have a Dialog Service per each dialog module, so that we won't end up with one gigantic service.

First let's create a base class for a Dialog Service:

```typescript
@Directive()
// tslint:disable-next-line:directive-class-suffix
export abstract class AsyncDialog<ComponentType, DataType, ReturnType = unknown> {
  constructor(protected matDialog: MatDialog) {
  }

  abstract async open(data: DataType): Promise<MatDialogRef<ComponentType, ReturnType>>;
}
```

This class is mostly for typing consistency.

The `AsyncDialog` class consumes 3 generic parameters:
1. ComponentType - a dialog class.
2. DataType - a structure a dialog receives from its opener.
3. ReturnType - a structure a dialog returns to its opener.

We also have to annotate it with `@Directive()`, because since version 10 Angular removes all types from constructor parameters of a class without a decorator and we need to inject `MatDialog`.

There is also 1 abstract method:
1. `open()` - template for opening a dialog

After creating a base class we can create a `JobUserAssignDialogService`:

```typescript
@Injectable({providedIn: 'root'})
export class JobUserAssignDialogService extends AsyncDialog<JobUserAssignDialogComponent, JobUserAssignDialogDataModel, UserModel> {

  async open(data: JobUserAssignDialogDataModel): Promise<MatDialogRef<JobUserAssignDialogComponent, UserModel>> {
    // the magical part of importing a module asynchronously
    await import('../job-user-assign-dialog.module');

    return this.matDialog.open(JobUserAssignDialogComponent, {data});
  }
}
```

The `JobUserAssignDialogService` inherits from `AsyncDialog` base class created before. In the 3 generic parameters we specify what component this service is responsible for, what it consumes and what it returns.

The magical part is `await import('...')`. This tells angular to fetch the module file if it has not yet been downloaded. Then after that we just open the dialog like we did before.

**Note**: We use `async` keyword, because asynchronous importing returns promise and we need to wait with opening the dialog until the operation completes.

The example below shows that a module file is fetched only when we click the action.
![opening async dialog fetches its module file](https://dev-to-uploads.s3.amazonaws.com/i/cdgfl6as50wcy3emr27a.gif)


# Unexpected problem

The gif shows that the dialog module is being fetched asynchronously, however, if we run `ng build` and take a closer look at the source code of the `JobListViewComponent` we can find `JobUserAssignDialogComponent` bundled with the app instead of on the lazy loded module.

![potentially lazy loaded dialog is being bundled with the view](https://dev-to-uploads.s3.amazonaws.com/i/kzwd1y6qkyf9uvc34kzm.png)

WAIT WHAT?

Shouldn't the dialog component be lazy loaded? We have just downloaded the module lazily! What is going on!

...

It turns out the line responsible for this behaviour is the one which opens the dialog. But why?

```typescript
@Injectable({providedIn: 'root'})
export class JobUserAssignDialogService extends AsyncDialog<...> {

  async open(data: JobUserAssignDialogDataModel): Promise<...> {
    await import('../job-user-assign-dialog.module');

    // THIS IS THE CULPRIT!
    return this.matDialog.open(JobUserAssignDialogComponent, {data});
  }
}
```

### Dependency graph

If we analyze the import chaining (what imports what), we can draw the following graph:

![dialog dependency graph](https://dev-to-uploads.s3.amazonaws.com/i/b25o2akiikiletwan0xo.png)

From view Jobs view, where we invoke the action, to the dialog there are 3 imports along the way:

1. `JobsComponent` injects `JobAssignAction` and uses the type **as value** (Angular preserves a type of constructor params, so that it knows what to inject).
2. `JobAssignAction` injects `JobUserAssignDialogService` and uses the type **as value**.
3. `JobUserAssignDialogService` opens the `JobUserAssignDialogComponent` and uses its type **as value**.

So in order for `JobsComponent` to be run by Angular it needs to have a dependency of `JobUserAssignDialogComponent`, because all along the way it was used as a value!!!

So how can we fix it?

### Using as value vs type

First we need to understand some differences between value and a type:

#### As a value

In the example below we use a class as a value, which means it is still there after compiling to JavaScript.

```typescript
// typescript
const componentClass = JobUserAssignDialogComponent;

// javascript
const componentClass = JobUserAssignDialogComponent;
```

#### As a type

In the example below we use a class as a type, which means it is completely removed from JavaScript with all of its imports.

```typescript
// typescript
const component: JobUserAssignDialogComponent = {};

// javascript
const component = {};
```


# Lazy loading a component

Now we somehow need to use `JobUserAssignDialogComponent` as a value, but without importing it as a value. We can ask the module that we lazily imported for some help!

```typescript
@NgModule({
  declarations: [JobUserAssignDialogComponent],
  imports: [...],
})
export class JobUserAssignDialogModule {
  static getComponent(): typeof JobUserAssignDialogComponent {
    return JobUserAssignDialogComponent;
  }
}
```

It's now the module's responsibility to import the component **as a value**, by having a static method called `getComponent()`, and returning it to us.

After that we can adjust the dialog service.

```typescript
@Injectable({providedIn: 'root'})
export class JobUserAssignDialogService extends AsyncDialog<JobUserAssignDialogComponent,...> {

  async open(data: JobUserAssignDialogDataModel): Promise<MatDialogRef<...> {
    const importedModuleFile = await import('../job-user-assign-dialog.module');

    // the `importedModuleFile` has all the imports of the file
    // and since one of them is `JobUserAssignDialogModule`
    // we can use it to invoke previously defined `getComponent()` method
    return this.matDialog.open(
      importedModuleFile.JobUserAssignDialogModule.getComponent(),
      {data},
    );
  }
}
```

Et voilà! The dialog component is now bundled with the module, which is being loaded lazily.

What about component class used as a generic parameter `AsyncDialog<JobUserAssignDialogComponent,...>`? Fortunately, it is used **as a type** so it is completely removed in the compilation phase.

# Final project structure

The scructure now looks like this:
![async dialog project structure](https://dev-to-uploads.s3.amazonaws.com/i/e86ytej1cf1cgk3id9fs.png)

Each dialog:
1. Has a dedicated module,
2. Has a dedicated component,
3. Has a dedicated data input structure,
4. Has a dedicated async service.

If we now add 50 more dialogs to our app and use them all in one view none of them would come immediately. It is handy in case some of them uses 2MB library that plays a violin while mining bitcoins at the same time. The view would be slim and light until we trigger the right action which in result would download it all.

> Don't forget to remove Dialog Module imports from your `AppModule`

The GitHub repo can be found below as well as a StackBlitz demo:

{% github Humberd/lazy-loaded-dialogs-in-angular no-readme %}

{{< stackblitz lazy-loaded-dialogs-in-angular  >}}


# Conclusion

During the last 5 minutes we've learned why loading all dialogs at once is not optimal. We discovered the problem why dialogs are bundled with `main.js` file. We've also understood the difference between using a class as a value and using it as a type. At the very end we implemented a solution for all dialogs to by asynchronous by lazy loading their module classes and using them as a proxy to get a component class reference, so that Angular can instantiate it.

I hope you are impressed as much as I was when I discovered it was possible :)

In the next article I will write something about Angular. Probably.

See you around.







