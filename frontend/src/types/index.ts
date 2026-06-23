export interface User {
  id: string;
  email: string;
  name: string;
  created_at: string;
}

export interface Emoji {
  id: string;
  user_id: string;
  title: string;
  prompt: string;
  image_url: string;
  style: EmojiStyle;
  created_at: string;
}

export type EmojiStyle = "기본" | "귀여움" | "집중" | "행복";

export interface EmojiListResponse {
  items: Emoji[];
  total: number;
  page: number;
  size: number;
  pages: number;
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
  user: User;
}

export interface GenerateEmojiRequest {
  title: string;
  style: EmojiStyle;
}

export const EMOJI_STYLES: { value: EmojiStyle; label: string; description: string }[] = [
  { value: "기본", label: "기본", description: "차분하고 프로페셔널한 표현" },
  { value: "귀여움", label: "귀여움", description: "귀엽고 사랑스러운 표현" },
  { value: "집중", label: "집중", description: "집중하고 열정적인 표현" },
  { value: "행복", label: "행복", description: "기쁘고 활기찬 표현" },
];

export const STATUS_PRESETS = [
  "회의중",
  "출장중",
  "프로젝트중",
  "외근중",
  "휴가중",
  "고객미팅중",
  "제안서작성중",
];
