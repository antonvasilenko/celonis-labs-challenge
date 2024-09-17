

Subscribe to all topics:
./kafka.sh kafka-console-consumer --whitelist 'personevents-created|personevents-changed|personevents-deleted'  --from-beginning


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


#### TODOS:
[x] Learn existing solution
[x] Test contract-service api
[x] bootstrap order service, setup TS, add express server
[x] add mongo connection and mongoose schema
[ ] complete api crud logic up to the db
[x] error handling
[x] latency handling
[x] include new service in docker compose
[ ] publish own events to kafka on create, update, delete
[ ] subscribe to contact events from kafka streams, dummy handlers



### ASSUMPTIONS:
1. For the created order, person objects should not be updated if person is updated in contact service, as those have historical value.
2. 

### DECISIONS:
1. On order creation, fail creating order if persons were not resolved, otherwise order will miss critical information to be performed, like delivery address, billing info.
2. Implement retries for orderService/services/contactService.getPerson() with backoff.
3. Forbid updating persons in order. Workaround - cancel order, create new one.
4. Implementation for other endpoints of order service were skipped as they are straightforward and in no way help solving the core task.


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
