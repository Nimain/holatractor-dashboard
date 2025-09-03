
export interface User {
  location_id: string;
  id: string;
  first_name: string;
  middle_name?: string | null;
  last_name: string;
  email: string;
  password?: string | null;
  authType: AuthType;
  googleId?: string | null;
  mobile: string;
  country_code: string;
  image?: string | null;
  age: number;
  gender: string;
  base_id: string;
  createdAt: Date;
  updatedAt: Date;
  phoneVerified: boolean;
  emailVerified: boolean;
  otp?: OTP | null;
  emailToken?: EmailToken | null;
  session: Session[];
  profiles: UserProfile[];
  tractor: Tractor[];
  createdStores: Store[];
  storeStocks: StoreStock[];
  ratings: Rating[];
  TractorInStoreRating: TractorInStoreRating[];
  AttachmentInStoreRating: AttachmentInStoreRating[];
  OperatorInStore: OperatorInStore[];
  OperatorBookingJob: OperatorBookingJob[];
  location: Location;
  Owner: Owner[];
  OwnerCreator: Owner[];
  Agent: Agent[];
  AgentCreator: Agent[];
  Farmer: Farmer[];
  FarmerCreator: Farmer[];
  Lease: Lease[];
  LeaseCreator: Lease[];
  LeaseDocument: LeaseDocument[];
  Dealer: Dealer[]
  DealerCreator: Dealer[]
  Booking: Booking[]
  Log: Logs[]
  paymentSender: Payment[]
  paymentReciever: Payment[]
  BankAccount: BankAccount[]
  PayPal: PayPal[]
  UPI: UPI[]
  Subscriptions: Subscriptions[]
  DealerStore: DealerStore[]
  DealerStoreCreator: DealerStore[]
  Farm: Farm[]
}

export interface Role {
  id: string;
  name: string;
  image?: string | null;
  base_id: string;
  allowedModules: any; // Assuming JSON
  createdAt: Date;
  updatedAt: Date;
  profiles: UserProfile[];
  permissions: ModulePermission[];
  operator: Operator[];
  owner: Owner[];
  agent: Agent[];
  Farmer: Farmer[];
  Dealer: Dealer[];
}

export interface UserProfile {
  id: string;
  user_id: string;
  role_id: string;
  base_id: string;
  createdAt: Date;
  updatedAt: Date;
  user: User;
  role: Role;
}

export interface Base {
  id: string;
  created_by?: string | null;
  status: number;
  created: Date;
  updated: Date;
  Store: Store[];
  storeStocks: StoreStock[];
  ratings: Rating[];
  TractorInStore: TractorInStore[];
  AttachmentInStore: AttachmentInStore[];
  country: Country[];
  Operator: Operator[];
  Document: Document[];
  OperatorBookingJob: OperatorBookingJob[];
  Owner: Owner[];
  Agent: Agent[];
  Farmer: Farmer[];
  City: City[];
  Lease: Lease[];
  LeaseDocument: LeaseDocument[];
  Dealer: Dealer[];
  booking: Booking[];
  Payment: Payment[]
  BankAccount: BankAccount[]
  PayPal: PayPal[]
  UPI: UPI[]
}

export interface Module {
  id: string;
  name: string;
  description: string;
  image?: string | null;
  base_id: string;
  createdAt: Date;
  updatedAt: Date;
  permissions: ModulePermission[];
}

export interface ModulePermission {
  id: string;
  module_id: string;
  role_id: string;
  base_id: string;
  createdAt: Date;
  updatedAt: Date;
  module: Module;
  role: Role;
}

export interface OTP {
  id: string;
  userId: string;
  otp: string;
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
  user: User;
}

export interface EmailToken {
  id: string;
  userId: string;
  token: string;
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
  user: User;
}

export interface Session {
  id: string;
  userId: string;
  token: string;
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
  user: User;
}

export interface Tractor {
  id: string;
  name: string;
  description: string;
  es_name?: String;
  es_description?: string;
  ay_name?: string;
  ay_description?: string;
  qu_name?: string;
  qu_description?: string;
  gn_name?: string;
  gn_description?: string;
  images: string[];
  model?: string | null;
  type: TractorType;
  year?: Date | null;
  base_id: string;
  created_by: string;
  createdAt: Date;
  updatedAt: Date;
  inventory: Inventory[];
  user: User;
  TractorInStore: TractorInStore[];
  TractorLead: TractorLead[];
  BookingStandaloneTractor: BookingStandaloneTractor[];
}

