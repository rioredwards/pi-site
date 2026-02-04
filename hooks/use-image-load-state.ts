"use client";

import { useCallback, useEffect, useState } from "react";

const DEFAULT_MAX_RETRIES = 2;

interface UseImageLoadStateOptions {
  maxRetries?: number;
}

export function useImageLoadState(options: UseImageLoadStateOptions = {}) {
  const { maxRetries = DEFAULT_MAX_RETRIES } = options;
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [imageKey, setImageKey] = useState(0);

  const retry = useCallback(() => {
    setRetryCount(0);
    setImageKey((prev) => prev + 1);
    setLoading(true);
    setError(false);
  }, []);

  useEffect(() => {
    if (error && retryCount < maxRetries) {
      const delay = Math.pow(2, retryCount) * 1000;
      const timer = setTimeout(() => {
        setRetryCount((prev) => prev + 1);
        setImageKey((prev) => prev + 1);
        setLoading(true);
        setError(false);
      }, delay);
      return () => clearTimeout(timer);
    }
  }, [error, retryCount, maxRetries]);

  const onLoadStart = useCallback(() => {
    setLoading(true);
    setError(false);
  }, []);

  const onLoad = useCallback(() => {
    setLoading(false);
    setError(false);
  }, []);

  const onError = useCallback(() => {
    setLoading(false);
    setError(true);
  }, []);

  const hasExhaustedRetries = error && retryCount >= maxRetries;

  return {
    loading,
    error,
    hasExhaustedRetries,
    retry,
    imageKey,
    onLoadStart,
    onLoad,
    onError,
  };
}
