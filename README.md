# acelga-bus
An extensible typescript message bus with support for middlewares & eventstore (for event sourcing or similar patterns).

[![codecov](https://codecov.io/gh/DavidBM/acelga-bus/branch/master/graph/badge.svg)](https://codecov.io/gh/DavidBM/acelga-bus) [![Maintainability](https://api.codeclimate.com/v1/badges/7fc4998d666a07395802/maintainability)](https://codeclimate.com/github/DavidBM/acelga-bus/maintainability)

<img src="img/acelga.png">

This bus enforces you to use the types and interfaces you define, avoiding errors and problems in your code. 

<!-- MarkdownTOC autolink="true" autoanchor="true" -->

- [Simple example](#simple-example)
- [Eventstore](#eventstore)
- [Structure of the Bus](#structure-of-the-bus)

<!-- /MarkdownTOC -->

**It filter by types instead of strings.** That means that you have compile time protection against misspellings. But it means that you need to encapsulate everything withing a class. 

Moreover, *it is not safe to publish primitives like numbers, null or strings* because their falsifiability property (0, NaN, "", null, undefined are false). Always send an object / class.

<a id="simple-example"></a>
## Simple example

```typescript
/* DEFINITIONS */
// This interface must be implemented by all events
interface IMyEvent {
    date: Date;
}

/* EVENTS IMPLEMENTATIONS */
// This events implements the interface of the bus
class UserCreated implements IMyEvent {
    date = new Date();
    name: string;

    constructor(name: string) {
        this.name = name;
    }

    getName() {
        return this.name;
    }
}

/* HANDLER DEFINITIONS */

import {Bus} from 'acelga-bus';
// We set the correct type in the bus instance
const bus = new Bus<IMyEvent>();

bus.on(UserCreated, (user) => {
    // It will autocomplete the getName, regardless that it is not in the interface
    console.log('user created: ', user.getName());
});
// The bus returns a promise that tells you if the event was published successfully
await bus.publish(new UserCreated('Matias'));

/* LETS CREATE ANOTHER CLASS THAT DOESN'T IMPLEMENT THE INTERFACE */
class NotAnEvent {}
/* TYPESCRIPT ERROR: typeof NotAnEvent is not assignable to Constructable<IMyEvent>*/
bus.on(NotAnEvent, (notEvent) => {});
```

<a id="eventstore"></a>
## Eventstore

The bus implements a connector with [Eventstore](https://eventstore.org/) [persistent subscriptions/competing consumers](https://eventstore.org/docs/http-api/competing-consumers/index.html). It handles automatically:

 - Bulk processing of events
 - Ordering of depending events (it requires a implementation from the user)
 - Handling errors and ACK or NACK them
 - Avoid most bad pattern like:
     + Multi subscription of the events (usually in event-store you want to process one time per bounded context)
     + Non returning promises in handlers (the bus needs to know when you finished and if the operation was a success or not in order to ack or nack)

The connector works very similar to the base bus, but it requires some extra configuration, lets see the previous example with the connected Bus:

```typescript
/* DEFINITIONS */
import {IEventstoreEvent} from 'acelga-bus';
// **NEW** Your interface must implement the IEventstoreEvent interface
interface IMyEvent extends IEventstoreEvent {
    date: Date;
}

/* EVENTS IMPLEMENTATIONS */
import {Bus, IEventFactory, IDecodedSerializedEventstoreEvent} from 'acelga-bus';

class UserCreated implements IMyEvent {
    date = new Date();
    name: string;
    aggregate: 'user';// **NEW** The same as the stream
    ...
}
// **NEW** This is the factory that will be executed when the event is retrieved by Eventstore
class UserCreatedFactory implements IEventFactory<IMyEvent> {
    build(event: IDecodedSerializedEventstoreEvent) {
        // Never trust what comes from eventstore. Acelga-bus guarantees some attributes, but not the data content
        if (!event.data || event.data.name) throw new Error('Event without name');

        return new UserCreated(event.data.name);
    }
}

/* HANDLER DEFINITIONS */

import {Bus} from 'acelga-bus';
// We set the correct type in the bus factory **NEW** for this use the factory function
const bus = createEventstoreBus<IMyEvent>(/*connectionOptions, subscriptions*/);

// **NEW** You need to specify the correct factories for each event
bus.addEventType(UserCreated, new UserCreatedFactory());


bus.on(UserCreated, (user) => {
    console.log('user created: ', user.getName());
});

await bus.publish(new UserCreated('Matias'));
```

<a id="structure-of-the-bus"></a>
## Structure of the Bus

The Bus is spitted in a lot of parts. The main advantage is that they can be reused in order to create a new bus adapted to a new system. That is how the Eventstore adapted bus was created. This is the structure:

- Publisher: Having a handler, when the publish method is called, it executed a sequence of middlewares and calls the handler. It can be cloned in order to have a multi producer and one consumer.
- Dispatcher (single): Given a key and a item, it executes the callbacks associates to that key in parallel over the item. It is like a router. It fails if any fails.
- MiddlewareChain: executes a list of middlewares over a item.
- Pipeline: Given an Dispatcher, triggers the dispatcher over a item in two modalities: StopOnError and ContinueOnError. It returns a list of errors and results after all the executions.
    + executor: Simplified version of the pipeline, no dispatcher and only stopOnError mode.
- Dispatcher (multi): Like the Dispatcher (single) but accepting an array of items. It makes an execution plan and uses pipelines to execute it with optimal parallelism. Returns the errors and success as array.
- Schedulers: Creates an execution plan for a set of events. This allows to set dependent events like user **update** should be executed only if user **create** succeed.

These pieces are organized in this way:

```
+--------------------------------------------------------------------------------+
|                                                                                |
|                                                                                |
|                                                        EventstoreBus           |
|                                                                                |
| +------------------------------------------------+  +------------------------+ |
| |                                                |  |                        | |
| |    Dispatcher (bulk)         +---------------+ |  | Eventstore  +--------+ | |
| |                              |               | |  |   client    |        | | |
| |                              |   Scheduler   | |  |             |getevent| | |
| | +-----------------------+    |               | |  | +---------+ |store+  | | |
| | |        Pipeline       |    +---------------+ |  | | Tracker | |promise | | |
| | |   (Executed several   |                      |  | +---------+ |        | | |
| | |      in parallel)     |                      |  | +---------+ |        | | |
| | | +-------------------------------+            |  | | Backoff | |        | | |
| | | |Dispatcher (single)  |         |            |  | +---------+ +--------+ | |
| | | |                     |         |            |  +------------------------+ |
| | | |   +------------+    |         |            |                             |
| | | |   |  Executor  |    |         |            |  +------------+ +---------+ |
| | | |   +------------+    |         |            |  |            | |         | |
| | | +-------------------------------+            |  | Factory    | | Utils & | |
| | +-----------------------+                      |  | repository | | mappers | |
| |                                                |  |            | |         | |
| +------------------------------------------------+  +------------+ +---------+ |
|                                                                                |
+--------------------------------------------------------------------------------+
```
