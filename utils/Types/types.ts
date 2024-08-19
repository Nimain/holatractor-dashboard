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
    Store: Store[];
    createdStores: Store[];
    storeStocks: StoreStock[];
    ratings: Rating[];
    TractorInStoreRating: TractorInStoreRating[];
    AttachmentInStoreRating: AttachmentInStoreRating[];
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
  }
  
  export interface Inventory {
    id: string;
    tractor_id: string;
    city: string;
    created_by: string;
    base_id: string;
    createdAt: Date;
    updatedAt: Date;
    tractor: Tractor;
    storeStock: StoreStock[];
  }
  
  export interface Store {
    id: string;
    owner_user_id: string;
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
    owner: User;
    creator: User;
    base: Base;
    rating: Rating[];
    Booking: Booking[];
    TractorInStore: TractorInStore[];
    AttachmentInStore: AttachmentInStore[];
  }
  
  export interface TractorInStore {
    id: string;
    baseTractorId: string;
    base_id: string;
    min_price: number;
    max_price: number;
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
    min_price: number;
    max_price: number;
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
    first_name: string;
    middle_name?: string | null;
    last_name: string;
    email: string;
    password?: string | null;
    googleId?: string | null;
    mobile: string;
    country_code: string;
    image?: string | null;
    dob: Date;
    age: number;
    gender: string;
    base_id: string;
    createdAt: Date;
    updatedAt: Date;
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
  