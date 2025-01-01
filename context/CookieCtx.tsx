"use client"
import { createContext, Dispatch, PropsWithChildren, SetStateAction, useContext, useEffect, useState } from 'react';
import { createCookie, getCookie } from '../app/actions';

type CookieCtxType = {
  cookie: string,
  setCookie: Dispatch<SetStateAction<string>>
}

export const CookieCtx = createContext<CookieCtxType | undefined>(undefined);

export const useCookie = (): CookieCtxType => {
  const context = useContext(CookieCtx);

  if (!context) {
    throw new Error('useCookie must be used within a CookieProvider');
  }

  return context;
};

export const CookieProvider = ({ children }: PropsWithChildren) => {
  const [cookie, setCookie] = useState<string>("");

  useEffect(() => {
    (async () => {
      if (!cookie) {
        let storedCookie: string | undefined;
        storedCookie = (await getCookie()).data
        console.log("storedCookie", storedCookie)
        if (!storedCookie) {
          storedCookie = (await createCookie()).data
          console.log("newStoredCookie", storedCookie)
          if (!storedCookie) {
            console.error("There was a problem creating a cookie.")
          } else {
            setCookie(storedCookie)
          }
        } else {
          setCookie(storedCookie)
        }
      }
    })()
  }, []);

  return (
    <CookieCtx.Provider value={{ cookie, setCookie }}>
      {children}
    </CookieCtx.Provider>
  );
};
