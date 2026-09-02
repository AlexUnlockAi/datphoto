// DatPhotography's own business details, shown on generated invoices.
// Single-business app — a settings table would be over-engineering here.
export const BUSINESS = {
  name: "DatPhotography",
  email: "photosbydat@gmail.com",
  phone: "(214) 385-0412",
  website: "datphotography.org",
};

// Outgoing quote/invoice emails send from this address (a verified
// datphotography.org sender in Resend) so they land as real business email
// instead of a Yahoo/Gmail address a provider like Resend can't verify —
// replies still route to BUSINESS.email above.
export const EMAIL_FROM = "DatPhotography <studio@datphotography.org>";
