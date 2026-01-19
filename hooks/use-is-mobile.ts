import { useEffect, useState } from "react";

export const useIsMobile = () => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      const touch = "ontouchstart" in window || navigator.maxTouchPoints > 0;
      const userAgent =
        /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(
          navigator.userAgent.toLowerCase()
        );

      setIsMobile(touch && userAgent);
    };

    checkMobile();
  }, []);

  return isMobile;
};
