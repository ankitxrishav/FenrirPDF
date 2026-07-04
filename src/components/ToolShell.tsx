"use client";

import React from "react";

interface ToolShellProps {
  title: string;
  description: string;
  optionsPanel?: React.ReactNode;
  children: React.ReactNode;
}

export const ToolShell: React.FC<ToolShellProps> = ({
  title,
  description,
  optionsPanel,
  children,
}) => {
  return (
    <div className="flex flex-col min-h-screen">
      <div className="text-center mb-8">
        <h1 className="text-4xl md:text-5xl font-bold text-primary tracking-tight">
          {title}
        </h1>
        <p className="mt-4 text-lg text-foreground/80 max-w-3xl mx-auto">
          {description}
        </p>
      </div>

      <div className="flex flex-col lg:flex-row gap-8 items-start">
        {optionsPanel && (
          <aside className="w-full lg:w-80 shrink-0 bg-card border rounded-xl p-6 shadow-sm">
            {optionsPanel}
          </aside>
        )}
        <div className="flex-1 w-full space-y-6">
          {children}
        </div>
      </div>
    </div>
  );
};