export interface Attachment {
  id: string;
  name: string;
  description: string;
    category?: string;
  es_name?: String;
  es_description?: string;
  ay_name?: string;
  ay_description?: string;
  qu_name?: string;
  qu_description?: string;
  gn_name?: string;
  gn_description?: string;
  images: string[];
  tractorId: string[];
  base_id: string;
  fixedPrice?: number;
  createdAt: Date;
  updatedAt: Date;
  AttachmentInStore: AttachmentInStore[];
  AttachmentLead: AttachmentLead[];
  BookingStandaloneAttachment: BookingStandaloneAttachment[];
}

// Base Service
export interface Service {
  id: string;
  name: string;
  description?: string;
  images: string[];
  base_id: string;
  createdAt: Date;
  updatedAt: Date;
  min_price?: string | number; // Make optional if it can be null
  max_price?: string | number; // Make optional if it can be null
  ServiceInStore: ServiceInStore[];
  category?:string
}

// Service inside a Store
export interface ServiceInStore {
  id: string;
  baseServiceId: string;
  base_id: string;
  price: number;
  store_id: string;
  createdAt: Date;
  updatedAt: Date;
  baseService: Service;
  base: Base;
  store: Store;
  hourly_price:number;
  description:string;
  name:string;
}

export interface BookingTractor {
  bookingId: string;
  tractorId: string;
  booking: Booking;
  tractor: TractorInStore;
}

export interface BookingAttachment {
  bookingId: string;
  attachmentId: string;
  booking: Booking;
  attachment: AttachmentInStore;
}

export interface BookingStandaloneTractor {
  id: string;
  bookingId: string;
  tractorId: string;
  count: number; // Number of tractors booked
  booking: Booking;
  tractor: Tractor;
}

export interface BookingStandaloneAttachment {
  id: string;
  bookingId: string;
  attachmentId: string;
  count: number; // Number of tractors booked
  booking: Booking;
  attachment: Attachment;
}

export interface LeaseTractor {
  leaseId: String
  tractorId: String
  lease: Lease
  tractor: TractorInStore
}

// Join table for Booking and Attachment
export interface LeaseAttachment {
  leaseId: String
  attachmentId: String
  lease: Lease
  attachment: AttachmentInStore
}

export interface Location {
  id: string;
  name?: string;
  address?: string;
  city?: string;
  state?: string;
  zip_code: string;
  country: string;
  base_id: string;
  lat: string;
  lan: string;
  createdAt: Date;
  updatedAt: Date;
  Store: Store[];
  Booking: Booking[];
  User: User[];
  Owner: Owner[];
  Agent: Agent[];
  Lease: Lease[];
  FarmerHome: Farmer[];
  FarmerFarm: Farmer[];
  DealerStore: DealerStore[]
}

export interface Booking {
  id: string;
  user_id: string;
  store_id?: string | null;
  start_date: Date;
  end_date?: Date | null;
  base_id: string;
  total_cost: number;
  total_tractor_cost?: number | null;
  total_attachment_cost?: number | null;
  total_service_charge?: number | null;
  total_tax?: number | null;
  total_distance_cost?: number | null;
  booking_hours?: BookingHours | null;
  booking_location_lan?: string | null;
  booking_location_lat?: string | null;
  farm_id?: string | null;
  confirm: boolean;
  owner_confirm: boolean;
  distance?: string | null;
  location_id?: string | null;
  created_by: string;
  bookingType?: BookingType | null;
  bookingStatus?: BookingStatus | null;
  createdAt: Date;
  updatedAt: Date;
  store?: Store | null;
  location?: Location | null;
  tractors: BookingTractor[];
  attachments: BookingAttachment[];
  standaloneTractors: BookingStandaloneTractor[]; // Standalone tractors
  standaloneAttachments: BookingStandaloneAttachment[];
  OperatorBookingJob: OperatorBookingJob[];
  ownerOperatorRequest: ownerOperatorRequest[];
  farm?: Farm | null;
  user?: User | null;
  payment: Payment[]
}

export interface Inventory {
  id: string;
  tractor_id: string;
  city: string;
  created_by: string;
  base_id: string;
  min_price: number;
  max_price: number;
  fixedPrice?: number;
  createdAt: Date;
  updatedAt: Date;
  tractor: Tractor;
  storeStock: StoreStock[];
}

