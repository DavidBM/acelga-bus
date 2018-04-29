# acelga-bus
An extensible typescript message bus with support for middlewares

<img src="img/acelga.png">

This bus enforces you to use the types and interfaces you define, avoiding errors and problems. 

<!-- MarkdownTOC autolink="true" autoanchor="true" -->

- [Simple example](#simple-example)
- [Extended example](#extended-example)
- [Middlewares!](#middlewares)
    - [Why middlewares?](#why-middlewares)
    - [Possibilities of the middlewares \(like connec to to kafka, etc\)](#possibilities-of-the-middlewares-like-connec-to-to-kafka-etc)
    - [How to create](#how-to-create)
    - [Code example](#code-example)

<!-- /MarkdownTOC -->


**It filter by types instead of strings.** That means that you have compile time protection against misspellings. But it means that you need to encapsulate everything withing a class. 

Moreover, *it is not safe to publish primitives like numbers, null or strings* because their falsifiability property (0, NaN, "", null, undefined are false). Always send an object / class.

Lets see a simple example (you can check the full example, better for experienced programmers).

<a id="simple-example"></a>
## Simple example

```typescript
import {Bus} from 'acelga-bus';

//No constructor in order to keep the example short
class RegisterEvent(){
    time: new Date(),
    name: "David"
};

const bus = new Bus();

bus.on(RegisterEvent, (event) => console.log(event));

bus.publish(new RegisterEvent()); //Return a promise when all handlers are finished.
```

Now lets see the full potential of the library

<a id="extended-example"></a>
## Extended example

```typescript
import {Bus, IEvent, IMiddleware} from 'acelga-bus';

//Lets define some basic interface for all our events. You can do with a class or abstract class too for enforcing inheritance.
interface IBaseEvent {
    id: string
    getId(): IBaseEvent["id"]
};

class MyCustomEvent implements IBaseEvent {
    id: string = Math.random().toString(36).substring(2);
    getId(){
        return this.id;
    }
    customMethod(){
        return "I'm custom! :D"
    }
}

class MyAnotherCustomEvent implements IBaseEvent {
    id: string = Math.random().toString(36).substring(2);
    name: "David";

    getId(){
        return this.id;
    }
}

//If you don't provide any type, the bus uses a default empty interface.
var bus = new Bus<IBaseEvent>();

bus.on(MyCustomEvent, (event) => {
    //You have auto completion here. Typescript will infer the correct types.
    console.log(event.getId());
    console.log(event.date);
    //Including the methods of the subtype
    console.log(event.customMethod());
})

//Will trigger the previous declared handler
bus.publish(new MyCustomEvent()); 

//This won't trigger any handler
bus.publish(new MyAnotherCustomEvent());

//Lets create a Event that doesn't implements the base interface
class NonCompatibleEvent {}

//Error! This won't compile
bus.publish(new NonCompatibleEvent());
```

<a id="middlewares"></a>
## Middlewares!

<a id="why-middlewares"></a>
### Why middlewares?

Because they allow to extend the buss to almost anything. In some cases middlewares are a good tool for not repeating code.

<a id="possibilities-of-the-middlewares-like-connec-to-to-kafka-etc"></a>
### Possibilities of the middlewares (like connec to to kafka, etc)

You can implement a connector to Kafka, RabbitMQ, Redis, etc. Middlewares can completely control the flow of the delivery saying when it fails or succeed and if to continue or to not. 

<a id="how-to-create"></a>
### How to create

You just need to implement the following interface:

```typescript
export interface IMiddleware<T = IEvent> {
    (event: T): Promise<T | void>;
}
```

You can import it with `import {IMiddleware} from 'acelga-bus';`. 

- IEvent is the default interface that the Bus defaults if not generic type is provided, you can provide your own base type. **You should always define it as the same interface as the Bus.**
- `Promise<T | void>`
    - `T` if you return the Event, then the execution continues as expected.
    - `void` if you don't return anything, then the execution is stopped and the promise that `bus.publish()` returns is fulfilled.

<a id="code-example"></a>
### Code example
 
```typescript
import {Bus, IMiddleware} from 'acelga-bus';

class CustomEventNumber {
    data: number;
    constructor(data: number = 0) {
        this.data = data;
    }
}

enum Operation {Add, Substract};

const CustomMiddleware: (number?: number, operation?: Operation) => IMiddleware<CustomEventNumber> = (number = 0, operation) => {
    return (event) => {
        switch (operation) {
            case Operation.Add:
                return Promise.resolve(new CustomEventNumber(event.data + number));
            case Operation.Substract:
                return Promise.resolve(new CustomEventNumber(event.data - number));
            default:
                //This one will stop the execution. No events will be dispatched and no more middlewares will be called. 
                return Promise.resolve();
        }
    }
}

//Lets create the bus and a event.
const bus = new Bus<CustomEventNumber>();
const event = new CustomEventNumber(25);

//We can add at the beginning
bus.pushMiddleware(CustomMiddleware(1, Operation.Substract));
//And at the end
bus.addStartMiddleware(CustomMiddleware(3, Operation.Add));

bus.on(CustomEventNumber, (event) => {
    console.log(event.data); //27
});

//This will print 27 in the console
bus.publish(event);

//This middleware will return undefined
bus.unshiftMiddleware(CapturingMiddleware(0, false));

//This won't print anything because the last added middleware returns 
//nothing and the dispatch & process of the event is stopped
bus.publish(event);
```

