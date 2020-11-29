---
url: angular-architecture-how-to-use-command-pattern-to-manage-large-amount-of-context-menu-actions
title: Angular Architecture - How to use Command Pattern to manage large amount of context menu actions
description: <todo>
date: 2020-11-08
series:
    - angular
tags:
    - angular
    - typescript
    - javascript
----------------

Design Patterns is a topic most programmers don't think they'll ever use, because it feels so abstract and complicated. In this article I'll show you a use case for a Command Pattern in extremely big web app written in Angular. Don't worry if you don't know Angular, the idea is what matters.

# The Problem

In [SDI Media](https://www.sdimedia.com/) where I currently work in we translate, dubbing and subtitle films and series both for small studios and giants like Netflix and Disney.

In the web app that supports this workflow we have about a hundred views both small and complex that operate on top of domain entities, such as: Job, Task, User, Facility, etc. It's easy to imagine that the views don't operate around only a single entity, but rather a mix of entities that are connected with each other. For example User profile displays not only User stuff, but also Facilities, which he works in, Jobs list, which he is assigned to, etc.

Each of the entity has some set of actions. For example our Job entity has about 20 actions (e.g. Start Job, Assign Job, Change Priority, etc.), which behave mostly similar across the app, but some views need specific treatment, for example: on one view we need to refresh only one table when action succeeds, but on the other view we need to close the dialog and refresh 3 tables.

Previously we stored all Job actions inside one dedicated service `JobActionsService`, which grew and grew as we added more and more logic solving some use cases. 500 lines turned into 1000 lines. 1000 lines turned into 1500. It contained so much spaghetti that I wouldn't need to cook for a week. One action was one method that could use other methods and all the methods had multiple configuration parameters which resulted in many if statements for different flows for different views.

We needed a pasta chef that would throw out the 1-star meal and cook some well-prepared rice that even [Uncle Roger](https://www.youtube.com/watch?v=53me-ICi_f8) would be proud of. ( ಠ◡ಠ )

# Example application

For this article I've prepared an application with 2 views: `Jobs Master List` and `User Jobs`. On both of these views we can change Job statuses and assign Jobs to Users. Here is how it looks:

![Alt Text](https://dev-to-uploads.s3.amazonaws.com/i/hb7p1ofqgojinod852h1.gif)

{% stackblitz command-pattern-for-angular view=preview %}

# Naive Approach #1 - duplication

Let's see how we can naively define context menu actions for these 2 views:

```typescript
// jobs.component.ts
const actionsForJobMasterList = [
  {
    name: 'Assign to User',
    icon: 'how_to_reg',
    isHidden: actor => !!actor.assignedUser,
    action: () => {/* Action */},
  },
  {
    name: 'Unassign from User',
    icon: 'voice_over_off',
    isHidden: actor => !actor.assignedUser,
    action: () => {/* Action */}
  },
  {
    name: 'Start',
    icon: 'play_arrow',
    isHidden: actor => actor.status !== JobStatusEnum.NEW,
    action: () => {/* Action */}
  },
  {
    name: 'Complete',
    icon: 'done',
    isHidden: actor => actor.status !== JobStatusEnum.IN_PROGRESS,
    action: () => {/* Action */}
  },
  {
    name: 'Restart',
    icon: 'repeat',
    isHidden: actor => actor.status !== JobStatusEnum.DONE,
    action: () => {/* Action */}
  },
];

// user.component.ts
const actionsForUserJobs = [
  // we cannot reassign User in this view
  {
    name: 'Start',
    icon: 'play_arrow',
    isHidden: actor => actor.status !== JobStatusEnum.NEW,
    action: () => {/* Action */}
  },
  {
    name: 'Complete',
    icon: 'done',
    isHidden: actor => actor.status !== JobStatusEnum.IN_PROGRESS,
    action: () => {/* Action */}
  },
  {
    name: 'Restart',
    icon: 'repeat',
    isHidden: actor => actor.status !== JobStatusEnum.DONE,
    action: () => {/* Action */}
  },
];
```

We can see that for the Jobs list view we have 5 actions, whereas for User Jobs we have only 3. Moreover, we repeat all properties. Most of them are static throughout the views.

## More naive approach #2 - generator function

To not duplicate the code we could make some generator method that would return all the actions for a specific view, for example:

```typescript
function getActionsForView(viewType: 'jobsMasterList' | 'userJobs', usersListTable: UsersListTable) {
  const actionsForJobMasterList = [
    viewType === 'jobsMasterList' ? {
      name: 'Assign to User',
      action: () => {/* Action */},
      ...
    } : null,
    viewType === 'jobsMasterList' ? {
      name: 'Unassign from User',
      action: () => {/* Action */},
      ...
    } : null,
    {
      name: 'Start',
      action: () => {
         if (viewType === 'userJobs') {
            sendNotification();
         } else {
            usersListTable.reloadTable();
         }
      }, 
      ...
    },
    {
      name: 'Complete',
      action: () => {/* Action */},
      ...
    },
    {
      name: 'Restart',
      action: () => {/* Action */},
      ...
    }
  ].filter(Boolean);
}
```

In this approach we are not duplicating anything, but now we have a bigger problem, this is a does-it-all function. We have some nasty if statements that return specific actions for a specific views. In 'Start' action we react to differently between views. What if we have 3 views? Or 5 views? What if some objects are only context-specific? For example users view is using a dedicated service `UsersListTable` that is used only by itself and nowhere else in the app. Now we need to pass it from every view that wants to use this generator. This is unacceptable. The logic would kill all the enthusiasm in developers and make them start to think about throwing it all and going to Hawaii.

We need a better solution that would:
1. get rid of all the if statements
2. respect context-related objects, such as `UsersListTable`

# Solution proposal - simple draft

Before we start implementing a solution I recommend to always draft the way we want to use it. This is how I imagine our solution will look like:

```typescript
// jobs.component.ts
const actionsForJobMasterList = [
  ...,
  JobStartAction.build({
    isHidden: actor => actor.status !== JobStatusEnum.NEW,
    onSuccess: () => sendNotification()
  })
  JobCompleteAction.build({
    ...
  })
];

// user.component.ts
const actionsForUserJobs = [
  ...
  JobStartAction.build({
    isHidden: actor => actor.status !== JobStatusEnum.NEW,
    onSuccess: () => usersListTable.reloadTable()
  }),
  JobCompleteAction.build({
    ...
  })
];
```

Nice, we solved some issues:
1. ✔ No ifs anywhere. Nice.
2. ✔ `usersListTable` is not passed around globally. Nice x2.
3. ✔ Action definitions are defined inside `JobStartAction` and `JobCompleteAction` classes. We just make them spit out context menu object. Nice x3.

> There is also repeated `isHidden` property, but I will leave it until the end.

However, There is one more issue. We need our action classes to be as generic as possible. That means they cannot use the whole entity model like `JobModel`, because some views might use other models like `UserJobModel`, `MinimalJobModel`, `CachedJobModel`, etc. If `JobStartAction` consumes them all we would have more ifs than we previously had. We need another iteration on that.

```typescript
// jobs.component.ts
const actionsForJobMasterList = [
  ...,
  JobStartAction.build({
    resolveParams: actor => ({ jobId: actor.id, userId: actor.assignedUser.id }),
    isHidden: actor => actor.status !== JobStatusEnum.NEW,
    onSuccess: () => sendNotification()
  })
];

// user.component.ts
const actionsForUserJobs = [
  ...
  JobStartAction.build({
    resolveParams: actor => ({ jobId: actor.id, userId: currentUser.id }),
    isHidden: actor => actor.status !== JobStatusEnum.NEW,
    onSuccess: () => usersListTable.reloadTable()
  }),
];
```

We have added `resolveParams` method that provides all the necessary parameters to our action. In jobs list `userId` is taken from entity itself, but on user jobs list it is taken from user in the current scope.

This solves all our pains, so now we can start implementing our solution.

# Command Pattern for the rescue

A very helpful pattern we might use is Command pattern. Basically the main idea is:

### Each action is represented by a separate class

Inside the project I've created a separate directory called `action-definitions`:

![project structure for action definitions](https://dev-to-uploads.s3.amazonaws.com/i/918rsk3jtjhjtu43pyml.png)

For 5 actions we have 5 directories. Each directory contains 2 files:
1. **Action definition** - specifies how context menu looks like and what it does. Since the action can be used throughout the entire app it cannot reference local services and all data must be provided via `Params`. This is why it is `providedIn: 'root'`.


```typescript
@Injectable({
  providedIn: 'root',
})
export class JobRestartAction extends ActionDefinition<JobRestartActionParams> {
  // Thanks to Angular's dependency injection the action can use any global service.
  constructor(
    private jobsService: JobsService,
    private snackBar: MatSnackBar,
  ) {
    super();
  }

  // in this action we send request with status change
  // and display a notification with a success message
  invoke(params: JobRestartActionParams): any | Observable<any> {
    return this.jobsService.setStatus(params.jobId, JobStatusEnum.NEW)
      .pipe(
        tap(() => this.snackBar.open(`Job restarted successfully.`))
      );
  }

  // we return how the menu looks like
  protected getMenu(): ActionDefinitionContextMenu {
    return {
      name: 'Restart',
      icon: 'repeat',
    };
  }
}
```

2. **Action definition params** - interface which tells what data it consumes. We provide them inside `resolveParams` field during context menu building. We must use the least specific data, so that the action is reusable probably everywhere.

```typescript
export interface JobRestartActionParams {
  jobId: string;
}
```

### Each action implements Command Pattern

Every action extends `ActionDefinition` base class. It looks like this:

```typescript
export abstract class ActionDefinition<Params> {

  // it simply transforms action class into context menu object
  // that is consumed by a context menu component.
  build<Actor>(config: BuildConfig<Actor, Params>): ContextMenuActionModel<Actor> {
    const menu = this.getMenu();

    return {
      name: menu.name,
      icon: menu.icon,
      isHidden: actor => config.isHidden?.(actor),
      action: actor => {
        // Here we get parameters provided while building 
        // context menu actions list in specific views
        const params = config.resolveParams(actor);

        // now we invoke action with provided parameters
        const result = this.invoke(params);

        // for a conveninece action can return either raw value or an Observable,
        // so that actions can make requests or do other async stuff
        if (isObservable(result)) {
          result
            .pipe(take(1))
            .subscribe(() => config.onSuccess?.());
        } else {
          config.onSuccess?.();
        }
      },
    };
  }

  // methods required to be implemented by every action
  abstract invoke(params: Params): void | Observable<void>;
  protected abstract getMenu(): ActionDefinitionContextMenu;
}

//build-config.ts
export interface BuildConfig<Actor, Params> {
  resolveParams: (actor: Actor) => Params;
  isHidden?: (actor: Actor) => boolean;
  onSuccess?: () => void;
}
```

So now having all actions defined as separate classes we can build our context menus:

```typescript
// jobs.component.ts
const actionsForJobMasterList = [
  this.injector.get(JobAssignAction).build({
    resolveParams: actor => ({jobId: actor.id}),
    isHidden: actor => !!actor.assignedUser,
    onSuccess: () => this.jobsService.reloadData()
  }),
  this.injector.get(JobUnassignAction).build({
    resolveParams: actor => ({jobId: actor.id, currentUserName: actor.assignedUser.name}),
    isHidden: actor => !actor.assignedUser
  }),
  this.injector.get(JobStartAction).build({
    resolveParams: actor => ({jobId: actor.id}),
    isHidden: actor => actor.status !== JobStatusEnum.NEW
  }),
  this.injector.get(JobCompleteAction).build({
    resolveParams: actor => ({jobId: actor.id}),
    isHidden: actor => actor.status !== JobStatusEnum.IN_PROGRESS
  }),
  this.injector.get(JobRestartAction).build({
    resolveParams: actor => ({jobId: actor.id}),
    isHidden: actor => actor.status !== JobStatusEnum.DONE
  })
];

// user.component.ts
const actionsForUserJobs = [
  this.injector.get(JobStartAction).build({
    resolveParams: actor => ({jobId: actor.id}),
    isHidden: actor => actor.status !== JobStatusEnum.NEW
  }),
  this.injector.get(JobCompleteAction).build({
    resolveParams: actor => ({jobId: actor.id}),
    isHidden: actor => actor.status !== JobStatusEnum.IN_PROGRESS
  }),
  this.injector.get(JobRestartAction).build({
    resolveParams: actor => ({jobId: actor.id}),
    isHidden: actor => actor.status !== JobStatusEnum.DONE
  })
];
```

Key takeaways:
1. Instead of `JobStartAction.build()` we have to inject services via `this.injector.get(JobStartAction)`, because our action definitions are in fact global services.
2. Inside a view we have access to the context, but inside the action we don't.
3. We can even use the action in standalone mode (without context menu): `this.injector.get(JobRestartAction).invoke({...params})`.
4. Everything is statically typed thanks to the magic of TypeScript generic types.
5. All the logic is hidden inside action classes. Some of them can be really complex:

```typescript
// JobUnassignAction
// Displays 2 confirmation dialogs one after another
// and then displays confirmation notification
invoke(params: JobUnassignActionParams): any | Observable<any> {
  return this.confirmationDialogService
    .open({
      title: `Unassign ${params.currentUserName}?`,
      content: `You are going to unassign ${params.currentUserName} from this Job, are you completely sure?`,
    })
    .pipe(
      filter(Boolean),
      switchMap(() => this.confirmationDialogService.open({
        title: 'Are you 100% sure?',
        content: 'There is no way back!',
        cancelButtonText: 'Take me back',
        confirmButtonText: 'YES!'
      })),
      filter(Boolean),
      switchMap(() => this.jobsService.setUser(params.jobId, undefined)),
      tap(() => this.snackBar.open('User unassigned successfully'))
    );
}
```

![unassign action flow](https://dev-to-uploads.s3.amazonaws.com/i/xwgrw4nfgwbojbk81lzs.gif)

6. `isHidden` property is being repeated multiple times throughout the views, but the subject of controlling a visibility is up to the view. I call it a necessary repetition.


# Summary

In this article we've created a simple  abstraction layer for defining actions for context menus. Thanks to it, we utilize Command Pattern that helps us separate logic for all the action while maintaining a connection with context of views that use them. Everything is also statically typed thanks to Params interfaces defined per each action. Modifying action is no longer painful. Adding more actions is as simple as creating a new class without touching anything else.

At the beginning we've also made a simple draft of the way we want the solution to work, so that we caught the potential problem early. I highly recommend this approach to everyone!

If you have any suggestions make sure to write it down in a comment.

The full source code can be found on github:
{% github Humberd/command-pattern-in-angular no-readme %}

Application demo:
{% stackblitz command-pattern-for-angular view=preview %}

In the next article I'll write something about Angular as well.

See you around.