export interface Store {
  id: string;
  owner_user_id: string;
  agent_owner_user_id: string;
  name: string;
  description: string;
  image: string;
  opening_time: Date;
  closing_time: Date;
  closing_days: string[];
  created_by: string;
  base_id: string;
  rating_id: string[];
  location_id: string;
  createdAt: Date;
  updatedAt: Date;
  location: Location;
  owner: Owner;
  agentOwner: Owner;
  creator: User;
  base: Base;
  service:string;
  rating: Rating[];
  Booking: Booking[];
  TractorInStore: TractorInStore[];
  AttachmentInStore: AttachmentInStore[];
  OperatorInStore: OperatorInStore[];
  OperatorStoreCon: OperatorStoreCon[];
  ServiceInStore: ServiceInStore[];
}

export interface TractorInStore {
  id: string;
  baseTractorId: string;
  base_id: string;
  hourly_price: number;
  store_id: string;
  lat?: string;
  lan?: string;
  createdAt: Date;
  updatedAt: Date;
  baseTractor: Tractor;
  base: Base;
  store: Store;
  BookingTractor: BookingTractor[];
  TractorInStoreRating: TractorInStoreRating[];
  LeaseTractor: LeaseTractor[]
}

export interface AttachmentInStore {
  id: string;
  baseAttachmentId: string;
  base_id: string;
  hourly_price: number;
  store_id: string;
  createdAt: Date;
  updatedAt: Date;
  baseAttachment: Attachment;
  base: Base;
  store: Store;
  BookingAttachment: BookingAttachment[];
  AttachmentInStoreRating: AttachmentInStoreRating[];
  LeaseAttachment: LeaseAttachment[]
}

export interface StoreStock {
  id: string;
  store_id: string;
  inventory_id: string[];
  created_by: string;
  base_id: string;
  createdAt: Date;
  updatedAt: Date;
  creator: User;
  base: Base;
  inventory: Inventory[];
}

export interface Rating {
  id: string;
  store_id: string;
  user_id: string;
  ranting: number;
  comment: string;
  like: string[];
  base_id: string;
  createdAt: Date;
  updatedAt: Date;
  store: Store;
  user: User;
  base: Base;
  DealerStore: DealerStore[]
}

export interface TractorInStoreRating {
  id: string;
  tractorId: string;
  userId: string;
  rating: number;
  comment: string;
  createdAt: Date;
  updatedAt: Date;
  tractor: TractorInStore;
  user: User;
  TractorInDealerStore: TractorInDealerStore[]
}

export interface AttachmentInStoreRating {
  id: string;
  attachmentId: string;
  userId: string;
  rating: number;
  comment: string;
  createdAt: Date;
  updatedAt: Date;
  attachment: AttachmentInStore;
  user: User;
  AttachmentInDealerStore: AttachmentInDealerStore[]
}

export interface Farmer {
  id: string;
  user_id: string;
  role_id: string;
  created_by?: string | null
  Status: number;
  base_id: string;
  device_type?: string | null
  device_id?: string | null
  home_location_id?: string | null
  farm_location_id?: string | null
  currency?: string | null
  currency_code?: string | null
  createdAt: Date;
  updatedAt: Date;
  role: Role;
  user: User;
  createor?: User;
  base: Base;
  home?: Location
  farm?: Location
}

export interface Country {
  id: string;
  name: string;
  region: string;
  country_code: string;
  base_id: string;
  createdAt: Date;
  updatedAt: Date;
  base: Base[]; // Relation to Base model
  City: City[];
}

export interface City {
  id: string;
  name: string;
  country_id: string;
  base_id: string;
  createdAt: Date;
  updatedAt: Date;
  base: Base;
  country: Country
}

export interface Operator {
  id: string;
  user_id: string;
  role_id: string;
  document_attachment_id: string;
  created_by?: string | null;
  Status: number; // 0 = inactive, 1 = active
  base_id: string;
  createdAt: Date;
  updatedAt: Date;
  user: User; // Relation to the User model as Operator
  role: Role; // Relation to the Role model as OperatorRole
  creator?: User | null; // Relation to the User model as the creator of the Operator
  base: Base; // Relation to the Base model as BaseOfOperator
  document: Document; // Relation to the Document model as OperatorDocument
  OperatorInStore: OperatorInStore[]; // Relation to OperatorInStore
  OperatorStoreCon: OperatorStoreCon[]; // Relation to OperatorStoreCon
  OperatorBookingJob: OperatorBookingJob[]; // Relation to OperatorBookingJob
}

