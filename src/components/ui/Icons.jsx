import React from 'react';

export const TrashIcon = ({ className, width = 16, height = 16, strokeWidth = 2, ...props }) => (
  <svg fill="none" height={height} stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth={strokeWidth} viewBox="0 0 24 24" width={width} xmlns="http://www.w3.org/2000/svg" className={className} {...props}>
    <polyline points="3 6 5 6 21 6"></polyline>
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
  </svg>
);

export const SettingsIcon = ({ className, width = 24, height = 24, strokeWidth = 2, ...props }) => (
  <svg fill="none" height={height} stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth={strokeWidth} viewBox="0 0 24 24" width={width} xmlns="http://www.w3.org/2000/svg" className={className} {...props}>
    <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"></path>
    <circle cx="12" cy="12" r="3"></circle>
  </svg>
);

export const CheckIcon = ({ className, width = 24, height = 24, strokeWidth = 3, ...props }) => (
  <svg fill="none" height={height} stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth={strokeWidth} viewBox="0 0 24 24" width={width} xmlns="http://www.w3.org/2000/svg" className={className} {...props}>
    <polyline points="20 6 9 17 4 12"></polyline>
  </svg>
);

export const ExternalLinkIcon = ({ className, width = 24, height = 24, strokeWidth = 2, ...props }) => (
  <svg fill="none" height={height} stroke="currentColor" strokeWidth={strokeWidth} viewBox="0 0 24 24" width={width} xmlns="http://www.w3.org/2000/svg" className={className} {...props}>
    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
    <polyline points="15 3 21 3 21 9"></polyline>
    <line x1="10" x2="21" y1="14" y2="3"></line>
  </svg>
);

export const ArrowRightIcon = ({ className, width = 24, height = 24, strokeWidth = 3, ...props }) => (
  <svg fill="none" height={height} stroke="currentColor" strokeLinecap="round" strokeWidth={strokeWidth} viewBox="0 0 24 24" width={width} xmlns="http://www.w3.org/2000/svg" className={className} {...props}>
    <line x1="5" x2="19" y1="12" y2="12"></line>
    <polyline points="12 5 19 12 12 19"></polyline>
  </svg>
);

export const CloseIcon = ({ className, width = 24, height = 24, strokeWidth = 2.5, ...props }) => (
  <svg fill="none" height={height} stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth={strokeWidth} viewBox="0 0 24 24" width={width} xmlns="http://www.w3.org/2000/svg" className={className} {...props}>
    <line x1="18" x2="6" y1="6" y2="18"></line>
    <line x1="6" x2="18" y1="6" y2="18"></line>
  </svg>
);export const AlertCircleIcon = ({ className, width = 24, height = 24, strokeWidth = 2, ...props }) => (
  <svg fill="none" height={height} stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth={strokeWidth} viewBox="0 0 24 24" width={width} xmlns="http://www.w3.org/2000/svg" className={className} {...props}>
    <circle cx="12" cy="12" r="10"></circle>
    <line x1="15" x2="9" y1="9" y2="15"></line>
    <line x1="9" x2="15" y1="9" y2="15"></line>
  </svg>
);


export const PictureIcon = ({ className, width = 24, height = 24, strokeWidth = 2, ...props }) => (
  <svg fill="none" height={height} stroke="currentColor" strokeWidth={strokeWidth} viewBox="0 0 24 24" width={width} xmlns="http://www.w3.org/2000/svg" className={className} {...props}>
    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
    <circle cx="8.5" cy="8.5" r="1.5"></circle>
    <polyline points="21 15 16 10 5 21"></polyline>
  </svg>
);

export const PlayIcon = ({ className, width = 24, height = 24, strokeWidth = 2, ...props }) => (
  <svg fill="none" height={height} stroke="currentColor" strokeWidth={strokeWidth} viewBox="0 0 24 24" width={width} xmlns="http://www.w3.org/2000/svg" className={className} {...props}>
    <polygon points="6 3 20 12 6 21 6 3"></polygon>
  </svg>
);

export const InfoIcon = ({ className, width = 24, height = 24, strokeWidth = 2, ...props }) => (
  <svg fill="none" height={height} stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth={strokeWidth} viewBox="0 0 24 24" width={width} xmlns="http://www.w3.org/2000/svg" className={className} {...props}>
    <circle cx="12" cy="12" r="10"></circle>
    <line x1="12" x2="12" y1="16" y2="12"></line>
    <line x1="12" x2="12.01" y1="8" y2="8"></line>
  </svg>
);

