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
  const { messages: allMessages, sendMessage, userId, people } = useStore();
  const messages = allMessages[groupId] || [];
  const [text, setText] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  
  // Shared motion value for swiping all messages at once (Instagram style)
  const x = useMotionValue(0);
  const timeOpacity = useTransform(x, [-60, -20], [1, 0]);

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
      initial={{ x: "100%" }}
      animate={{ x: 0 }}
      exit={{ x: "100%" }}
      transition={{ type: "spring", damping: 25, stiffness: 200 }}
      className="fixed inset-0 z-[80] bg-surface flex flex-col shadow-2xl overflow-hidden"
    >
      <header className="px-5 pt-8 pb-4 border-b border-hairline flex items-center justify-between bg-surface/90 backdrop-blur-xl sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <button 
            onClick={onClose} 
            className="size-10 rounded-full bg-surface-soft flex items-center justify-center hover:bg-hairline active:scale-90 transition-all"
          >
            <X className="size-5" />
          </button>
          <div>
            <h2 className="text-sm font-bold text-ink">Group Chat</h2>
            <div className="flex items-center gap-1.5">
              <div className="size-1.5 rounded-full bg-success animate-pulse" />
              <p className="text-[10px] text-ink-soft uppercase tracking-widest font-black">Online</p>
            </div>
          </div>
        </div>
        <div className="size-10 rounded-full bg-brand/10 text-brand flex items-center justify-center shadow-inner">
          <MessageCircle className="size-5" />
        </div>
      </header>

      {/* Main chat area with global drag */}
      <div className="flex-1 overflow-hidden relative bg-surface-soft/30">
        <div 
          ref={scrollRef}
          className="h-full overflow-y-auto scroll-smooth"
        >
          <motion.div
            drag="x"
            dragConstraints={{ left: -100, right: 0 }}
            dragElastic={0.05}
            dragDirectionLock
            onDragEnd={() => animate(x, 0, { type: "spring", bounce: 0, duration: 0.4 })}
            style={{ x }}
            className="min-h-full p-5 space-y-1 relative"
          >
            <AnimatePresence initial={false}>
              {messages.length === 0 ? (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="h-full min-h-[60vh] flex flex-col items-center justify-center text-center opacity-40 pointer-events-none"
                >
                  <div className="size-20 rounded-full bg-surface flex items-center justify-center mb-6 shadow-soft">
                    <MessageCircle className="size-10 text-brand" />
                  </div>
                  <p className="text-sm font-bold text-ink">No messages yet</p>
                  <p className="text-[11px] text-ink-soft mt-1">Be the first to say hi!</p>
                </motion.div>
              ) : (
                messages.map((m, i) => {
                  const isMe = m.senderId === userId;
                  const sender = personById(people, m.senderId);
                  const isSameAsNext = i < messages.length - 1 && messages[i + 1].senderId === m.senderId;
                  const isSameAsPrev = i > 0 && messages[i - 1].senderId === m.senderId;
                  const showAvatar = !isMe && !isSameAsNext;
                  const showName = !isMe && !isSameAsPrev;
                  const time = new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

                  return (
                    <MessageBubble 
                      key={m.id}
                      message={m}
                      isMe={isMe}
                      sender={sender}
                      showAvatar={showAvatar}
                      showName={showName}
                      isSameAsNext={isSameAsNext}
                      time={time}
                      timeOpacity={timeOpacity}
                    />
                  );
                })
              )}
            </AnimatePresence>
          </motion.div>
        </div>
      </div>

      <div className="p-4 bg-surface border-t border-hairline safe-area-bottom z-30">
        <form onSubmit={handleSend} className="flex items-center gap-3 bg-surface-soft rounded-[1.75rem] p-1.5 pr-2 focus-within:ring-2 focus-within:ring-brand/20 transition-all border border-hairline/30 shadow-sm">
          <input 
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 bg-transparent px-4 py-2.5 text-sm font-medium outline-none placeholder:text-ink-soft/60"
          />
          <button 
            type="submit"
            disabled={!text.trim()}
            className={cn(
              "size-10 rounded-full flex items-center justify-center transition-all shadow-lg active:scale-90",
              text.trim() ? "bg-brand text-white shadow-brand/20" : "bg-ink-soft/10 text-ink-soft grayscale opacity-50"
            )}
          >
            <Send className="size-5" />
          </button>
        </form>
      </div>
    </motion.div>
  );
}

function MessageBubble({ message, isMe, sender, showAvatar, showName, isSameAsNext, time, timeOpacity }: any) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 10, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      className={cn(
        "w-full flex flex-col relative",
        isMe ? "items-end" : "items-start",
        !isSameAsNext && "mb-3"
      )}
    >
      {showName && !isMe && (
        <span className="text-[10px] font-bold text-ink-soft ml-11 mb-1 opacity-60 uppercase tracking-widest">{sender?.name.split(" ")[0]}</span>
      )}
      <div className="flex items-end gap-2 max-w-[85%] relative">
        {!isMe && (
          <div className="size-8 shrink-0">
            {showAvatar ? (
              <PersonAvatar person={sender!} size="sm" />
            ) : (
              <div className="size-8" />
            )}
          </div>
        )}
        
        <div
          className={cn(
            "px-4 py-2.5 rounded-2xl text-sm font-medium shadow-sm transition-colors relative z-10",
            isMe 
              ? "bg-brand text-white rounded-tr-sm" 
              : "bg-white text-ink rounded-tl-sm border border-hairline/50"
          )}
        >
          {message.text}
        </div>
      </div>

      {/* Timestamp reveal - Instagram style (fixed relative to row) */}
      <motion.div 
        style={{ opacity: timeOpacity }}
        className="absolute left-[calc(100%+1rem)] whitespace-nowrap text-[10px] font-bold text-ink-soft flex items-center h-full pointer-events-none"
      >
        <Clock className="size-3 mr-1 opacity-30" />
        {time}
      </motion.div>
    </motion.div>
  );
}
