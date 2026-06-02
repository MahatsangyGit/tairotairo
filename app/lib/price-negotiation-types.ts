export type RequestNegotiationContext = {
  source: "request";
  requestResponseId: string;
  requestId: string;
  requestTitle: string;
  responseStatus: string;
  currentPrice: number | null;
  referencePrice: number;
  bookingId: string | null;
  bookingStatus: string | null;
  canNegotiate: boolean;
};

export type ServiceNegotiationContext = {
  source: "service";
  serviceId: string;
  serviceTitle: string;
  listPrice: number;
  currentPrice: number;
  bookingId: string | null;
  bookingStatus: string | null;
  canNegotiate: boolean;
};

export type NegotiationContext =
  | RequestNegotiationContext
  | ServiceNegotiationContext;
