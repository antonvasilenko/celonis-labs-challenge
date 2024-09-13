# Celonis Programming Challenge: Backend Specialist

Dear applicant,

Congratulations, you made it to the Celonis Programming Challenge!

Why do we ask you to complete this challenge?

First of all, we need to have some way of comparing different applicants and we try to answer certain questions which we can not out-right ask in an interview.
Also we don't want to ask too many technical questions in a face-to-face interview to not be personally biased in a potentially stressful situation.
To be as transparent as possible, we want to give you some insights into what we look at and how we evaluate.
This challenge gives you the possibility to shine :).
Impress us with **simplicity**, understanding of your own solution and of course **working code**.

## Challenge

The following challenge has to be solved.
You will find specific tasks and deliverables in the subsequent sections.

Note that there is nothing wrong with googling when you have certain questions or are unsure about some APIs, but you should not outright copy code that you don't understand.
If you decide to copy code, please mark it as copied citing the source.

What we are looking for:

- Clean, simple and understandable code 
- Analytical / problem-understanding / problem-solving skills
- Ability to execute / implement 
- Ability to explain why you picked a certain solution and why you rejected possible alternatives
- Ability to challenge proposed solutions (business wise and technically) and identify more efficient or better ways forward

## Task 1: Get the sample application "up and running"

The sample application is a very simple microservice that manages persons/contacts.
The service is "dockerized" and comes with a [docker-compose file](docker-compose.yaml) that helps you set it up quickly.
To run it you need docker (incl. compose) and an internet connection. 

You start the application with `docker-compose up -d`.
This will create the following setup:

![Basic Architecture](assets/basic-deployment.svg)

The Application exposes a REST API that is described with an [OpenAPI 3.0 compliant specification](assets/contact_service_openapi.yaml).
This specification is also available on the running service under [http://localhost:8080/swagger-ui/](http://localhost:8080/swagger-ui/).

Every create / update / delete operation on a "Person" entity will result in the creation of a CloudEvent 1.0 compliant message in Kafka.
There are 3 topics that will be used:

* personevents-created
* personevents-changed
* personevents-deleted

Your first task is to use the API to create, change and delete contacts.
Basically get to know your base service. 

Congrats! Now you are ready to begin the actual development work!

## Task 2: Create a new service to capture orders

Now it is your time to develop a similar service and to integrate it into the landscape.
You should use NodeJS/Typescript as the implementation language and your service's API should comply to the provided [OpenAPI 3.0 spec](assets/order_service_openapi.yaml).
All other implementation details (e.g. database, frameworks) are up to you.

One thing you should ensure is that the person data is sourced from the previously deployed service and fully persisted to a storage specifically used by the order service (order read operations should not require the contact service to be up and running).
The input API will provide the necessary ID reference.
In case the reference is invalid (does not exist or can't be checked), the order API should send an error.
The basic flow is depicted in the sequence diagram below.

![Order Posting](assets/order-post.svg)

Be aware that the contact service sometimes has latency issues.
You can simulate these by changing the `--api.maxArtificialLatency` command of the `contact-service` in the [docker-compose](docker-compose.yaml) file. 

In order to not overcomplicate things:

* You don't need to do excessive error handling, however please explain where you compromised and how you would do it properly
* No need for automated tests, however we would like to hear how you would set these up
* If you think certain ideas are too much effort to implement, just explain them 
* Service is not responsible for calculations (ATP, Price, etc.) it is "just persistency"

## Task 3: Subscribe to Contact Updates from Contact Service

For now your order service only stores orders.
To allow other services to integrate, you will publish events for create, update and delete operations to the existing Kafka Broker (events should follow the [CloudEvents 1.0 spec](https://github.com/cloudevents/spec/blob/v1.0.1/json-format.md))

To introspect the events, you can shell into the Kafka container (`docker exec`) and use the native Kafka scripts to print the event log contained within the topics mentioned before.
The scripts are located in `/opt/bitnami/kafka/bin`.
Remember that inside the container your bootstrap server is `kafka:9092` and on your laptop it is `localhost:9093`.

Furthermore, your service only stores a snapshot of the referenced contact persons.
This means the local storage is out of sync when changes are made to contacts post order creation / manipulation.
To ensure eventual consistency, you should now subscribe to the **relevant** person events (topics personevents-created, personevents-changed, personevents-deleted) and ensure the concerned orders reflect the updates.
This behavior is described in the below sequence diagram:

![Contact Update](assets/contact-event.svg)

After you have implemented the functionality, take a step back and think about the implementation.
What were tradeoff decisions you had to take.
What do they mean to things like scalability, performance, consistency, ....
Would there be better designs to achieve the same goal?

## Task 4: Presentation

Congratulations you have completed the technical part of your challenge.
Now you need to sell it to us ;-).
For that we would expect the following to be handed in once your deadline is expired:

* Documented summary (keep it short and concise!) highlighting:
  * Architecture ([original architecture is available as drawio](assets/Architecture.drawio))
  * Choices made and reasons for them
  * Proposed improvements
  * What worked and what not
  * How you would propose to handle security
* Complete Source Code 
* Amended docker-compose file (to re-create your setup on our own infrastructure)
* Documentation on how to run your solution and try it out

Please provide your solution as a git repository either

* via link to a public Github repository (preferred) OR
* packed as zip archive on a cloud storage of your choice, e.g. Dropbox/Google Drive (make sure that the .git folder of your project is included and we have access to this folder)

During the meeting we would follow the below structure:

1. First, you would demonstrate your solution.
2. After that, we would discuss your previously handed in documented summary.
3. Next, you would present your source code structure.
   This would be the time where we dive a little bit deeper into technical details and ask questions about that.
4. Lastly, we would ask you about reasons of choices you made.
   It is very important to be honest here.
   If you picked a certain technology because it is the only one you know, don't make up things just say it.