export const ArrowLeftIcon = ({ className, width = 24, height = 24, strokeWidth = 2, ...props }) => (
  <svg fill="none" height={height} stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth={strokeWidth} viewBox="0 0 24 24" width={width} xmlns="http://www.w3.org/2000/svg" className={className} {...props}>
    <line x1="19" x2="5" y1="12" y2="12"></line>
    <polyline points="12 19 5 12 12 5"></polyline>
  </svg>
);

export const VideoIcon = ({ className, width = 24, height = 24, strokeWidth = 2, ...props }) => (
  <svg fill="none" height={height} stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth={strokeWidth} viewBox="0 0 24 24" width={width} xmlns="http://www.w3.org/2000/svg" className={className} {...props}>
    <polygon points="23 7 16 12 23 17 23 7"></polygon>
    <rect height="14" rx="2" ry="2" width="15" x="1" y="5"></rect>
  </svg>
);

export const MaximizeIcon = ({ className, width = 24, height = 24, strokeWidth = 2, ...props }) => (
  <svg fill="none" height={height} stroke="currentColor" strokeWidth={strokeWidth} viewBox="0 0 24 24" width={width} xmlns="http://www.w3.org/2000/svg" className={className} {...props}>
    <path d="m15 3 6 6M9 21l-6-6M21 3l-6 6M3 21l6-6"></path>
  </svg>
);

export const ChevronRight = ({ className, width = 18, height = 18, strokeWidth = 2, ...props }) => (
  <svg fill="none" height={height} stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth={strokeWidth} viewBox="0 0 24 24" width={width} xmlns="http://www.w3.org/2000/svg" className={className} {...props}>
    <polyline points="9 18 15 12 9 6" />
  </svg>
);

export const ChevronLeft = ({ className, width = 18, height = 18, strokeWidth = 2, ...props }) => (
  <svg fill="none" height={height} stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth={strokeWidth} viewBox="0 0 24 24" width={width} xmlns="http://www.w3.org/2000/svg" className={className} {...props}>
    <polyline points="15 18 9 12 15 6" />
  </svg>
);

// Tab specific icons
export const TimersIcon = ({ className, width = 18, height = 18, strokeWidth = 2, ...props }) => (
  <svg fill="none" height={height} stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth={strokeWidth} viewBox="0 0 24 24" width={width} xmlns="http://www.w3.org/2000/svg" className={className} {...props}>
    <circle cx="12" cy="12" r="10" />
    <polyline points="12 6 12 12 16 14" />
  </svg>
);

export const TracksIcon = ({ className, width = 18, height = 18, strokeWidth = 2, ...props }) => (
  <svg fill="none" height={height} stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth={strokeWidth} viewBox="0 0 24 24" width={width} xmlns="http://www.w3.org/2000/svg" className={className} {...props}>
    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
  </svg>
);

export const CardsIcon = ({ className, width = 18, height = 18, strokeWidth = 2, ...props }) => (
  <svg fill="none" height={height} stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth={strokeWidth} viewBox="0 0 24 24" width={width} xmlns="http://www.w3.org/2000/svg" className={className} {...props}>
    <polygon points="12 2 2 7 12 12 22 7 12 2" />
    <polyline points="2 17 12 22 22 17" />
    <polyline points="2 12 12 17 22 12" />
  </svg>
);

export const PromptsIcon = ({ className, width = 18, height = 18, strokeWidth = 2, ...props }) => (
  <svg fill="none" height={height} stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth={strokeWidth} viewBox="0 0 24 24" width={width} xmlns="http://www.w3.org/2000/svg" className={className} {...props}>
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
  </svg>
);

export const StretchesIcon = ({ className, width = 18, height = 18, strokeWidth = 2, ...props }) => (
  <svg fill="none" height={height} stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth={strokeWidth} viewBox="0 0 24 24" width={width} xmlns="http://www.w3.org/2000/svg" className={className} {...props}>
    <circle cx="12" cy="5" r="1" />
    <path d="m9 22 2-6h2l2 6" />
    <path d="M12 16v-6" />
    <path d="M7 12h10" />
  </svg>
);

export const ProfileIcon = ({ className, width = 24, height = 24, strokeWidth = 2, ...props }) => (
  <svg fill="none" height={height} stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth={strokeWidth} viewBox="0 0 24 24" width={width} xmlns="http://www.w3.org/2000/svg" className={className} {...props}>
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
    <circle cx="12" cy="7" r="4"></circle>
  </svg>
);
