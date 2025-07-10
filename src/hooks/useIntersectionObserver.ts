import { useEffect, useRef } from "react";

export function useIntersectionObserver(
  callback: () => void,
  options?: IntersectionObserverInit
) {
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!ref.current) return;
    const observer = new window.IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting) callback();
      },
      options
    );
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, [callback, options]);

  return ref;
} 