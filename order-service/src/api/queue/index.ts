import { CloudEvent } from 'cloudevents';
import * as personChanged from './personChanged';

const handleCloudEvent = async <T>(event: CloudEvent<T>): Promise<void> => {
  try {
    switch (event.type) {
      case 'person.changed':
        return await personChanged.handler(personChanged.schema.parse(event.data));
      default:
        console.log('Unknown event type', event.type);
        break;
    }
  } catch (error) {
    console.error('Error handling event', event, error);
  }
};

export default handleCloudEvent;
