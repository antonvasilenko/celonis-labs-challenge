

Subscribe to contact related topics:
```bash
./kafka.sh kafka-console-consumer --whitelist 'personevents-created|personevents-changed|personevents-deleted'  --from-beginning
```

Subscribe to order related topics:
```bash
./kafka.sh kafka-console-consumer --whitelist 'orderevents'  --from-beginning
```


### Findouts:
contact-service
  PUT person/id
    updates the entity, full replace, sets null if prop is absent in request.
    publishes in personevents-changed: person.changed, data: personId. Not full change.
  PATCH person/id
    does same as PUT
  POST person
    does not require provided id
    publishes personevents-created: person.created, data: personId. Not full change.
  DELETE person/id
    deletes person
    publishes personevents-deleted, person.changed, data: personId.

Requirement:
  order-service should source data from contact-service and persist it in own storage.

Order-Service Requirements:
  - GET orders, have full person objects stored in order
  - POST order/ create order, accepts only ids of persons
  - DELETE order - delete all orders
  - GET order/:id - get 1 order by id
  - PUT 
  - POST, PATCH order/:id - updates order, full overide, default to null values.
  - DELETE order/:id - updates order

Order relates to Person via soldTo, billTo, shipTo.
Those are not normalized and have full props of Person, including ID.


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



### ASSUMPTIONS:
1. For the created order, person objects should not be updated if person is updated in contact service, as those have historical value.
2. 

### DECISIONS:
1. On order creation, fail creating order if persons were not resolved, otherwise order will miss critical information to be performed, like delivery address, billing info.
2. Implement retries for orderService/services/contactService.getPerson() with backoff.
3. Forbid updating persons in order. Workaround - cancel order, create new one.
4. Patch order endpoint skipped as found no difference with PUT order
5. Delete orders response doc was misleading, thus decided to return 200 & empty array.


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

### Tests
I would recommend the following test suits:
* Unit tests for api layer while mocking domains - to check request /response formats
* Unit tests for domain layer while mocking services and db - to check business logic
* No tests for db and services - they should be kept thin and simple
* Integration tests from api level (supertest with given express app instance) - to check full flow. Mock only 3rd party http calls, i.e. services layer. Use mongodb-memory-server for db.


### Task 3.

From the description it looks like storing a snapshot of the person in the order was wrong idea.
Looks like we actually want to update person details in created order. A bit conterintuitive for me and violates typical business needs, but let's follow along.


In order to achieve that, we should:
* store only personid in the order
* store person object in separate persons collection
* subscribe to person events and update persons in persons collection

Seq diagramm suggests that we should update only persons that are related to the orders.
Meaning NOT to keep the full replication of persons db in the orders db.

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

#### TODO task 3:
- [] change mongo db schema to store only person id in the order
- [] create persons collection
- [] on order creation, lookup person and store in persons collection
- [] on person update event from kafka, update persons in persons collection
  