import { z } from 'zod';
import orderDomain from '../../domain/orders';

// convert to zod schema
export const schema = z.object({
  personid: z.string(),
});

type PersonChangedEvent = z.infer<typeof schema>;
export const handler = async (event: PersonChangedEvent): Promise<void> => {
  return orderDomain.updatePersonInOrders(event.personid);
};