export interface Document {
  id: string;
  document_number: string;
  attachment: string;
  expire_date?: Date | null;
  created_by?: string | null;
  base_id: string;
  createdAt: Date;
  updatedAT: Date;
  Operator: Operator[]; // Relation to the Operator model
  creator?: User | null; // Relation to the User model as DocumentCreator
  base: Base; // Relation to the Base model as DocumentBase
  TractorInStore: TractorInStore[]; // Relation to TractorInStore as "Document of tractors"
  Owner: Owner[]; // Relation to Owner as "document of owner"
  Agent: Agent[]; // Relation to Agent as "document of Agent"
  Dealer: Dealer[]
  TractorInDealerStore: TractorInDealerStore[]
}

export interface OperatorStoreCon {
  operator_id: string;
  store_id: string;
  operator: Operator; // Relation to the Operator model as OperatorAndStoreConjunction
  store: Store; // Relation to the Store model as StoreAndOperatorConjunction
}

export interface OperatorInStore {
  id: string;
  operator_id: string;
  store_id: string;
  cost_per_job?: string | null;
  cost_per_hour?: string | null;
  cost_per_month?: string | null;
  note: string;
  status: StoreOperatorStatus; // 1 = active, 0 = inactive
  created_by: string; // ID of either Agent, Admin, or Store owner
  base_id: string;
  createdAt: Date;
  updatedAt: Date;
  operator: Operator; // Relation to the Operator model as OperatorInStore
  store: Store; // Relation to the Store model as StoreOfOperator
  creator: User; // Relation to the User model as CreatorOfOperatorInStore
}

export interface OperatorBookingJob {
  id: string;
  booking_id: string;
  operator_id?: string | null;
  cost_for_operator: number;
  created_by: string; // ID of either Agent, Admin, or Store owner
  status: OperatorBookingJobStatus;
  base_id: string;
  createdAt: Date;
  updatedAt: Date;
  booking: Booking; // Relation to the Booking model as bookingForOperator
  operator?: Operator | null; // Relation to the Operator model as operatorForBooking
  creator: User; // Relation to the User model as CreatorOfOperatorBooking
  base: Base; // Relation to the Base model as BaseForOperatorBookingJob
}

export interface Owner {
  id: string;
  user_id: string;
  role_id: string;
  loaction_id: string;
  document_id: string;
  created_by?: string | null;
  base_id: string;
  status: number; // 0 = inactive, 1 = active
  payment_id: string;
  createdAt: Date;
  updatedAt: Date;
  paymentScreenshots: string[];
  user: User; // Relation to the User model as "Owner user"
  role: Role; // Relation to the Role model as "Owner role"
  location: Location; // Relation to the Location model as "location of owner"
  document: Document; // Relation to the Document model as "document of owner"
  creator?: User | null; // Relation to the User model as "owner creator"
  base: Base; // Relation to the Base model as "base of owner"
  Store: Store[]; // Relation to the Store model as "StoreOwner"
}

export interface Agent {
  id: string;
  user_id: string;
  role_id: string;
  loaction_id: string;
  document_id: string;
  created_by?: string | null;
  base_id: string;
  status: number; // 0 = inactive, 1 = active
  createdAt: Date;
  updatedAt: Date;
  user: User; // Relation to the User model as "Agent user"
  role: Role; // Relation to the Role model as "Agent role"
  location: Location; // Relation to the Location model as "location of Agent"
  document: Document; // Relation to the Document model as "document of Agent"
  creator?: User | null; // Relation to the User model as "Agent creator"
  base: Base; // Relation to the Base model as "base of Agent"
  Store: Store[]; // Relation to the Store model as "StoreAgent"
}

export interface Dealer {
  id: string;
  user_id: string;
  role_id: string;
  document_attachment_id?: string | null;
  created_by?: string | null;
  Status: number;
  base_id: string;
  createdAt: Date;
  updatedAt: Date;

  user: User;
  role: Role;
  creator?: User;
  base: Base;
  document?: Document;
}

export enum OperatorBookingJobStatus {
  Active = 'Active',
  Inactive = 'Inactive',
  Assigned = 'Assigned',
  Rejected = 'Rejected'
}

