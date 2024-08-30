export interface User {
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
}

export interface Attachment {
  id: string;
  name: string;
  description: string;
  images: string[];
  tractorId: string[];
  base_id: string;
  createdAt: Date;
  updatedAt: Date;
  AttachmentInStore: AttachmentInStore[];
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

export interface Location {
  id: string;
  name: string;
  address: string;
  city: string;
  state: string;
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
}

export interface Booking {
  id: string;
  user_id: string;
  store_id: string;
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
  booking_location_lan: string;
  booking_location_lat: string;
  confirm: boolean;
  owner_confirm: boolean;
  distance: string;
  location_id: string;
  created_by: string;
  bookingStatus?: BookingStatus | null;
  createdAt: Date;
  updatedAt: Date;
  store: Store;
  location: Location;
  tractors: BookingTractor[];
  attachments: BookingAttachment[];
  OperatorBookingJob: OperatorBookingJob[];
}

export interface Inventory {
  id: string;
  tractor_id: string;
  city: string;
  created_by: string;
  base_id: string;
  min_price: number;
  max_price: number;
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
  image?: string | null;
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
  rating: Rating[];
  Booking: Booking[];
  TractorInStore: TractorInStore[];
  AttachmentInStore: AttachmentInStore[];
  OperatorInStore: OperatorInStore[];
  OperatorStoreCon: OperatorStoreCon[];
}

export interface TractorInStore {
  id: string;
  baseTractorId: string;
  base_id: string;
  hourly_price: number;
  store_id: string;
  createdAt: Date;
  updatedAt: Date;
  baseTractor: Tractor;
  base: Base;
  store: Store;
  BookingTractor: BookingTractor[];
  TractorInStoreRating: TractorInStoreRating[];
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
}

export interface Farmer {
  id: string;
  user_id: string;
  role_id: string;
  created_by?: string;
  Status: number;
  base_id: string;  
  createdAt: Date;
  updatedAt: Date;
  role: Role;
  user: User;
  createor?: User;
  base: Base;
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

export enum OperatorBookingJobStatus {
  Active = 'Active',
  Inactive = 'Inactive',
  Assigned = 'Assigned',
  Rejected = 'Rejected'
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
  OPEN = "Open",
  CONFIRM = "Confirm",
  CANCELLED = "Cancelled",
  REJECTED = "Rejected",
  COMPLETED = "Completed",
}

export enum StoreOperatorStatus {
  Requested = 'Requested',
  Accepted = 'Accepted',
  Rejected = 'Rejected',
  Active = 'Active',
  Inactive = 'Inactive',
  Deleted = 'Deleted'
}
