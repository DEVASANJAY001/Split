import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";

export default function ScrollToTop() {
  const { pathname } = useLocation();
  const scrollPositions = useRef<Record<string, number>>({});

  useEffect(() => {
    // Save current scroll position before leaving
    const handleBeforeUnload = () => {
      scrollPositions.current[pathname] = window.scrollY;
    };
    
    // Restoration logic
    if (pathname === "/") {
      // Restore home position if it exists
      const savedPos = scrollPositions.current[pathname];
      if (savedPos !== undefined) {
        window.scrollTo(0, savedPos);
      } else {
        window.scrollTo(0, 0);
      }
    } else {
      // Always scroll to top for other pages
      window.scrollTo(0, 0);
    }

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => {
      // Save position on cleanup (when component updates due to path change)
      scrollPositions.current[pathname] = window.scrollY;
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [pathname]);

  return null;
}