export interface Lease {
  id: string
  user_id: string
  start_date: Date
  end_date: Date
  hours_operation_per_day: string
  store_id: string
  location_id: string
  distance: string
  booking_location_lat: string
  booking_location_lng: string
  total_tractor_cost: number
  total_attachment_cost: number
  total_distance_cost: number
  total_service_charge: number
  total_tax: number
  total_cost: number
  lease_attachment_id: string
  created_by: string
  status: string
  base_id: string
  createdAt: Date
  updatedAt: Date
  LeaseTractor: LeaseTractor[]
  LeaseAttachment: LeaseAttachment[]
  user: User
  location: Location
  document: LeaseDocument
  creator: User
  base: Base
}

export interface LeaseDocument {
  id: string
  attachment: string
  created_by?: string
  base_id: string
  createdAt: Date
  updatedAT: Date
  creator?: User
  base: Base
  Lease: Lease[]
}

export interface ownerOperatorRequest {
  id: string
  booking_id: string
  operator_id: string
  base_id: string
  operator_response: ownerOperatorResponse
  createdAt: Date
  updatedAt: Date
  booking: Booking
  operator: Operator
  base: Base
}

export interface Logs {
  id: string;
  action: string;
  email: string;
  userId: string;
  user: User;
  details: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface OperatorAddStoreReuests {
  id: string
  operator_id: string
  store_id: string
  operator_response: ownerOperatorResponse
  store_owner_response: ownerOperatorResponse
  cost_per_job?: string
  cost_per_hour?: string
  cost_per_month?: string
  note?: string
  base_id: string
  createdAt: Date
  updatedAt: Date

  store: Store
  operator: Operator
  base: Base
}

export interface Payment {
  id: string;
  booking_id: string
  transactionType: TransactionType
  transactionMethod: TransactionMethod
  sender_id: string
  recieptant_id: string
  amount: number
  status: PaymentStatus
  screenshots: string[]
  transaction_reference: string[]
  base_id: string
  bankAccount_id?: string
  paypal_id?: string
  upi_id?: string
  rejecting_reasons: string[]
  createdAt: Date;
  updatedAt: Date;
  sender: User
  reciever: User
  booking: Booking
  BankAccount?: BankAccount
  PayPal?: PayPal
  UPI?: UPI
  base: Base
}

export interface BankAccount {
  id: string
  ownerId: string
  accountHolderName: string
  bankName: string
  accountNumber: string
  swiftCode?: string
  iban?: string
  routingNumber?: string
  branchCode?: string
  currency: string
  country: string
  base_id: string

  createdAt: Date
  updatedAt: Date

  owner: User
  payments: Payment[]
  base: Base
}

export interface PayPal {
  id: string
  email: string
  ownerId: string
  base_id: string

  createdAt: Date
  updatedAt: Date

  owner: User
  payments: Payment[]
  base: Base
}

export interface UPI {
  id: string
  upi_id: string
  ownerId: string
  qr_code: string
  base_id: string

  createdAt: Date
  updatedAt: Date

  owner: User
  payments: Payment[]
  base: Base
}

export enum PaymentStatus {
  NotGenerated,
  FarmerPENDING,
  FarmerCONFIRMED,
  OwnerPending,
  OwnerREJECTED,
  COMPLETED,
  PAID
}

export interface Inquiry {
  id: string
  first_name: string
  last_name: string
  email: string
  phone: string
  tractor_type: TractorType
  budget: string
  message: string
  base_id: string
  createdAt: string
  updatedAt: string
}

export interface Subscriptions {
  id: string
  name: string
  created_by: string
  type: SubscriptionType
  actual_cost: number
  discount_cost: number
  features: string[]
  focused_features: string[]
  total_days: number
  total_stores?: number
  total_devices?: number
  total_operators?: number
  total_tractors?: number
  total_attachments?: number
  base_id: string
  for_owner: boolean
  for_dealer: boolean
  createdAt: Date
  updatedAt: Date
  OwnerSubscribed: OwnerSubscribed[]
  creator: User
  base: Base
  DealerSubscribed: DealerSubscribed[]
}

export interface OwnerSubscribed {
  id: string
  user_id: string
  subscription_id: string
  end_date: Date
  base_id: string
  status: boolean
  createdAt: Date
  updatedAt: Date
  user: User
  subscription: Subscriptions
  base: Base
}

export interface DealerSubscribed {
  id: string
  user_id: string
  subscription_id: string
  end_date: Date
  base_id: string
  status: boolean
  createdAt: Date
  updatedAt: Date
  user: User
  subscription: Subscriptions
  base: Base
}

export interface DealerStore {
  id: string
  owner_id: string
  name: string
  description: string
  banner?: string
  logo?: string
  opening_time: Date
  closing_time: Date
  closing_days: string[]
  created_by: string
  base_id: string
  rating_id: string[]
  location_id: string
  createdAt: Date
  updatedAt: Date
  owner: User
  location: Location
  creator: User
  base: Base
  rating: Rating[]
  TractorInDealerStore: TractorInDealerStore[]
  AttachmentInDealerStore: AttachmentInDealerStore[]
}

export interface TractorInDealerStore {
  id: string
  baseTractorId: string
  base_id: string
  price: number
  store_id: string
  document_id: string
  lat?: string
  lan?: string
  createdAt: Date
  updatedAt: Date
  baseTractor: Tractor
  base: Base
  store: DealerStore
  document: Document
  TractorInStoreRating: TractorInStoreRating[]
}

export interface AttachmentInDealerStore {
  id: string
  baseAttachmentId: string
  base_id: string
  price: number
  store_id: string
  createdAt: Date
  updatedAt: Date
  baseAttachment: Attachment
  base: Base
  store: DealerStore
  AttachmentInStoreRating: AttachmentInStoreRating[]
}

export interface TractorLead {
  id: string
  user_id: string
  message?: string | null
  tractorId: string
  dealerStoreId: string
  base_id: string
  createdAt: Date
  updatedAt: Date
  tractor: Tractor
  dealerStore: DealerStore
  user: User
  base: Base
}

export interface AttachmentLead {
  id: string
  user_id: string
  message?: string | null
  attachmentId: string
  dealerStoreId: string
  base_id: string
  createdAt: Date
  updatedAt: Date
  attachment: Attachment
  dealerStore: DealerStore
  user: User
  base: Base
}

export interface Farm {
  id: string
  owner_id: string
  base_id: string
  type: FarmType
  name: string
  description?: string
  boundary: any
  createdAt: Date
  updatedAt: Date

