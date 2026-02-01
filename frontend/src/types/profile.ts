export interface UserProfile {
  id: number;
  username: string;
  avatarUrl: string | null;
  bio: string | null;
  age: number | null;
  gender: 'male' | 'female' | 'diverse' | null;
  state: string | null;
  signature: string | null;
  memberSince: string;
  onlineStatus: boolean;
  lastSeen: string | null;
  profileVisibility: 'public' | 'friends_only' | 'private';
  stats: {
    ratingsCount: number;
    ratingsCommentsCount: number;
    friendsCount: number;
  };
  isFriend: boolean;
  friendRequestStatus: 'pending' | 'accepted' | null;
  friendshipId: number | null;
  friendRequestDirection: 'sent' | 'received' | null;
  canViewProfile: boolean;
  isOwnProfile: boolean;
}

export interface PrivateProfile {
  canViewProfile: false;
  username: string;
  avatarUrl: string | null;
}

export interface ActivityItem {
  type: 'rating';
  id: number;
  productId: number;
  productName: string;
  category: string;
  overall: number;
  comment?: string;
  createdAt: string;
}

export interface ActivityResponse {
  items: ActivityItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export type ProfileVisibility = 'public' | 'friends_only' | 'private';
export type FriendRequestPermission = 'everyone' | 'friends_of_friends' | 'none';
export type Gender = 'male' | 'female' | 'diverse';

export interface FriendshipUser {
  id: number;
  username: string;
  avatarUrl: string | null;
  onlineStatus: boolean;
  lastSeen: string | null;
}

export interface Friend {
  friendshipId: number;
  user: FriendshipUser;
  since: string;
}

export interface PendingRequest {
  friendshipId: number;
  user: FriendshipUser;
  createdAt: string;
}

export interface FriendshipsResponse {
  friends: Friend[];
  pendingReceived: PendingRequest[];
  pendingSent: PendingRequest[];
}

export type NotificationType = 'friend_request' | 'friend_accepted' | 'new_rating' | 'comment_on_profile' | 'rating_vote';

export interface NotificationSender {
  id: number;
  username: string;
  avatarUrl: string | null;
}

export interface NotificationItem {
  id: number;
  type: NotificationType;
  message: string;
  isRead: boolean;
  referenceId: number | null;
  createdAt: string;
  sender: NotificationSender | null;
}

export interface NotificationsResponse {
  notifications: NotificationItem[];
  unreadCount: number;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export const GERMAN_STATES = [
  'Baden-Württemberg', 'Bayern', 'Berlin', 'Brandenburg', 'Bremen',
  'Hamburg', 'Hessen', 'Mecklenburg-Vorpommern', 'Niedersachsen',
  'Nordrhein-Westfalen', 'Rheinland-Pfalz', 'Saarland', 'Sachsen',
  'Sachsen-Anhalt', 'Schleswig-Holstein', 'Thüringen',
] as const;
