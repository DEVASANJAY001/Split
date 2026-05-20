import { useState, useRef, useEffect } from "react";
import { useStore, Message, personById } from "@/lib/store";
import { PersonAvatar } from "./Avatar";
import { Send, X, MessageCircle, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence, useMotionValue, useTransform, animate } from "framer-motion";

interface GroupChatProps {
  groupId: string;
  onClose: () => void;
}

export function GroupChat({ groupId, onClose }: GroupChatProps) {
  const { messages: allMessages, sendMessage, userId, people, groups } = useStore();
  const group = groups.find(g => g.id === groupId);
  const messages = allMessages[groupId] || [];
  const [text, setText] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  
  const scrollToBottom = (behavior: ScrollBehavior = "smooth") => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior
      });
    }
  };

  useEffect(() => {
    scrollToBottom(messages.length <= 1 ? "auto" : "smooth");
  }, [messages]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;
    sendMessage(groupId, text.trim());
    setText("");
  };

  return (
    <motion.div 
      initial={{ y: "100%", opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: "100%", opacity: 0 }}
      transition={{ type: "spring", damping: 30, stiffness: 300 }}
      className="fixed inset-0 z-[80] bg-background flex flex-col overflow-hidden"
    >
      {/* Immersive Background Layer */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-brand/5 blur-[100px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-brand/5 blur-[100px] rounded-full" />
      </div>

      {/* Modern Header */}
      <header className="px-5 pt-[calc(env(safe-area-inset-top,0px)+1rem)] pb-4 flex items-center justify-between bg-surface/80 backdrop-blur-2xl border-b border-hairline/50 z-20 relative">
        <div className="flex items-center gap-4">
          <button 
            onClick={onClose} 
            className="size-10 rounded-2xl bg-surface shadow-sm border border-hairline flex items-center justify-center hover:bg-surface-soft active:scale-95 transition-all text-ink-soft"
          >
            <X className="size-5" />
          </button>
          <div className="flex flex-col">
            <h2 className="text-base font-black text-ink tracking-tightest leading-tight">
              {group?.name || "Conversation"}
            </h2>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[9px] font-black tracking-[0.15em] text-ink-soft">Secure Channel</span>
            </div>
          </div>
        </div>
        <div className="flex -space-x-2">
          {group?.memberIds?.slice(0, 3).map(id => {
            const p = people.find(x => x.id === id);
            return p ? <PersonAvatar key={id} person={p} size="sm" ring className="border-2 border-surface shadow-sm" /> : null;
          })}
        </div>
      </header>

      {/* Main Message Stream */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-6 py-6 space-y-1.5 scroll-smooth z-10 relative"
      >
        <AnimatePresence initial={false}>
          {messages.length === 0 ? (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="h-full flex flex-col items-center justify-center text-center opacity-30"
            >
              <MessageCircle className="size-12 mb-4" strokeWidth={1.5} />
              <p className="text-sm font-bold tracking-tightest">Start Chatting</p>
            </motion.div>
          ) : (
            messages.map((m, i) => {
              const isMe = m.senderId === userId;
              const sender = personById(people, m.senderId);
              const isNextSame = i < messages.length - 1 && messages[i + 1].senderId === m.senderId;
              const isPrevSame = i > 0 && messages[i - 1].senderId === m.senderId;
              const time = new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

              return (
                <MessageItem 
                  key={m.id}
                  message={m}
                  isMe={isMe}
                  sender={sender}
                  isFirst={!isPrevSame}
                  isLast={!isNextSame}
                  time={time}
                />
              );
            })
          )}
        </AnimatePresence>
      </div>

      {/* Input Area */}
      <div className="p-4 bg-surface/60 backdrop-blur-xl border-t border-hairline/50 z-20 relative safe-area-bottom">
        <form 
          onSubmit={handleSend} 
          className="flex items-center gap-3 bg-surface-soft/50 rounded-[28px] p-1.5 pl-6 border border-hairline/30"
        >
          <input 
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 bg-transparent py-2.5 text-sm font-bold outline-none placeholder:text-ink-soft text-ink"
          />
          <button 
            type="submit"
            disabled={!text.trim()}
            className={cn(
              "size-10 rounded-full flex items-center justify-center transition-all active:scale-90 shadow-sm",
              text.trim() 
                ? "bg-ink text-background" 
                : "bg-surface-soft text-ink-soft"
            )}
          >
            <Send className="size-5" strokeWidth={2.5} />
          </button>
        </form>
      </div>
    </motion.div>
  );
}

function MessageItem({ message, isMe, sender, isFirst, isLast, time }: any) {
  const x = useMotionValue(0);
  // Sent (isMe): Drag Right to see time on Left
  // Received (!isMe): Drag Left to see time on Right
  const timeOpacity = useTransform(x, isMe ? [20, 60] : [-60, -20], isMe ? [0, 1] : [1, 0]);

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className={cn(
        "flex flex-col relative",
        isMe ? "items-end" : "items-start",
        isLast ? "mb-4" : "mb-0.5"
      )}
    >
      {isFirst && !isMe && (
        <span className="text-[9px] font-black text-ink-soft ml-1 mb-1.5 tracking-widest leading-none opacity-60">{sender?.name.split(" ")[0]}</span>
      )}
      
      <div className="flex items-end gap-3 max-w-[85%] relative">
        {/* Sent Time (Left Reveal) */}
        {isMe && (
          <motion.div 
            style={{ opacity: timeOpacity }}
            className="absolute left-[-60px] whitespace-nowrap text-[9px] font-black text-ink-soft flex items-center h-full pointer-events-none tracking-widest"
          >
            {time}
          </motion.div>
        )}

        <motion.div
          drag="x"
          dragConstraints={isMe ? { left: 0, right: 80 } : { left: -80, right: 0 }}
          dragElastic={0.1}
          style={{ x }}
          onDragEnd={() => animate(x, 0, { type: "spring", bounce: 0, duration: 0.5 })}
          className={cn(
            "px-4 py-2.5 text-sm font-bold shadow-sm transition-all cursor-grab active:cursor-grabbing select-none",
            isMe 
              ? "bg-ink text-background" 
              : "bg-surface text-ink border border-hairline",
            isMe
              ? (isFirst ? "rounded-[20px] rounded-tr-none" : isLast ? "rounded-[20px] rounded-br-[4px]" : "rounded-[20px] rounded-r-[4px]")
              : (isFirst ? "rounded-[20px] rounded-tl-none" : isLast ? "rounded-[20px] rounded-bl-[4px]" : "rounded-[20px] rounded-l-[4px]")
          )}
        >
          {message.text}
        </motion.div>

        {/* Received Time (Right Reveal) */}
        {!isMe && (
          <motion.div 
            style={{ opacity: timeOpacity }}
            className="absolute right-[-60px] whitespace-nowrap text-[9px] font-black text-ink-soft flex items-center h-full pointer-events-none tracking-widest"
          >
            {time}
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}
