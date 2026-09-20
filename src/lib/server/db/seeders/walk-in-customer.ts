import { WalkInCustomerName } from "$lib/const";
import { db, client } from ".."
import { getWalkInCustomer } from "../queries/customers";
import { customers } from "../schema"

const insertWalkInCustomer = async () => {
  try {
    const [customer] = await getWalkInCustomer();
    if (customer) {
      console.log("Walk-in customer already exists");
      return;
    }

    await db.insert(customers).values({
      name: WalkInCustomerName,
      address: '',
      phone: '',
      viber: '',
      fb_account: '',
    });
    console.log("Walk-in customer inserted successfully");
  } catch (error) {
    console.error("Error inserting walk-in customer:", error);
  } finally {
    await client.end();
  }
}

insertWalkInCustomer();
