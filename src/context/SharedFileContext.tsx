"use client";

import React, { createContext, useContext, useState, useCallback } from "react";

interface SharedFileContextType {
  sharedFile: File | null;
  setSharedFile: (file: File | null) => void;
  clearSharedFile: () => void;
}

const SharedFileContext = createContext<SharedFileContextType | undefined>(undefined);

export const SharedFileProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [sharedFile, setSharedFileState] = useState<File | null>(null);

  const setSharedFile = useCallback((file: File | null) => {
    setSharedFileState(file);
  }, []);

  const clearSharedFile = useCallback(() => {
    setSharedFileState(null);
  }, []);

  return (
    <SharedFileContext.Provider value={{ sharedFile, setSharedFile, clearSharedFile }}>
      {children}
    </SharedFileContext.Provider>
  );
};

export const useSharedFile = () => {
  const context = useContext(SharedFileContext);
  if (context === undefined) {
    throw new Error("useSharedFile must be used within a SharedFileProvider");
  }
  return context;
};
