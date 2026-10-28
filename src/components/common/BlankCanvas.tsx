import React from 'react';

interface BlankCanvasProps {
  pageTitle: string;
  pageSummary: string;
}

export const BlankCanvas: React.FC<BlankCanvasProps> = ({ pageTitle, pageSummary }) => {
  return (
    <div className="flex-1 w-full min-h-[460px] rounded-2xl border border-dashed border-slate-200 bg-white/50 flex flex-col items-center justify-center p-8 text-center transition-colors">
      <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 mb-4 border border-slate-200/60">
        <span className="text-sm font-semibold tracking-wider uppercase font-mono text-slate-500">
          {pageTitle.slice(0, 2).toUpperCase()}
        </span>
      </div>
      <h3 className="text-base font-semibold text-slate-800">
        {pageTitle} Canvas
      </h3>
      <p className="mt-1 text-sm text-slate-500 max-w-md">
        {pageSummary}
      </p>
      <div className="mt-4 inline-flex items-center gap-2 text-xs font-medium text-slate-400 font-mono">
        <span>Ready for content</span>
      </div>
    </div>
  );
};
