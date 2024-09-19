Here ypou can find the details of task implementation accompanied by my assumptions, considered options and decisions made.

Jump to solution presentation [here](#presentation).

#### General TODOS:
- [x] Learn existing solution
- [x] Test contract-service api
- [x] bootstrap order service, setup TS, add express server
- [x] add mongo connection and mongoose schema
- [x] complete api crud logic up to the db
- [x] error handling
- [x] latency handling
- [x] include new service in docker compose
- [x] publish own events to kafka on create, update, delete
- [x] subscribe to contact events from kafka streams, dummy handlers


### Task 2.

#### Handling Latency of Contact Service:
1. Simplest implementation: handle timeout, store partial person object (just id). Fail only in case of not found.
2. Current implementation: retry with 200ms delay in case of timeout or unknown error.
   Optionally: use linear backoff to not overload contact service.
3. Put retry command in a queue with a longer delay, e.g. 30s, 5m, 60m. This will mitigate load peaks.
  For client, those cases might be separated by returned status code:
    * 201 Created - when order created instantly, person lookups successful;
    * 202 Accepted - order is accepted but not yet fully created.

2 and 3 favor performance and availability over consistency. Targeting eventual consistency.
Generally in error handling we should separate cases when it makes sense to retry and when it does not, leading 2 code flows: either saving order somehow (even partially) or not saving and returning an error th the client.

### Considerations on Tests
I would recommend the following test suits:
* Unit tests for api layer while mocking domains - to check request /response formats
* Unit tests for domain layer while mocking services and db - to check business logic
* No tests for db and services - they should be kept thin and simple
* Integration tests from api level (supertest with given express app instance) - to check full flow. Mock only 3rd party http calls, i.e. services layer. Use mongodb-memory-server for db.


### Task 3.
From the requirement to update persons in orders based on person's changes in contact service, it looks like storing a snapshot of the person is not the best idea. Normalized structure with storing orders and persons separately would simplify persons' update logic, but would make order operations more complex, as they would always require a lookup.  

The taken approach with persons nested in order should still be appropriate if single person will have moderate amount of orders to update. Again here, the order status will help to update only the orders that are not yet processed and do not touch completed (historical) orders.


Seq diagramm suggests that we should update only persons that are related to the orders.
Meaning NOT to keep the full replication of persons db in the orders db.
That requires 1 extra db query to check if orders related to person exist before invoking bulk update command.

Questions:
1. how to react on person.deleted event?  
  Options:
    * do nothing, skip handling
    * mark person as deleted in persons collection
    
    Decision: do not handle
2. how to handle person.created event?  
   Options:
    * do nothing, skip handling
    * create person in persons collection
  
    Decision: do not handle

3. Send order.changed on change or related person.changed?  
   Options:
    * send order.changed if any or related (nested) persons changed
    * do not treat it as order change
  
    Decision: do not send order.changed, do not treat it as order change as nested persons is an internal implementation detail.
  

#### TODO task 3:
- [x] setup kafka consumer for person changed events
- [x] on person update event from kafka, update persons in orders collection


### How to run
Docker-compose.yml is is updated, so just:
```bash
docker-compose up -d
```
Then you can open [order-service Swagger UI](http://localhost:8081/docs) in browser.
Also, here is [contact-service Swagger UI](http://localhost:8080/swagger-ui/) for quick reference.

#### Helpful scripts
Subscribe to contact related topics:
```bash
./kafka.sh kafka-console-consumer --whitelist 'personevents-created|personevents-changed|personevents-deleted'  --from-beginning
```

Subscribe to order related topics:
```bash
./kafka.sh kafka-console-consumer --whitelist 'orderevents'  --from-beginning
```


## Solution Presentation <a id="presentation"></a>
Here is an [updated draw.io diagram](assets/updated/Architecture_v2.drawio) of the solution, but I put images of it below.

Here is an updated components diagram with added order-service:
![Updated Architecture](assets/updated/components.svg)

Updated sequence diagramm of order creation:
![Order Creation](assets/updated/seq_order_create.svg)

Updated sequence diagramm of person update handling:
![Person Update Handling](assets/updated/seq_person_update.svg)

Service Architecture:
![Service Architecture](assets/updated/order_service_structure.svg)

Folder structure:
```
order-service
├── src
│   ├── api
│   │   ├── http
│   │   │   └── v1
│   │   │       ├── dto.ts - zod-based data transfer objects for api
│   │   │       └── order.ts - zod-based endpoint declarations followed by handlers 
│   │   └── queue - kafka consumers, only person.changed implemented
│   ├── domain - business logic
│   ├── models - mongoose schemas with TS interfaces
│   ├── services - http client for contact-service, kafka producer
│   └── index.ts - starts the service, init connections, ties all together
└── Dockerfile // multistage build for nodejs service

```

### DB Schema
I decided to store persons nested in orders ( order fields shipTo, billTo and sellTo are actually person objects in db), as it simplifies and speeds up the order creation and retrieval.
It makes more complex sync the update of persons in orders, but this operation will happen "in background" and is ok to be slower.

### Assumptions:
1. Although the task description implicitly asks to update person information in the order-service, I would bring it up for the discussion. The argument is that once order is created and taken into work, minimum of it's initial content should be changed.  
We can achieve it in few ways:
   1. by forbidding the change and only allowing to cancel the order and create a new one;
   2. by introducing a state that represents the lifecycle of the order and only allowing to change order's person information in certain states, e.g. "draft". Such approach will also allow us to skip lookup of persons during order creation, do it later in background and once the order info is collected, set it to the state ready for processing.


### Decisions:
1. Implement retries for orderService/services/contactService.getPerson() with backoff.
2. Forbid updating persons in order. Workaround - cancel order, create new one.
3. Patch order endpoint skipped as found no difference with PUT order
4. Delete orders response doc was misleading, thus decided to return 200 & empty array.
5. Used zod library as a way to enforce type conformance in the runtime as it derives types from the schema definition.
6. Splited app in folders in such way external ports and business logic separated. This folder structure is extensible and maintainable with the growth of the project.

### Security considerations:
In terms of service-to-service authentication, that would depend a lot on the infrastructure around and services' ownership - subject to discuss. 

Simplest way would be to do ip filtering on infrastructure level and auth token check on code level. although handling of token expiration or revocation is not trivial.

More complex solution would require usage of identity provider, e.g. Keycloak, and JWT tokens. This would require more complex setup and maintenance, but would provide more flexibility with authorization and token management.

Of course, supported auth should be enabled and when connecting to mongodb and kafka (credentials, ssh, ip filtering, user access management).


## Final Considerations
Although the task description was clear, if focused a lot on technical implementation while not covering business case we are trying to solve.
This limited the scope of the solution and the alternatives I can provide without speculation about the real product needs.

Few aspects I would charify if that was a story in the real project:
* what is the side that using order service api and contact service API.
* What is the process behind those entities? How persons are created? How and when orders are created? Do we really need to update persons in orders? Can we avoid that?
* Technical aspects:
  * does order service even need to know about person id - internal db id of contact-service? Can the caller side (frontend or other service) provide the person data directly during order creation? If it knowns person id, it probably knows the other person data as well.
  * why split events into 3 streams? If they have same payload, it can be just single stream with events of 3 types: created, changed, deleted. I am sure in real world scenarios, if someone would need to gather updates, it would need to subscribe to all 3 streams. Having 1 stream makes it easier, if some events are not needed, they can be just skipped by the consumer.
  * open to discussion: we could put whole person payload to the event instead of just id. In this case event handling will not require service lookup, thus the latency of contact service won't affect order service. This will make order service more independent and resilient to contact service issues.