import type { ChatData, ChatConversation, ChatUser } from "@/types/chat";

// Current user (CVE 분석가)
const currentUser: ChatUser = {
  id: "analyst",
  name: "CVE 분석가",
  username: "@analyst",
  avatar: "",
  isOnline: true,
};

// AI Assistant
const users: Record<string, ChatUser> = {
  ai_assistant: {
    id: "ai_assistant",
    name: "취꼼마 AI",
    username: "@취꼼마_AI",
    avatar: "",
    isOnline: true,
  },
  cve_ai: {
    id: "cve_ai",
    name: "CVE 보안 AI",
    username: "@CVE_AI",
    avatar: "",
    isOnline: true,
  },
  security_bot: {
    id: "security_bot",
    name: "보안 봇",
    username: "@SECURITY_BOT",
    avatar: "",
    isOnline: true,
  },
};

// Mock conversations
const conversations: ChatConversation[] = [
  {
    id: "conv-ai-assistant",
    participants: [currentUser, users.ai_assistant],
    unreadCount: 1,
    lastMessage: {
      id: "msg-ai-1",
      content: "CVE-2024-3094에 대한 분석이 완료되었습니다. 심각도는 Critical입니다.",
      timestamp: "2024-07-10T16:00:00Z",
      senderId: "ai_assistant",
      isFromCurrentUser: false,
    },
    messages: [
      {
        id: "msg-ai-0",
        content: "CVE-2024-3094 분석 요청드립니다.",
        timestamp: "2024-07-10T15:55:00Z",
        senderId: "analyst",
        isFromCurrentUser: true,
      },
      {
        id: "msg-ai-1",
        content: "CVE-2024-3094에 대한 분석이 완료되었습니다. 심각도는 Critical입니다.",
        timestamp: "2024-07-10T16:00:00Z",
        senderId: "ai_assistant",
        isFromCurrentUser: false,
      },
    ],
  },
  {
    id: "conv-cve-ai",
    participants: [currentUser, users.cve_ai],
    unreadCount: 0,
    lastMessage: {
      id: "msg-cve-ai-1",
      content: "최신 보안 패치가 적용되었습니다. 12개의 CVE가 해결되었습니다.",
      timestamp: "2024-06-06T14:30:00Z",
      senderId: "cve_ai",
      isFromCurrentUser: false,
    },
    messages: [
      {
        id: "msg-cve-ai-1",
        content: "최신 보안 패치가 적용되었습니다. 12개의 CVE가 해결되었습니다.",
        timestamp: "2024-06-06T14:30:00Z",
        senderId: "cve_ai",
        isFromCurrentUser: false,
      },
    ],
  },
  {
    id: "conv-security-bot",
    participants: [currentUser, users.security_bot],
    unreadCount: 0,
    lastMessage: {
      id: "msg-security-last",
      content: "보안 스캔을 시작하겠습니다.",
      timestamp: "2024-06-06T12:15:00Z",
      senderId: "analyst",
      isFromCurrentUser: true,
    },
    messages: [
      {
        id: "msg-security-1",
        content: "안녕하세요! 오늘 보안 점검은 어떻게 진행할까요?",
        timestamp: "2024-06-06T12:05:00Z",
        senderId: "security_bot",
        isFromCurrentUser: false,
      },
      {
        id: "msg-security-2",
        content: "현재 시스템에 취약점이 있는지 확인해주세요.",
        timestamp: "2024-06-06T12:08:00Z",
        senderId: "analyst",
        isFromCurrentUser: true,
      },
      {
        id: "msg-security-3",
        content: "전체 시스템 스캔을 실행하겠습니다. 약 5분 소요됩니다.",
        timestamp: "2024-06-06T12:10:00Z",
        senderId: "security_bot",
        isFromCurrentUser: false,
      },
      {
        id: "msg-security-4",
        content: "스캔 결과: 3개의 중요 취약점이 발견되었습니다.",
        timestamp: "2024-06-06T12:14:00Z",
        senderId: "security_bot",
        isFromCurrentUser: false,
      },
      {
        id: "msg-security-last",
        content: "보안 스캔을 시작하겠습니다.",
        timestamp: "2024-06-06T12:15:00Z",
        senderId: "analyst",
        isFromCurrentUser: true,
      },
    ],
  },
];

export const mockChatData: ChatData = {
  currentUser,
  conversations,
};
