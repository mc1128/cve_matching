import { cn } from "@/lib/utils";

interface ColorAvatarProps {
  userId: string;
  name: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

// 사용자별 색상 매핑
const getUserColor = (userId: string) => {
  const colors = {
    ai_assistant: "bg-blue-500",
    cve_ai: "bg-green-500", 
    security_bot: "bg-purple-500",
    analyst: "bg-orange-500",
  };
  return colors[userId as keyof typeof colors] || "bg-gray-500";
};

// 사용자 이니셜 생성
const getUserInitials = (name: string) => {
  return name.split(' ').map(word => word[0]).join('').toUpperCase().slice(0, 2);
};

// 크기별 스타일
const getSizeStyles = (size: "sm" | "md" | "lg") => {
  const styles = {
    sm: "w-8 h-8 text-xs",
    md: "w-10 h-10 text-sm", 
    lg: "w-14 h-14 text-lg"
  };
  return styles[size];
};

export default function ColorAvatar({ userId, name, size = "md", className }: ColorAvatarProps) {
  return (
    <div 
      className={cn(
        "rounded-lg flex items-center justify-center text-white font-bold",
        getUserColor(userId),
        getSizeStyles(size),
        className
      )}
    >
      {getUserInitials(name)}
    </div>
  );
}