  Owner: User
  base: Base
  Booking: Booking[];
}

export interface FarmerNotification {
  id: string
  title: string
  message: string
  type: FarmerNotificationType
  userId: string
  baseId: string
  createdAt: Date
  updatedAt: Date

  user: User
  base: Base
}

export interface OwnerNotification {
  id        :string              
  title     :string
  message   :string
  type      :OwnerNotificationType
  userId    :string
  baseId    :string
  createdAt :Date
  updatedAt :Date

  user :User
  base :Base
}

export enum OwnerNotificationType {
  storeCreated,
  Booking
}

export enum FarmerNotificationType {
  farmAdded,
  bookingConfirmation,
  bookingRejected,
  bookingAssigned,
  bookingArriving,
  bookingArrived,
  workStarted,
  workPaused,
  paymentRequired,
  paymentSent,
  paymentRejected,
  paymentAccepted
}

export enum BookingType {
  standalone,
  store
}

export enum FarmType {
  polygon,
  rectangle
}

export enum SubscriptionType {
  Basic = "Basic",
  Business = "Business",
  Premium = "Premium",
  Custom = "Custom"
}

export enum TransactionType {
  Booking,
  Maintainance,
  Comission,
  Dealer,
}

export enum TransactionMethod {
  UPI,
  PayPal,
  Bank,
  CoD,
}

export enum ownerOperatorResponse {
  NotSeen = "NotSeen",
  Accept = "Accept",
  Reject = "Reject"
}

export enum AuthType {
  GOOGLE = "GOOGLE",
  EMAIL = "EMAIL",
}

export enum TractorType {
  LARGE = "large",
  SMALL = "small",
  MEDIUM = "medium",
}

export enum BookingHours {
  ONE_HOUR = "One_Hour",
  TWO_HOURS = "Two_Hours",
  THREE_HOURS = "Three_Hours",
  FOUR_HOURS = "Four_Hours",
  FIVE_HOURS = "Five_Hours",
  SIX_HOURS = "Six_Hours",
  SEVEN_HOURS = "Seven_Hours",
  EIGHT_HOURS = "Eight_Hours",
}

export enum BookingStatus {
  Open = "Open",
  Accepted = "Accepted",
  Rejected = "Rejected",
  Confirmed = "Confirmed",
  Cancelled = "Cancelled",
  Arriving = "Arriving",
  Arrived = "Arrived",
  Started = "Started",
  Stopped = "Stopped",
  Finished = "Finished"
}

export enum StoreOperatorStatus {
  Requested = 'Requested',
  Accepted = 'Accepted',
  Rejected = 'Rejected',
  Active = 'Active',
  Inactive = 'Inactive',
  Deleted = 'Deleted'
}

