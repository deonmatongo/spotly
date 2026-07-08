// MQTT topic contract for the order event bus. Location topics
// (drivers/{id}/location, trips/{ref}/location) are unchanged and owned by the
// existing bridge — see each app's tracking config.
//
// Durability strategy: state topics are published RETAINED so an app that
// connects mid-flight instantly receives the current value. Queue topics use a
// per-ref subtopic + a wildcard subscription, and are cleared (empty retained
// payload) once the item leaves the queue.

// --- Order queue: customer → merchant -------------------------------------
// One retained topic per pending order under the merchant's namespace. The
// merchant subscribes to the wildcard and receives every open order on connect.
export const merchantOrderTopic = (merchantId: string, ref: string) =>
  `merchants/${merchantId}/orders/${ref}`
export const merchantInboxWildcard = (merchantId: string) =>
  `merchants/${merchantId}/orders/+`

// --- Order status: shared by all parties ----------------------------------
// Retained so the customer's tracking screen and the merchant both see the
// latest status even if they open after it changed.
export const orderStatusTopic = (ref: string) => `orders/${ref}/status`

// --- Driver presence: driver → dispatcher ---------------------------------
// Retained so the dispatcher knows who is online/available at any moment.
export const presenceTopic = (driverId: string) => `drivers/${driverId}/presence`

// --- Dispatch result: dispatcher → merchant/driver ------------------------
export const dispatchResultTopic = (ref: string) => `dispatch/${ref}/result`

// --- Job queue: merchant → drivers ----------------------------------------
// One retained topic per available job. Drivers subscribe to the wildcard.
// Cleared once a driver claims the job.
export const jobTopic = (ref: string) => `jobs/${ref}`
export const jobsWildcard = () => `jobs/+`

// --- Merchant menu: merchant publishes → customers see it live --------------
// Retained: the customer app gets the current menu the moment it subscribes.
export const merchantMenuTopic = (merchantId: string) => `merchants/${merchantId}/menu`

// --- Event tickets: customer issues → door scanner validates & redeems ------
// Retained per ticket code so a scanner sees all valid tickets on connect and
// redemptions persist (blocking re-use).
export const ticketTopic = (code: string) => `tickets/${code}`
export const ticketsWildcard = () => `tickets/+`

// Pull the {ref} out of a jobs/{ref} or merchants/{id}/orders/{ref} topic.
export const refFromTopic = (topic: string): string | null => {
  const parts = topic.split('/')
  const last = parts[parts.length - 1]
  return last && last.startsWith('SPT-') ? last : null
}
